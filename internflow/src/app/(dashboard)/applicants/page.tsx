import { db } from "@/lib/db";
import { users, jobPostings, jobApplications, companyRegistrations, studentProfiles } from "@/lib/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import ApplicantsClient from "./ApplicantsClient";

type ApplicantRow = {
  id: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  status: string | null;
  appliedAt: Date | string | null;
  jobId: string;
  jobTitle: string;
  resumeUrl: string | null;
};

export default async function ApplicantsPage(props: { searchParams: Promise<{ page?: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return <div>Unauthorized</div>;

  // Find company record to filter only this company's applicants
  const companyRecord = await db
    .select()
    .from(companyRegistrations)
    .where(eq(companyRegistrations.userId, userId))
    .limit(1);

  const companyId = companyRecord[0]?.id;

  const searchParams = await props.searchParams;
  const currentPage = parseInt(searchParams.page || "1", 10);
  const pageSize = 25;

  let applicants: ApplicantRow[] = [];
  let totalPages = 1;

  const limitCount = pageSize;
  const offsetCount = (currentPage - 1) * pageSize;

  // Count
  const countResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobApplications)
    .innerJoin(jobPostings, eq(jobApplications.jobId, jobPostings.id))
    .where(eq(jobPostings.postedBy, userId));
    
  const totalRecords = countResult[0]?.count || 0;
  totalPages = Math.ceil(totalRecords / pageSize);
  const rawApps = await db
    .select({
      id: users.id, // the student's user logic
      appId: jobApplications.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      status: jobApplications.status,
      appliedAt: jobApplications.appliedAt,
      jobId: jobPostings.id,
      jobTitle: jobPostings.title,
      resumeUrl: studentProfiles.resumeUrl
    })
    .from(jobApplications)
    .innerJoin(users, eq(jobApplications.studentId, users.id))
    .innerJoin(jobPostings, eq(jobApplications.jobId, jobPostings.id))
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(eq(jobPostings.postedBy, userId))
    .orderBy(desc(jobApplications.appliedAt))
    .limit(limitCount)
    .offset(offsetCount);
    
  // Remap so 'id' is standard studentId for the UI
  applicants = rawApps.map((a) => ({
    ...a,
    id: a.id,
    applicationId: a.appId
  }));

  return (
     <ApplicantsClient initialApplicants={applicants} currentPage={currentPage} totalPages={totalPages} />
  );
}
