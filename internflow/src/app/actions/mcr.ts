"use server";

import { randomBytes } from "crypto";

import bcrypt from "bcryptjs";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  auditLogs,
  companyRegistrationLinks,
  companyRegistrations,
  companyStaff,
  notifications,
  users,
} from "@/lib/db/schema";
import { getMailDeliveryMode, sendCompanyApprovalEmail } from "@/lib/mail";
import { captureServerError, captureServerEvent } from "@/lib/observability";

function normalizeCompanyContactRole(company: typeof companyRegistrations.$inferSelect) {
  return company.ceoName ? "CEO" : "HR";
}

async function requireMcrSession() {
  const session = await auth();
  if (!session?.user?.id || !["management_corporation", "mcr"].includes(session.user.role)) {
    return null;
  }
  return session;
}

export async function generateCompanyRegistrationLink(expiryDays: number = 7) {
  const session = await requireMcrSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    await db.insert(companyRegistrationLinks).values({
      token,
      generatedBy: session.user.id,
      expiresAt,
    });

    const link = `/company/register?token=${token}`;
    captureServerEvent("company_registration_link_generated", {
      generatedBy: session.user.id,
      expiresAt: expiresAt.toISOString(),
    });
    revalidatePath("/companies/review");
    return { success: true, link };
  } catch (error) {
    captureServerError(error, {
      scope: "generateCompanyRegistrationLink",
      actorId: session.user.id,
    });
    return { error: "Failed to generate link" };
  }
}

export async function approveCompanyRegistration(companyId: string) {
  const session = await requireMcrSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  try {
    const [company] = await db
      .select()
      .from(companyRegistrations)
      .where(eq(companyRegistrations.id, companyId))
      .limit(1);

    if (!company) {
      return { error: "Company not found" };
    }

    if (company.status === "approved" && company.userId) {
      return { success: true, reusedExistingUser: true };
    }

    const loginEmail = company.ceoEmail || company.hrEmail;
    if (!loginEmail) {
      return { error: "Company is missing a valid contact email." };
    }

    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, loginEmail))
      .limit(1);

    if (existingUser && existingUser.role !== "company") {
      return { error: "The company contact email is already used by a non-company account." };
    }

    let tempPassword: string | null = null;
    let companyUserId = existingUser?.id || company.userId || null;

    await (async (tx) => {
      if (!companyUserId) {
        tempPassword = randomBytes(8).toString("hex");
        const passwordHash = await bcrypt.hash(tempPassword, 10);

        const [createdUser] = await tx
          .insert(users)
          .values({
            email: loginEmail,
            passwordHash,
            role: "company",
            firstName: company.ceoName || company.hrName || "Company",
            lastName: company.companyLegalName,
            phone: company.ceoPhone || company.hrPhone || null,
            companyId: companyId,
            isActive: true,
          })
          .returning({ id: users.id });

        companyUserId = createdUser.id;
      } else {
        await tx
          .update(users)
          .set({
            role: "company",
            firstName: company.ceoName || company.hrName || "Company",
            lastName: company.companyLegalName,
            phone: company.ceoPhone || company.hrPhone || existingUser?.phone || null,
            companyId: companyId,
            isActive: true,
            updatedAt: new Date(),
          })
          .where(eq(users.id, companyUserId));
      }

      await tx
        .update(companyRegistrations)
        .set({
          status: "approved",
          userId: companyUserId,
          reviewedBy: session.user.id,
          reviewedByRole: "management_corporation",
          reviewComment: null,
          reviewedAt: new Date(),
        })
        .where(eq(companyRegistrations.id, companyId));

      await tx
        .update(companyRegistrationLinks)
        .set({ isUsed: true })
        .where(eq(companyRegistrationLinks.usedByCompanyId, companyId));

      const [existingStaffLink] = await tx
        .select({ id: companyStaff.id })
        .from(companyStaff)
        .where(eq(companyStaff.userId, companyUserId))
        .limit(1);

      if (!existingStaffLink) {
        await tx.insert(companyStaff).values({
          companyId: companyId,
          userId: companyUserId,
          roleInCompany: normalizeCompanyContactRole(company),
          isActive: true,
        });
      }

      await tx.insert(auditLogs).values({
        userId: session.user.id,
        action: "approve_company_registration",
        entityType: "company_registration",
        entityId: companyId,
        details: { companyUserId, loginEmail },
      });

      const authorityUsers = await tx
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.role, ["placement_officer", "dean", "placement_head", "coe", "principal"]));

      if (authorityUsers.length > 0) {
        await tx.insert(notifications).values(
          authorityUsers.map((user) => ({
            userId: user.id,
            type: "company_onboarded",
            title: "New Company Onboarded",
            message: `${company.companyLegalName} has been approved and onboarded to the platform.`,
            linkUrl: `/companies/${company.id}`,
          }))
        );
      }
    })(db);

    if (tempPassword && getMailDeliveryMode() === "smtp") {
      await sendCompanyApprovalEmail(loginEmail, company.companyLegalName, tempPassword);
    } else if (tempPassword) {
      await db.insert(notifications).values({
        userId: session.user.id,
        type: "company_manual_handoff",
        title: "Manual Credential Handoff Required",
        message: [
          `${company.companyLegalName} was approved without SMTP delivery.`,
          `Login email: ${loginEmail}`,
          `Temporary password: ${tempPassword}`,
          "Share these credentials manually with the company contact and ask them to change the password after first login.",
        ].join(" "),
        linkUrl: "/companies/review",
      });

      await db
        .update(companyRegistrations)
        .set({
          reviewComment: "Manual credential handoff pending in dashboard notifications.",
        })
        .where(eq(companyRegistrations.id, companyId));
    }

    captureServerEvent("company_registration_approved", {
      companyId,
      companyUserId,
      approverId: session.user.id,
      createdNewUser: Boolean(tempPassword),
      deliveryMode: getMailDeliveryMode(),
    });

    revalidatePath("/companies");
    revalidatePath("/companies/review");
    return { success: true, createdNewUser: !!tempPassword };
  } catch (error) {
    captureServerError(error, {
      scope: "approveCompanyRegistration",
      companyId,
      actorId: session.user.id,
    });
    return { error: "Failed to approve company" };
  }
}

