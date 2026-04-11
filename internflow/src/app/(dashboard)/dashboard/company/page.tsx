import { db } from "@/lib/db";
import { users, jobPostings, internshipRequests, companyRegistrations } from "@/lib/db/schema";
import { Briefcase, Users, FileText, TrendingUp, CheckCircle, Clock } from "lucide-react";
import { eq, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import Link from "next/link";

export default async function DashboardCompanyPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return <div>Unauthorized</div>;

  // Let's get the company's registration record if it exists
  const companyRecord = await db
    .select()
    .from(companyRegistrations)
    .where(eq(companyRegistrations.userId, userId))
    .limit(1);

  const companyId = companyRecord[0]?.id;

  // Company specific stats
  // 1. Total jobs posted by this user
  const jobsRes = await db
    .select({ count: sql`count(*)` })
    .from(jobPostings)
    .where(eq(jobPostings.postedBy, userId));
  const activeJobs = Number(jobsRes[0].count);

  let totalApplicants = 0;
  let recentApplicants: { id: string; firstName: string; lastName: string; role: string; status: string | null; submittedAt: Date | null }[] = [];

  // 2. Applicants/Requests for these jobs
  if (companyId) {
    const appsRes = await db
      .select({ count: sql`count(*)` })
      .from(internshipRequests)
      .innerJoin(jobPostings, eq(internshipRequests.jobPostingId, jobPostings.id))
      .where(eq(jobPostings.companyId, companyId));
    
    totalApplicants = Number(appsRes[0].count);

    // Get 3 most recent applicants
    recentApplicants = await db
      .select({
        id: internshipRequests.id,
        firstName: users.firstName,
        lastName: users.lastName,
        role: internshipRequests.role,
        status: internshipRequests.status,
        submittedAt: internshipRequests.submittedAt
      })
      .from(internshipRequests)
      .innerJoin(users, eq(internshipRequests.studentId, users.id))
      .innerJoin(jobPostings, eq(internshipRequests.jobPostingId, jobPostings.id))
      .where(eq(jobPostings.companyId, companyId))
      .orderBy(desc(internshipRequests.submittedAt))
      .limit(3);
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Company Workspace</h1>
          <p>Welcome back to R-Choice portal. Manage your postings and view applicants.</p>
        </div>
        <Link href="/jobs/create" className="btn btn-primary">
          <FileText size={18} /> Post New Opportunity
        </Link>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
        <div className="card" style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(155, 46, 135, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Briefcase size={24} color="var(--primary-color)" />
          </div>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>Total Opportunities</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{activeJobs}</div>
          </div>
        </div>

        <div className="card" style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
          <div style={{ width: "48px", height: "48px", borderRadius: "12px", backgroundColor: "rgba(30, 155, 215, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Users size={24} color="var(--color-info)" />
          </div>
          <div>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>Total Applicants</div>
            <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{totalApplicants}</div>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-6)" }}>
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Recent Applications</h2>
            <Link href="/applicants" className="btn btn-outline" style={{ padding: "8px 16px" }}>
              View All
            </Link>
          </div>
          
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <th style={{ padding: "var(--space-3)", color: "var(--text-secondary)", fontWeight: 500 }}>Candidate</th>
                  <th style={{ padding: "var(--space-3)", color: "var(--text-secondary)", fontWeight: 500 }}>Role</th>
                  <th style={{ padding: "var(--space-3)", color: "var(--text-secondary)", fontWeight: 500 }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentApplicants.length === 0 ? (
                  <tr>
                    <td colSpan={3} style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--text-secondary)" }}>
                      No applicants yet. Keep posting roles to attract talent!
                    </td>
                  </tr>
                ) : (
                  recentApplicants.map((app) => (
                    <tr key={app.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                      <td style={{ padding: "var(--space-3)", fontWeight: 500 }}>
                        {app.firstName} {app.lastName}
                      </td>
                      <td style={{ padding: "var(--space-3)", color: "var(--text-secondary)" }}>
                        {app.role}
                      </td>
                      <td style={{ padding: "var(--space-3)" }}>
                        <span className={`status-pill status-${(app.status || 'pending').split('_')[0]}`}>
                          {(app.status || 'pending').replace('_', ' ')}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
