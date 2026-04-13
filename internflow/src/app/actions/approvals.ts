"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { internshipRequests, notifications } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

// Approval tier progression order
const TIER_CHAIN: Record<string, { nextStatus: string; nextTier: number }> = {
  "tutor:pending_tutor":          { nextStatus: "pending_coordinator", nextTier: 2 },
  "placement_coordinator:pending_coordinator": { nextStatus: "pending_hod", nextTier: 3 },
  "hod:pending_hod":              { nextStatus: "pending_admin",  nextTier: 4 },
  "dean:pending_admin":           { nextStatus: "pending_admin",  nextTier: 5 },
  "placement_officer:pending_admin": { nextStatus: "pending_admin", nextTier: 6 },
};

export async function advanceApproval(requestId: string, action: "approve" | "reject") {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const role = session.user.role;
  const approverId = session.user.id;

  if (!requestId || typeof requestId !== "string") {
    return { error: "Invalid request ID" };
  }

  try {
    const [request] = await db
      .select()
      .from(internshipRequests)
      .where(eq(internshipRequests.id, requestId))
      .limit(1);

    if (!request) return { error: "Request not found" };

    const now = new Date();

    if (action === "reject") {
      await db.transaction(async (tx) => {
        await tx
          .update(internshipRequests)
          .set({
            status: "rejected",
            lastReviewedBy: approverId,
            lastReviewedAt: now,
          })
          .where(eq(internshipRequests.id, requestId));

        await tx.insert(notifications).values({
          userId: request.studentId as string,
          type: "application_update",
          title: "Application Rejected",
          message: `Your internship application for ${request.companyName} was rejected.`,
          linkUrl: `/applications/${request.id}`,
        });
      });

      revalidatePath("/approvals");
      return { success: true };
    }

    // ── Advance approval ──
    // Principal final approval (tier 6 → approved)
    if (role === "principal" && request.status === "pending_admin" && request.currentTier === 6) {
      await db.transaction(async (tx) => {
        await tx
          .update(internshipRequests)
          .set({
            status: "approved",
            lastReviewedBy: approverId,
            lastReviewedAt: now,
          })
          .where(eq(internshipRequests.id, requestId));

        await tx.insert(notifications).values({
          userId: request.studentId as string,
          type: "application_update",
          title: "Application Approved!",
          message: `Your internship application for ${request.companyName} has received final approval.`,
          linkUrl: `/applications/${request.id}`,
        });
      });

      revalidatePath("/approvals");
      return { success: true };
    }

    // Look up the tier chain for this role + status combination
    const chainKey = `${role}:${request.status}`;
    const next = TIER_CHAIN[chainKey];

    if (!next) {
      return { error: "You cannot approve this request at its current stage." };
    }

    await db.transaction(async (tx) => {
      await tx
        .update(internshipRequests)
        .set({
          status: next.nextStatus as typeof request.status,
          currentTier: next.nextTier,
          lastReviewedBy: approverId,
          lastReviewedAt: now,
        })
        .where(eq(internshipRequests.id, requestId));

      await tx.insert(notifications).values({
        userId: request.studentId as string,
        type: "application_update",
        title: "Application Progressed",
        message: `Your application for ${request.companyName} advanced to tier ${next.nextTier} (${next.nextStatus}).`,
        linkUrl: `/applications/${request.id}`,
      });
    });

    revalidatePath("/approvals");
    return { success: true };
  } catch (error: unknown) {
    console.error("Approval error:", error);
    return { error: "Failed to process approval" };
  }
}
