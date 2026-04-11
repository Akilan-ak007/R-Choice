export default function AdminDashboard() {
  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Full platform overview — approvals, analytics, and management.</p>
      </div>

      <div className="grid grid-4" style={{ marginBottom: "var(--space-6)" }}>
        {[
          { label: "Pending Approvals", value: "8", color: "var(--rathinam-orange)" },
          { label: "Active Students", value: "2,450", color: "var(--rathinam-blue)" },
          { label: "Companies", value: "24", color: "var(--rathinam-purple)" },
          { label: "Placement Rate", value: "78%", color: "var(--rathinam-green)" },
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

      <div className="grid grid-2">
        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div className="card" style={{ cursor: "pointer" }}>
              <p style={{ fontWeight: 600 }}>Create User Account</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Add students, staff, or admin accounts
              </p>
            </div>
            <div className="card" style={{ cursor: "pointer" }}>
              <p style={{ fontWeight: 600 }}>Review Companies</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Approve pending company registrations
              </p>
            </div>
            <div className="card" style={{ cursor: "pointer" }}>
              <p style={{ fontWeight: 600 }}>Export Data</p>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                Download reports as Excel sheets
              </p>
            </div>
          </div>
        </div>

        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Recent Activity</h2>
          <div className="card">
            <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--space-8)" }}>
              Activity feed will appear here once the system is live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
