import Link from "next/link";
import { AlertTriangle, ArrowRight, Compass, Sparkles, UserCircle } from "lucide-react";
import { eq, count } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, internshipRequests } from "@/lib/db/schema";
import { getAuthorityMappingsForRole } from "@/lib/authority-scope";

type InternshipStatus = typeof internshipRequests.$inferSelect.status;

export default async function StaffDashboard() {
  const session = await auth();
  const role = session?.user?.role;

  let pendingCount = 0;
  const statusMap: Partial<Record<string, InternshipStatus>> = {
    tutor: "pending_tutor",
    placement_coordinator: "pending_coordinator",
    hod: "pending_hod",
    dean: "pending_dean",
    placement_officer: "pending_po",
    principal: "pending_principal",
  };
  const pendingStatus = role ? statusMap[role] : null;

  const mappings = role && session?.user?.id ? await getAuthorityMappingsForRole(session.user.id, role) : [];

  if (pendingStatus) {
    const [result] = await db.select({ value: count() }).from(internshipRequests).where(eq(internshipRequests.status, pendingStatus));
    pendingCount = result?.value ?? 0;
  }

  const [studentsResult] = await db.select({ value: count() }).from(users).where(eq(users.role, "student"));
  const totalStudents = studentsResult?.value ?? 0;

  const [activeResult] = await db.select({ value: count() }).from(internshipRequests).where(eq(internshipRequests.status, "approved"));
  const activeInternships = activeResult?.value ?? 0;

  const recentPending = pendingStatus
    ? await db
        .select({
          id: internshipRequests.id,
          studentId: internshipRequests.studentId,
          status: internshipRequests.status,
          createdAt: internshipRequests.createdAt,
        })
        .from(internshipRequests)
        .where(eq(internshipRequests.status, pendingStatus))
        .orderBy(internshipRequests.createdAt)
        .limit(5)
    : [];

  return (
    <div className="dashboard-shell animate-fade-in">
      <section className="hero-panel">
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <span className="hero-badge">
            <Compass size={14} />
            Staff Workspace
          </span>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1>Staff Dashboard</h1>
            <p>Review approvals, understand your scope, and keep students moving without losing track of class ownership.</p>
          </div>
          <div className="metric-strip">
            <HeroMetric label="Pending approvals" value={pendingCount} accent="var(--color-warning)" />
            <HeroMetric label="Visible students" value={totalStudents} accent="var(--text-link)" />
            <HeroMetric label="Active internships" value={activeInternships} accent="var(--rathinam-green)" />
          </div>
        </div>
      </section>

      <section className="card-glass" style={{ padding: "var(--space-5)", borderRadius: "var(--border-radius-xl)" }}>
        <h2 style={{ marginTop: 0, marginBottom: "var(--space-3)" }}>Hierarchy Access</h2>
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.9rem" }}>
          Tutors, placement coordinators, and HODs cannot self-assign hierarchy scope. Scope assignment is handled through hierarchy management by HOD or dean based on role.
        </p>
      </section>

      {mappings.length > 0 && (
        <section className="card-glass" style={{ padding: "var(--space-5)", borderRadius: "var(--border-radius-xl)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "var(--space-4)" }}>
            <UserCircle size={20} color="var(--text-link)" />
            <div>
              <h2 style={{ margin: 0, fontSize: "1.125rem" }}>My Responsibility Scope</h2>
              <p style={{ margin: "4px 0 0 0", color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                Your live academic identity card. This changes automatically when hierarchy assignments are updated.
              </p>
            </div>
          </div>
          <div className="scope-grid">
            {mappings.map((mapping, idx) => (
              <div key={idx} className="scope-card">
                <div className="scope-card-title">
                  <Sparkles size={16} color="var(--text-link)" />
                  {(role || "staff").replaceAll("_", " ")} ID card
                </div>
                <div className="scope-meta">
                  {mapping.school && <span className="scope-chip">School: {mapping.school}</span>}
                  {mapping.department && <span className="scope-chip">Dept: {mapping.department}</span>}
                  {mapping.course && <span className="scope-chip">Class: {mapping.course}</span>}
                  {mapping.programType && <span className="scope-chip">Program: {mapping.programType}</span>}
                  {mapping.year ? <span className="scope-chip">Year: {mapping.year}</span> : null}
                  {mapping.section && <span className="scope-chip">Section: {mapping.section}</span>}
                  {mapping.batchStartYear && mapping.batchEndYear ? (
                    <span className="scope-chip">Batch: {mapping.batchStartYear} - {mapping.batchEndYear}</span>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {pendingCount > 0 && (
        <div className="card" style={{ background: "linear-gradient(135deg, rgba(250,185,21,0.12), rgba(244,122,42,0.08))", borderColor: "rgba(234,179,8,0.24)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <AlertTriangle color="#eab308" size={24} />
              <div>
                <h3 style={{ margin: 0, fontSize: "1.125rem", color: "var(--text-primary)" }}>Action Required</h3>
                <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                  You have {pendingCount} application{pendingCount === 1 ? "" : "s"} waiting for approval.
                </p>
              </div>
            </div>
            <Link href="/approvals" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
              Review Now <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-2">
        <div className="dashboard-shell">
          <div className="grid grid-3" style={{ marginBottom: 0 }}>
            {[
              { label: "Pending Approvals", value: String(pendingCount), color: "var(--color-warning)", href: "/approvals" },
              { label: "Total Students", value: String(totalStudents), color: "var(--color-info)", href: "/students" },
              { label: "Active Internships", value: String(activeInternships), color: "var(--rathinam-green)" },
            ].map((kpi) => {
              const content = (
                <div className="card" style={{ height: "100%", cursor: kpi.href ? "pointer" : "default", background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,249,255,0.94))" }}>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>{kpi.label}</p>
                  <p style={{ fontFamily: "var(--font-heading)", fontSize: "2rem", fontWeight: 700, color: kpi.color }}>{kpi.value}</p>
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

          <div className="card-glass" style={{ padding: "var(--space-5)", borderRadius: "var(--border-radius-xl)" }}>
            <h2 style={{ marginBottom: "var(--space-4)" }}>Recent Approval Requests</h2>
            {recentPending.length === 0 ? (
              <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--space-8)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                No pending requests. All caught up! <Sparkles size={18} />
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                {recentPending.map((req) => (
                  <Link key={req.id} href="/approvals" style={{ textDecoration: "none", color: "inherit" }}>
                    <div style={{ padding: "var(--space-3)", borderRadius: "14px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(255,255,255,0.88)" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>Student ID: {req.studentId?.slice(0, 8)}...</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "N/A"}</div>
                      </div>
                      <span className="status-pill status-pending">Pending</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="dashboard-shell">
          <div className="card">
            <h2 style={{ marginTop: 0, marginBottom: "var(--space-3)" }}>Recommended Flow</h2>
            <div style={{ display: "grid", gap: "10px" }}>
              <FlowRow title="1. Confirm your scope" detail="Check school, department, class, section, and year before reviewing student records." />
              <FlowRow title="2. Filter student lists" detail="Choose class and department first so the student directory stays fast and clear." />
              <FlowRow title="3. Resolve hierarchy gaps" detail="Use hierarchy audit when a student or staff record looks missing even after successful creation." />
            </div>
          </div>

          {!["tutor", "placement_coordinator"].includes(role || "") && (
            <div className="card">
              <h2 style={{ marginTop: 0, marginBottom: "var(--space-3)" }}>Jump To</h2>
              <div style={{ display: "grid", gap: "var(--space-2)" }}>
                {role !== "tutor" ? (
                  <Link href="/students" className="btn btn-outline" style={{ textDecoration: "none", justifyContent: "center" }}>Student Directory</Link>
                ) : null}
                <Link href="/users" className="btn btn-outline" style={{ textDecoration: "none", justifyContent: "center" }}>User Management</Link>
                <Link href="/settings/hierarchy-audit" className="btn btn-outline" style={{ textDecoration: "none", justifyContent: "center" }}>Hierarchy Audit</Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function HeroMetric({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="glass-stat">
      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: accent || "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

function FlowRow({ title, detail }: { title: string; detail: string }) {
  return (
    <div style={{ padding: "var(--space-3)", borderRadius: "14px", background: "rgba(30, 155, 215, 0.06)" }}>
      <div style={{ fontWeight: 700, marginBottom: "4px" }}>{title}</div>
      <div style={{ color: "var(--text-secondary)", fontSize: "0.86rem" }}>{detail}</div>
    </div>
  );
}