export async function reviewCompanyRegistration(
  companyId: string,
  action: "approve" | "reject" | "reconsider" | "info_requested",
  comment?: string
) {
  const session = await requireMcrSession();
  if (!session) {
    return { error: "Unauthorized" };
  }

  if (action === "approve") {
    return approveCompanyRegistration(companyId);
  }

  try {
    const [company] = await db
      .select()
      .from(companyRegistrations)
      .where(eq(companyRegistrations.id, companyId))
      .limit(1);

    if (!company) {
      return { error: "Company not found" };
    }

    const newStatus =
      action === "reject"
        ? "rejected"
        : action === "reconsider"
          ? "under_review"
          : "info_requested";

    await (async (tx) => {
      await tx
        .update(companyRegistrations)
        .set({
          status: newStatus,
          reviewedBy: session.user.id,
          reviewedByRole: "management_corporation",
          reviewComment: comment?.trim() || null,
          reviewedAt: new Date(),
        })
        .where(eq(companyRegistrations.id, companyId));

      await tx.insert(auditLogs).values({
        userId: session.user.id,
        action: "review_company_registration",
        entityType: "company_registration",
        entityId: companyId,
        details: { newStatus, comment: comment?.trim() || null },
      });

      if (company.userId) {
        const title =
          newStatus === "rejected"
            ? "Company Registration Rejected"
            : newStatus === "info_requested"
              ? "Company Registration Needs Info"
              : "Company Registration Reopened";

        const message =
          newStatus === "rejected"
            ? `${company.companyLegalName} registration was rejected.${comment ? ` Note: ${comment}` : ""}`
            : newStatus === "info_requested"
              ? `${company.companyLegalName} registration needs more information before approval.${comment ? ` Note: ${comment}` : ""}`
              : `${company.companyLegalName} registration has been moved back for re-review.`;

        await tx.insert(notifications).values({
          userId: company.userId,
          type: "company_registration_review",
          title,
          message,
          linkUrl: `/companies/${companyId}`,
        });
      }
    })(db);

    captureServerEvent("company_registration_reviewed", {
      companyId,
      action,
      newStatus,
      actorId: session.user.id,
    });

    revalidatePath("/companies/review");
    revalidatePath("/companies");
    return { success: true };
  } catch (error) {
    captureServerError(error, {
      scope: "reviewCompanyRegistration",
      companyId,
      action,
      actorId: session.user.id,
    });
    return { error: "Failed to update company review status" };
  }
}
