import Link from "next/link";
import { AdminKpiCards } from "./AdminKpiCards";
import { ExportDataButton } from "@/components/dashboard/admin/ExportDataButton";
import { GenerateLinkButton } from "@/components/dashboard/admin/GenerateLinkButton";
import { db } from "@/lib/db";
import { users, internshipRequests, companyRegistrations, jobResultPublications, odRaiseRequests, notifications } from "@/lib/db/schema";
import { eq, count, inArray, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { getMailDeliveryMode } from "@/lib/mail";

export default async function AdminDashboard() {
  const session = await auth();
  const userRole = session?.user?.role || "";

  // Fetch real KPI data
  const [pendingResult] = await db
    .select({ value: count() })
    .from(internshipRequests)
    .where(inArray(internshipRequests.status, ["pending_dean", "pending_po", "pending_principal", "pending_coe"]));
  const pendingApprovals = pendingResult?.value ?? 0;

  const [slaBreachResult] = await db
    .select({
      value: sql<number>`count(*)`,
    })
    .from(internshipRequests)
    .where(sql`
      ${internshipRequests.status} IN ('pending_tutor', 'pending_coordinator', 'pending_hod', 'pending_dean', 'pending_po', 'pending_coe', 'pending_principal')
      and ${internshipRequests.currentTierEnteredAt} is not null
      and ${internshipRequests.currentTierEnteredAt} + (coalesce(${internshipRequests.currentTierSlaHours}, 6) * interval '1 hour') <= now()
    `);
  const slaBreaches = slaBreachResult?.value ?? 0;

  const [studentsResult] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "student"));
  const activeStudents = studentsResult?.value ?? 0;

  const [companiesResult] = await db
    .select({ value: count() })
    .from(users)
    .where(eq(users.role, "company"));
  const totalCompanies = companiesResult?.value ?? 0;

  // Calculate placement rate
  const [approvedResult] = await db
    .select({ value: count() })
    .from(internshipRequests)
    .where(eq(internshipRequests.status, "approved"));
  const approvedCount = approvedResult?.value ?? 0;
  const placementRate = activeStudents > 0 ? Math.round((approvedCount / activeStudents) * 100) : 0;

  // Pending company registrations count (for MCR badge)
  const [pendingCompaniesResult] = await db
    .select({ value: count() })
    .from(companyRegistrations)
    .where(eq(companyRegistrations.status, "pending"));
  const pendingCompanies = pendingCompaniesResult?.value ?? 0;

  const [pendingRaiseResult] = await db
    .select({ value: count() })
    .from(jobResultPublications)
    .leftJoin(odRaiseRequests, eq(jobResultPublications.id, odRaiseRequests.resultPublicationId))
    .where(eq(jobResultPublications.resultStatus, "selected"));
  const pendingRaiseQueue = pendingRaiseResult?.value ?? 0;
  const mailDeliveryMode = getMailDeliveryMode();

  const [manualHandoffResult] =
    ["management_corporation", "mcr"].includes(userRole) && session?.user?.id
      ? await db
          .select({ value: count() })
          .from(notifications)
          .where(
            sql`${notifications.userId} = ${session.user.id} and ${notifications.type} = 'company_manual_handoff' and coalesce(${notifications.isRead}, false) = false`
          )
      : [{ value: 0 }];
  const pendingManualHandoffs = manualHandoffResult?.value ?? 0;

  return (
    <div>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Full platform overview — approvals, analytics, and management.</p>
      </div>

      <AdminKpiCards 
        pendingApprovals={pendingApprovals} 
        activeStudents={activeStudents} 
        totalCompanies={totalCompanies} 
        placementRate={placementRate}
        slaBreaches={slaBreaches}
      />

      <div className="grid grid-2">
        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Quick Actions</h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            {["placement_officer", "management_corporation", "placement_head"].includes(userRole) && (
              <Link href="/users/create" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card action-card">
                  <p style={{ fontWeight: 600 }}>Create User Account</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    Add students, staff, or admin accounts
                  </p>
                </div>
              </Link>
            )}
            {["placement_officer", "management_corporation", "mcr", "placement_head"].includes(userRole) && (
              <Link href="/companies/review" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card action-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: 600 }}>Review Companies</p>
                    {pendingCompanies > 0 && (
                      <span style={{
                        background: "var(--status-pending)",
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        minWidth: "20px",
                        textAlign: "center",
                      }}>
                        {pendingCompanies}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    Approve pending company registrations
                  </p>
                </div>
              </Link>
            )}
            {["placement_officer", "management_corporation", "mcr", "placement_head"].includes(userRole) && (
              <Link href="/settings" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card action-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: 600 }}>OD SLA Settings</p>
                    {slaBreaches > 0 && (
                      <span style={{
                        background: "#dc2626",
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        minWidth: "20px",
                        textAlign: "center",
                      }}>
                        {slaBreaches}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    Review the current approval timing policy and overdue OD approvals.
                  </p>
                </div>
              </Link>
            )}
            {["dean", "placement_officer", "coe", "principal", "placement_head", "management_corporation", "mcr"].includes(userRole) && (
              <Link href="/approvals/escalations" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card action-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: 600 }}>Escalation Dashboard</p>
                    {slaBreaches > 0 && (
                      <span style={{
                        background: "#dc2626",
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        minWidth: "20px",
                        textAlign: "center",
                      }}>
                        {slaBreaches}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    See active breaches, upward escalations, and notification pressure by tier.
                  </p>
                </div>
              </Link>
            )}
            {userRole === "placement_officer" && (
              <Link href="/approvals/results" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card action-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <p style={{ fontWeight: 600 }}>Raise OD Queue</p>
                    {pendingRaiseQueue > 0 && (
                      <span style={{
                        background: "var(--status-pending)",
                        color: "white",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        padding: "2px 8px",
                        borderRadius: "12px",
                        minWidth: "20px",
                        textAlign: "center",
                      }}>
                        {pendingRaiseQueue}
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    Review company selections and manually start OD approvals
                  </p>
                </div>
              </Link>
            )}
            <ExportDataButton />
          </div>

          {/* MCR-specific: Generate company onboarding links */}
          {["management_corporation", "mcr"].includes(userRole) && (
            <div style={{ marginTop: "var(--space-6)" }}>
              <h2 style={{ marginBottom: "var(--space-4)" }}>Company Onboarding</h2>
              <div className="card" style={{ padding: "var(--space-5)" }}>
                <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "var(--space-3)" }}>
                  Generate a secure, time-limited registration link to send to a company for onboarding.
                </p>
                <GenerateLinkButton />
              </div>

              <Link href="/companies/invitations" style={{ textDecoration: "none", color: "inherit" }}>
                <div className="card action-card" style={{ marginTop: "var(--space-4)" }}>
                  <p style={{ fontWeight: 600 }}>View Registration Links</p>
                  <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    Review generated onboarding links, expiry windows, and submitted registrations.
                  </p>
                </div>
              </Link>

              {mailDeliveryMode !== "smtp" && (
                <div className="card" style={{ padding: "var(--space-5)", marginTop: "var(--space-4)", border: "1px solid rgba(245, 158, 11, 0.2)", background: "rgba(245, 158, 11, 0.08)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <div>
                      <div style={{ fontWeight: 700, marginBottom: "4px", color: "#b45309" }}>Manual Credential Handoff</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                        Email delivery is disabled. Approved companies will need credentials shared manually from your dashboard notifications.
                      </div>
                    </div>
                    {pendingManualHandoffs > 0 && (
                      <span style={{ background: "#b45309", color: "white", fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: "999px" }}>
                        {pendingManualHandoffs} pending
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Ongoing Internships</h2>
          <div className="card" style={{ padding: "var(--space-6)", textAlign: "center" }}>
            <p style={{ fontFamily: "var(--font-heading)", fontSize: "2.5rem", fontWeight: 700, color: "var(--rathinam-green)" }}>
              {approvedCount}
            </p>
            <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
              Active approved internships across all departments
            </p>
            <Link href="/reports/admin" className="btn btn-outline" style={{ display: "inline-flex", gap: "8px" }}>
              View Detailed Reports
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
