"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  internshipRequests,
  externalInternshipDetails,
  jobApplications,
  jobPostings,
  companyRegistrations,
  users,
  notifications,
  jobResultPublications,
  odRaiseRequests,
  approvalSlaSettings,
  calendarEvents,
  jobApplicationRoundProgress,
  selectionProcessRounds,
} from "@/lib/db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { sendCompanyResultEmail } from "@/lib/mail";
import { getApproversForStudent } from "@/lib/db/queries/authority";
import { revalidatePath } from "next/cache";
import {
  sanitize,
  sanitizeOptional,
  validateEmail,
  validateUrl,
  validatePhone,
  validateDate,
  validateEnum,
  ValidationError,
} from "@/lib/validation";
import { getCompanyContextForUser } from "@/lib/company-context";
import { syncSelectionRoundCalendarForJob } from "@/lib/calendar-sync";
import { captureServerError, captureServerEvent } from "@/lib/observability";

async function getDefaultOdSlaHours() {
  const [setting] = await db
    .select({ slaHours: approvalSlaSettings.slaHours })
    .from(approvalSlaSettings)
    .where(eq(approvalSlaSettings.scope, "default_od"))
    .limit(1);

  return setting?.slaHours || 6;
}

export async function submitInternshipRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const userId = session.user.id;
  const role = session.user.role;

  if (role !== "student") {
    return { error: "Only students can submit internship applications." };
  }

  try {
    // 1. Get the authority mapping for the student
    const approvers = await getApproversForStudent(userId);

    if (!approvers.tutorId) {
      return { error: "No class tutor mapped to your department/section. Cannot submit request." };
    }

    // 2. Extract and validate form data
    const applicationType = validateEnum(
      formData.get("applicationType") || "external",
      ["portal", "external"] as const,
      "Application type"
    );
    const companyName = sanitize(formData.get("companyName"), "Company Name", 200);
    const companyAddress = sanitizeOptional(formData.get("companyAddress"), "Company Address", 500);
    const roleTitle = sanitize(formData.get("role"), "Job Role", 200);
    const startDate = validateDate(formData.get("startDate"), "Start Date");
    const endDate = validateDate(formData.get("endDate"), "End Date");
    const stipend = sanitizeOptional(formData.get("stipend"), "Stipend", 100);
    const workMode = sanitizeOptional(formData.get("workMode"), "Work Mode", 50);

    // External-specific validation
    let companyWebsite: string | null = null;
    let hrName: string | null = null;
    let hrEmail: string | null = null;
    let hrPhone: string | null = null;
    let offerLetterUrl: string | null = null;
    let companyIdProofUrl: string | null = null;
    let parentConsentUrl: string | null = null;
    let discoverySource: string | null = null;

    if (applicationType === "external") {
      companyWebsite = validateUrl(formData.get("companyWebsite"), "Company Website");
      hrName = sanitize(formData.get("hrName"), "HR Name", 200);
      hrEmail = validateEmail(formData.get("hrEmail"), "HR Email");
      // Strip whitespace & formatting from phone before validation/storage to fit varchar(15) column
      const rawPhone = typeof formData.get("hrPhone") === "string" ? (formData.get("hrPhone") as string).replace(/[\s\-()]/g, "") : formData.get("hrPhone");
      hrPhone = validatePhone(rawPhone, "HR Phone");
      offerLetterUrl = validateUrl(formData.get("offerLetterUrl"), "Offer Letter URL");
      companyIdProofUrl = validateUrl(formData.get("companyIdProofUrl"), "Company ID Proof URL");
      parentConsentUrl = validateUrl(formData.get("parentConsentUrl"), "Parent Consent URL");
      discoverySource = sanitizeOptional(formData.get("discoverySource"), "Discovery Source", 100) || "Other";
    }

    // 3. Create the internship request
    // Wrap in transaction to prevent partial writes
    const tx = db;
    {
      const insertedReq = await tx.insert(internshipRequests).values({
        studentId: userId,
        applicationType,
        companyName,
        companyAddress,
        role: roleTitle,
        startDate,
        endDate,
        stipend,
        workMode,
        offerLetterUrl: offerLetterUrl || null,
        status: "pending_tutor", // Starts at tier 1 automatically
        currentTier: 1,
        submittedAt: new Date(),
      }).returning({ id: internshipRequests.id });

      const reqId = insertedReq[0].id;

      // 4. Insert External Details if applicable
      if (applicationType === "external") {
        await tx.insert(externalInternshipDetails).values({
          requestId: reqId,
          companyWebsite: companyWebsite || "Not provided",
          hrName: hrName!,
          hrEmail: hrEmail!,
          hrPhone: hrPhone!,
          companyIdProofUrl: companyIdProofUrl || "Not provided",
          parentConsentUrl: parentConsentUrl || "Not provided",
          workMode: workMode || "onsite",
          discoverySource: discoverySource || "Other",
        });
      }
    }

    revalidatePath("/applications");
    revalidatePath("/dashboard/student");
    
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return { error: error.message };
    }
    captureServerError(error, {
      scope: "submitInternshipRequest",
      actorId: userId,
      actorRole: role,
    });
    const message = error instanceof Error ? error.message : "Failed to submit application.";
    return { error: message };
  }
}

