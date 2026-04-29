"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyRegistrations, users, auditLogs, notifications } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";

export async function reviewCompany(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Unauthorized" };
  const role = session.user.role;
  if (!["dean", "placement_officer", "principal", "coe", "mcr"].includes(role)) return { error: "Unauthorized" };

  const id = formData.get("id") as string;
  const action = formData.get("action") as string;
  const comment = formData.get("comment") as string;

  let newStatus: "approved" | "rejected" | "pending" | "info_requested" = "approved";
  if (action === "reject") newStatus = "rejected";
  else if (action === "reconsider") newStatus = "pending";
  else if (action === "info_requested") newStatus = "info_requested";

  try {
    const [reg] = await db.select().from(companyRegistrations).where(eq(companyRegistrations.id, id)).limit(1);
      if (!reg) throw new Error("Registration not found");

      await db.update(companyRegistrations).set({
        status: newStatus,
        reviewedBy: session.user.id,
        reviewedByRole: role,
        reviewComment: comment || null,
        reviewedAt: new Date(),
      }).where(eq(companyRegistrations.id, id));

      if (newStatus === "approved" && !reg.userId) {
        // 1. Generate Auth Profile for CEO
        const founderDetails = reg.founderDetails as { name?: string; officeMail?: string } | null;
        const founderEmail = founderDetails?.officeMail || reg.hrEmail;
        const founderName = founderDetails?.name || reg.hrName;
        const rawPassword = randomBytes(8).toString("hex");
        const passwordHash = await bcrypt.hash(rawPassword, 12);

        // Optional: Ensure email is unique
        const [existing] = await db.select().from(users).where(eq(users.email, founderEmail)).limit(1);
        let createdUserId = existing?.id;

        if (!existing) {
          const [newUser] = await db.insert(users).values({
            email: founderEmail,
            passwordHash,
            firstName: founderName,
            lastName: "(CEO)",
            role: "company",
            companyId: reg.id,
            isActive: true,
          }).returning();
          createdUserId = newUser.id;

          // In a real system, send email via Nodemailer here with rawPassword
          if (process.env.NODE_ENV === "development") {
            console.log(`[SYS] Generated credentials for CEO: ${founderEmail}`);
          }
        }

        await db.update(companyRegistrations).set({ userId: createdUserId }).where(eq(companyRegistrations.id, id));

        // 2. Dispatch Notifications to specified roles
        const notifyRoles = ["placement_officer", "dean", "hod", "coe", "principal"] as const;
        const targetAdmins = await db.select().from(users).where(inArray(users.role, notifyRoles));
        
        if (targetAdmins.length > 0) {
          await db.insert(notifications).values(
            targetAdmins.map(admin => ({
              userId: admin.id,
              type: "system",
              title: "New Company Onboarded",
              message: `${reg.companyLegalName} has been officially approved and onboarded.`,
              linkUrl: `/companies`,
            }))
          );
        }
      }

      await db.insert(auditLogs).values({
        userId: session.user.id,
        action: `review_company`,
        entityType: "company_registration",
        entityId: id,
        details: { newStatus, comment },
      });

    revalidatePath("/companies/review");
    return { success: true };
  } catch (error: unknown) {
    console.error("Company review error:", error);
    return { error: "Failed to process review." };
  }
}
