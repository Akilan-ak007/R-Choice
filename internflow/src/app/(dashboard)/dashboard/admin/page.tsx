"use client";

import Link from "next/link";
import { AdminKpiCards } from "./AdminKpiCards";
import { AuditLogTypewriter } from "@/components/dashboard/admin/AuditLogTypewriter";
import { ExportDataButton } from "@/components/dashboard/admin/ExportDataButton";

export default function AdminDashboard() {
  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Full platform overview — approvals, analytics, and management.</p>
      </div>

      <AdminKpiCards />

      <div className="grid grid-2">
        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <Link href="/users/create" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card" style={{ cursor: "pointer", transition: "transform var(--transition-fast), box-shadow var(--transition-fast)" }}
                onMouseEnter={(e: any) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
              >
                <p style={{ fontWeight: 600 }}>Create User Account</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  Add students, staff, or admin accounts
                </p>
              </div>
            </Link>
            <Link href="/approvals" style={{ textDecoration: "none", color: "inherit" }}>
              <div className="card" style={{ cursor: "pointer", transition: "transform var(--transition-fast), box-shadow var(--transition-fast)" }}
                onMouseEnter={(e: any) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "var(--shadow-card-hover)"; }}
                onMouseLeave={(e: any) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = ""; }}
              >
                <p style={{ fontWeight: 600 }}>Review Companies</p>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  Approve pending company registrations
                </p>
              </div>
            </Link>
            <ExportDataButton />
          </div>
        </div>

        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Recent Activity</h2>
          <AuditLogTypewriter />
        </div>
      </div>
    </div>
  );
}
