import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { internshipRequests } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, ExternalLink, Calendar, MapPin, Building2 } from "lucide-react";

export default async function ApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const userId = session.user.id;
  
  // Fetch their applications
  const applications = await db
    .select()
    .from(internshipRequests)
    .where(eq(internshipRequests.studentId, userId))
    .orderBy(desc(internshipRequests.createdAt));

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "approved": return <span className="badge badge-success">Approved</span>;
      case "rejected": return <span className="badge badge-danger">Rejected</span>;
      case "returned": return <span className="badge badge-warning">Needs Revision</span>;
      default: return <span className="badge badge-pending">Pending Staff</span>;
    }
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>My Applications</h1>
          <p>Track your internship approval status.</p>
        </div>
        <Link href="/applications/new" className="btn btn-primary" style={{ display: "flex", gap: "8px" }}>
          <PlusCircle size={18} />
          New Request
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>📂</div>
          <h2 style={{ marginBottom: "var(--space-2)" }}>No Applications Found</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
            You haven't requested any internship approvals yet. When you secure an external opportunity or apply through the portal, it will show up here.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {applications.map((app) => (
            <div key={app.id} className="card" style={{ padding: "var(--space-5)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                <h3 style={{ fontSize: "1.125rem", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  {app.role} {app.applicationType === "external" && <span style={{ fontSize: "0.6875rem", background: "var(--bg-hover)", padding: "2px 6px", borderRadius: "4px" }}>External</span>}
                </h3>
                {getStatusBadge(app.status || "draft")}
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: app.status === "approved" ? "var(--space-4)" : 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Building2 size={14} /> {app.companyName}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} /> {app.workMode}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={14} /> {app.startDate} - {app.endDate}</span>
              </div>
              
              {app.status === "approved" && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
                  <a href={`/api/certificates/${app.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
                    <ExternalLink size={16} /> Print Bonafide
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <style>{`
        .badge {
          font-size: 0.6875rem;
          font-weight: 700;
          padding: 4px 10px;
          border-radius: var(--border-radius-full);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .badge-success { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
        .badge-danger { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
        .badge-warning { background: rgba(234, 179, 8, 0.15); color: #eab308; }
        .badge-pending { background: rgba(14, 165, 233, 0.15); color: #0ea5e9; }
      `}</style>
    </div>
  );
}
