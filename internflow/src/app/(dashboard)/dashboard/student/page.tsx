import styles from "./student.module.css";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { studentProfiles, internshipRequests } from "@/lib/db/schema";
import { eq, and, count } from "drizzle-orm";
import { Hand, FileEdit, FileText, Briefcase } from "lucide-react";
import Link from "next/link";

export default async function StudentDashboard() {
  const session = await auth();
  const userId = session?.user?.id;

  // Fetch real data
  let profileScore = 0;
  let applicationCount = 0;
  let approvedCount = 0;
  let pendingCount = 0;

  if (userId) {
    // Profile completion
    const [profile] = await db
      .select({ score: studentProfiles.profileCompletionScore })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);
    profileScore = profile?.score ?? 0;

    // Application counts
    const allApps = await db
      .select({ status: internshipRequests.status })
      .from(internshipRequests)
      .where(eq(internshipRequests.studentId, userId));

    applicationCount = allApps.length;
    approvedCount = allApps.filter((a) => a.status === "approved").length;
    pendingCount = allApps.filter(
      (a) => a.status !== "approved" && a.status !== "rejected" && a.status !== "draft"
    ).length;
  }

  // Readiness score = profile score for now (V1)
  const readinessScore = Math.min(profileScore + approvedCount * 10, 100);
  const completionPercent = Math.min(profileScore, 100);

  return (
    <div>
      <div className="page-header">
        <h1>Welcome back! <Hand size={24} style={{ display: "inline-block", verticalAlign: "middle" }} /></h1>
        <p>Here&apos;s your placement journey at a glance.</p>
      </div>

      {/* Profile Completion Banner */}
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

      {/* KPI Cards */}
      <div className="grid grid-3" style={{ marginBottom: "var(--space-6)" }}>
        {[
          { label: "Applications", value: String(applicationCount), color: "var(--rathinam-purple)" },
          { label: "Approved", value: String(approvedCount), color: "var(--rathinam-green)" },
          { label: "Pending", value: String(pendingCount), color: "var(--rathinam-gold)" },
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

      {/* Quick Actions — Wired to real routes */}
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
        <Link href="/profile/resume" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <p style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}><FileText size={18} /> Generate Resume</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Download an ATS-friendly resume
            </p>
          </div>
        </Link>
        <Link href="/jobs" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="card" style={{ cursor: "pointer" }}>
            <p style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}><Briefcase size={18} /> Browse Jobs</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              View internships matching your interests
            </p>
          </div>
        </Link>
      </div>
    </div>
  );
}
