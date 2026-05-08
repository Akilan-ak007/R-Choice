import Link from "next/link";
import { ArrowRight, Building2, ShieldCheck, Sparkles, Workflow } from "lucide-react";
import { eq, count, inArray, sql } from "drizzle-orm";

import { GenerateLinkButton } from "@/components/dashboard/admin/GenerateLinkButton";
import { ExportDataButton } from "@/components/dashboard/admin/ExportDataButton";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  companyRegistrations,
  internshipRequests,
  jobResultPublications,
  notifications,
  odRaiseRequests,
  users,
} from "@/lib/db/schema";
import { getMailDeliveryMode } from "@/lib/mail";

import { AdminKpiCards } from "./AdminKpiCards";

type QuickAction = {
  href: string;
  title: string;
  description: string;
  badge?: number;
};

export default async function AdminDashboard() {
  const session = await auth();
  const userRole = session?.user?.role || "";

  const [pendingResult] = await db
    .select({ value: count() })
    .from(internshipRequests)
    .where(inArray(internshipRequests.status, ["pending_dean", "pending_po", "pending_principal", "pending_coe"]));
  const pendingApprovals = pendingResult?.value ?? 0;

  const [slaBreachResult] = await db
    .select({ value: sql<number>`count(*)` })
    .from(internshipRequests)
    .where(sql`
      ${internshipRequests.status} IN ('pending_tutor', 'pending_coordinator', 'pending_hod', 'pending_dean', 'pending_po', 'pending_coe', 'pending_principal')
      and ${internshipRequests.currentTierEnteredAt} is not null
      and ${internshipRequests.currentTierEnteredAt} + (coalesce(${internshipRequests.currentTierSlaHours}, 6) * interval '1 hour') <= now()
    `);
  const slaBreaches = slaBreachResult?.value ?? 0;

  const [studentsResult] = await db.select({ value: count() }).from(users).where(eq(users.role, "student"));
  const activeStudents = studentsResult?.value ?? 0;

  const [companiesResult] = await db.select({ value: count() }).from(users).where(eq(users.role, "company"));
  const totalCompanies = companiesResult?.value ?? 0;

  const [approvedResult] = await db.select({ value: count() }).from(internshipRequests).where(eq(internshipRequests.status, "approved"));
  const approvedCount = approvedResult?.value ?? 0;
  const placementRate = activeStudents > 0 ? Math.round((approvedCount / activeStudents) * 100) : 0;

  const [pendingCompaniesResult] = await db.select({ value: count() }).from(companyRegistrations).where(eq(companyRegistrations.status, "pending"));
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

  const quickActions: QuickAction[] = [
    ["placement_officer", "management_corporation", "placement_head"].includes(userRole)
      ? { href: "/users/create", title: "Create User", description: "Add students, faculty, and admin accounts." }
      : null,
    ["placement_officer", "management_corporation", "mcr", "placement_head"].includes(userRole)
      ? { href: "/companies/review", title: "Review Companies", description: "Approve pending company registrations.", badge: pendingCompanies }
      : null,
    ["placement_officer", "management_corporation", "mcr", "placement_head"].includes(userRole)
      ? { href: "/settings", title: "OD SLA Settings", description: "Review timing rules and overdue approvals.", badge: slaBreaches }
      : null,
    ["dean", "placement_officer", "coe", "principal", "placement_head", "management_corporation", "mcr"].includes(userRole)
      ? { href: "/approvals/escalations", title: "Escalation Board", description: "Track breaches and upward escalations.", badge: slaBreaches }
      : null,
    userRole === "placement_officer"
      ? { href: "/approvals/results", title: "Raise OD Queue", description: "Start OD approvals for selected students.", badge: pendingRaiseQueue }
      : null,
  ].filter(Boolean) as QuickAction[];

  return (
    <div className="dashboard-shell animate-fade-in">
      <section className="hero-panel">
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <span className="hero-badge">
            <Sparkles size={14} />
            Leadership Command Center
          </span>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1>Admin Dashboard</h1>
            <p>Run approvals, hierarchy cleanup, company onboarding, and placement operations from one high-signal workspace.</p>
          </div>
          <div className="metric-strip">
            <HeroMetric label="Pending approvals" value={pendingApprovals} accent="var(--color-warning)" />
            <HeroMetric label="SLA breaches" value={slaBreaches} accent="#dc2626" />
            <HeroMetric label="Placement rate" value={`${placementRate}%`} accent="var(--rathinam-green)" />
          </div>
        </div>
      </section>

      <AdminKpiCards
        pendingApprovals={pendingApprovals}
        activeStudents={activeStudents}
        totalCompanies={totalCompanies}
        placementRate={placementRate}
        slaBreaches={slaBreaches}
      />

      <div className="dashboard-split">
        <div className="dashboard-shell">
          <div className="card-glass" style={{ padding: "var(--space-5)", borderRadius: "var(--border-radius-xl)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
              <div>
                <h2 style={{ marginTop: 0, marginBottom: "6px" }}>Operations Snapshot</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>A compact read of the pressure points that need leadership attention.</p>
              </div>
              <span className="hero-badge">
                <Workflow size={14} />
                Live overview
              </span>
            </div>
            <div className="metric-strip">
              <CompactMetric label="Pending approvals" value={pendingApprovals} />
              <CompactMetric label="SLA breaches" value={slaBreaches} accent="#dc2626" />
              <CompactMetric label="Approved internships" value={approvedCount} accent="var(--rathinam-green)" />
            </div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
              <h2 style={{ margin: 0 }}>Quick Actions</h2>
              <span style={{ color: "var(--text-secondary)", fontSize: "0.85rem" }}>Compact and above the fold for faster admin work</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-3)" }}>
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} style={{ textDecoration: "none", color: "inherit" }}>
                  <div className="card action-card" style={{ height: "100%", minHeight: "150px", display: "grid", alignContent: "space-between", background: "linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,249,255,0.94))" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
                      <p style={{ fontWeight: 700, margin: 0 }}>{action.title}</p>
                      {action.badge ? (
                        <span style={{ background: "var(--status-pending)", color: "white", fontSize: "0.75rem", fontWeight: 700, padding: "2px 8px", borderRadius: "999px", minWidth: "24px", textAlign: "center" }}>
                          {action.badge}
                        </span>
                      ) : null}
                    </div>
                    <p style={{ fontSize: "0.84rem", color: "var(--text-secondary)", marginBottom: "var(--space-3)" }}>{action.description}</p>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", color: "var(--text-link)", fontWeight: 700, fontSize: "0.84rem" }}>
                      Open action <ArrowRight size={14} />
                    </span>
                  </div>
                </Link>
              ))}
              <ExportDataButton />
            </div>
          </div>

          {["management_corporation", "mcr"].includes(userRole) && (
            <div>
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
                    {pendingManualHandoffs > 0 ? (
                      <span style={{ background: "#b45309", color: "white", fontSize: "0.75rem", fontWeight: 700, padding: "4px 10px", borderRadius: "999px" }}>
                        {pendingManualHandoffs} pending
                      </span>
                    ) : null}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <div className="card-glass" style={{ padding: "var(--space-5)", borderRadius: "var(--border-radius-xl)" }}>
            <h2 style={{ marginTop: 0, marginBottom: "var(--space-3)" }}>Placement Performance</h2>
            <div style={{ display: "grid", gap: "var(--space-3)" }}>
              <PerformanceRow label="Placement rate" value={`${placementRate}%`} accent="var(--rathinam-green)" />
              <PerformanceRow label="Approved internships" value={String(approvedCount)} />
              <PerformanceRow label="Companies onboarded" value={String(totalCompanies)} />
              <PerformanceRow label="Students tracked" value={String(activeStudents)} />
            </div>
            <Link href="/reports/admin" className="btn btn-outline" style={{ display: "inline-flex", gap: "8px", marginTop: "var(--space-4)" }}>
              View Detailed Reports
            </Link>
          </div>

          <div className="card" style={{ padding: "var(--space-5)", background: "linear-gradient(180deg, rgba(20,95,132,0.96), rgba(13,67,94,0.98))", color: "white" }}>
            <div style={{ display: "inline-flex", width: 44, height: 44, alignItems: "center", justifyContent: "center", borderRadius: "14px", background: "rgba(255,255,255,0.12)", marginBottom: "var(--space-3)" }}>
              <ShieldCheck size={20} />
            </div>
            <h2 style={{ marginTop: 0, marginBottom: "var(--space-2)", color: "white" }}>Leadership Notes</h2>
            <p style={{ fontSize: "0.875rem", color: "rgba(255,255,255,0.82)", marginBottom: "var(--space-3)" }}>
              Keep hierarchy mappings aligned before reviewing approvals so HOD, PC, tutor, and student visibility stays in sync.
            </p>
            <div style={{ display: "grid", gap: "var(--space-2)" }}>
              <Link href="/settings/hierarchy" className="btn btn-outline" style={{ textDecoration: "none", justifyContent: "center", borderColor: "rgba(255,255,255,0.22)", color: "white" }}>
                Open Hierarchy Settings
              </Link>
              <Link href="/settings/hierarchy-audit" className="btn btn-outline" style={{ textDecoration: "none", justifyContent: "center", borderColor: "rgba(255,255,255,0.22)", color: "white" }}>
                Open Hierarchy Audit
              </Link>
              <Link href="/students" className="btn btn-outline" style={{ textDecoration: "none", justifyContent: "center", borderColor: "rgba(255,255,255,0.22)", color: "white" }}>
                Open Student Directory
              </Link>
              <Link href="/users" className="btn btn-outline" style={{ textDecoration: "none", justifyContent: "center", borderColor: "rgba(255,255,255,0.22)", color: "white" }}>
                Open User Management
              </Link>
            </div>
          </div>

          <div className="card" style={{ padding: "var(--space-5)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "var(--space-3)" }}>
              <Building2 size={18} color="var(--text-link)" />
              <h2 style={{ margin: 0 }}>Platform Health</h2>
            </div>
            <div style={{ display: "grid", gap: "10px" }}>
              <PerformanceRow label="Pending company reviews" value={String(pendingCompanies)} />
              <PerformanceRow label="Raise OD queue" value={String(pendingRaiseQueue)} />
              <PerformanceRow label="Manual handoffs" value={String(pendingManualHandoffs)} accent="#b45309" />
            </div>
          </div>
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

function CompactMetric({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div style={{ padding: "var(--space-3)", borderRadius: "12px", background: "rgba(255,255,255,0.72)" }}>
      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{label}</div>
      <div style={{ fontSize: "1.5rem", fontWeight: 700, color: accent || "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

function PerformanceRow({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-3)", borderRadius: "12px", background: "rgba(255,255,255,0.72)" }}>
      <span style={{ color: "var(--text-secondary)" }}>{label}</span>
      <strong style={{ color: accent || "var(--text-primary)" }}>{value}</strong>
    </div>
  );
}
