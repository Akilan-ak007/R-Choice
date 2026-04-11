export default function StaffDashboard() {
  return (
    <div>
      <div className="page-header">
        <h1>Staff Dashboard</h1>
        <p>Manage approvals, view students, and track placement progress.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "var(--space-6)" }}>
        {[
          { label: "Pending Approvals", value: "5", color: "var(--rathinam-gold)" },
          { label: "Total Students", value: "120", color: "var(--rathinam-teal)" },
          { label: "Active Internships", value: "34", color: "var(--rathinam-green)" },
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

      <h2 style={{ marginBottom: "var(--space-4)" }}>Recent Approval Requests</h2>
      <div className="card">
        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--space-8)" }}>
          No pending requests. All caught up! ✨
        </p>
      </div>
    </div>
  );
}
