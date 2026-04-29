"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, users, auditLogs, deviceTokens, companyRegistrations, notifications } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sanitize, sanitizeOptional, validateDate, ValidationError } from "@/lib/validation";
import { sendPushToMultiple } from "@/lib/firebase";

export async function createJobPosting(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  
  const allowedRoles = [
    "company", "company_staff", "tutor", "placement_coordinator", "hod", "dean", 
    "placement_officer", "principal", "coe", "placement_head", "management_corporation"
  ];
  const role = session.user.role;
  if (!allowedRoles.includes(role)) {
    return { error: "You do not have permission to post jobs." };
  }

  try {
    const title = sanitize(formData.get("title"), "Job Title", 255);
    const description = sanitize(formData.get("description"), "Job Description", 5000);
    const location = sanitize(formData.get("location"), "Location", 200);
    const stipendInfo = sanitize(formData.get("stipendInfo"), "Stipend Info", 200);
    const deadline = validateDate(formData.get("deadline"), "Application Deadline");

    // Optional text fields
    const responsibilities = sanitizeOptional(formData.get("responsibilities"), "Responsibilities", 5000);
    const learnings = sanitizeOptional(formData.get("learnings"), "Learnings", 3000);
    const domain = sanitizeOptional(formData.get("domain"), "Domain", 100);
    const workMode = sanitizeOptional(formData.get("workMode"), "Work Mode", 50) || "Hybrid";
    const duration = sanitizeOptional(formData.get("duration"), "Duration", 100) || "3 Months";
    const interviewMode = sanitizeOptional(formData.get("interviewMode"), "Interview Mode", 50);
    const selectionProcess = sanitizeOptional(formData.get("selectionProcess"), "Selection Process", 3000);
    const preferredQualifications = sanitizeOptional(formData.get("preferredQualifications"), "Preferred Qualifications", 3000);

    // Date fields
    const startDate = sanitizeOptional(formData.get("startDate"), "Start Date", 10);
    const expectedJoiningDate = sanitizeOptional(formData.get("expectedJoiningDate"), "Joining Date", 10);

    // Numeric
    const minCgpaStr = formData.get("minCgpa") as string;
    const minCgpa = minCgpaStr && minCgpaStr.trim() ? minCgpaStr.trim() : null;

    // Array fields (multiple values with same key)
    const mandatorySkills = formData.getAll("mandatorySkills").map(s => String(s).trim()).filter(Boolean);
    const preferredSkills = formData.getAll("preferredSkills").map(s => String(s).trim()).filter(Boolean);
    const toolsList = formData.getAll("tools").map(s => String(s).trim()).filter(Boolean);
    const perksList = formData.getAll("perks").map(s => String(s).trim()).filter(Boolean);
    const selectionSteps = formData.getAll("selectionSteps").map(s => String(s).trim()).filter(Boolean);

    // JSON fields
    let faq = null;
    try {
      const faqStr = formData.get("faq") as string;
      if (faqStr) {
        const parsed = JSON.parse(faqStr);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].question) faq = parsed;
      }
    } catch { /* ignore */ }

    let contactPersons = null;
    try {
      const cpStr = formData.get("contactPersons") as string;
      if (cpStr) {
        const parsed = JSON.parse(cpStr);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].name) contactPersons = parsed;
      }
    } catch { /* ignore */ }

    // Determine the company record
    let companyIdToInsert = null;
    if (role === "company") {
      const [compReg] = await db
        .select({ id: companyRegistrations.id })
        .from(companyRegistrations)
        .where(eq(companyRegistrations.userId, session.user.id))
        .limit(1);
      if (compReg) companyIdToInsert = compReg.id;
    } else {
      const [company] = await db
        .select({ id: companyRegistrations.id })
        .from(companyRegistrations)
        .where(eq(companyRegistrations.userId, session.user.id))
        .limit(1);
      if (company) companyIdToInsert = company.id;
    }

    await db.insert(jobPostings).values({
      postedBy: session.user.id,
      postedByRole: role as typeof jobPostings.$inferInsert.postedByRole,
      companyId: companyIdToInsert,
      title,
      jobType: formData.get("jobType") as string || "internship",
      domain: domain || null,
      isPpoAvailable: formData.get("isPpoAvailable") === "true",
      isCampusHiring: formData.get("isCampusHiring") === "true",
      description,
      responsibilities: responsibilities || null,
      learnings: learnings || null,
      location,
      workMode,
      duration,
      stipendSalary: stipendInfo,
      openingsCount: isNaN(parseInt(formData.get("openingsCount") as string, 10)) ? 1 : parseInt(formData.get("openingsCount") as string, 10),
      applicationDeadline: deadline,
      startDate: startDate || null,
      expectedJoiningDate: expectedJoiningDate || null,
      interviewMode: interviewMode || null,
      minCgpa: minCgpa,
      preferredQualifications: preferredQualifications || null,
      selectionProcess: selectionProcess || null,
      mandatorySkills: mandatorySkills.length > 0 ? mandatorySkills : null,
      preferredSkills: preferredSkills.length > 0 ? preferredSkills : null,
      tools: toolsList.length > 0 ? toolsList : null,
      perks: perksList.length > 0 ? perksList : null,
      selectionProcessSteps: selectionSteps.length > 0 ? selectionSteps : null,
      faq: faq,
      contactPersons: contactPersons,
      requiredSkills: mandatorySkills.length > 0 ? mandatorySkills : [],
      status: (role === "management_corporation") ? "approved" 
            : "pending_mcr_approval",
    });

    revalidatePath("/jobs");
    revalidatePath("/jobs/manage");
    revalidatePath("/approvals/jobs");

    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return { error: error.message };
    }
    console.error("Job creation error:", error);
    return { error: "Failed to post job." };
  }
}


