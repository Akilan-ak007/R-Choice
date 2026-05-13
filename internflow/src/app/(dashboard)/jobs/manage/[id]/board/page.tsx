import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  jobApplications,
  jobPostings,
  studentProfiles,
  users,
} from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCompanyContextForUser } from "@/lib/company-context";
import KanbanBoardClient from "./KanbanBoardClient";

export default async function KanbanBoardPage(props: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { id: jobId } = await props.params;

  const [job] = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      companyId: jobPostings.companyId,
      postedBy: jobPostings.postedBy,
    })
    .from(jobPostings)
    .where(eq(jobPostings.id, jobId))
    .limit(1);

  if (!job) redirect("/jobs/manage");

  const companyContext = await getCompanyContextForUser(session.user.id);
  const isOwner =
    companyContext?.companyId === job.companyId ||
    job.postedBy === session.user.id;
  const isAdmin = [
    "placement_officer",
    "placement_head",
    "management_corporation",
    "mcr",
    "dean",
    "principal",
  ].includes(session.user.role);

  if (!isOwner && !isAdmin) redirect("/jobs/manage");

  const applicants = await db
    .select({
      applicationId: jobApplications.id,
      studentId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      avatarUrl: users.avatarUrl,
      status: jobApplications.status,
      appliedAt: jobApplications.appliedAt,
      department: studentProfiles.department,
      course: studentProfiles.course,
    })
    .from(jobApplications)
    .innerJoin(users, eq(jobApplications.studentId, users.id))
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(eq(jobApplications.jobId, jobId))
    .orderBy(desc(jobApplications.appliedAt));

  return (
    <KanbanBoardClient
      jobId={jobId}
      jobTitle={job.title}
      applicants={applicants.map((a) => ({
        applicationId: a.applicationId,
        studentId: a.studentId,
        firstName: a.firstName,
        lastName: a.lastName,
        email: a.email,
        avatarUrl: a.avatarUrl,
        status: a.status || "applied",
        appliedAt: a.appliedAt ? new Date(a.appliedAt).toISOString() : null,
        department: a.department,
        course: a.course,
      }))}
    />
  );
}
