import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import {
  Briefcase,
  CheckCircle2,
  Clock,
  FileEdit,
  FileText,
  Hand,
  Milestone,
  ShieldCheck,
  Star,
} from "lucide-react";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  companyRegistrations,
  internshipRequests,
  jobApplicationRoundProgress,
  jobApplications,
  jobPostings,
  selectionProcessRounds,
  studentProfiles,
  users,
} from "@/lib/db/schema";

import ApprovedRequestsClient from "./ApprovedRequestsClient";
import styles from "./student.module.css";
import VerificationBannerClient from "./VerificationBannerClient";

type SelectionTimelineItem = {
  appId: string;
  jobTitle: string;
  companyName: string | null;
  applicationStatus: string | null;
  currentRound: {
    roundNumber: number;
    roundName: string;
    startsAt: Date | null;
  } | null;
  clearedRounds: Array<{
    roundNumber: number;
    roundName: string;
    reviewedAt: Date | null;
  }>;
};

export default async function StudentDashboard() {
  const session = await auth();
  const userId = session?.user?.id;

  let profileScore = 0;
  let applicationCount = 0;
  let approvedCount = 0;
  let pendingCount = 0;
  let pendingVerificationApps: { appId: string; jobTitle: string; companyName: string | null; verificationCode: string | null }[] = [];
  let shortlistedApps: { appId: string; jobTitle: string; companyName: string | null; status: string | null }[] = [];
  let selectionTimeline: SelectionTimelineItem[] = [];
  let approvedRequestsData: { id: string; status: string | null; companyName: string; role: string; startDate: string; endDate: string; approvedAt: Date | null }[] = [];
  let studentFullName = "Student";

  if (userId) {
    const [user] = await db.select({ first: users.firstName, last: users.lastName }).from(users).where(eq(users.id, userId)).limit(1);
    if (user) studentFullName = `${user.first} ${user.last}`;

    const [profile] = await db
      .select({ score: studentProfiles.profileCompletionScore })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);
    profileScore = profile?.score ?? 0;

    const allApps = await db
      .select({
        id: internshipRequests.id,
        status: internshipRequests.status,
        companyName: internshipRequests.companyName,
        role: internshipRequests.role,
        startDate: internshipRequests.startDate,
        endDate: internshipRequests.endDate,
        approvedAt: internshipRequests.approvedAt,
      })
      .from(internshipRequests)
      .where(eq(internshipRequests.studentId, userId));

    applicationCount = allApps.length;
    const approvedEntries = allApps.filter((app) => app.status === "approved");
    approvedCount = approvedEntries.length;
    approvedRequestsData = approvedEntries;
    pendingCount = allApps.filter((app) => app.status !== "approved" && app.status !== "rejected" && app.status !== "draft").length;

    const myJobApps = await db
      .select({
        appId: jobApplications.id,
        status: jobApplications.status,
        verificationCode: jobApplications.verificationCode,
        isVerified: jobApplications.isVerified,
        jobTitle: jobPostings.title,
        companyName: companyRegistrations.companyLegalName,
      })
      .from(jobApplications)
      .innerJoin(jobPostings, eq(jobApplications.jobId, jobPostings.id))
      .leftJoin(companyRegistrations, eq(jobPostings.companyId, companyRegistrations.id))
      .where(eq(jobApplications.studentId, userId));

    pendingVerificationApps = myJobApps
      .filter((app) => app.status === "selected")
      .map((app) => ({ appId: app.appId, jobTitle: app.jobTitle, companyName: app.companyName, verificationCode: app.verificationCode }));

    shortlistedApps = myJobApps
      .filter((app) => app.status === "shortlisted" || app.status === "round_scheduled")
      .map((app) => ({ appId: app.appId, jobTitle: app.jobTitle, companyName: app.companyName, status: app.status }));

    const roundProgressRows = await db
      .select({
        appId: jobApplications.id,
        applicationStatus: jobApplications.status,
        jobTitle: jobPostings.title,
        companyName: companyRegistrations.companyLegalName,
        roundNumber: selectionProcessRounds.roundNumber,
        roundName: selectionProcessRounds.roundName,
        startsAt: selectionProcessRounds.startsAt,
        progressStatus: jobApplicationRoundProgress.status,
        reviewedAt: jobApplicationRoundProgress.reviewedAt,
      })
      .from(jobApplicationRoundProgress)
      .innerJoin(jobApplications, eq(jobApplications.id, jobApplicationRoundProgress.applicationId))
      .innerJoin(selectionProcessRounds, eq(selectionProcessRounds.id, jobApplicationRoundProgress.roundId))
      .innerJoin(jobPostings, eq(jobPostings.id, jobApplications.jobId))
      .leftJoin(companyRegistrations, eq(companyRegistrations.id, jobPostings.companyId))
      .where(eq(jobApplications.studentId, userId))
      .orderBy(asc(selectionProcessRounds.roundNumber));

    const timelineMap = new Map<string, SelectionTimelineItem>();
    for (const row of roundProgressRows) {
      const existing = timelineMap.get(row.appId) || {
        appId: row.appId,
        jobTitle: row.jobTitle,
        companyName: row.companyName,
        applicationStatus: row.applicationStatus,
        currentRound: null,
        clearedRounds: [],
      };

      if (row.progressStatus === "scheduled") {
        existing.currentRound = {
          roundNumber: row.roundNumber,
          roundName: row.roundName,
          startsAt: row.startsAt,
        };
      }

      if (row.progressStatus === "cleared") {
        existing.clearedRounds.push({
          roundNumber: row.roundNumber,
          roundName: row.roundName,
          reviewedAt: row.reviewedAt,
        });
      }

      timelineMap.set(row.appId, existing);
    }

    selectionTimeline = Array.from(timelineMap.values());
  }

  const readinessScore = Math.min(profileScore + approvedCount * 10, 100);
  const completionPercent = Math.min(profileScore, 100);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Welcome back! <Hand size={24} style={{ display: "inline-block", verticalAlign: "middle" }} /></h1>
        <p>Here&apos;s your placement journey at a glance.</p>
      </div>

      {pendingVerificationApps.map((app) => (
        <VerificationBannerClient
          key={app.appId}
          applicationId={app.appId}
          jobTitle={app.jobTitle}
          companyName={app.companyName || "Company"}
        />
      ))}

      {(shortlistedApps.length > 0 || pendingVerificationApps.length > 0) && (
        <div style={{ marginBottom: "var(--space-6)" }}>
          <h2 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Star size={20} color="#f59e0b" /> My Shortlists
          </h2>
          <div className="grid grid-3" style={{ gap: "var(--space-4)" }}>
            {shortlistedApps.map((app) => (
              <div key={app.appId} className="card" style={{ borderLeft: "4px solid #f59e0b", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 600, margin: "0 0 4px 0" }}>{app.companyName || "Company"}</p>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>{app.jobTitle}</p>
                </div>
                <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Clock size={14} color="#f59e0b" />
                  <span style={{ fontSize: "0.8rem", color: "#f59e0b", fontWeight: 600 }}>
                    {app.status === "round_scheduled" ? "Round scheduled. Check your calendar." : "Awaiting final results..."}
                  </span>
                </div>
              </div>
            ))}
            {pendingVerificationApps.map((app) => (
              <div key={app.appId} className="card" style={{ borderLeft: "4px solid #6366f1", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>
                  <p style={{ fontWeight: 600, margin: "0 0 4px 0" }}>{app.companyName || "Company"}</p>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", margin: 0 }}>{app.jobTitle}</p>
                </div>
                <div style={{ marginTop: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
                    <ShieldCheck size={14} color="#6366f1" />
                    <span style={{ fontSize: "0.8rem", color: "#6366f1", fontWeight: 600 }}>Selected! Waiting for Placement Officer to raise OD</span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    Your company result is visible to the Placement Officer. Once OD is raised, it will appear in your applications tracker automatically.
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectionTimeline.length > 0 && (
        <div style={{ marginBottom: "var(--space-6)" }}>
          <h2 style={{ marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Milestone size={20} color="#8b5cf6" /> Selection Rounds
          </h2>
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            {selectionTimeline.map((item) => (
              <div key={item.appId} className="card" style={{ padding: "var(--space-5)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", flexWrap: "wrap" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "1rem", marginBottom: "4px" }}>{item.jobTitle}</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{item.companyName || "Company"}</div>
                  </div>
                  <div className={`status-pill ${item.applicationStatus === "selected" ? "status-approved" : "status-pending"}`}>
                    {item.applicationStatus === "selected" ? "Final Result Published" : item.currentRound ? "Round In Progress" : "In Selection"}
                  </div>
                </div>

                <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                  {item.currentRound ? (
                    <div style={{ padding: "14px", borderRadius: "10px", border: "1px solid rgba(139, 92, 246, 0.35)", background: "rgba(139, 92, 246, 0.08)" }}>
                      <div style={{ fontSize: "0.75rem", color: "#8b5cf6", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                        Current Round
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: "4px" }}>
                        Round {item.currentRound.roundNumber}: {item.currentRound.roundName}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        {item.currentRound.startsAt ? new Date(item.currentRound.startsAt).toLocaleString("en-IN") : "Scheduled timing will appear in your calendar."}
                      </div>
                    </div>
                  ) : (
                    <div style={{ padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                        Current State
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: "4px" }}>Waiting for company update</div>
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                        You have no active scheduled round at the moment.
                      </div>
                    </div>
                  )}

                  <div style={{ padding: "14px", borderRadius: "10px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                      Cleared Rounds
                    </div>
                    {item.clearedRounds.length === 0 ? (
                      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>No round has been marked as cleared yet.</div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {item.clearedRounds.map((round) => (
                          <div key={`${item.appId}-${round.roundNumber}`} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.9rem" }}>
                            <CheckCircle2 size={14} color="#22c55e" />
                            <span>
                              Round {round.roundNumber}: {round.roundName}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className={styles.completionBanner}>
        <div className={styles.completionInfo}>
          <h3>Complete Your Profile</h3>
          <p>Finish your profile to unlock job applications.</p>
        </div>
        <div className={styles.completionBar}>
          <div className={styles.completionProgress} style={{ width: `${completionPercent}%` }} />
        </div>
        <span className={styles.completionPercent}>{completionPercent}%</span>
      </div>

      <ApprovedRequestsClient requests={approvedRequestsData} studentName={studentFullName} />

      <div className="grid grid-3" style={{ marginBottom: "var(--space-6)" }}>
        {[
          { label: "OD Requests", value: String(applicationCount), color: "var(--rathinam-purple)" },
          { label: "Approved ODs", value: String(approvedCount), color: "var(--rathinam-green)" },
          { label: "Pending ODs", value: String(pendingCount), color: "var(--rathinam-gold)" },
          { label: "Readiness Score", value: String(readinessScore), color: "var(--rathinam-blue)" },
        ].map((kpi) => (
          <div className="card" key={kpi.label}>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>
              {kpi.label}
            </p>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700, color: kpi.color }}>
              {kpi.value}
            </p>
          </div>
        ))}
      </div>

      <h2 style={{ marginBottom: "var(--space-4)" }}>Quick Actions</h2>
      <div className="grid grid-3">
        <Link href="/profile" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <p style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}><FileEdit size={18} /> Complete Profile</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Add skills, certifications, and projects
            </p>
          </div>
        </Link>
        <Link href="/profile?tab=resume" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <p style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}><FileText size={18} /> Upload Resume</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Manage your Cloudinary PDF resume
            </p>
          </div>
        </Link>
        <Link href="/jobs" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <p style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}><Briefcase size={18} /> Browse Internships</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Apply directly to approved internships
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
