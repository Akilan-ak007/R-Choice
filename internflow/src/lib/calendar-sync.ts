import { and, eq, inArray } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  calendarEvents,
  companyRegistrations,
  jobApplicationRoundProgress,
  jobApplications,
  jobPostings,
  selectionProcessRounds,
} from "@/lib/db/schema";

export async function syncSelectionRoundCalendarForJob(jobId: string, staleRoundIds: string[] = []) {
  const rounds = await db
    .select({
      id: selectionProcessRounds.id,
      roundNumber: selectionProcessRounds.roundNumber,
      roundName: selectionProcessRounds.roundName,
      description: selectionProcessRounds.description,
      startsAt: selectionProcessRounds.startsAt,
      endsAt: selectionProcessRounds.endsAt,
      mode: selectionProcessRounds.mode,
      meetLink: selectionProcessRounds.meetLink,
      location: selectionProcessRounds.location,
      jobTitle: jobPostings.title,
      companyName: companyRegistrations.companyLegalName,
    })
    .from(selectionProcessRounds)
    .innerJoin(jobPostings, eq(jobPostings.id, selectionProcessRounds.jobId))
    .leftJoin(companyRegistrations, eq(companyRegistrations.id, jobPostings.companyId))
    .where(eq(selectionProcessRounds.jobId, jobId));

  const allRoundIds = Array.from(new Set([...staleRoundIds, ...rounds.map((round) => round.id)]));

  if (allRoundIds.length > 0) {
    await db
      .delete(calendarEvents)
      .where(
        and(
          eq(calendarEvents.relatedEntityType, "selection_round"),
          inArray(calendarEvents.relatedEntityId, allRoundIds)
        )
      );
  }

  const activeRounds = rounds.filter((round) => round.startsAt);
  if (activeRounds.length === 0) {
    return;
  }

  const scheduledProgress = await db
    .select({
      applicationId: jobApplicationRoundProgress.applicationId,
      roundId: jobApplicationRoundProgress.roundId,
      studentId: jobApplications.studentId,
    })
    .from(jobApplicationRoundProgress)
    .innerJoin(jobApplications, eq(jobApplications.id, jobApplicationRoundProgress.applicationId))
    .where(
      and(
        eq(jobApplications.jobId, jobId),
        eq(jobApplicationRoundProgress.status, "scheduled"),
        inArray(jobApplications.status, ["round_scheduled", "selected"])
      )
    );

  if (scheduledProgress.length === 0) {
    return;
  }

  const roundMap = new Map(activeRounds.map((round) => [round.id, round]));
  const eventsToInsert = scheduledProgress.flatMap((progress) => {
    const round = roundMap.get(progress.roundId);
    if (!round?.startsAt) {
      return [];
    }

    const detailParts = [
      round.companyName || "Company",
      round.mode ? `Mode: ${round.mode}` : null,
      round.location ? `Location: ${round.location}` : null,
      round.description || null,
    ].filter(Boolean);

    return [{
      userId: progress.studentId,
      title: `Round ${round.roundNumber}: ${round.roundName}`,
      description: `${round.jobTitle}${detailParts.length > 0 ? `\n${detailParts.join("\n")}` : ""}`,
      eventType: "selection_round",
      startDate: round.startsAt,
      endDate: round.endsAt || null,
      meetLink: round.meetLink || null,
      relatedEntityId: round.id,
      relatedEntityType: "selection_round",
      isAllDay: false,
    }];
  });

  if (eventsToInsert.length > 0) {
    await db.insert(calendarEvents).values(eventsToInsert);
  }
}
