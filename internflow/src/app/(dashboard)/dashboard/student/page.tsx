import styles from "./student.module.css";

export default function StudentDashboard() {
  return (
    <div>
      <div className="page-header">
        <h1>Welcome back! 👋</h1>
        <p>Here&apos;s your placement journey at a glance.</p>
      </div>

      {/* Profile Completion Banner */}
      <div className={styles.completionBanner}>
        <div className={styles.completionInfo}>
          <h3>Complete Your Profile</h3>
          <p>Finish your profile to unlock job applications and placement drives.</p>
        </div>
        <div className={styles.completionBar}>
          <div className={styles.completionProgress} style={{ width: "35%" }} />
        </div>
        <span className={styles.completionPercent}>35%</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-4" style={{ marginBottom: "var(--space-6)" }}>
        {[
          { label: "Applications", value: "0", color: "var(--rathinam-purple)" },
          { label: "Approved", value: "0", color: "var(--rathinam-green)" },
          { label: "Pending", value: "0", color: "var(--rathinam-gold)" },
          { label: "Readiness Score", value: "35", color: "var(--rathinam-teal)" },
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

      {/* Quick Actions */}
      <h2 style={{ marginBottom: "var(--space-4)" }}>Quick Actions</h2>
      <div className="grid grid-3">
        <div className="card" style={{ cursor: "pointer" }}>
          <p style={{ fontWeight: 600 }}>📝 Complete Profile</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            Add skills, certifications, and projects
          </p>
        </div>
        <div className="card" style={{ cursor: "pointer" }}>
          <p style={{ fontWeight: 600 }}>📄 Generate Resume</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            Download an ATS-friendly resume
          </p>
        </div>
        <div className="card" style={{ cursor: "pointer" }}>
          <p style={{ fontWeight: 600 }}>💼 Browse Jobs</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
            View internships matching your interests
          </p>
        </div>
      </div>
    </div>
  );
}