import { sendMobilePush } from "@/lib/notifications";

export async function updateJobStatus(jobId: string, action: "approve" | "reject") {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  
  const role = session.user.role;
  if (!["placement_officer", "coe", "principal", "management_corporation", "placement_head"].includes(role)) {
    return { error: "Only admins and MCR can approve company jobs." };
  }
  try {
    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);
    if (!job) return { error: "Job not found" };

    let newStatus = job.status;
    let shouldNotify = false;
    
    if (role === "management_corporation" && job.status === "pending_mcr_approval") {
       // MCR approving Company job -> goes to approved directly and notifies others
       if (action === "approve") {
          newStatus = "approved";
          shouldNotify = true;
       } else {
          newStatus = "rejected";
       }
    } else if (role === "placement_officer" && job.status === "pending_review") {
       if (action === "approve") {
          newStatus = "approved";
       } else {
          newStatus = "rejected";
       }
    } else {
       return { error: "You do not have permission to approve this job at its current stage." };
    }
    
    await db.transaction(async (tx) => {
      await tx.update(jobPostings)
        .set({ 
          status: newStatus as any,
          verifiedBy: session.user.id,
          verifiedByRole: role,
          verifiedAt: new Date()
        })
        .where(eq(jobPostings.id, jobId));

      if (newStatus === "approved") {
        const [job] = await tx.select().from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);
        
        // 1. Notify Admins
        const notifyRoles = ["placement_officer"] as const;
        const targetAdmins = await tx.select().from(users).where(inArray(users.role, notifyRoles));
        
        if (targetAdmins.length > 0) {
          await tx.insert(notifications).values(
            targetAdmins.map(admin => ({
              userId: admin.id,
              type: "system",
              title: "New Job Approved",
              message: `Job ${job?.title} is now active.`,
              linkUrl: `/jobs`,
            }))
          );
        }

        // 2. Notify ALL Active Students via Push
        const students = await tx.select({ id: users.id }).from(users).where(eq(users.role, "student"));
        if (students.length > 0) {
           await sendMobilePush(
             "New Internship Available!",
             `${job?.title} is now accepting applications. Check your dashboard!`,
             students.map(s => s.id)
           );
        }
      }

      await tx.insert(auditLogs).values({
        userId: session.user.id,
        action: `review_job_${action}`,
        entityType: "job_posting",
        entityId: jobId,
        details: { newStatus },
      });
    });

    if (shouldNotify) {
      // Find devices for authorities (po)
      const authorityTokens = await db
        .select({ token: deviceTokens.token })
        .from(deviceTokens)
        .innerJoin(users, eq(deviceTokens.userId, users.id))
        .where(
          inArray(users.role, ["placement_officer"])
        );
      
      const authorityTokenList = authorityTokens.map(t => t.token);
      if (authorityTokenList.length > 0) {
        await sendPushToMultiple(
          authorityTokenList,
          "New Internship Approved",
          `A new internship '${job.title}' has been approved by MCR.`,
          { type: "job_approved", jobId }
        );
      }

      // Notify all active students
      const studentTokens = await db
        .select({ token: deviceTokens.token })
        .from(deviceTokens)
        .innerJoin(users, eq(deviceTokens.userId, users.id))
        .where(eq(users.role, "student"));
      
      const studentTokenList = studentTokens.map(t => t.token);
      if (studentTokenList.length > 0) {
        await sendPushToMultiple(
          studentTokenList,
          "New Internship Opportunity",
          `Check out the newly added internship: ${job.title}`,
          { type: "new_job", jobId }
        );
      }
    }

    revalidatePath("/approvals/jobs");
    revalidatePath("/jobs");
    return { success: true };
  } catch (error) {
    console.error("Failed to update job status:", error);
    return { error: "Database error occurred" };
  }
}