export async function createPortalApplication(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const userId = session.user.id;
  const role = session.user.role;

  if (role !== "student") return { error: "Only students can apply." };

  try {
    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);
    if (!job) {
      return { error: "Job not found." };
    }
    if (job.status !== "approved") {
      return { error: "This internship has not been approved yet." };
    }

    // Check if already applied
    const [existing] = await db.select({ id: jobApplications.id })
      .from(jobApplications)
      .where(and(eq(jobApplications.jobId, jobId), eq(jobApplications.studentId, userId)))
      .limit(1);
    if (existing) {
      return { error: "You have already applied to this internship." };
    }

    // Direct apply for job tracking.
    await db.insert(jobApplications).values({
      jobId,
      studentId: userId,
      status: "applied",
    });

    captureServerEvent("job_application_created", {
      jobId,
      studentId: userId,
    });

    // NOTE: For internal/portal applications, we do NOT create an internshipRequests
    // record here. The flow is: Student Applies → Company Shortlists → Company Posts
    // Results (sends verification code) → Student enters code → verifyAndInitializeOD
    // creates the OD request and starts the 6-tier approval chain.

    revalidatePath("/jobs");
    revalidatePath("/applicants");
    revalidatePath("/dashboard/student");
    
    return { success: true };
  } catch (error: unknown) {
    captureServerError(error, {
      scope: "createPortalApplication",
      jobId,
      studentId: userId,
    });
    const msg = error instanceof Error ? error.message : "Failed to submit application.";
    return { error: msg };
  }
}

export async function shortlistApplicant(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized. Only company-linked users can shortlist applicants." };
  }

  try {
    const [app] = await db.select({
      id: jobApplications.id,
      status: jobApplications.status,
      jobId: jobApplications.jobId,
      studentId: jobApplications.studentId,
    })
    .from(jobApplications)
    .where(eq(jobApplications.id, applicationId))
    .limit(1);

    if (!app) return { error: "Application not found." };

    // Verify the job belongs to this company
    const [job] = await db
      .select({ companyId: jobPostings.companyId })
      .from(jobPostings)
      .where(eq(jobPostings.id, app.jobId))
      .limit(1);
    const companyContext = await getCompanyContextForUser(session.user.id);
    if (!job || !companyContext || job.companyId !== companyContext.companyId) {
      return { error: "You can only shortlist applicants for your own job postings." };
    }

    const newStatus = app.status === "shortlisted" ? "applied" : "shortlisted";

    await db.update(jobApplications)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(jobApplications.id, applicationId));

    // Notify the student
    if (newStatus === "shortlisted") {
      await db.insert(notifications).values({
        userId: app.studentId,
        type: "application_update",
        title: "You've been shortlisted!",
        message: `You have been shortlisted for an internship. The company will post final results soon.`,
        linkUrl: "/dashboard/student",
      });
    }

    await syncSelectionRoundCalendarForJob(app.jobId);

    captureServerEvent("job_application_shortlist_toggled", {
      applicationId,
      jobId: app.jobId,
      studentId: app.studentId,
      newStatus,
      actorId: session.user.id,
    });

    revalidatePath("/applicants");
    revalidatePath("/students/shortlisted");
    revalidatePath("/students/applied");
    revalidatePath("/students");
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard/admin");
    return { success: true, newStatus };
  } catch (err: unknown) {
    captureServerError(err, {
      scope: "shortlistApplicant",
      applicationId,
      actorId: session.user.id,
    });
    return { error: err instanceof Error ? err.message : "Failed to update shortlist status." };
  }
}

