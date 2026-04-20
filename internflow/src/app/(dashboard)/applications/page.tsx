import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { internshipRequests, approvalLogs, users } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, ExternalLink, Calendar, MapPin, Building2, FolderOpen, MessageSquare } from "lucide-react";

type ApplicationLog = {
  requestId: string;
  action: string;
  comment: string | null;
  createdAt: Date | string | null;
  approverName: string;
  approverRole: string;
};

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

  const appIds = applications.map(a => a.id);
  let allLogs: ApplicationLog[] = [];
  if (appIds.length > 0) {
    allLogs = await db
      .select({
        requestId: approvalLogs.requestId,
        action: approvalLogs.action,
        comment: approvalLogs.comment,
        createdAt: approvalLogs.createdAt,
        approverName: users.firstName,
        approverRole: users.role,
      })
      .from(approvalLogs)
      .innerJoin(users, eq(approvalLogs.approverId, users.id))
      .where(inArray(approvalLogs.requestId, appIds))
      .orderBy(desc(approvalLogs.createdAt));
  }

  // Create a map to grab the latest log for each application
  const latestLogsMap = allLogs.reduce<Record<string, ApplicationLog>>((acc, log) => {
    if (!acc[log.requestId]) {
      acc[log.requestId] = log;
    }
    return acc;
  }, {});

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; cls: string }> = {
      draft: { label: "Draft", cls: "badge-draft" },
      pending_tutor: { label: "Pending Tutor", cls: "badge-pending" },
      pending_coordinator: { label: "Pending Coordinator", cls: "badge-pending" },
      pending_hod: { label: "Pending HOD", cls: "badge-pending" },
      pending_admin: { label: "Pending Admin", cls: "badge-pending" },
      approved: { label: "Approved", cls: "badge-success" },
      rejected: { label: "Rejected", cls: "badge-danger" },
      returned: { label: "Needs Revision", cls: "badge-warning" },
    };
    const info = statusMap[status] || { label: status.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()), cls: "badge-pending" };
    return <span className={`badge ${info.cls}`}>{info.label}</span>;
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
          External OD Request
        </Link>
      </div>

      {applications.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ marginBottom: "var(--space-4)", display: "flex", justifyContent: "center", color: "var(--color-primary)" }}>
            <FolderOpen size={48} />
          </div>
          <h2 style={{ marginBottom: "var(--space-2)" }}>No Applications Found</h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
            You haven&apos;t requested any internship approvals yet. When you secure an external opportunity or apply through the portal, it will show up here.
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
              
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: String(app.status) === "approved" ? "var(--space-4)" : 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Building2 size={14} /> {app.companyName}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} /> {app.workMode}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={14} /> {app.startDate} - {app.endDate}</span>
              </div>
              
              {String(app.status) === "approved" && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
                  <a href={`/api/certificates/${app.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
                    <ExternalLink size={16} /> Print Bonafide
                  </a>
                </div>
              )}

              {/* Progress Tracker */}
              <div className="tracker-scroll-wrapper">
                <div className={`tracker-container`}>
                  <div className="progress-bg-line"></div>
                  
                  {/* Dynamic fill line based on currentTier */}
                  <div 
                    className="progress-fill-line" 
                    style={{ 
                      width: `${Math.min(100, Math.max(0, ((Math.max(1, app.currentTier || 1) - 1) / 6) * 100))}%`,
                      background: String(app.status) === "rejected" ? "linear-gradient(90deg, #8DC63F 0%, #22c55e 60%, #ef4444 100%)" :
                         String(app.status) === "returned" ? "linear-gradient(90deg, #8DC63F 0%, #22c55e 60%, #eab308 100%)" :
                         String(app.status) === "approved" ? "linear-gradient(90deg, #8DC63F 0%, #22c55e 100%)" :
                         "linear-gradient(90deg, #8DC63F 0%, #0ea5e9 100%)"
                    }}
                  ></div>
                  
                  {["Applied", "Tutor", "Coordinator", "HOD", "Dean", "Pl. Head", "Principal"].map((label, index) => {
                    const tier = index + 1;
                    const currentTier = app.currentTier || 1;
                    const statusStr = String(app.status);
                    
                    let dotStyle = {};
                    let labelColor = "var(--text-muted)";
                    let labelWeight = "600";
                    
                    if (tier < currentTier || statusStr === "approved") {
                      // Passed stages
                      dotStyle = { background: "#22c55e" };
                      labelColor = "var(--text-primary)";
                    } else if (tier === currentTier) {
                      // Current stage
                      if (statusStr === "rejected") {
                         dotStyle = { background: "#ef4444", boxShadow: "0 0 0 3px rgba(239,68,68,0.25)" };
                         labelColor = "#ef4444";
                         labelWeight = "700";
                      } else if (statusStr === "returned") {
                         dotStyle = { background: "#eab308", boxShadow: "0 0 0 3px rgba(234,179,8,0.25)" };
                         labelColor = "#eab308";
                         labelWeight = "700";
                      } else if (statusStr === "approved") { // Final tier fallback 
                         dotStyle = { background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.25)" };
                         labelColor = "var(--text-primary)";
                      } else {
                         dotStyle = { background: "#0ea5e9", boxShadow: "0 0 0 3px rgba(14,165,233,0.25)" };
                         labelColor = "var(--text-primary)";
                      }
                    }

                    return (
                      <div key={label} className="progress-step" style={{ flexBasis: "14%" }}>
                        <div className="step-dot" style={dotStyle}></div>
                        <span className="step-label" style={{ color: labelColor, fontWeight: labelWeight }}>{label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {latestLogsMap[app.id] && latestLogsMap[app.id].comment && (
                <div style={{ marginTop: "var(--space-4)", padding: "var(--space-4)", borderRadius: "var(--border-radius-md)", background: String(app.status) === "rejected" ? "rgba(239, 68, 68, 0.05)" : "var(--bg-hover)", borderLeft: `3px solid ${String(app.status) === "rejected" ? "#ef4444" : "var(--primary-color)"}`, display: "flex", gap: "12px" }}>
                  <MessageSquare size={18} color={String(app.status) === "rejected" ? "#ef4444" : "var(--primary-color)"} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "4px" }}>
                      Message from <strong style={{ color: "var(--text-primary)" }}>{latestLogsMap[app.id].approverName}</strong> • <span style={{textTransform: "capitalize"}}>{String(latestLogsMap[app.id].approverRole).replace("_", " ")}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "0.9375rem", color: String(app.status) === "rejected" ? "#dc2626" : "var(--text-primary)" }}>
                      {latestLogsMap[app.id].comment}
                    </p>
                  </div>
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
        
        .tracker-scroll-wrapper { width: 100%; overflow-x: auto; padding-bottom: var(--space-2); -webkit-overflow-scrolling: touch; }
        .tracker-scroll-wrapper::-webkit-scrollbar { height: 6px; }
        .tracker-scroll-wrapper::-webkit-scrollbar-thumb { background: var(--border-strong); border-radius: 4px; }
        
        .tracker-container { display: flex; justify-content: space-between; position: relative; margin-top: var(--space-6); padding: var(--space-4) 0 8px 0; border-top: 1px solid var(--border-color); background: transparent; min-width: 600px; }
        .progress-bg-line { position: absolute; top: calc(var(--space-4) + 6px); left: 30px; right: 30px; height: 3px; background: #e5e7eb; z-index: 1; border-radius: 2px; }
        .progress-fill-line { position: absolute; top: calc(var(--space-4) + 6px); left: 30px; height: 3px; z-index: 2; border-radius: 2px; transition: all 0.5s ease; }
        
        .progress-step { display: flex; flex-direction: column; align-items: center; gap: 6px; z-index: 3; flex-shrink: 0; }
        .step-dot { width: 14px; height: 14px; border-radius: 50%; background: #e5e7eb; transition: all 0.3s ease; }
        .step-label { font-size: 0.6rem; text-align: center; white-space: normal; line-height: 1.1; }
      `}</style>
    </div>
  );
}
