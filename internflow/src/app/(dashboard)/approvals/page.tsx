import { auth } from "@/lib/auth";
import { getFilteredRequestsForStaff } from "@/lib/db/queries/approvals";
import { redirect } from "next/navigation";
import { CheckCircle } from "lucide-react";
import ApprovalActions from "./ApprovalActions";

function getSlaState(enteredAt: Date | string | null | undefined, slaHours: number | null | undefined) {
  if (!enteredAt) return null;

  const slaWindow = slaHours || 6;
  const elapsedHours = (Date.now() - new Date(enteredAt).getTime()) / (1000 * 60 * 60);
  const roundedElapsed = Math.max(0, Math.floor(elapsedHours));

  if (elapsedHours >= slaWindow) {
    return {
      overdue: true,
      text: `SLA overdue by ${Math.max(1, roundedElapsed - slaWindow)}h`,
      tone: "#dc2626",
      background: "rgba(239, 68, 68, 0.08)",
    };
  }

  return {
    overdue: false,
    text: `Within SLA ${roundedElapsed}h / ${slaWindow}h`,
    tone: "var(--text-secondary)",
    background: "var(--bg-hover)",
  };
}

export default async function ApprovalsPage(props: { searchParams: Promise<{ status?: string; page?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const role = session.user.role;
  // Let's only allow staff/admins
  if (role === "student" || role === "company" || role === "alumni") {
    redirect("/");
  }

  const searchParams = await props.searchParams;
  const filterStatus = searchParams.status || "pending";
  const currentPage = parseInt(searchParams.page || "1", 10);

  const result = await getFilteredRequestsForStaff(session.user.id, role, filterStatus, currentPage, 25);
  const requests = result.data;
  const totalPages = result.totalPages;

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Student Approvals</h1>
          <p>Review and filter internship requests handled by your tier.</p>
        </div>
        <form method="GET" style={{ display: "flex", gap: "10px" }}>
          <select name="status" defaultValue={filterStatus} style={{ padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", fontWeight: 500 }}>
            <option value="pending">Pending Approvals</option>
            {(role === "dean" || role === "placement_officer" || role === "coe" || role === "principal") && (
              <option value="downward">Pending at Lower Tiers</option>
            )}
            <option value="approved">Successfully Approved</option>
            <option value="rejected">Rejected Approvals</option>
          </select>
          <button type="submit" className="button">Filter</button>
        </form>
      </div>

      {requests.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ marginBottom: "var(--space-4)", display: "flex", justifyContent: "center", color: "var(--color-primary)" }}>
            <CheckCircle size={48} />
          </div>
          <h2 style={{ marginBottom: "var(--space-2)" }}>All Caught Up!</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
            There are no student internship requests waiting for your approval right now.
          </p>
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Company</th>
                <th>Role</th>
                <th>Status / Latency</th>
                <th>Date Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => {
                const lastActionDate = new Date(req.updatedAt || req.submittedAt!);
                const requestStatus = req.status ?? "pending";
                const slaState = getSlaState(req.currentTierEnteredAt, req.currentTierSlaHours);
                
                return (
                  <tr key={req.id}>
                    <td style={{ fontWeight: 600 }}>{req.studentName}</td>
                    <td>{req.companyName}</td>
                    <td>{req.role}</td>
                    <td>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span className="badge">
                          {requestStatus.replace("pending_", "").replace("_", " ")}
                        </span>
                        {filterStatus === "pending" || filterStatus === "downward" ? (
                          <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                            Last activity {lastActionDate.toLocaleDateString()}
                          </span>
                        ) : null}
                        {filterStatus === "pending" && slaState ? (
                          <span
                            style={{
                              fontSize: "0.75rem",
                              color: slaState.tone,
                              background: slaState.background,
                              borderRadius: "999px",
                              padding: "3px 8px",
                              width: "fit-content",
                              fontWeight: slaState.overdue ? 700 : 500,
                            }}
                          >
                            {slaState.text}
                          </span>
                        ) : null}
                      </div>
                    </td>
                    <td>{new Date(req.submittedAt!).toLocaleDateString()}</td>
                    <td>
                      {requestStatus === "approved" || requestStatus === "rejected" ? (
                        <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>
                          {requestStatus === "approved" ? "Processed" : "Declined"}
                        </span>
                      ) : filterStatus === "downward" ? (
                        <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>
                          Awaiting lower tier
                        </span>
                      ) : (
                        <ApprovalActions requestId={req.id} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "24px" }}>
          <a
             href={`?status=${filterStatus}&page=${currentPage - 1}`}
             className="btn btn-outline"
             style={{ opacity: currentPage <= 1 ? 0.5 : 1, pointerEvents: currentPage <= 1 ? "none" : "auto", display: "inline-block", textDecoration: "none" }}
          >
            Previous
          </a>
          <span style={{ display: "flex", alignItems: "center", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
             Page {currentPage} of {totalPages}
          </span>
          <a
             href={`?status=${filterStatus}&page=${currentPage + 1}`}
             className="btn btn-outline"
             style={{ opacity: currentPage >= totalPages ? 0.5 : 1, pointerEvents: currentPage >= totalPages ? "none" : "auto", display: "inline-block", textDecoration: "none" }}
          >
            Next
          </a>
        </div>
      )}

      <style>{`
        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--bg-primary);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .data-table th, .data-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
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
          background: var(--bg-hover);
          border-radius: 4px;
          text-transform: capitalize;
        }
      `}</style>
    </div>
  );
}
