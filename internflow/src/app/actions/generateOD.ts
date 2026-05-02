"use server";

import { db } from "@/lib/db";
import { internshipRequests, users, studentProfiles, approvalLogs, odForms } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";

export async function generateODData(requestId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    // Fetch the approved request
    const [request] = await db
      .select()
      .from(internshipRequests)
      .where(eq(internshipRequests.id, requestId))
      .limit(1);

    if (!request) return { error: "Request not found" };
    if (request.status !== "approved") return { error: "OD can only be generated for approved requests." };

    // Fetch student details
    const [student] = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, request.studentId as string))
      .limit(1);

    const [profile] = await db
      .select({
        registerNo: studentProfiles.registerNo,
        department: studentProfiles.department,
        course: studentProfiles.course,
        school: studentProfiles.school,
        section: studentProfiles.section,
        year: studentProfiles.year,
        batchStartYear: studentProfiles.batchStartYear,
        batchEndYear: studentProfiles.batchEndYear,
        program: studentProfiles.program,
      })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, request.studentId as string))
      .limit(1);

    // Fetch all approval logs for this request
    const logs = await db
      .select({
        approverId: approvalLogs.approverId,
        approverRole: approvalLogs.approverRole,
        tier: approvalLogs.tier,
        action: approvalLogs.action,
        comment: approvalLogs.comment,
        createdAt: approvalLogs.createdAt,
      })
      .from(approvalLogs)
      .where(eq(approvalLogs.requestId, requestId))
      .orderBy(approvalLogs.tier);

    // Fetch approver names
    const approverIds = [...new Set(logs.map(l => l.approverId))];
    const approvers: Record<string, { name: string; role: string }> = {};
    for (const id of approverIds) {
      const [u] = await db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      if (u) approvers[id] = { name: `${u.firstName} ${u.lastName}`, role: "" };
    }

    const approvalChain = logs
      .filter(l => l.action === "approved")
      .map(l => ({
        name: approvers[l.approverId]?.name || "Staff",
        role: l.approverRole.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
        tier: l.tier,
        approvedAt: l.createdAt ? new Date(l.createdAt).toISOString() : null,
      }));

    // Check if OD already exists
    const [existingOd] = await db
      .select()
      .from(odForms)
      .where(eq(odForms.requestId, requestId))
      .limit(1);

    let odNumber = existingOd?.formNumber;
    if (!existingOd) {
      // Generate a new OD number
      const year = new Date().getFullYear();
      const allOds = await db.select({ id: odForms.id }).from(odForms);
      odNumber = `OD-${year}-${String(allOds.length + 1).padStart(4, "0")}`;

      await db.insert(odForms).values({
        requestId,
        formNumber: odNumber,
      });
    }

    return {
      success: true,
      data: {
        odNumber: odNumber!,
        student: { ...student, ...profile },
        internship: {
          companyName: request.companyName,
          role: request.role,
          startDate: request.startDate,
          endDate: request.endDate,
          applicationType: request.applicationType,
        },
        approvalChain,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("OD generation error:", error);
    return { error: "Failed to generate OD data" };
  }
}
