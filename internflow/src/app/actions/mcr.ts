"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyRegistrationLinks, companyRegistrations, users, notifications } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";

export async function generateCompanyRegistrationLink() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "management_corporation") {
    return { error: "Unauthorized" };
  }

  try {
    const token = randomBytes(32).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

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

    await db.transaction(async (tx) => {
      // 1. Create CEO user credentials
      const tempPassword = randomBytes(8).toString("hex");
      const passwordHash = `mock-bcrypt-hash-${tempPassword}`; // Replace with actual hashing in prod

      const [newCeo] = await tx
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
      await tx
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
      const authUsers = await tx
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
        await tx.insert(notifications).values(notifs);
      }
    });

    revalidatePath("/dashboard/mcr");
    revalidatePath("/companies");
    return { success: true };
  } catch (error) {
    console.error("Company approval error:", error);
    return { error: "Failed to approve company" };
  }
}
