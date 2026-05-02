import { db } from "@/lib/db";
import { users, jobPostings, internshipRequests, companyRegistrations, companyStaff } from "@/lib/db/schema";
import { FileText } from "lucide-react";
import { eq, desc, sql, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import Link from "next/link";
import CompanyDashboardTabs from "@/components/dashboard/CompanyDashboardTabs";
import { getCompanyContextForUser } from "@/lib/company-context";

export default async function DashboardCompanyPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return <div>Unauthorized</div>;

  const companyContext = await getCompanyContextForUser(userId);
  const companyId = companyContext?.companyId;
  const [companyRecord] = companyId
    ? await db.select().from(companyRegistrations).where(eq(companyRegistrations.id, companyId)).limit(1)
    : [];

  // ── Stats ──
  const jobsRes = await db
    .select({ count: sql`count(*)` })
    .from(jobPostings)
    .where(eq(jobPostings.companyId, companyId || ""));
  const totalJobs = Number(jobsRes[0].count);

  let totalApplicants = 0;
  let pendingApprovals = 0;
  let shortlisted = 0;

  if (companyId) {
    const appsRes = await db
      .select({ count: sql`count(*)` })
      .from(internshipRequests)
      .innerJoin(jobPostings, eq(internshipRequests.jobPostingId, jobPostings.id))
      .where(eq(jobPostings.companyId, companyId));
    totalApplicants = Number(appsRes[0].count);

    const pendRes = await db
      .select({ count: sql`count(*)` })
      .from(internshipRequests)
      .innerJoin(jobPostings, eq(internshipRequests.jobPostingId, jobPostings.id))
      .where(and(
        eq(jobPostings.companyId, companyId),
        sql`${internshipRequests.status} NOT IN ('approved', 'rejected')`
      ));
    pendingApprovals = Number(pendRes[0].count);

    const shortRes = await db
      .select({ count: sql`count(*)` })
      .from(internshipRequests)
      .innerJoin(jobPostings, eq(internshipRequests.jobPostingId, jobPostings.id))
      .where(and(
        eq(jobPostings.companyId, companyId),
        eq(internshipRequests.status, "approved")
      ));
    shortlisted = Number(shortRes[0].count);
  }

  // ── Staff ──
  const staffList = companyId
    ? await db
        .select({
          id: companyStaff.id,
          name: sql<string>`${users.firstName} || ' ' || ${users.lastName}`,
          email: users.email,
          designation: companyStaff.roleInCompany,
          department: sql<string | null>`NULL`,
          phone: users.phone,
        })
        .from(companyStaff)
        .innerJoin(users, eq(companyStaff.userId, users.id))
        .where(eq(companyStaff.companyId, companyId))
        .orderBy(desc(companyStaff.createdAt))
    : [];

  // ── Jobs with applicant counts ──
  const jobsList = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      status: jobPostings.status,
      openingsCount: jobPostings.openingsCount,
      applicationDeadline: jobPostings.applicationDeadline,
    })
    .from(jobPostings)
    .where(eq(jobPostings.companyId, companyId || ""))
    .orderBy(desc(jobPostings.createdAt));

  // Get applicant counts per job
  const jobsWithCounts = await Promise.all(
    jobsList.map(async (job) => {
      const countRes = companyId
        ? await db
          .select({ count: sql`count(*)` })
          .from(internshipRequests)
          .where(eq(internshipRequests.jobPostingId, job.id))
        : [{ count: 0 }];

      return {
        ...job,
        applicationDeadline: job.applicationDeadline || "N/A",
        applicantCount: Number(countRes[0].count),
      };
    })
  );

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1>Company Workspace</h1>
          <p>Welcome back{companyRecord ? `, ${companyRecord.companyLegalName}` : ""}. Manage your postings, staff, and hiring pipeline.</p>
        </div>
        <Link href="/jobs/create" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
          <FileText size={18} /> Post New Opportunity
        </Link>
      </div>

      <CompanyDashboardTabs
        staff={staffList.map(s => ({
          id: s.id,
          name: s.name,
          email: s.email,
          designation: s.designation,
          department: s.department,
          phone: s.phone,
        }))}
        jobs={jobsWithCounts}
        analytics={{
          totalJobs,
          totalApplicants,
          pendingApprovals,
          shortlisted,
        }}
      />
    </div>
  );
}