export async function postCompanyResults(jobId: string, selectedStudentIds: string[]) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized. Only company-linked users can post results." };
  }

  try {
    const companyContext = await getCompanyContextForUser(session.user.id);
    if (!companyContext) {
      return { error: "No company is linked to this user." };
    }

    // Get Job Details
    const [job] = await db.select({
      role: jobPostings.title,
      companyId: jobPostings.companyId
    }).from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);

    if (!job || job.companyId !== companyContext.companyId) {
      return { error: "You can only publish results for jobs owned by your company." };
    }

    const [company] = job.companyId
      ? await db.select({
          name: companyRegistrations.companyLegalName
        }).from(companyRegistrations).where(eq(companyRegistrations.id, job.companyId)).limit(1)
      : [{ name: "Unknown Company" }];

    const appIds = Array.from(new Set(selectedStudentIds.filter(Boolean)));
    if (appIds.length === 0) {
      return { error: "Select at least one candidate before publishing results." };
    }

    const rounds = await db
      .select({
        id: selectionProcessRounds.id,
        roundNumber: selectionProcessRounds.roundNumber,
      })
      .from(selectionProcessRounds)
      .where(eq(selectionProcessRounds.jobId, jobId))
      .orderBy(asc(selectionProcessRounds.roundNumber));

    const applications = await db
      .select({
        applicationId: jobApplications.id,
        studentId: jobApplications.studentId,
        status: jobApplications.status,
      })
      .from(jobApplications)
      .where(and(eq(jobApplications.jobId, jobId), inArray(jobApplications.id, appIds)));

    if (applications.length !== appIds.length) {
      return { error: "Some selected applications could not be found for this job." };
    }

    const invalidStatusApplication = applications.find(
      (application) => !["shortlisted", "round_scheduled"].includes(application.status || "")
    );
    if (invalidStatusApplication) {
      return { error: "Only shortlisted or round-scheduled candidates can receive final results." };
    }

    if (rounds.length > 0) {
      const progressRows = await db
        .select({
          applicationId: jobApplicationRoundProgress.applicationId,
          roundId: jobApplicationRoundProgress.roundId,
          status: jobApplicationRoundProgress.status,
        })
        .from(jobApplicationRoundProgress)
        .where(inArray(jobApplicationRoundProgress.applicationId, appIds));

      const roundIds = rounds.map((round) => round.id);
      const progressByApplication = progressRows.reduce<Record<string, { cleared: Set<string>; scheduled: Set<string> }>>((acc, row) => {
        if (!acc[row.applicationId]) {
          acc[row.applicationId] = {
            cleared: new Set<string>(),
            scheduled: new Set<string>(),
          };
        }
        if (row.status === "cleared") acc[row.applicationId].cleared.add(row.roundId);
        if (row.status === "scheduled") acc[row.applicationId].scheduled.add(row.roundId);
        return acc;
      }, {});

      const notReady = applications.find((application) => {
        const progress = progressByApplication[application.applicationId];
        if (!progress) return true;

        const hasUnclearedRound = roundIds.some((roundId) => !progress.cleared.has(roundId));
        const stillScheduled = progress.scheduled.size > 0;
        return hasUnclearedRound || stillScheduled;
      });

      if (notReady) {
        return {
          error: "Candidates can receive final results only after every configured round is cleared.",
        };
      }
    }

    for (const application of applications) {
      const studentId = application.studentId;

      // Update the application status
      await db.update(jobApplications)
        .set({ status: "selected", verificationCode: null, isVerified: false, updatedAt: new Date() })
        .where(eq(jobApplications.id, application.applicationId));

      await db
        .insert(jobResultPublications)
        .values({
          jobId,
          applicationId: application.applicationId,
          companyId: companyContext.companyId,
          studentId,
          resultStatus: "selected",
          publishedByUserId: session.user.id,
          notes: "Selected by company. Waiting for student OD document submission and PO Raise OD.",
        })
        .onConflictDoNothing();

      // Build email
      const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
      
      let emailTask: { email: string; name: string; phone: string | null; tutorId: null; pcId: null; hodId: null } | null = null;
      if (student && student.email) {
        // Notify Student Directly
        await db.insert(notifications).values({
          userId: student.id,
          type: "selection",
          title: "Internship Selection Result",
          message: `Congratulations! You have been selected by ${company?.name}. Submit your offer letter and parent consent links to send the OD request to Placement Officer.`,
          linkUrl: "/dashboard/student"
        });
        
        emailTask = { email: student.email, name: `${student.firstName} ${student.lastName}`, phone: student.phone, tutorId: null, pcId: null, hodId: null };
      }

      // Side-effects (Email API requests) fire only if the atomic db transaction succeeds
      if (emailTask) {
        await sendCompanyResultEmail(
          emailTask.email,
          emailTask.name,
          company?.name || "The Company",
          job?.role || "Internship",
          "RESULT"
        );

        // Fetch authorities outside logic if needed
        try {
          const approvers = await getApproversForStudent(studentId);
          const notifyAlerts: Array<typeof notifications.$inferInsert> = [];
          const pushMessage = `A student in your section (${emailTask.name}) was just shortlisted for ${job?.role || "an internship"} by ${company?.name}. A student-started OD request may follow soon.`;
          
          if (approvers.tutorId) notifyAlerts.push({ userId: approvers.tutorId, type: "application_update", title: "Student Shortlisted", message: pushMessage, linkUrl: "/approvals" });
          if (approvers.placementCoordinatorId) notifyAlerts.push({ userId: approvers.placementCoordinatorId, type: "application_update", title: "Student Shortlisted", message: pushMessage, linkUrl: "/approvals" });
          if (approvers.hodId) notifyAlerts.push({ userId: approvers.hodId, type: "application_update", title: "Student Shortlisted", message: pushMessage, linkUrl: "/approvals" });

          if (notifyAlerts.length > 0) {
            // We do this outside the main transaction to not fail the core selection if this fails
            await db.insert(notifications).values(notifyAlerts);
          }
        } catch (authErr) {
          console.error("Failed to lookup authorities for notifications, skipping...", authErr);
        }
      }
    }

    await syncSelectionRoundCalendarForJob(jobId);

    captureServerEvent("company_results_published", {
      jobId,
      companyId: companyContext.companyId,
      selectedCount: applications.length,
      actorId: session.user.id,
    });

    // Optional: Alert the hierarchy that a result was posted (can be global or mapped to selected students)
    
    revalidatePath("/applicants");
    revalidatePath("/approvals/results");
    revalidatePath("/students/shortlisted");
    revalidatePath("/students/applied");
    revalidatePath("/students");
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/staff");
    return { success: true };
  } catch (err: unknown) {
    captureServerError(err, {
      scope: "postCompanyResults",
      jobId,
      actorId: session.user.id,
      selectedApplicationIds: selectedStudentIds,
    });
    return { error: err instanceof Error ? err.message : "Failed to post results" };
  }
}

