import { db } from "@/lib/db";
import { users, internshipRequests, jobPostings } from "@/lib/db/schema";
import { BarChart, Users, FileText, CheckCircle, Clock, XCircle, Briefcase } from "lucide-react";
import { eq, sql } from "drizzle-orm";

export default async function AnalyticsPage() {
  // Aggregate stats via Drizzle
  const totalStudentsRes = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, "student"));
  const totalStudents = Number(totalStudentsRes[0].count);

  const totalCompaniesRes = await db.select({ count: sql`count(*)` }).from(users).where(eq(users.role, "company"));
  const totalCompanies = Number(totalCompaniesRes[0].count);

  const totalJobsRes = await db.select({ count: sql`count(*)` }).from(jobPostings);
  const totalJobs = Number(totalJobsRes[0].count);

  const requestsStats = await db
    .select({
      status: internshipRequests.status,
      count: sql`count(*)`
    })
    .from(internshipRequests)
    .groupBy(internshipRequests.status);

  let approved = 0, pending = 0, rejected = 0;
  requestsStats.forEach(stat => {
    if (stat.status === "approved") approved += Number(stat.count);
    else if (stat.status === "rejected") rejected += Number(stat.count);
    else pending += Number(stat.count); // any pending tier
  });

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Analytics Overview</h1>
        <p>Real-time platform metrics and internship application statistics.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        {/* Core Network Stats */}
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(99, 102, 241, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={24} color="#6366f1" />
          </div>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>Total Students</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{totalStudents}</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(168, 85, 247, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Briefcase size={24} color="#a855f7" />
          </div>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>Total Companies</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{totalCompanies}</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(14, 165, 233, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <FileText size={24} color="#0ea5e9" />
          </div>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>Active Jobs</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{totalJobs}</div>
          </div>
        </div>
      </div>

      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "var(--space-4)" }}>Internship Approvals Pipeline</h2>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
        <div className="card" style={{ borderLeft: "4px solid #f59e0b" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>Awaiting Review</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "var(--space-2)" }}>{pending}</div>
            </div>
            <Clock size={24} color="#f59e0b" />
          </div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #10b981" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>Approved Internships</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "var(--space-2)" }}>{approved}</div>
            </div>
            <CheckCircle size={24} color="#10b981" />
          </div>
        </div>

        <div className="card" style={{ borderLeft: "4px solid #ef4444" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>Rejected Applications</div>
              <div style={{ fontSize: "2rem", fontWeight: 700, marginTop: "var(--space-2)" }}>{rejected}</div>
            </div>
            <XCircle size={24} color="#ef4444" />
          </div>
        </div>
      </div>
    </div>
  );
}
