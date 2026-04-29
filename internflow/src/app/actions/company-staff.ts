"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyStaff, companyRegistrations, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

/**
 * Resolve the company registration for the current user.
 * Uses the same multi-path lookup as the company dashboard page:
 *   1. users.companyId (set during companyReview approval)
 *   2. companyRegistrations.userId (set during mcr/companyReview approval)
 */
async function resolveCompanyRegistration(userId: string) {
  // Path 1: Check if users.companyId is set (points to companyRegistrations.id)
  const [userRec] = await db
    .select({ companyId: users.companyId })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (userRec?.companyId) {
    const [reg] = await db
      .select()
      .from(companyRegistrations)
      .where(eq(companyRegistrations.id, userRec.companyId))
      .limit(1);
    if (reg) return reg;
  }

  // Path 2: Fallback to companyRegistrations.userId
  const [reg] = await db
    .select()
    .from(companyRegistrations)
    .where(eq(companyRegistrations.userId, userId))
    .limit(1);

  return reg || null;
}

/**
 * Add a staff member to the company.
 * Only the company CEO (company role user linked to the registration) can add staff.
 */
export async function addCompanyStaff(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "company") {
    return { error: "Unauthorized" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const designation = formData.get("designation") as string;
  const phone = formData.get("phone") as string;

  if (!name || !email || !designation) {
    return { error: "Name, email, and designation are required." };
  }

  const [firstName, ...lastNameParts] = name.split(" ");
  const lastName = lastNameParts.join(" ") || " ";

  try {
    const company = await resolveCompanyRegistration(session.user.id);

    if (!company) {
      return { error: "No company registration found for this account." };
    }

    // Insert user record first with proper bcrypt hash
    const tempPassword = randomBytes(8).toString("hex");
    const passwordHash = await bcrypt.hash(tempPassword, 10);
    
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        passwordHash,
        role: "company_staff",
        firstName,
        lastName,
        phone: phone || null,
        companyId: company.id,
      })
      .returning({ id: users.id });

    // Insert company staff mapping
    await db.insert(companyStaff).values({
      companyId: company.id,
      userId: newUser.id,
      roleInCompany: designation,
      isActive: true,
    });

    // TODO: Email staff the temp password: tempPassword
    console.log(`[Staff] Credentials created for ${email}, temp password: ${tempPassword}`);

    revalidatePath("/dashboard/company");
    return { success: true };
  } catch (error) {
    console.error("Add staff error:", error);
    return { error: "Failed to add staff member." };
  }
}

/**
 * Remove a staff member from the company.
 */
export async function removeCompanyStaff(staffId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "company") {
    return { error: "Unauthorized" };
  }

  try {
    const company = await resolveCompanyRegistration(session.user.id);

    if (!company) {
      return { error: "No company registration found." };
    }

    // Fetch the staff record to delete user as well
    const [staff] = await db
      .select()
      .from(companyStaff)
      .where(and(eq(companyStaff.id, staffId), eq(companyStaff.companyId, company.id)));

    if (staff) {
      await db.delete(companyStaff).where(eq(companyStaff.id, staffId));
      await db.delete(users).where(eq(users.id, staff.userId));
    }

    revalidatePath("/dashboard/company");
    return { success: true };
  } catch (error) {
    console.error("Remove staff error:", error);
    return { error: "Failed to remove staff member." };
  }
}

