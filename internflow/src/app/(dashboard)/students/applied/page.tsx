import { db } from "@/lib/db";
import { users, internshipRequests, approvalLogs, jobPostings, companyRegistrations } from "@/lib/db/schema";
import { Building, Calendar, MapPin, ExternalLink, MessageSquare, FolderOpen } from "lucide-react";
import { and, eq, desc, inArray, sql } from "drizzle-orm";
import { format } from "date-fns";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { buildStudentVisibilityCondition } from "@/lib/authority-scope";
import { studentProfiles } from "@/lib/db/schema";

type ApplicationLog = {
  requestId: string;
  action: string;
  comment: string | null;
  createdAt: Date | string | null;
  approverName: string;
  approverRole: string;
  tier: number;
};

export default async function StudentsAppliedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }

  const allowedRoles = ["tutor", "placement_coordinator", "hod", "dean", "placement_officer", "coe", "principal", "management_corporation", "mcr"];
  if (!allowedRoles.includes(session.user.role)) {
    return null;
  }

  const hierarchyCondition = await buildStudentVisibilityCondition(session.user.id, session.user.role);
  const whereCondition = hierarchyCondition ? and(hierarchyCondition) : sql`1=1`;

  const applications = await db
    .select({
      id: internshipRequests.id,
      studentId: internshipRequests.studentId,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      companyId: companyRegistrations.id,
      companyName: internshipRequests.companyName,
      jobPostingId: internshipRequests.jobPostingId,
      jobTitle: jobPostings.title,
      role: internshipRequests.role,
      status: internshipRequests.status,
      startDate: internshipRequests.startDate,
      endDate: internshipRequests.endDate,
      workMode: internshipRequests.workMode,
      submittedAt: internshipRequests.submittedAt,
      currentTier: internshipRequests.currentTier,
      applicationType: internshipRequests.applicationType,
    })
    .from(internshipRequests)
    .innerJoin(users, eq(users.id, internshipRequests.studentId))
    .leftJoin(jobPostings, eq(jobPostings.id, internshipRequests.jobPostingId))
    .leftJoin(companyRegistrations, eq(companyRegistrations.id, jobPostings.companyId))
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(whereCondition)
    .orderBy(desc(internshipRequests.submittedAt));

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
        tier: approvalLogs.tier,
      })
      .from(approvalLogs)
      .innerJoin(users, eq(approvalLogs.approverId, users.id))
      .where(inArray(approvalLogs.requestId, appIds))
      .orderBy(desc(approvalLogs.createdAt));
  }

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
      <div className="page-header">
        <h1>Students Applied</h1>
        <p>Monitor all active internship applications submitted by students.</p>
      </div>

      {applications.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ marginBottom: "var(--space-4)", display: "flex", justifyContent: "center", color: "var(--color-primary)" }}>
            <FolderOpen size={48} />
          </div>
          <h2 style={{ marginBottom: "var(--space-2)" }}>No Applications Found</h2>
            <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
            There are no student internship applications at this time.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {applications.map((app) => (
            <div key={app.id} className="card" style={{ padding: "var(--space-5)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div style={{ fontWeight: 600, fontSize: "1.125rem", color: "var(--text-primary)" }}>
                    {app.firstName} {app.lastName} <span style={{ fontSize: "0.875rem", color: "var(--text-secondary)", fontWeight: "normal" }}>({app.email})</span>
                  </div>
                  <h3 style={{ fontSize: "1rem", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)" }}>
                    {app.role} {app.applicationType === "external" && <span style={{ fontSize: "0.6875rem", background: "var(--bg-hover)", padding: "2px 6px", borderRadius: "4px" }}>External</span>}
                  </h3>
                </div>
                {getStatusBadge(app.status || "draft")}
              </div>
              
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)", fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: String(app.status) === "approved" ? "var(--space-4)" : 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Building size={14} /> {app.companyName}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} /> {app.workMode}</span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Calendar size={14} /> {app.startDate ? format(new Date(app.startDate), "MMM d, yyyy") : "N/A"} - {app.endDate ? format(new Date(app.endDate), "MMM d, yyyy") : "N/A"}</span>
              </div>
              
              {String(app.status) === "approved" && (
                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
                  <a href={`/api/certificates/${app.id}`} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: "bold" }}>
                    <ExternalLink size={16} /> Print Bonafide
                  </a>
                </div>
              )}

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "var(--space-4)" }}>
                <Link href={`/students/${app.studentId}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                  View Student
                </Link>
                {app.companyId && (
                  <Link href={`/companies/${app.companyId}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                    View Company
                  </Link>
                )}
                {app.jobPostingId && (
                  <Link href={`/jobs/${app.jobPostingId}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                    View Internship
                  </Link>
                )}
              </div>

              {/* Progress Tracker */}
              <div className="tracker-scroll-wrapper">
                <div className={`tracker-container`}>
                  <div className="progress-bg-line"></div>
                  
                  {/* Dynamic fill line based on currentTier */}
                  <div 
                    className="progress-fill-line" 
                    style={{ 
                      width: `${Math.min(100, Math.max(0, ((Math.max(1, app.currentTier || 1) - 1) / 7) * 100))}%`,
                      background: String(app.status) === "rejected" ? "linear-gradient(90deg, #8DC63F 0%, #22c55e 60%, #ef4444 100%)" :
                         String(app.status) === "returned" ? "linear-gradient(90deg, #8DC63F 0%, #22c55e 60%, #eab308 100%)" :
                         String(app.status) === "approved" ? "linear-gradient(90deg, #8DC63F 0%, #22c55e 100%)" :
                         "linear-gradient(90deg, #8DC63F 0%, #0ea5e9 100%)"
                    }}
                  ></div>
                  
                  {["Applied", "Tutor", "Coordinator", "HOD", "Dean", "Placement Officer", "COE", "Principal"].map((label, index) => {
                    const tier = index + 1;
                    const currentTier = app.currentTier || 1;
                    const statusStr = String(app.status);
                    
                    let dotStyle = {};
                    let labelColor = "var(--text-muted)";
                    let labelWeight = "600";
                    let timestampStr = "";
                    
                    // The first step "Applied" corresponds to submittedAt
                    if (tier === 1 && app.submittedAt) {
                      timestampStr = format(new Date(app.submittedAt), "MMM d, yyyy");
                    } else if (tier > 1) {
                      // Find log for this tier (the tier when it was approved is tier - 1)
                      const logForTier = allLogs.find((l) => l.requestId === app.id && l.tier === (tier - 1));
                      if (logForTier && logForTier.createdAt) {
                        timestampStr = format(new Date(logForTier.createdAt), "MMM d, yyyy");
                      }
                    }
                    
                    if (tier < currentTier || statusStr === "approved") {
                      dotStyle = { background: "#22c55e" };
                      labelColor = "var(--text-primary)";
                    } else if (tier === currentTier) {
                      if (statusStr === "rejected") {
                         dotStyle = { background: "#ef4444", boxShadow: "0 0 0 3px rgba(239,68,68,0.25)" };
                         labelColor = "#ef4444";
                         labelWeight = "700";
                      } else if (statusStr === "returned") {
                         dotStyle = { background: "#eab308", boxShadow: "0 0 0 3px rgba(234,179,8,0.25)" };
                         labelColor = "#eab308";
                         labelWeight = "700";
                      } else if (statusStr === "approved") {
                         dotStyle = { background: "#22c55e", boxShadow: "0 0 0 3px rgba(34,197,94,0.25)" };
                         labelColor = "var(--text-primary)";
                      } else {
                         dotStyle = { background: "#0ea5e9", boxShadow: "0 0 0 3px rgba(14,165,233,0.25)" };
                         labelColor = "var(--text-primary)";
                      }
                    }

                    return (
                      <div key={label} className="progress-step" style={{ flexBasis: "12.5%" }}>
                        <div className="step-dot" style={dotStyle}></div>
                        <span className="step-label" style={{ color: labelColor, fontWeight: labelWeight }}>{label}</span>
                        {timestampStr && (
                          <span style={{ fontSize: "0.55rem", color: "var(--text-muted)", textAlign: "center", marginTop: "2px" }}>
                            {timestampStr}
                          </span>
                        )}
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
