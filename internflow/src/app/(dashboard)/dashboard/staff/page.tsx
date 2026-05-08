import { Sparkles, AlertTriangle, ArrowRight, UserCircle } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, internshipRequests } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import { getAuthorityMappingsForRole } from "@/lib/authority-scope";
import { getCollegeHierarchy } from "@/app/actions/hierarchy";
import { ScopeProvisionClient } from "./ScopeProvisionClient";

type InternshipStatus = typeof internshipRequests.$inferSelect.status;

export default async function StaffDashboard() {
  const session = await auth();
  const role = session?.user?.role;

  // Get pending approvals count based on role
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

  // Get mappings for "ID Card" scope
  const mappings = (role && session?.user?.id) 
    ? await getAuthorityMappingsForRole(session.user.id, role) 
    : [];

  if (pendingStatus) {
    const [result] = await db
      .select({ value: count() })
      .from(internshipRequests)
      .where(eq(internshipRequests.status, pendingStatus));
    pendingCount = result?.value ?? 0;
  }

  // Get active students count
  const [studentsResult] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "student"));
  const totalStudents = studentsResult?.value ?? 0;

  // Get active internships (approved requests)
  const [activeResult] = await db
    .select({ value: count() })
    .from(internshipRequests)
    .where(eq(internshipRequests.status, "approved"));
  const activeInternships = activeResult?.value ?? 0;

  // Fetch recent pending requests (latest 5)
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

  const collegeHierarchy = await getCollegeHierarchy();
  const hasScope = mappings.length > 0;

  return (
    <div>
      <div className="page-header">
        <h1>Staff Dashboard</h1>
        <p>Manage approvals, view students, and track placement progress.</p>
      </div>

      <ScopeProvisionClient collegeHierarchy={collegeHierarchy} hasScope={hasScope} role={role || ""} />

      {mappings.length > 0 && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontSize: "1.125rem", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
            <UserCircle size={20} color="var(--primary-color, #2563eb)" /> My Responsibility Scope
          </h2>
          <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
            {mappings.map((mapping, idx) => (
              <div key={idx} style={{ padding: "var(--space-4)", border: "1px solid var(--border-color)", borderRadius: "var(--border-radius-md)", backgroundColor: "var(--bg-secondary)" }}>
                <div style={{ fontWeight: 600, color: "var(--text-primary)", marginBottom: "var(--space-3)", textTransform: "capitalize", fontSize: "1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-2)" }}>
                  {role?.replace("_", " ")} Role
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-2)", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                  {mapping.school && <div><strong>School:</strong><br/>{mapping.school}</div>}
                  {mapping.department && <div><strong>Department:</strong><br/>{mapping.department}</div>}
                  {mapping.course && <div><strong>Course:</strong><br/>{mapping.course}</div>}
                  {mapping.programType && <div><strong>Program:</strong><br/>{mapping.programType}</div>}
                  {mapping.year ? <div><strong>Year:</strong><br/>{mapping.year}</div> : null}
                  {mapping.section && <div><strong>Section:</strong><br/>{mapping.section}</div>}
                  {mapping.batchStartYear && mapping.batchEndYear && <div><strong>Batch:</strong><br/>{mapping.batchStartYear} - {mapping.batchEndYear}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pendingCount > 0 && (
        <div style={{
          background: "rgba(234, 179, 8, 0.1)",
          borderLeft: "4px solid #eab308",
          padding: "var(--space-4)",
          borderRadius: "var(--border-radius-md)",
          marginBottom: "var(--space-6)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <AlertTriangle color="#eab308" size={24} />
            <div>
              <h3 style={{ margin: 0, fontSize: "1.125rem", color: "var(--text-primary)" }}>Action Required: Pending Approvals</h3>
              <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                You have {pendingCount} application{pendingCount === 1 ? '' : 's'} waiting for your approval. Please review them promptly to avoid delaying student timelines.
              </p>
            </div>
          </div>
          <Link href="/approvals" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            Review Now <ArrowRight size={16} />
          </Link>
        </div>
      )}

      <div className="grid grid-3" style={{ marginBottom: "var(--space-6)" }}>
        {[
          { label: "Pending Approvals", value: String(pendingCount), color: "var(--color-warning)", href: "/approvals" },
          { label: "Total Students", value: String(totalStudents), color: "var(--color-info)", href: "/students" },
          { label: "Active Internships", value: String(activeInternships), color: "var(--rathinam-green)" },
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
        {recentPending.length === 0 ? (
          <p style={{ color: "var(--text-secondary)", textAlign: "center", padding: "var(--space-8)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
            No pending requests. All caught up! <Sparkles size={18} />
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {recentPending.map((req) => (
              <Link key={req.id} href="/approvals" style={{ textDecoration: "none", color: "inherit" }}>
                <div style={{ padding: "var(--space-3)", borderRadius: "8px", border: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div>
                    <div style={{ fontWeight: 500, fontSize: "0.875rem" }}>Student ID: {req.studentId?.slice(0, 8)}...</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : "N/A"}
                    </div>
                  </div>
                  <span className="status-pill status-pending">Pending</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