export async function toggleApplicantRoundScheduled(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized. Only company-linked users can manage round stages." };
  }

  try {
    const [app] = await db.select({
      id: jobApplications.id,
      status: jobApplications.status,
      jobId: jobApplications.jobId,
      studentId: jobApplications.studentId,
    })
    .from(jobApplications)
    .where(eq(jobApplications.id, applicationId))
    .limit(1);

    if (!app) return { error: "Application not found." };

    const [job] = await db
      .select({ companyId: jobPostings.companyId, title: jobPostings.title })
      .from(jobPostings)
      .where(eq(jobPostings.id, app.jobId))
      .limit(1);
    const companyContext = await getCompanyContextForUser(session.user.id);
    if (!job || !companyContext || job.companyId !== companyContext.companyId) {
      return { error: "You can only manage round stages for your own job postings." };
    }

    if (!["shortlisted", "round_scheduled"].includes(app.status || "")) {
      return { error: "Only shortlisted candidates can be moved into a scheduled round." };
    }

    const newStatus = app.status === "round_scheduled" ? "shortlisted" : "round_scheduled";

    if (newStatus === "round_scheduled") {
      const rounds = await db
        .select({
          id: selectionProcessRounds.id,
        })
        .from(selectionProcessRounds)
        .where(eq(selectionProcessRounds.jobId, app.jobId))
        .orderBy(asc(selectionProcessRounds.roundNumber));

      const firstRound = rounds[0];
      if (!firstRound) {
        return { error: "Add at least one structured round before scheduling candidates." };
      }

      const [existingProgress] = await db
        .select({ id: jobApplicationRoundProgress.id })
        .from(jobApplicationRoundProgress)
        .where(eq(jobApplicationRoundProgress.applicationId, applicationId))
        .limit(1);

      if (!existingProgress) {
        await db.insert(jobApplicationRoundProgress).values({
          applicationId,
          roundId: firstRound.id,
          status: "scheduled",
          reviewedByUserId: session.user.id,
        });
      }
    } else {
      await db
        .delete(jobApplicationRoundProgress)
        .where(
          and(
            eq(jobApplicationRoundProgress.applicationId, applicationId),
            eq(jobApplicationRoundProgress.status, "scheduled")
          )
        );
    }

    await db.update(jobApplications)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(jobApplications.id, applicationId));

    if (newStatus === "round_scheduled") {
      await db.insert(notifications).values({
        userId: app.studentId,
        type: "application_update",
        title: "Interview Round Scheduled",
        message: `Your next round for ${job.title} has been scheduled. Check your calendar for the latest timing.`,
        linkUrl: "/calendar",
      });
    }

    await syncSelectionRoundCalendarForJob(app.jobId);

    captureServerEvent("job_application_round_schedule_toggled", {
      applicationId,
      jobId: app.jobId,
      studentId: app.studentId,
      newStatus,
      actorId: session.user.id,
    });

    revalidatePath("/applicants");
    revalidatePath("/calendar");
    revalidatePath("/dashboard/student");
    revalidatePath("/students/shortlisted");
    revalidatePath("/students/applied");
    revalidatePath("/students");
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard/admin");
    return { success: true, newStatus };
  } catch (err: unknown) {
    captureServerError(err, {
      scope: "toggleApplicantRoundScheduled",
      applicationId,
      actorId: session.user.id,
    });
    return { error: err instanceof Error ? err.message : "Failed to update round stage." };
  }
}

