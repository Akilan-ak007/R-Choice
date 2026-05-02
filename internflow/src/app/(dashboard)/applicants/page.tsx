import { desc, eq, sql } from "drizzle-orm";

import { auth } from "@/lib/auth";
import { getCompanyContextForUser } from "@/lib/company-context";
import { db } from "@/lib/db";
import {
  jobApplicationRoundProgress,
  jobApplications,
  jobPostings,
  selectionProcessRounds,
  studentProfiles,
  users,
} from "@/lib/db/schema";

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

type ApplicantRoundProgressRow = {
  applicationId: string;
  roundId: string;
  roundNumber: number;
  roundName: string;
  roundType: string | null;
  progressStatus: string;
  reviewedAt: Date | null;
};

type JobWorkflowSummary = {
  id: string;
  title: string;
  status: string | null;
  totalApplicants: number;
  shortlistedCount: number;
  roundScheduledCount: number;
  selectedCount: number;
  rounds: Array<{
    id: string;
    roundNumber: number;
    roundName: string;
    roundType: string | null;
    startsAt: Date | null;
    endsAt: Date | null;
    mode: string | null;
    meetLink: string | null;
    location: string | null;
    description: string | null;
  }>;
};

export default async function ApplicantsPage(props: { searchParams: Promise<{ page?: string; jobId?: string; status?: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return <div>Unauthorized</div>;

  const companyContext = await getCompanyContextForUser(userId);
  const companyId = companyContext?.companyId;
  if (!companyId) return <div>Unauthorized</div>;

  const searchParams = await props.searchParams;
  const currentPage = parseInt(searchParams.page || "1", 10);
  const selectedJobId = searchParams.jobId || "all";
  const selectedStatus = searchParams.status || "all";
  const pageSize = 25;
  const limitCount = pageSize;
  const offsetCount = (currentPage - 1) * pageSize;

  const jobs = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      status: jobPostings.status,
      totalApplicants: sql<number>`count(${jobApplications.id})`,
      shortlistedCount: sql<number>`count(case when ${jobApplications.status} = 'shortlisted' then 1 end)`,
      roundScheduledCount: sql<number>`count(case when ${jobApplications.status} = 'round_scheduled' then 1 end)`,
      selectedCount: sql<number>`count(case when ${jobApplications.status} = 'selected' then 1 end)`,
    })
    .from(jobPostings)
    .leftJoin(jobApplications, eq(jobApplications.jobId, jobPostings.id))
    .where(eq(jobPostings.companyId, companyId))
    .groupBy(jobPostings.id)
    .orderBy(desc(jobPostings.createdAt));

  const rounds = await db
    .select({
      id: selectionProcessRounds.id,
      jobId: selectionProcessRounds.jobId,
      roundNumber: selectionProcessRounds.roundNumber,
      roundName: selectionProcessRounds.roundName,
      roundType: selectionProcessRounds.roundType,
      startsAt: selectionProcessRounds.startsAt,
      endsAt: selectionProcessRounds.endsAt,
      mode: selectionProcessRounds.mode,
      meetLink: selectionProcessRounds.meetLink,
      location: selectionProcessRounds.location,
      description: selectionProcessRounds.description,
    })
    .from(selectionProcessRounds)
    .innerJoin(jobPostings, eq(selectionProcessRounds.jobId, jobPostings.id))
    .where(eq(jobPostings.companyId, companyId))
    .orderBy(selectionProcessRounds.roundNumber);

  const roundsByJob = new Map<string, JobWorkflowSummary["rounds"]>();
  for (const round of rounds) {
    const existing = roundsByJob.get(round.jobId) || [];
    existing.push(round);
    roundsByJob.set(round.jobId, existing);
  }

  const workflowJobs: JobWorkflowSummary[] = jobs.map((job) => ({
    ...job,
    rounds: roundsByJob.get(job.id) || [],
  }));

  const totalCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(jobApplications)
    .innerJoin(jobPostings, eq(jobApplications.jobId, jobPostings.id))
    .where(
      sql`${jobPostings.companyId} = ${companyId}
        ${selectedJobId !== "all" ? sql`and ${jobApplications.jobId} = ${selectedJobId}` : sql``}
        ${selectedStatus !== "all" ? sql`and ${jobApplications.status} = ${selectedStatus}` : sql``}`
    );

  const totalRecords = totalCountResult[0]?.count || 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  const rawApplicants = await db
    .select({
      id: users.id,
      appId: jobApplications.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      status: jobApplications.status,
      appliedAt: jobApplications.appliedAt,
      jobId: jobPostings.id,
      jobTitle: jobPostings.title,
      resumeUrl: studentProfiles.resumeUrl,
    })
    .from(jobApplications)
    .innerJoin(users, eq(jobApplications.studentId, users.id))
    .innerJoin(jobPostings, eq(jobApplications.jobId, jobPostings.id))
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(
      sql`${jobPostings.companyId} = ${companyId}
        ${selectedJobId !== "all" ? sql`and ${jobApplications.jobId} = ${selectedJobId}` : sql``}
        ${selectedStatus !== "all" ? sql`and ${jobApplications.status} = ${selectedStatus}` : sql``}`
    )
    .orderBy(desc(jobApplications.appliedAt))
    .limit(limitCount)
    .offset(offsetCount);

  const applicants: ApplicantRow[] = rawApplicants.map((app) => ({
    ...app,
    applicationId: app.appId,
  }));

  const progressRows = await db
    .select({
      applicationId: jobApplicationRoundProgress.applicationId,
      roundId: selectionProcessRounds.id,
      roundNumber: selectionProcessRounds.roundNumber,
      roundName: selectionProcessRounds.roundName,
      roundType: selectionProcessRounds.roundType,
      progressStatus: jobApplicationRoundProgress.status,
      reviewedAt: jobApplicationRoundProgress.reviewedAt,
    })
    .from(jobApplicationRoundProgress)
    .innerJoin(jobApplications, eq(jobApplications.id, jobApplicationRoundProgress.applicationId))
    .innerJoin(selectionProcessRounds, eq(selectionProcessRounds.id, jobApplicationRoundProgress.roundId))
    .innerJoin(jobPostings, eq(jobPostings.id, jobApplications.jobId))
    .where(eq(jobPostings.companyId, companyId))
    .orderBy(selectionProcessRounds.roundNumber);

  const roundProgressByApplication = progressRows.reduce<Record<string, ApplicantRoundProgressRow[]>>((acc, row) => {
    if (!acc[row.applicationId]) acc[row.applicationId] = [];
    acc[row.applicationId].push(row);
    return acc;
  }, {});

  return (
    <ApplicantsClient
      initialApplicants={applicants}
      jobs={workflowJobs}
      roundProgressByApplication={roundProgressByApplication}
      currentPage={currentPage}
      totalPages={totalPages}
      selectedJobId={selectedJobId}
      selectedStatus={selectedStatus}
    />
  );
}
