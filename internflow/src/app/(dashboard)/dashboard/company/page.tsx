import { db } from "@/lib/db";
import { users, jobPostings, internshipRequests, companyRegistrations, companyStaff } from "@/lib/db/schema";
import { FileText } from "lucide-react";
import { eq, desc, sql, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import Link from "next/link";
import CompanyDashboardTabs from "@/components/dashboard/CompanyDashboardTabs";

export default async function DashboardCompanyPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return <div>Unauthorized</div>;

  // Get the company's registration record based on role
  let companyRecord = null;
  let companyId = null;
  
  // First, check if the user has a companyId assigned directly (new unified method)
  const [userRec] = await db.select({ companyId: users.companyId }).from(users).where(eq(users.id, userId)).limit(1);
  
  if (userRec?.companyId) {
    companyId = userRec.companyId;
  } else if (session?.user?.role === "company_staff") {
    // Fallback: look up via companyStaff table (older method)
    const [staffRec] = await db
      .select({ companyId: companyStaff.companyId })
      .from(companyStaff)
      .where(eq(companyStaff.userId, userId))
      .limit(1);
    if (staffRec) companyId = staffRec.companyId;
  } else {
    // If CEO (role === 'company') and no users.companyId, look up by userId
    const [rec] = await db
      .select({ id: companyRegistrations.id })
      .from(companyRegistrations)
      .where(eq(companyRegistrations.userId, userId))
      .limit(1);
    companyId = rec?.id;
  }

  if (companyId) {
    const [rec] = await db
      .select()
      .from(companyRegistrations)
      .where(eq(companyRegistrations.id, companyId))
      .limit(1);
    companyRecord = rec;
  }

  // Company specific stats
  // 1. Total jobs posted by this user/company
  let totalJobs = 0;
  if (companyId) {
    const jobsRes = await db
      .select({ count: sql`count(*)` })
      .from(jobPostings)
      .where(eq(jobPostings.companyId, companyId));
    totalJobs = Number(jobsRes[0].count);
  } else {
    const jobsRes = await db
      .select({ count: sql`count(*)` })
      .from(jobPostings)
      .where(eq(jobPostings.postedBy, userId));
    totalJobs = Number(jobsRes[0].count);
  }

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
    .where(eq(jobPostings.postedBy, userId))
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