export async function recordApplicantRoundOutcome(
  applicationId: string,
  roundId: string,
  outcome: "cleared" | "rejected"
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized. Only company-linked users can update round outcomes." };
  }

  try {
    const [application] = await db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        studentId: jobApplications.studentId,
      })
      .from(jobApplications)
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!application) {
      return { error: "Application not found." };
    }

    const [job] = await db
      .select({ companyId: jobPostings.companyId, title: jobPostings.title })
      .from(jobPostings)
      .where(eq(jobPostings.id, application.jobId))
      .limit(1);

    const companyContext = await getCompanyContextForUser(session.user.id);
    if (!job || !companyContext || job.companyId !== companyContext.companyId) {
      return { error: "You can only manage round outcomes for your own job postings." };
    }

    const rounds = await db
      .select({
        id: selectionProcessRounds.id,
        roundNumber: selectionProcessRounds.roundNumber,
        roundName: selectionProcessRounds.roundName,
      })
      .from(selectionProcessRounds)
      .where(eq(selectionProcessRounds.jobId, application.jobId))
      .orderBy(asc(selectionProcessRounds.roundNumber));

    const currentRoundIndex = rounds.findIndex((round) => round.id === roundId);
    if (currentRoundIndex === -1) {
      return { error: "Round not found for this job." };
    }

    const [existingProgress] = await db
      .select({ id: jobApplicationRoundProgress.id })
      .from(jobApplicationRoundProgress)
      .where(
        and(
          eq(jobApplicationRoundProgress.applicationId, applicationId),
          eq(jobApplicationRoundProgress.roundId, roundId)
        )
      )
      .limit(1);

    if (existingProgress) {
      await db
        .update(jobApplicationRoundProgress)
        .set({
          status: outcome,
          reviewedByUserId: session.user.id,
          reviewedAt: new Date(),
        })
        .where(eq(jobApplicationRoundProgress.id, existingProgress.id));
    } else {
      await db.insert(jobApplicationRoundProgress).values({
        applicationId,
        roundId,
        status: outcome,
        reviewedByUserId: session.user.id,
        reviewedAt: new Date(),
      });
    }

    if (outcome === "rejected") {
      await db
        .update(jobApplications)
        .set({ status: "rejected", updatedAt: new Date() })
        .where(eq(jobApplications.id, applicationId));

      await db.insert(notifications).values({
        userId: application.studentId,
        type: "application_update",
        title: "Application Closed",
        message: `Your application for ${job.title} was not advanced beyond the current round.`,
        linkUrl: "/dashboard/student",
      });
    } else {
      const nextRound = rounds[currentRoundIndex + 1];

      if (nextRound) {
        const [existingNext] = await db
          .select({ id: jobApplicationRoundProgress.id })
          .from(jobApplicationRoundProgress)
          .where(
            and(
              eq(jobApplicationRoundProgress.applicationId, applicationId),
              eq(jobApplicationRoundProgress.roundId, nextRound.id)
            )
          )
          .limit(1);

        if (existingNext) {
          await db
            .update(jobApplicationRoundProgress)
            .set({
              status: "scheduled",
              reviewedByUserId: session.user.id,
              reviewedAt: new Date(),
            })
            .where(eq(jobApplicationRoundProgress.id, existingNext.id));
        } else {
          await db.insert(jobApplicationRoundProgress).values({
            applicationId,
            roundId: nextRound.id,
            status: "scheduled",
            reviewedByUserId: session.user.id,
            reviewedAt: new Date(),
          });
        }

        await db
          .update(jobApplications)
          .set({ status: "round_scheduled", updatedAt: new Date() })
          .where(eq(jobApplications.id, applicationId));

        await db.insert(notifications).values({
          userId: application.studentId,
          type: "application_update",
          title: "Next Round Unlocked",
          message: `You cleared a round for ${job.title}. Check your calendar for the next scheduled round.`,
          linkUrl: "/calendar",
        });
      } else {
        await db
          .update(jobApplications)
          .set({ status: "round_scheduled", updatedAt: new Date() })
          .where(eq(jobApplications.id, applicationId));

        await db.insert(notifications).values({
          userId: application.studentId,
          type: "application_update",
          title: "All Rounds Cleared",
          message: `You cleared the final listed round for ${job.title}. The company can now publish the final result.`,
          linkUrl: "/dashboard/student",
        });
      }
    }

    await syncSelectionRoundCalendarForJob(application.jobId);

    captureServerEvent("job_application_round_outcome_recorded", {
      applicationId,
      roundId,
      outcome,
      studentId: application.studentId,
      jobId: application.jobId,
      actorId: session.user.id,
    });

    revalidatePath("/applicants");
    revalidatePath("/calendar");
    revalidatePath("/dashboard/student");
    revalidatePath("/students/shortlisted");
    revalidatePath("/students/applied");
    revalidatePath("/students");
    revalidatePath("/dashboard/company");
    revalidatePath("/dashboard/staff");
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (err: unknown) {
    captureServerError(err, {
      scope: "recordApplicantRoundOutcome",
      applicationId,
      roundId,
      outcome,
      actorId: session.user.id,
    });
    return { error: err instanceof Error ? err.message : "Failed to update round outcome." };
  }
}

