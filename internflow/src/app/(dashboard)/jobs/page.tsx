import { auth } from "@/lib/auth";
import { fetchActiveJobs } from "@/app/actions/jobs";
import { redirect } from "next/navigation";
import JobBoardClient from "./JobBoardClient";
import { db } from "@/lib/db";
import { studentJobInterests, studentProfiles, jobApplications, jobPostings, companyRegistrations, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import SelectionResultsSection from "./SelectionResultsSection";

export const dynamic = "force-dynamic";

export default async function JobBoardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const role = session.user.role;
  const isStudent = role === "student";

  const jobs = await fetchActiveJobs();

  let interests: Array<typeof studentJobInterests.$inferSelect> = [];
  let appliedJobIds: string[] = [];

  if (isStudent) {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, session.user.id)).limit(1);
    if (profile) {
      interests = await db.select().from(studentJobInterests).where(eq(studentJobInterests.studentId, profile.id));
    }

    const apps = await db.select({ jobId: jobApplications.jobId })
      .from(jobApplications)
      .where(eq(jobApplications.studentId, session.user.id));
    
    appliedJobIds = apps.map((a) => a.jobId);
  }

  // Fetch selection results (visible to all roles as permanent record)
  const selectionResults = await db
    .select({
      id: jobApplications.id,
      studentId: jobApplications.studentId,
      studentFirstName: users.firstName,
      studentLastName: users.lastName,
      jobTitle: jobPostings.title,
      companyName: companyRegistrations.companyLegalName,
      appliedAt: jobApplications.appliedAt,
      updatedAt: jobApplications.updatedAt,
    })
    .from(jobApplications)
    .innerJoin(users, eq(jobApplications.studentId, users.id))
    .innerJoin(jobPostings, eq(jobApplications.jobId, jobPostings.id))
    .leftJoin(companyRegistrations, eq(jobPostings.postedBy, companyRegistrations.userId))
    .where(eq(jobApplications.status, "selected"))
    .orderBy(desc(jobApplications.updatedAt));

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <h1>Opportunities</h1>
        <p>Browse and apply for verified internships from our corporate partners.</p>
      </div>

      <JobBoardClient jobs={jobs.map(j => ({ ...j, isPpoAvailable: j.isPpoAvailable ?? undefined }))} interests={interests} isStudent={isStudent} appliedJobIds={appliedJobIds} />

      {/* Selection Results — permanent record visible to all */}
      <SelectionResultsSection results={selectionResults} />

      <style>{`
        .job-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--bg-hover);
          color: var(--text-secondary);
          border-radius: var(--border-radius-full);
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
