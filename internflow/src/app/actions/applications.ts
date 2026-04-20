"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { internshipRequests, externalInternshipDetails, jobApplications, jobPostings, companyRegistrations, users, notifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { sendCompanyResultEmail, sendVerificationSMS } from "@/lib/mail";
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
      hrPhone = validatePhone(formData.get("hrPhone"), "HR Phone");
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
    console.error("Application submission error:", error);
    return { error: "Failed to submit application." };
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

    // NOTE: For internal/portal applications, we do NOT create an internshipRequests
    // record here. The flow is: Student Applies → Company Shortlists → Company Posts
    // Results (sends verification code) → Student enters code → verifyAndInitializeOD
    // creates the OD request and starts the 6-tier approval chain.

    revalidatePath("/jobs");
    revalidatePath("/applicants");
    revalidatePath("/dashboard/student");
    
    return { success: true };
  } catch (error: unknown) {
    console.error("Portal apply error:", error);
    const msg = error instanceof Error ? error.message : "Failed to submit application.";
    return { error: msg };
  }
}

export async function shortlistApplicant(applicationId: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "company") {
    return { error: "Unauthorized. Only companies can shortlist applicants." };
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
    const [job] = await db.select({ postedBy: jobPostings.postedBy }).from(jobPostings).where(eq(jobPostings.id, app.jobId)).limit(1);
    if (!job || job.postedBy !== session.user.id) {
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

    revalidatePath("/applicants");
    return { success: true, newStatus };
  } catch (err: unknown) {
    console.error("Shortlist error:", err);
    return { error: err instanceof Error ? err.message : "Failed to update shortlist status." };
  }
}

export async function postCompanyResults(jobId: string, selectedStudentIds: string[]) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "company") {
    return { error: "Unauthorized. Only companies can post results." };
  }

  try {
    // Get Job Details
    const [job] = await db.select({
      role: jobPostings.title,
      companyId: jobPostings.companyId
    }).from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);

    const [company] = job.companyId
      ? await db.select({
          name: companyRegistrations.companyLegalName
        }).from(companyRegistrations).where(eq(companyRegistrations.id, job.companyId)).limit(1)
      : [{ name: "Unknown Company" }];

    for (const studentId of selectedStudentIds) {
      // Generate 6 digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Execute mutations within a resilient transaction boundary
      let emailTask: any = null;
      const tx = db;
      {
        // Update the application status
        await tx.update(jobApplications)
          .set({ status: "selected", verificationCode: code, updatedAt: new Date() })
          .where(and(eq(jobApplications.jobId, jobId), eq(jobApplications.studentId, studentId)));

        // Build email
        const [student] = await tx.select().from(users).where(eq(users.id, studentId)).limit(1);
        
        if (student && student.email) {
          // Notify Student Directly
          await tx.insert(notifications).values({
            userId: student.id,
            type: "selection",
            title: "Internship Selection Result",
            message: `Congratulations! You have been selected by ${company?.name}. Please check your email for the verification code to start your OD request.`,
            linkUrl: "/dashboard/student"
          });
          
          emailTask = { email: student.email, name: `${student.firstName} ${student.lastName}`, phone: student.phone, tutorId: null, pcId: null, hodId: null };
        }
      }

        // Side-effects (Email API requests) fire only if the atomic db transaction succeeds
      if (emailTask) {
        await sendCompanyResultEmail(
          emailTask.email,
          emailTask.name,
          company?.name || "The Company",
          job?.role || "Internship",
          code
        );

        if (emailTask.phone) {
          await sendVerificationSMS(emailTask.phone, code);
        }

        // Fetch authorities outside logic if needed
        try {
          const approvers = await getApproversForStudent(studentId);
          const notifyAlerts: Array<typeof notifications.$inferInsert> = [];
          const pushMessage = `A student in your section (${emailTask.name}) was just shortlisted for ${job?.role || "an internship"} by ${company?.name}. Expect an OD request soon.`;
          
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

    // Optional: Alert the hierarchy that a result was posted (can be global or mapped to selected students)
    
    revalidatePath("/dashboard/company/applicants");
    return { success: true };
  } catch (err: unknown) {
    console.error("Post results error:", err);
    return { error: err instanceof Error ? err.message : "Failed to post results" };
  }
}

export async function verifyAndInitializeOD(applicationId: string, code: string, startDate: string, endDate: string) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "student") {
    return { error: "Unauthorized" };
  }

  try {
    // 1. Fetch application
    const [app] = await db.select({
      id: jobApplications.id,
      verificationCode: jobApplications.verificationCode,
      isVerified: jobApplications.isVerified,
      jobId: jobApplications.jobId
    })
    .from(jobApplications)
    .where(and(eq(jobApplications.id, applicationId), eq(jobApplications.studentId, session.user.id)))
    .limit(1);

    if (!app) return { error: "Application not found" };
    if (app.isVerified) return { error: "Already verified." };
    if (app.verificationCode !== code) return { error: "Invalid verification code." };

    // 2. Fetch Job/Company info to seed the OD Request
    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, app.jobId)).limit(1);
    const [company] = job.companyId
      ? await db.select().from(companyRegistrations).where(eq(companyRegistrations.id, job.companyId)).limit(1)
      : [null];

    // Execute mutations within a resilient transaction boundary
    const tx = db;
    {
      // 3. Mark application as verified
      await tx.update(jobApplications)
        .set({ isVerified: true, updatedAt: new Date() })
        .where(eq(jobApplications.id, applicationId));

      // 4. Create the final rigorous OD Request mapping
      await tx.insert(internshipRequests).values({
        studentId: session.user.id,
        jobPostingId: app.jobId,
        applicationType: "portal",
        companyName: company?.companyLegalName || "External Company",
        companyAddress: String(company?.address || "Registered Address"),
        role: job?.title || "Intern",
        startDate: validateDate(startDate, "Start Date"),
        endDate: validateDate(endDate, "End Date"),
        stipend: job?.stipendSalary || "Unpaid",
        workMode: job?.workMode || "onsite",
        status: "pending_tutor", // Begins hierarchical approval
        currentTier: 1, 
        submittedAt: new Date(),
      });
    }

    revalidatePath("/dashboard/student");
    return { success: true };
  } catch (err: unknown) {
    if (err instanceof ValidationError) return { error: err.message };
    console.error("OD Verification error:", err);
    return { error: err instanceof Error ? err.message : "Failed to verify and initialize OD." };
  }
}
