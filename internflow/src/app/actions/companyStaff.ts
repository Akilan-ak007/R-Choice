"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyStaff, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { getCompanyContextForUser } from "@/lib/company-context";

export async function createCompanyStaff(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  
  // Only CEO ("company") can onboard staff
  if (session.user.role !== "company") return { error: "Unauthorized. CEO Access Required." };

  const rawEmail = formData.get("email") as string;
  const rawFirstName = formData.get("firstName") as string;
  const rawLastName = formData.get("lastName") as string;
  const rawPhone = formData.get("phone") as string;
  const rawPassword = formData.get("password") as string;
  const rawEmployeeId = formData.get("employeeId") as string;
  const rawStaffRole = formData.get("staffRole") as string;
  const rawDepartment = formData.get("department") as string;
  
  if (!rawEmail || !rawFirstName || !rawPassword || !rawStaffRole) return { error: "Missing required fields" };

  try {
    const [existing] = await db.select().from(users).where(eq(users.email, rawEmail)).limit(1);
    if (existing) return { error: "User with this email already exists." };

    const companyContext = await getCompanyContextForUser(session.user.id);
    if (!companyContext?.companyId) return { error: "No associated company found for this Master Account." };

    const passwordHash = await bcrypt.hash(rawPassword, 12);

    const [newUser] = await db.insert(users).values({
      email: rawEmail,
      firstName: rawFirstName,
      lastName: rawLastName,
      phone: rawPhone,
      passwordHash,
      role: "company_staff",
      companyId: companyContext.companyId,
      staffRole: rawStaffRole,
      employeeId: rawEmployeeId,
      department: rawDepartment,
      isActive: true,
    }).returning({ id: users.id });

    await db.insert(companyStaff).values({
      companyId: companyContext.companyId,
      userId: newUser.id,
      roleInCompany: rawStaffRole,
      isActive: true,
    });

    // Output password to server console in dev only (in prod, email it)
    if (process.env.NODE_ENV === "development") {
      console.log(`[SYS] STAFF CREATED: ${rawEmail}`);
    }

    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/company/team");
    return { success: true, generatedPassword: rawPassword }; // UI will display once for them to copy
  } catch (error: unknown) {
    console.error("Staff creation error:", error);
    return { error: "Failed to create staff account." };
  }
}

export async function revokeCompanyStaff(staffId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "company") return { error: "Unauthorized" };

  try {
    const companyContext = await getCompanyContextForUser(session.user.id);
    if (!companyContext?.companyId) return { error: "No associated company found." };
    
    // Ensure the staff belongs to the same company
    const [staff] = await db.select().from(users).where(eq(users.id, staffId)).limit(1);
    const [membership] = await db
      .select()
      .from(companyStaff)
      .where(and(eq(companyStaff.userId, staffId), eq(companyStaff.companyId, companyContext.companyId)))
      .limit(1);

    if (!staff || !membership) {
      return { error: "Not authorized to target this user" };
    }

    await db.update(users).set({ isActive: false }).where(eq(users.id, staffId));
    await db.update(companyStaff).set({ isActive: false }).where(eq(companyStaff.id, membership.id));
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/company/team");
    return { success: true };
  } catch (error) {
    return { error: "Failed to revoke staff." };
  }
}