export async function fetchActiveJobs() {
  try {
    // Alias for the verifier user (separate from the poster)
    const jobs = await db
      .select({
        id: jobPostings.id,
        title: jobPostings.title,
        description: jobPostings.description,
        location: jobPostings.location,
        stipendInfo: jobPostings.stipendSalary,
        deadline: jobPostings.applicationDeadline,
        companyName: users.firstName,
        companyId: jobPostings.postedBy,
        workMode: jobPostings.workMode,
        duration: jobPostings.duration,
        openingsCount: jobPostings.openingsCount,
        verifiedBy: jobPostings.verifiedBy,
        verifiedByRole: jobPostings.verifiedByRole,
        verifiedAt: jobPostings.verifiedAt,
        jobType: jobPostings.jobType,
        isPpoAvailable: jobPostings.isPpoAvailable,
      })
      .from(jobPostings)
      .innerJoin(users, eq(jobPostings.postedBy, users.id))
      .where(eq(jobPostings.status, "approved"))
      .orderBy(desc(jobPostings.createdAt));

    // Fetch verifier names for the badge
    const verifierIds = [...new Set(jobs.map(j => j.verifiedBy).filter(Boolean))] as string[];
    const verifierMap: Record<string, string> = {};
    if (verifierIds.length > 0) {
      const verifiers = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(inArray(users.id, verifierIds));
      verifiers.forEach(v => { verifierMap[v.id] = `${v.firstName} ${v.lastName}`; });
    }

    return jobs.map(j => ({
      ...j,
      verifierName: j.verifiedBy ? verifierMap[j.verifiedBy] || "Staff" : null,
    }));
  } catch (err) {
    console.error("Failed to fetch jobs:", err);
    return [];
  }
}

export async function fetchCompanyJobs(userId: string, role: string, companyId?: string | null) {
  try {
    if (role === "company_staff") {
      return await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.postedBy, userId))
        .orderBy(desc(jobPostings.createdAt));
    } else if (role === "company" && companyId) {
      return await db
        .select()
        .from(jobPostings)
        .where(eq(jobPostings.companyId, companyId))
        .orderBy(desc(jobPostings.createdAt));
    } else {
      return [];
    }
  } catch (err) {
    console.error("Failed to fetch company jobs:", err);
    return [];
  }
}

export async function deleteJobPosting(jobId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  try {
    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);
    if (!job) return { error: "Job not found" };

    const role = session.user.role;
    const isOwner = job.postedBy === session.user.id;
    const [ceo] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);

    // CEO can delete any job of their company, staff can only delete their own
    if (role === "company_staff" && !isOwner) {
      return { error: "You can only delete your own jobs" };
    }
    if (role === "company" && job.companyId !== ceo?.companyId) {
       return { error: "You can only delete jobs belonging to your company" };
    }
    
    if (job.status !== "draft" && job.status !== "rejected" && job.status !== "pending_mcr_approval" && job.status !== "pending_review") {
      return { error: "Only draft, rejected, or pending jobs can be deleted" };
    }

    await db.delete(jobPostings).where(eq(jobPostings.id, jobId));
    revalidatePath("/jobs/manage");
    return { success: true };
  } catch (error) {
    console.error("Failed to delete job:", error);
    return { error: "Failed to delete job" };
  }
}

export async function updateJobPosting(jobId: string, formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const role = session.user.role;
  
  try {
    const [job] = await db.select().from(jobPostings).where(eq(jobPostings.id, jobId)).limit(1);
    if (!job) return { error: "Job not found." };

    // Only the posting company or admin roles can edit
    const isOwner = job.postedBy === session.user.id;
    const isAdmin = ["placement_officer", "principal"].includes(role);

    if (!isOwner && !isAdmin) {
      return { error: "You do not have permission to edit this job." };
    }

    const title = sanitizeOptional(formData.get("title"), "Title", 255);
    const description = sanitizeOptional(formData.get("description"), "Description", 5000);
    const location = sanitizeOptional(formData.get("location"), "Location", 200);
    const stipendSalary = sanitizeOptional(formData.get("stipendSalary"), "Stipend", 200);
    const deadline = sanitizeOptional(formData.get("deadline"), "Deadline", 10);
    const openingsCount = formData.get("openingsCount") as string;

    const updatePayload: Partial<typeof jobPostings.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (title) updatePayload.title = title;
    if (description) updatePayload.description = description;
    if (location) updatePayload.location = location;
    if (stipendSalary) updatePayload.stipendSalary = stipendSalary;
    if (deadline) updatePayload.applicationDeadline = deadline;
    if (openingsCount?.trim()) updatePayload.openingsCount = parseInt(openingsCount, 10);

    await db.update(jobPostings).set(updatePayload).where(eq(jobPostings.id, jobId));

    revalidatePath("/jobs");
    revalidatePath("/jobs/manage");
    revalidatePath(`/approvals/jobs`);
    return { success: true };
  } catch (error: unknown) {
    console.error("Job update error:", error);
    return { error: `Failed to update job: ${error instanceof Error ? error.message : String(error)}` };
  }
}
