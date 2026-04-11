"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { internshipRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function advanceApproval(requestId: string, action: "approve" | "reject") {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const role = (session.user as any).role;

  try {
    const [request] = await db
      .select()
      .from(internshipRequests)
      .where(eq(internshipRequests.id, requestId))
      .limit(1);

    if (!request) return { error: "Request not found" };

    if (action === "reject") {
      await db
        .update(internshipRequests)
        .set({ status: "rejected" })
        .where(eq(internshipRequests.id, requestId));
      revalidatePath("/approvals");
      return { success: true };
    }

    // Advance logic
    let nextStatus = request.status;
    let nextTier = request.currentTier || 1;

    if (role === "tutor" && request.status === "pending_tutor") {
      nextStatus = "pending_coordinator";
      nextTier = 2;
    } else if (role === "placement_coordinator" && request.status === "pending_coordinator") {
      nextStatus = "pending_hod";
      nextTier = 3;
    } else if (role === "hod" && request.status === "pending_hod") {
      nextStatus = "pending_admin";
      nextTier = 4;
    } else if ((role === "dean" || role === "principal" || role === "placement_officer") && request.status === "pending_admin") {
      nextStatus = "approved";
      
      // TODO: Here we would automatically generate the Bonafide Record
      // import { generateBonafide } from './certificates';
      // await generateBonafide(request.studentId, request.companyName);
    } else {
      return { error: "You cannot approve this request at its current stage." };
    }

    await db
      .update(internshipRequests)
      .set({ 
        status: nextStatus as any,
        currentTier: nextTier
      })
      .where(eq(internshipRequests.id, requestId));

    revalidatePath("/approvals");
    return { success: true };
  } catch (error: any) {
    console.error("Approval error:", error);
    return { error: "Failed to process approval" };
  }
}
