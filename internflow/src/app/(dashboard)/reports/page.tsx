import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workReportSchedules, workReports, internshipRequests } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import { FileText, Calendar, Clock, PlusCircle } from "lucide-react";
import ReportForm from "./ReportForm";

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "student") {
    redirect("/");
  }

  // Fetch approved internships to find active reporting schedules
  const userId = session.user.id;
  const approvedRequests = await db.query.internshipRequests.findMany({
    where: and(
      eq(internshipRequests.studentId, userId),
      eq(internshipRequests.status, "approved")
    ),
  });

  // Fetch all schedules for this user's internships
  const requestIds = approvedRequests.map((r: any) => r.id as string);
  
  let schedules: any[] = [];
  if (requestIds.length > 0) {
    schedules = await db.query.workReportSchedules.findMany({
      where: (s: any, { inArray }: any) => inArray(s.requestId, requestIds),
    });
  }

  // Fetch previously submitted reports
  const pastReports = await db.query.workReports.findMany({
    where: eq(workReports.studentId, userId),
    orderBy: [desc(workReports.submittedAt)],
  });

  return (
    <div className="animate-fade-in" style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gap: "var(--space-6)" }}>
      <div className="page-header">
        <h1>Internship Logs & Reports</h1>
        <p>Submit your periodic updates depending on your HOD's configured frequency.</p>
      </div>

      <div className="grid grid-2" style={{ gap: "var(--space-6)" }}>
        {/* Left Column: Submission Form */}
        <div>
          {schedules.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
              <Calendar size={48} style={{ color: "var(--text-tertiary)", margin: "0 auto var(--space-4)" }} />
              <h3>No Active Schedules</h3>
              <p style={{ color: "var(--text-secondary)" }}>You don't have any internship reporting schedules assigned yet.</p>
            </div>
          ) : (
            <div className="card">
              <h2 style={{ display: "flex", alignItems: "center", gap: "8px", borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <PlusCircle size={20} className="text-primary" />
                Submit New Log
              </h2>
              <ReportForm schedules={schedules} />
            </div>
          )}
        </div>

        {/* Right Column: Past Reports */}
        <div>
          <h2 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
            <FileText size={20} className="text-primary" />
            Previous Submissions
          </h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {pastReports.length === 0 ? (
              <div className="card" style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                No reports submitted yet.
              </div>
            ) : (
              pastReports.map((report) => (
                <div key={report.id} className="card" style={{ padding: "var(--space-4)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                    <h4 style={{ margin: 0 }}>Period: {report.reportPeriod}</h4>
                    <span className="badge badge-success">Submitted</span>
                  </div>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-3)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Clock size={14} /> {report.hoursSpent} hours
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Calendar size={14} /> {new Date(report.submittedAt!).toLocaleDateString()}
                    </span>
                  </div>
                  <div style={{ padding: "12px", background: "var(--bg-secondary)", borderRadius: "6px", fontSize: "0.9rem" }}>
                    <p style={{ margin: "0 0 8px 0" }}><strong>Tasks:</strong> {report.tasksCompleted}</p>
                    {report.learnings && <p style={{ margin: 0 }}><strong>Learnings:</strong> {report.learnings}</p>}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
