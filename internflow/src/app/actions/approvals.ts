"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  internshipRequests,
  notifications,
  approvalLogs,
  auditLogs,
  externalInternshipDetails,
  jobPostings,
  companyRegistrations,
  users,
  studentProfiles,
  approvalSlaSettings,
  approvalEscalations,
} from "@/lib/db/schema";
import { and, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { captureServerError, captureServerEvent } from "@/lib/observability";

type AppRole = "student" | "tutor" | "placement_coordinator" | "hod" | "dean" | "placement_officer" | "coe" | "principal" | "company" | "alumni";

// Approval tier progression order (includes COE at tier 6)
const TIER_CHAIN: Record<string, { nextStatus: string; nextTier: number }> = {
  "tutor:pending_tutor":          { nextStatus: "pending_coordinator", nextTier: 2 },
  "placement_coordinator:pending_coordinator": { nextStatus: "pending_hod", nextTier: 3 },
  "hod:pending_hod":              { nextStatus: "pending_dean",  nextTier: 4 },
  "dean:pending_dean":           { nextStatus: "pending_po",  nextTier: 5 },
  "placement_officer:pending_po": { nextStatus: "pending_coe", nextTier: 6 },
  "coe:pending_coe":              { nextStatus: "pending_principal", nextTier: 7 },
};

async function getCurrentSlaHours() {
  const [setting] = await db
    .select({ slaHours: approvalSlaSettings.slaHours })
    .from(approvalSlaSettings)
    .where(eq(approvalSlaSettings.scope, "default_od"))
    .limit(1);

  return setting?.slaHours || 6;
}

export async function advanceApproval(requestId: string, action: "approve" | "reject", comment?: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const role = session.user.role;
  const approverId = session.user.id;

  if (!requestId || typeof requestId !== "string") {
    return { error: "Invalid request ID" };
  }

  // Rejection requires a reason
  if (action === "reject" && (!comment || comment.trim().length === 0)) {
    return { error: "A reason is required when rejecting an application." };
  }

  try {
    const [request] = await db
      .select()
      .from(internshipRequests)
      .where(eq(internshipRequests.id, requestId))
      .limit(1);

    if (!request) return { error: "Request not found" };

    const now = new Date();
    const trimmedComment = comment?.trim() || null;

    if (action === "reject") {
      await db
        .update(internshipRequests)
        .set({
          status: "rejected",
          lastReviewedBy: approverId,
          lastReviewedAt: now,
          currentTierEnteredAt: now,
        })
        .where(eq(internshipRequests.id, requestId));

      await db
        .update(approvalEscalations)
        .set({ resolvedAt: now })
        .where(eq(approvalEscalations.requestId, requestId));

      await db.insert(approvalLogs).values({
        requestId,
        approverId,
        approverRole: role as AppRole,
        tier: request.currentTier || 0,
        action: "rejected",
        comment: trimmedComment,
      });

      await db.insert(auditLogs).values({
        userId: approverId,
        action: "reject_internship_application",
        entityType: "internship_request",
        entityId: requestId,
        details: { tier: request.currentTier || 0, comment: trimmedComment },
      });

      await db.insert(notifications).values({
        userId: request.studentId as string,
        type: "application_update",
        title: "Application Rejected",
        message: trimmedComment
          ? `Your internship application for ${request.companyName} was rejected. Reason: ${trimmedComment}`
          : `Your internship application for ${request.companyName} was rejected.`,
        linkUrl: `/applications/${request.id}`,
      });

      captureServerEvent("internship_request_rejected", {
        requestId,
        studentId: request.studentId,
        approverId,
        approverRole: role,
        tier: request.currentTier || 0,
      });

      revalidatePath("/approvals");
      revalidatePath("/applications");
      return { success: true };
    }

    // Principal final approval (tier 7 → approved)
    if (role === "principal" && request.status === "pending_principal" && request.currentTier === 7) {
      await db
        .update(internshipRequests)
        .set({
          status: "approved",
          lastReviewedBy: approverId,
          lastReviewedAt: now,
          currentTierEnteredAt: now,
        })
        .where(eq(internshipRequests.id, requestId));

      await db
        .update(approvalEscalations)
        .set({ resolvedAt: now })
        .where(eq(approvalEscalations.requestId, requestId));

      await db.insert(approvalLogs).values({
        requestId,
        approverId,
        approverRole: role as AppRole,
        tier: request.currentTier || 0,
        action: "approved",
        comment: trimmedComment,
      });

      await db.insert(auditLogs).values({
        userId: approverId,
        action: "approve_internship_final",
        entityType: "internship_request",
        entityId: requestId,
        details: { tier: 7, comment: trimmedComment },
      });

      await db.insert(notifications).values({
        userId: request.studentId as string,
        type: "application_update",
        title: "Application Approved!",
        message: trimmedComment
          ? `Your internship application for ${request.companyName} has received final approval. Note: ${trimmedComment}`
          : `Your internship application for ${request.companyName} has received final approval.`,
        linkUrl: `/applications/${request.id}`,
      });

      captureServerEvent("internship_request_fully_approved", {
        requestId,
        studentId: request.studentId,
        approverId,
        approverRole: role,
      });

      revalidatePath("/approvals");
      revalidatePath("/applications");
      return { success: true };
    }

    // Look up the tier chain for this role + status combination
    const chainKey = `${role}:${request.status}`;
    const next = TIER_CHAIN[chainKey];

    if (!next) {
      return { error: "You cannot approve this request at its current stage." };
    }

    const slaHours = await getCurrentSlaHours();

    await db
      .update(internshipRequests)
      .set({
        status: next.nextStatus as typeof request.status,
        currentTier: next.nextTier,
        lastReviewedBy: approverId,
        lastReviewedAt: now,
        currentTierEnteredAt: now,
        currentTierSlaHours: slaHours,
      })
      .where(eq(internshipRequests.id, requestId));

    // Escalations belong to a specific pending tier. Once the request advances,
    // any open escalation for the previous tier should no longer appear active.
    await db
      .update(approvalEscalations)
      .set({ resolvedAt: now })
      .where(
        and(
          eq(approvalEscalations.requestId, requestId),
          ne(approvalEscalations.escalatedFromTier, next.nextTier),
        ),
      );

    // Log the approval with optional endorsement
    await db.insert(approvalLogs).values({
      requestId,
      approverId,
      approverRole: role as AppRole,
      tier: request.currentTier || 0,
      action: "approved",
      comment: trimmedComment,
    });

    await db.insert(auditLogs).values({
      userId: approverId,
      action: "advance_internship_tier",
      entityType: "internship_request",
      entityId: requestId,
      details: { fromTier: request.currentTier || 0, toTier: next.nextTier, comment: trimmedComment },
    });

    await db.insert(notifications).values({
      userId: request.studentId as string,
      type: "application_update",
      title: "Application Progressed",
      message: trimmedComment
        ? `Your application for ${request.companyName} advanced to tier ${next.nextTier}. Comment: ${trimmedComment}`
        : `Your application for ${request.companyName} advanced to tier ${next.nextTier} (${next.nextStatus}).`,
      linkUrl: `/applications/${request.id}`,
    });

    captureServerEvent("internship_request_advanced", {
      requestId,
      studentId: request.studentId,
      approverId,
      approverRole: role,
      fromTier: request.currentTier || 0,
      toTier: next.nextTier,
      nextStatus: next.nextStatus,
    });

    revalidatePath("/approvals");
    revalidatePath("/applications");
    return { success: true };
  } catch (error: unknown) {
    captureServerError(error, {
      scope: "advanceApproval",
      requestId,
      action,
      actorId: approverId,
      actorRole: role,
    });
    return { error: `Failed to process approval: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function getRequestDetails(requestId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    const [request] = await db
      .select({
        id: internshipRequests.id,
        role: internshipRequests.role,
        companyName: internshipRequests.companyName,
        companyAddress: internshipRequests.companyAddress,
        applicationType: internshipRequests.applicationType,
        status: internshipRequests.status,
        submittedAt: internshipRequests.submittedAt,
        studentId: internshipRequests.studentId,
        jobPostingId: internshipRequests.jobPostingId,
        startDate: internshipRequests.startDate,
        endDate: internshipRequests.endDate,
        stipend: internshipRequests.stipend,
        workMode: internshipRequests.workMode,
        offerLetterUrl: internshipRequests.offerLetterUrl,
      })
      .from(internshipRequests)
      .where(eq(internshipRequests.id, requestId))
      .limit(1);

    if (!request) return { error: "Request not found" };

    // Try fetching external details if present
    let externalDetails = null;
    if (request.applicationType === "external") {
      const [ext] = await db.select().from(externalInternshipDetails).where(eq(externalInternshipDetails.requestId, requestId)).limit(1);
      externalDetails = ext || null;
    }

    // Try fetching portal job details if present
    let jobDetails = null;
    let companyDetails = null;
    if (request.applicationType === "portal" && request.jobPostingId) {
       const [jobP] = await db.select().from(jobPostings).where(eq(jobPostings.id, request.jobPostingId)).limit(1);
       if (jobP) {
         jobDetails = jobP;
         const [comp] = await db.select().from(companyRegistrations).where(eq(companyRegistrations.id, jobP.companyId!)).limit(1);
         companyDetails = comp || null;
       }
    }

    // Fetch the basic student snapshot
    const [user] = await db.select({ firstName: users.firstName, lastName: users.lastName, email: users.email, phone: users.phone, avatarUrl: users.avatarUrl }).from(users).where(eq(users.id, request.studentId as string)).limit(1);
    const [profile] = await db.select({
      department: studentProfiles.department,
      year: studentProfiles.year,
      section: studentProfiles.section,
      cgpa: studentProfiles.cgpa,
      school: studentProfiles.school,
      course: studentProfiles.course,
      program: studentProfiles.program,
      programType: studentProfiles.programType,
      registerNo: studentProfiles.registerNo,
      resumeUrl: studentProfiles.resumeUrl,
      batchStartYear: studentProfiles.batchStartYear,
      batchEndYear: studentProfiles.batchEndYear,
    }).from(studentProfiles).where(eq(studentProfiles.userId, request.studentId as string)).limit(1);

    return {
      success: true,
      data: {
        request,
        externalDetails,
        jobDetails,
        companyDetails,
        student: { user, profile }
      }
    }

  } catch (err) {
    captureServerError(err, {
      scope: "getRequestDetails",
      requestId,
    });
    return { error: "Failed to fetch request details" };
  }
}
