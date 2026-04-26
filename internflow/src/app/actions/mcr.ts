"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyRegistrationLinks, companyRegistrations, users, notifications } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { sendCompanyApprovalEmail } from "@/lib/mail";
import { revalidatePath } from "next/cache";

export async function generateCompanyRegistrationLink(expiryDays: number = 7) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "management_corporation") {
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
    revalidatePath("/dashboard/mcr");
    return { success: true, link };
  } catch (error) {
    console.error("Link generation error:", error);
    return { error: "Failed to generate link" };
  }
}

export async function approveCompanyRegistration(companyId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "management_corporation") {
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

    if (company.status === "approved") {
      return { error: "Company is already approved" };
    }

    // 1. Create CEO user credentials with proper bcrypt hashing
    const tempPassword = randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    const [newCeo] = await db
      .insert(users)
      .values({
        email: company.ceoEmail || company.hrEmail,
        passwordHash,
        role: "company",
        firstName: company.ceoName || "CEO",
        lastName: company.companyLegalName,
      })
      .returning({ id: users.id });

    // 2. Mark company as approved
    await db
      .update(companyRegistrations)
      .set({
        status: "approved",
        userId: newCeo.id,
        reviewedBy: session.user.id,
        reviewedByRole: "management_corporation",
        reviewedAt: new Date(),
      })
      .where(eq(companyRegistrations.id, companyId));

    // 3. Notify authorities
    const authUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(inArray(users.role, ["placement_officer", "dean", "placement_head", "coe", "principal"]));

    if (authUsers.length > 0) {
      const notifs = authUsers.map(u => ({
        userId: u.id,
        type: "company_onboarded",
        title: "New Company Onboarded",
        message: `${company.companyLegalName} has been approved and onboarded to the platform.`,
        linkUrl: `/companies/${company.id}`,
      }));
      await db.insert(notifications).values(notifs);
    }

    // 4. Email CEO the temp password
    const emailTo = company.ceoEmail || company.hrEmail;
    await sendCompanyApprovalEmail(emailTo, company.companyLegalName, tempPassword);
    
    console.log(`[MCR] CEO credentials created for ${emailTo}, temp password: ${tempPassword}`);

    revalidatePath("/dashboard/mcr");
    revalidatePath("/companies");
    return { success: true };
  } catch (error) {
    console.error("Company approval error:", error);
    return { error: "Failed to approve company" };
  }
}
