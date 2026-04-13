import { auth } from "@/lib/auth";
import { getFilteredRequestsForStaff } from "@/lib/db/queries/approvals";
import { redirect } from "next/navigation";
import { CheckCircle, XCircle } from "lucide-react";
import ApprovalActions from "./ApprovalActions";

export default async function ApprovalsPage(props: { searchParams: Promise<{ status?: string }> }) {
  const searchParams = await props.searchParams;
  const filterStatus = searchParams.status || "pending";
  
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const role = session.user.role;
  // Let's only allow staff/admins
  if (role === "student" || role === "company" || role === "alumni") {
    redirect("/");
  }

  const requests = await getFilteredRequestsForStaff(session.user.id, role, filterStatus);

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
                <th>Type</th>
                <th>Date Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((req) => (
                <tr key={req.id}>
                  <td style={{ fontWeight: 600 }}>{req.studentName}</td>
                  <td>{req.companyName}</td>
                  <td>{req.role}</td>
                  <td>
                    <span className="badge">
                      {req.applicationType}
                    </span>
                  </td>
                  <td>{new Date(req.submittedAt!).toLocaleDateString()}</td>
                  <td>
                    {req.status === "approved" || req.status === "rejected" ? (
                      <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>
                        {req.status === "approved" ? "Processed" : "Declined"}
                      </span>
                    ) : (
                      <ApprovalActions requestId={req.id} />
                    )}
                  </td>
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
