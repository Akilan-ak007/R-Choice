import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, selectionProcessRounds } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getCompanyContextForUser } from "@/lib/company-context";
import EditJobClient from "./EditJobClient";

function toDateTimeLocal(value: Date | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset();
  const local = new Date(date.getTime() - offset * 60_000);
  return local.toISOString().slice(0, 16);
}

export default async function EditJobPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { id } = await props.params;
  const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, id)).limit(1);
  if (!job) {
    redirect("/jobs/manage");
  }

  const companyContext = await getCompanyContextForUser(session.user.id);
  const isOwner = companyContext?.companyId === job.companyId || job.postedBy === session.user.id;
  const isAdmin = ["dean", "placement_officer", "principal"].includes(session.user.role);
  if (!isOwner && !isAdmin) {
    redirect("/jobs/manage");
  }

  const rounds = await db
    .select()
    .from(selectionProcessRounds)
    .where(eq(selectionProcessRounds.jobId, id))
    .orderBy(asc(selectionProcessRounds.roundNumber));

  return (
    <EditJobClient
      job={{
        id: job.id,
        title: job.title,
        description: job.description,
        location: job.location,
        stipendSalary: job.stipendSalary || "",
        applicationDeadline: job.applicationDeadline ? String(job.applicationDeadline).slice(0, 10) : "",
        openingsCount: job.openingsCount || 1,
        rounds: rounds.map((round) => ({
          roundName: round.roundName,
          roundType: round.roundType || "custom",
          startsAt: toDateTimeLocal(round.startsAt),
          endsAt: toDateTimeLocal(round.endsAt),
          mode: round.mode || "Online",
          meetLink: round.meetLink || "",
          location: round.location || "",
          description: round.description || "",
        })),
      }}
    />
  );
}