export async function raiseODFromSelection(resultPublicationId: string, startDate: string, endDate: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "placement_officer") {
    return { error: "Only the Placement Officer can raise OD requests from company results." };
  }

  try {
    const [resultPublication] = await db
      .select()
      .from(jobResultPublications)
      .where(eq(jobResultPublications.id, resultPublicationId))
      .limit(1);

    if (!resultPublication || resultPublication.resultStatus !== "selected") {
      return { error: "Selected result not found." };
    }

    const [existingRaise] = await db
      .select()
      .from(odRaiseRequests)
      .where(eq(odRaiseRequests.resultPublicationId, resultPublicationId))
      .limit(1);

    if (existingRaise?.status === "od_raised") {
      return { error: "OD has already been raised for this result." };
    }

    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, resultPublication.jobId)).limit(1);
    const [company] = await db.select().from(companyRegistrations).where(eq(companyRegistrations.id, resultPublication.companyId)).limit(1);
    if (!job || !company) {
      return { error: "Job or company details are missing." };
    }

    const validatedStartDate = validateDate(startDate, "Start Date");
    const validatedEndDate = validateDate(endDate, "End Date");
    const slaHours = await getDefaultOdSlaHours();
    const approvers = await getApproversForStudent(resultPublication.studentId);

    if (existingRaise && !existingRaise.internshipRequestId) {
      return { error: "The student must submit OD documents before Placement Officer can raise OD." };
    }

    let internshipRequestId = existingRaise?.internshipRequestId || null;

    if (internshipRequestId) {
      await db
        .update(internshipRequests)
        .set({
          startDate: validatedStartDate,
          endDate: validatedEndDate,
          status: "pending_tutor",
          currentTier: 1,
          currentTierEnteredAt: new Date(),
          currentTierSlaHours: slaHours,
          submittedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(internshipRequests.id, internshipRequestId));
    } else {
      const [createdRequest] = await db.insert(internshipRequests).values({
        studentId: resultPublication.studentId,
        jobPostingId: resultPublication.jobId,
        applicationType: "portal",
        companyName: company.companyLegalName,
        companyAddress: company.address,
        role: job.title,
        startDate: validatedStartDate,
        endDate: validatedEndDate,
        stipend: job.stipendSalary,
        workMode: job.workMode,
        status: "pending_tutor",
        currentTier: 1,
        currentTierEnteredAt: new Date(),
        currentTierSlaHours: slaHours,
        submittedAt: new Date(),
      }).returning({ id: internshipRequests.id });
      internshipRequestId = createdRequest.id;
    }

    if (existingRaise) {
      await db
        .update(odRaiseRequests)
        .set({
          internshipRequestId,
          status: "od_raised",
          raisedByUserId: session.user.id,
          startDate: validatedStartDate,
          endDate: validatedEndDate,
          raisedAt: new Date(),
        })
        .where(eq(odRaiseRequests.id, existingRaise.id));
    } else {
      await db.insert(odRaiseRequests).values({
        resultPublicationId,
        studentId: resultPublication.studentId,
        jobId: resultPublication.jobId,
        companyId: resultPublication.companyId,
        internshipRequestId,
        status: "od_raised",
        raisedByUserId: session.user.id,
        startDate: validatedStartDate,
        endDate: validatedEndDate,
        raisedAt: new Date(),
      });
    }

    await db.insert(notifications).values([
      {
        userId: resultPublication.studentId,
        type: "od_raised",
        title: "OD Approval Flow Started",
        message: `${company.companyLegalName} selection has been converted into an OD approval request by the Placement Officer.`,
        linkUrl: "/applications",
      },
      ...(approvers.tutorId
        ? [{
            userId: approvers.tutorId,
            type: "application_update",
            title: "New Portal OD Request",
            message: `A portal OD request for ${job.title} at ${company.companyLegalName} is ready for tutor review.`,
            linkUrl: "/approvals",
          }]
        : []),
      ...(approvers.placementCoordinatorId
        ? [{
            userId: approvers.placementCoordinatorId,
            type: "application_update",
            title: "New Portal OD Request",
            message: `A portal OD request for ${job.title} at ${company.companyLegalName} has entered the approval chain.`,
            linkUrl: "/approvals",
          }]
        : []),
      ...(approvers.hodId
        ? [{
            userId: approvers.hodId,
            type: "application_update",
            title: "New Portal OD Request",
            message: `A portal OD request for ${job.title} at ${company.companyLegalName} has entered the approval chain.`,
            linkUrl: "/approvals",
          }]
        : []),
    ]);

    await db.insert(calendarEvents).values({
      userId: resultPublication.studentId,
      title: `OD Raised: ${company.companyLegalName}`,
      description: `Placement Officer started OD approval for ${job.title}`,
      eventType: "od_raised",
      startDate: new Date(validateDate(startDate, "Start Date")),
      relatedEntityId: internshipRequestId,
      relatedEntityType: "internship_request",
      isAllDay: true,
    });

    captureServerEvent("od_raised_from_company_selection", {
      resultPublicationId,
      internshipRequestId,
      studentId: resultPublication.studentId,
      companyId: resultPublication.companyId,
      jobId: resultPublication.jobId,
      actorId: session.user.id,
    });

    revalidatePath("/applications");
    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ValidationError) return { error: err.message };
    captureServerError(err, {
      scope: "raiseODFromSelection",
      resultPublicationId,
      actorId: session.user.id,
    });
    return { error: err instanceof Error ? err.message : "Failed to raise OD request." };
  }
}

