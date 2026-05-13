"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  calendarEvents,
  companyRegistrations,
  internshipRequests,
  jobApplicationRoundProgress,
  jobApplications,
  jobPostings,
  selectionProcessRounds,
  workReportSchedules,
} from "@/lib/db/schema";

export async function fetchStudentCalendarEvents() {
  const session = await auth();
  if (!session?.user?.id) return [];

  const userId = session.user.id;

  try {
    const customEvents = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.userId, userId));

    const approvedRequests = await db
      .select({
        id: internshipRequests.id,
        companyName: internshipRequests.companyName,
        role: internshipRequests.role,
        startDate: internshipRequests.startDate,
        endDate: internshipRequests.endDate,
      })
      .from(internshipRequests)
      .where(eq(internshipRequests.studentId, userId));

    const candidateRounds = await db
      .select({
        roundId: selectionProcessRounds.id,
        roundName: selectionProcessRounds.roundName,
        startsAt: selectionProcessRounds.startsAt,
        endsAt: selectionProcessRounds.endsAt,
        mode: selectionProcessRounds.mode,
        meetLink: selectionProcessRounds.meetLink,
        location: selectionProcessRounds.location,
        jobTitle: jobPostings.title,
        companyName: companyRegistrations.companyLegalName,
      })
      .from(jobApplicationRoundProgress)
      .innerJoin(jobApplications, eq(jobApplications.id, jobApplicationRoundProgress.applicationId))
      .innerJoin(selectionProcessRounds, eq(selectionProcessRounds.id, jobApplicationRoundProgress.roundId))
      .innerJoin(jobPostings, eq(jobPostings.id, jobApplications.jobId))
      .leftJoin(companyRegistrations, eq(companyRegistrations.id, jobPostings.companyId))
      .where(
        and(
          eq(jobApplications.studentId, userId),
          eq(jobApplicationRoundProgress.status, "scheduled")
        )
      );

    const reportSchedules = await db
      .select({
        id: workReportSchedules.id,
        requestId: workReportSchedules.requestId,
        frequency: workReportSchedules.frequency,
        nextDueDate: workReportSchedules.nextDueDate,
      })
      .from(workReportSchedules);

    const events: {
      id: string;
      title: string;
      description: string;
      eventType: string;
      startDate: string;
      endDate?: string | null;
      meetLink?: string | null;
      isAllDay: boolean;
    }[] = [];

    for (const event of customEvents) {
      events.push({
        id: event.id,
        title: event.title,
        description: event.description || "",
        eventType: event.eventType,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate?.toISOString() || null,
        meetLink: event.meetLink || null,
        isAllDay: event.isAllDay || false,
      });
    }

    const existingSelectionRoundIds = new Set(
      customEvents
        .filter((event) => event.eventType === "selection_round" && event.relatedEntityId)
        .map((event) => event.relatedEntityId as string)
    );

    for (const request of approvedRequests) {
      if (request.startDate) {
        events.push({
          id: `intern-start-${request.id}`,
          title: `Internship Start: ${request.companyName}`,
          description: `Role: ${request.role}`,
          eventType: "internship_start",
          startDate: new Date(request.startDate).toISOString(),
          isAllDay: true,
        });
      }

      if (request.endDate) {
        events.push({
          id: `intern-end-${request.id}`,
          title: `Internship End: ${request.companyName}`,
          description: `Role: ${request.role}`,
          eventType: "internship_end",
          startDate: new Date(request.endDate).toISOString(),
          isAllDay: true,
        });
      }
    }

    for (const schedule of reportSchedules) {
      if (schedule.nextDueDate) {
        events.push({
          id: `report-${schedule.id}`,
          title: `Report Due (${schedule.frequency})`,
          description: "Submit your internship work report",
          eventType: "report_due",
          startDate: new Date(schedule.nextDueDate).toISOString(),
          isAllDay: true,
        });
      }
    }

    for (const round of candidateRounds) {
      if (!round.startsAt || existingSelectionRoundIds.has(round.roundId)) continue;

      const detailParts = [
        round.companyName || "Company",
        round.mode ? `Mode: ${round.mode}` : null,
        round.location ? `Location: ${round.location}` : null,
      ].filter(Boolean);

      events.push({
        id: `round-${round.roundId}`,
        title: `${round.roundName}: ${round.jobTitle}`,
        description: detailParts.join(" - "),
        eventType: "selection_round",
        startDate: round.startsAt.toISOString(),
        endDate: round.endsAt?.toISOString() || null,
        meetLink: round.meetLink || null,
        isAllDay: false,
      });
    }

    return events;
  } catch (error) {
    console.error("Calendar fetch error:", error);
    return [];
  }
}

export async function createCalendarEvent(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const targetUserId = (formData.get("userId") as string) || session.user.id;

  try {
    await db.insert(calendarEvents).values({
      userId: targetUserId,
      title: formData.get("title") as string,
      description: (formData.get("description") as string) || null,
      eventType: (formData.get("eventType") as string) || "meeting",
      startDate: new Date(formData.get("startDate") as string),
      endDate: formData.get("endDate") ? new Date(formData.get("endDate") as string) : null,
      meetLink: (formData.get("meetLink") as string) || null,
      isAllDay: formData.get("isAllDay") === "true",
    });

    revalidatePath("/calendar");
    return { success: true };
  } catch (error) {
    console.error("Create calendar event error:", error);
    return { error: "Failed to create event" };
  }
}
