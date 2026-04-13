import { Sparkles } from "lucide-react";
import Link from "next/link";

export default function StaffDashboard() {
  return (
    <div>
      <div className="page-header">
        <h1>Staff Dashboard</h1>
        <p>Manage approvals, view students, and track placement progress.</p>
      </div>

      <div className="grid grid-3" style={{ marginBottom: "var(--space-6)" }}>
        {[
          { label: "Pending Approvals", value: "5", color: "var(--color-warning)", href: "/approvals" },
          { label: "Total Students", value: "120", color: "var(--color-info)", href: "/students" },
          { label: "Active Internships", value: "34", color: "var(--rathinam-green)" },
        ].map((kpi) => {
          const content = (
            <div className="card" style={{ height: "100%", cursor: kpi.href ? "pointer" : "default" }}>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>
                {kpi.label}
              </p>
              <p style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700, color: kpi.color }}>
                {kpi.value}
              </p>
            </div>
          );

          return kpi.href ? (
             <Link href={kpi.href} key={kpi.label} style={{ textDecoration: "none", color: "inherit" }}>
               {content}
             </Link>
          ) : (
             <div key={kpi.label}>{content}</div>
          );
        })}
      </div>

      <h2 style={{ marginBottom: "var(--space-4)" }}>Recent Approval Requests</h2>
      <div className="card">
        <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--space-8)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
          No pending requests. All caught up! <Sparkles size={18} />
        </p>
      </div>
    </div>
  );
}
