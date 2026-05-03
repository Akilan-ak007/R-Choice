import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { approvalEscalations, internshipRequests, users } from "@/lib/db/schema";
import { and, desc, eq, inArray, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

const ALLOWED_ROLES = ["dean", "placement_officer", "coe", "principal", "placement_head", "management_corporation", "mcr"];
const PENDING_STATUSES = [
  "pending_tutor",
  "pending_coordinator",
  "pending_hod",
  "pending_dean",
  "pending_po",
  "pending_coe",
  "pending_principal",
] as const;

const TIER_LABELS: Record<number, string> = {
  1: "Tutor",
  2: "Placement Coordinator",
  3: "HOD",
  4: "Dean",
  5: "Placement Officer",
  6: "COE",
  7: "Principal",
};

function getElapsedHours(enteredAt: Date | string | null | undefined) {
  if (!enteredAt) return null;
  return Math.max(0, Math.floor((Date.now() - new Date(enteredAt).getTime()) / (1000 * 60 * 60)));
}

export default async function EscalationDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  if (!ALLOWED_ROLES.includes(session.user.role)) {
    redirect("/approvals");
  }

  const activeEscalations = await db
    .select({
      id: approvalEscalations.id,
      requestId: approvalEscalations.requestId,
      escalatedFromTier: approvalEscalations.escalatedFromTier,
      escalatedToTier: approvalEscalations.escalatedToTier,
      escalationStage: approvalEscalations.escalationStage,
      escalationReason: approvalEscalations.escalationReason,
      lastNotifiedAt: approvalEscalations.lastNotifiedAt,
      createdAt: approvalEscalations.createdAt,
      companyName: internshipRequests.companyName,
      role: internshipRequests.role,
      status: internshipRequests.status,
      currentTier: internshipRequests.currentTier,
      currentTierEnteredAt: internshipRequests.currentTierEnteredAt,
      currentTierSlaHours: internshipRequests.currentTierSlaHours,
      studentName: users.firstName,
      studentLastName: users.lastName,
    })
    .from(approvalEscalations)
    .innerJoin(internshipRequests, eq(approvalEscalations.requestId, internshipRequests.id))
    .innerJoin(users, eq(internshipRequests.studentId, users.id))
    .where(
      and(
        isNull(approvalEscalations.resolvedAt),
        inArray(internshipRequests.status, PENDING_STATUSES),
        eq(approvalEscalations.escalatedFromTier, internshipRequests.currentTier),
      ),
    )
    .orderBy(desc(approvalEscalations.lastNotifiedAt), desc(approvalEscalations.createdAt));

  const summary = {
    active: activeEscalations.length,
    escalatedBeyondCurrentTier: activeEscalations.filter((item) => (item.escalatedToTier || 0) > (item.escalatedFromTier || 0)).length,
    stageTwoOrMore: activeEscalations.filter((item) => (item.escalationStage || 0) >= 2).length,
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
        <div>
          <h1>Escalation Dashboard</h1>
          <p>Monitor OD approval requests that have breached SLA windows and moved into escalation.</p>
        </div>
        <Link href="/settings" className="btn btn-outline" style={{ textDecoration: "none" }}>
          Review SLA Policy
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <SummaryCard label="Active Escalations" value={summary.active} accent="#dc2626" />
        <SummaryCard label="Escalated Upward" value={summary.escalatedBeyondCurrentTier} accent="#f59e0b" />
        <SummaryCard label="Stage 2+" value={summary.stageTwoOrMore} accent="#8b5cf6" />
      </div>

      {activeEscalations.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <h2 style={{ marginBottom: "var(--space-2)" }}>No active escalations</h2>
          <p style={{ color: "var(--text-secondary)", margin: 0 }}>
            Every pending OD request is currently within its configured approval window.
          </p>
        </div>
      ) : (
        <div className="card" style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Company / Role</th>
                <th>Tier Movement</th>
                <th>SLA Context</th>
                <th>Last Notification</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {activeEscalations.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{`${item.studentName} ${item.studentLastName ?? ""}`.trim()}</td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span>{item.companyName}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>{item.role}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span>
                        {TIER_LABELS[item.escalatedFromTier || 0] || `Tier ${item.escalatedFromTier}`} to{" "}
                        {TIER_LABELS[item.escalatedToTier || 0] || `Tier ${item.escalatedToTier}`}
                      </span>
                      <span className="badge" style={{ width: "fit-content" }}>Stage {item.escalationStage || 1}</span>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <span>{(item.status || "").replace("pending_", "").replaceAll("_", " ") || "Pending"}</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        Entered tier: {item.currentTierEnteredAt ? new Date(item.currentTierEnteredAt).toLocaleString("en-IN") : "N/A"}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        SLA window: {item.currentTierSlaHours || 6}h
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                        Request tier: {TIER_LABELS[item.currentTier || item.escalatedFromTier || 0] || item.currentTier || item.escalatedFromTier}
                      </span>
                      <span style={{ fontSize: "0.8rem", color: "#dc2626", fontWeight: 600 }}>
                        {(() => {
                          const elapsed = getElapsedHours(item.currentTierEnteredAt);
                          if (elapsed === null) return "Elapsed time unavailable";
                          return `${elapsed}h elapsed at current tier`;
                        })()}
                      </span>
                    </div>
                  </td>
                  <td>{item.lastNotifiedAt ? new Date(item.lastNotifiedAt).toLocaleString("en-IN") : "Not notified yet"}</td>
                  <td style={{ maxWidth: "320px", color: "var(--text-secondary)" }}>{item.escalationReason || "SLA reminder triggered."}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--bg-primary);
        }
        .data-table th, .data-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
          vertical-align: top;
        }
        .data-table th {
          background: var(--bg-hover);
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }
        .badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 4px 8px;
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
          border-radius: 999px;
          text-transform: uppercase;
        }
      `}</style>
    </div>
  );
}

function SummaryCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="card" style={{ padding: "16px" }}>
      <div style={{ fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--text-secondary)", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 800, color: accent }}>{value}</div>
    </div>
  );
}
