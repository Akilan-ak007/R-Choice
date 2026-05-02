import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  jobApplicationRoundProgress,
  jobResultPublications,
  odRaiseRequests,
  companyRegistrations,
  jobPostings,
  selectionProcessRounds,
  users,
} from "@/lib/db/schema";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import RaiseODQueueClient from "./RaiseODQueueClient";

export default async function ApprovalResultsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const allowedRoles = ["placement_officer", "principal", "placement_head", "coe"];
  if (!allowedRoles.includes(session.user.role)) {
    redirect("/");
  }

  const rows = await db
    .select({
      resultPublicationId: jobResultPublications.id,
      applicationId: jobResultPublications.applicationId,
      studentId: users.id,
      studentName: users.firstName,
      studentLastName: users.lastName,
      studentEmail: users.email,
      companyId: companyRegistrations.id,
      companyName: companyRegistrations.companyLegalName,
      jobId: jobPostings.id,
      jobTitle: jobPostings.title,
      publishedAt: jobResultPublications.publishedAt,
      notes: jobResultPublications.notes,
      odStatus: odRaiseRequests.status,
      internshipRequestId: odRaiseRequests.internshipRequestId,
    })
    .from(jobResultPublications)
    .innerJoin(users, eq(jobResultPublications.studentId, users.id))
    .innerJoin(jobPostings, eq(jobResultPublications.jobId, jobPostings.id))
    .innerJoin(companyRegistrations, eq(jobResultPublications.companyId, companyRegistrations.id))
    .leftJoin(odRaiseRequests, eq(jobResultPublications.id, odRaiseRequests.resultPublicationId))
    .where(eq(jobResultPublications.resultStatus, "selected"))
    .orderBy(desc(jobResultPublications.publishedAt));

  const queueRows = rows.map((row) => ({
    resultPublicationId: row.resultPublicationId,
    applicationId: row.applicationId,
    studentId: row.studentId,
    studentName: `${row.studentName} ${row.studentLastName}`.trim(),
    studentEmail: row.studentEmail,
    companyId: row.companyId,
    companyName: row.companyName,
    jobId: row.jobId,
    jobTitle: row.jobTitle,
    publishedAt: row.publishedAt?.toISOString() || new Date().toISOString(),
    notes: row.notes,
    odStatus: row.odStatus,
    internshipRequestId: row.internshipRequestId,
  }));

  const applicationIds = queueRows.map((row) => row.applicationId);
  const roundProgressRows = applicationIds.length === 0
    ? []
    : await db
        .select({
          applicationId: jobApplicationRoundProgress.applicationId,
          progressStatus: jobApplicationRoundProgress.status,
          reviewedAt: jobApplicationRoundProgress.reviewedAt,
          roundNumber: selectionProcessRounds.roundNumber,
          roundName: selectionProcessRounds.roundName,
          startsAt: selectionProcessRounds.startsAt,
        })
        .from(jobApplicationRoundProgress)
        .innerJoin(selectionProcessRounds, eq(selectionProcessRounds.id, jobApplicationRoundProgress.roundId))
        .where(inArray(jobApplicationRoundProgress.applicationId, applicationIds))
        .orderBy(asc(selectionProcessRounds.roundNumber));

  const roundProgressByApplication = roundProgressRows.reduce<Record<string, {
    currentRound: { roundNumber: number; roundName: string; startsAt: string | null } | null;
    clearedRounds: Array<{ roundNumber: number; roundName: string; reviewedAt: string | null }>;
  }>>((acc, row) => {
    if (!acc[row.applicationId]) {
      acc[row.applicationId] = {
        currentRound: null,
        clearedRounds: [],
      };
    }

    if (row.progressStatus === "scheduled") {
      acc[row.applicationId].currentRound = {
        roundNumber: row.roundNumber,
        roundName: row.roundName,
        startsAt: row.startsAt?.toISOString() || null,
      };
    }

    if (row.progressStatus === "cleared") {
      acc[row.applicationId].clearedRounds.push({
        roundNumber: row.roundNumber,
        roundName: row.roundName,
        reviewedAt: row.reviewedAt?.toISOString() || null,
      });
    }

    return acc;
  }, {});

  const pendingCount = queueRows.filter((row) => row.odStatus !== "od_raised" && !row.internshipRequestId).length;

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Selection Results Review</h1>
        <p>Review company-selected students and explicitly raise On-Duty requests to begin the approval chain.</p>
      </div>

      <div className="card" style={{ marginBottom: "var(--space-4)", padding: "var(--space-4)", display: "flex", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Pending PO action
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--primary-color)" }}>{pendingCount}</div>
        </div>
        <div style={{ maxWidth: "520px", color: "var(--text-secondary)", fontSize: "0.9375rem" }}>
          Company results are visible here first. OD requests do not start automatically. The Placement Officer must choose dates and click <strong>Raise OD</strong> for each selected student.
        </div>
      </div>

      {queueRows.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
          No company selection results are waiting for review.
        </div>
      ) : (
        <RaiseODQueueClient rows={queueRows} roundProgressByApplication={roundProgressByApplication} />
      )}
    </div>
  );
}