export async function submitPortalOdRequestFromSelection(payload: {
  applicationId: string;
  startDate: string;
  endDate: string;
  offerLetterUrl: string;
  parentConsentUrl: string;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "student") {
    return { error: "Only students can start the OD request after selection." };
  }

  const studentId = session.user.id;

  try {
    const applicationId = sanitize(payload.applicationId, "Application", 100);
    const startDate = validateDate(payload.startDate, "Start Date");
    const endDate = validateDate(payload.endDate, "End Date");
    const offerLetterUrl = validateUrl(payload.offerLetterUrl, "Offer Letter URL");
    const parentConsentUrl = validateUrl(payload.parentConsentUrl, "Parent Consent URL");

    const [application] = await db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        studentId: jobApplications.studentId,
        status: jobApplications.status,
      })
      .from(jobApplications)
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!application || application.studentId !== studentId) {
      return { error: "Selection record not found for this student." };
    }

    if (application.status !== "selected") {
      return { error: "Only selected students can start the OD approval request." };
    }

    const [resultPublication] = await db
      .select()
      .from(jobResultPublications)
      .where(eq(jobResultPublications.applicationId, applicationId))
      .limit(1);

    if (!resultPublication || resultPublication.resultStatus !== "selected") {
      return { error: "The company selection result is missing." };
    }

    const [existingRaise] = await db
      .select()
      .from(odRaiseRequests)
      .where(eq(odRaiseRequests.resultPublicationId, resultPublication.id))
      .limit(1);

    if (existingRaise?.internshipRequestId) {
      return { error: "You have already started the OD approval flow for this selection." };
    }

    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, resultPublication.jobId)).limit(1);
    const [company] = await db
      .select()
      .from(companyRegistrations)
      .where(eq(companyRegistrations.id, resultPublication.companyId))
      .limit(1);

    if (!job || !company) {
      return { error: "Job or company details are missing for this selection." };
    }

    const [createdRequest] = await db
      .insert(internshipRequests)
      .values({
        studentId,
        jobPostingId: resultPublication.jobId,
        applicationType: "portal",
        companyName: company.companyLegalName,
        companyAddress: company.address,
        role: job.title,
        startDate,
        endDate,
        stipend: job.stipendSalary,
        workMode: job.workMode,
        offerLetterUrl,
        status: "draft",
        currentTier: 0,
        currentTierEnteredAt: null,
        submittedAt: new Date(),
      })
      .returning({ id: internshipRequests.id });

    await db.insert(externalInternshipDetails).values({
      requestId: createdRequest.id,
      companyWebsite: company.website || "Not provided",
      hrName: company.hrName || "HR Team",
      hrEmail: company.hrEmail || "not-provided@example.com",
      hrPhone: company.hrPhone || "0000000000",
      companyIdProofUrl: company.registrationCertUrl || company.coi || company.website || "Not provided",
      parentConsentUrl,
      workMode: job.workMode || "onsite",
      discoverySource: "Portal Selection",
    });

    const internshipRequestId = createdRequest.id;

    if (existingRaise) {
      await db
        .update(odRaiseRequests)
        .set({
          internshipRequestId: createdRequest.id,
          status: "awaiting_po_raise",
          raisedByUserId: null,
          startDate,
          endDate,
          raisedAt: null,
        })
        .where(eq(odRaiseRequests.id, existingRaise.id));
    } else {
      await db.insert(odRaiseRequests).values({
        resultPublicationId: resultPublication.id,
        studentId,
        jobId: resultPublication.jobId,
        companyId: resultPublication.companyId,
        internshipRequestId,
        status: "awaiting_po_raise",
        raisedByUserId: null,
        startDate,
        endDate,
        raisedAt: null,
      });
    }

    const placementOfficers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "placement_officer"));

    const notifyRows = [
      ...placementOfficers.map((po) => ({
        userId: po.id,
        type: "application_update",
        title: "Student Submitted OD Documents",
        message: `${session.user.name || "A student"} submitted portal OD documents for ${job.title} at ${company.companyLegalName}. Review and click Raise OD to start the approval chain.`,
        linkUrl: "/approvals/results",
      })),
      {
        userId: studentId,
        type: "application_update",
        title: "Documents Sent to Placement Officer",
        message: `Your OD documents for ${company.companyLegalName} were submitted successfully. Wait for the Placement Officer to click Raise OD.`,
        linkUrl: "/applications",
      },
    ] as typeof notifications.$inferInsert[];

    await db.insert(notifications).values(notifyRows);

    captureServerEvent("portal_od_request_started_by_student", {
      applicationId,
      internshipRequestId,
      studentId,
      resultPublicationId: resultPublication.id,
    });

    revalidatePath("/applications");
    revalidatePath("/approvals");
    revalidatePath("/approvals/results");
    revalidatePath("/dashboard/student");
    revalidatePath("/dashboard/admin");
    revalidatePath("/jobs");
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ValidationError) {
      return { error: err.message };
    }
    captureServerError(err, {
      scope: "submitPortalOdRequestFromSelection",
      actorId: studentId,
      applicationId: payload.applicationId,
    });
    return { error: err instanceof Error ? err.message : "Failed to start the OD request." };
  }
}

export async function verifyAndInitializeOD(applicationId: string, code: string, startDate: string, endDate: string) {
  void applicationId;
  void code;
  void startDate;
  void endDate;
  return {
    error: "Selected students now start the OD request directly by submitting their offer letter and parent consent links.",
  };
}
