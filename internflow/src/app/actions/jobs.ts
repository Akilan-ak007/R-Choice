"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, users, auditLogs, companyRegistrations } from "@/lib/db/schema";
import { eq, desc, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { sanitize, sanitizeOptional, validateDate, ValidationError } from "@/lib/validation";

export async function createJobPosting(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  
  const role = session.user.role;
  if (role !== "company") {
    return { error: "Only companies can post jobs." };
  }

  try {
    const title = sanitize(formData.get("title"), "Job Title", 255);
    const description = sanitize(formData.get("description"), "Job Description", 5000);
    const requirements = sanitizeOptional(formData.get("requirements"), "Requirements", 3000);
    const location = sanitize(formData.get("location"), "Location", 200);
    const stipendInfo = sanitizeOptional(formData.get("stipendInfo"), "Stipend Info", 100);
    const deadline = validateDate(formData.get("deadline"), "Application Deadline");

    // Determine the company record
    const [company] = await db
      .select({ id: companyRegistrations.id })
      .from(companyRegistrations)
      .where(eq(companyRegistrations.userId, session.user.id))
      .limit(1);

    const workMode = sanitizeOptional(formData.get("workMode"), "Work Mode", 50) || "Hybrid";
    const duration = sanitizeOptional(formData.get("duration"), "Duration", 100) || "3 Months";
    
    await db.insert(jobPostings).values({
      postedBy: session.user.id,
      postedByRole: "company",
      companyId: company?.id || null,
      title,
      jobType: "Internship",
      description,
      location,
      workMode,
      duration,
      stipendSalary: stipendInfo || "Unpaid",
      openingsCount: isNaN(parseInt(formData.get("openingsCount") as string, 10)) ? 1 : parseInt(formData.get("openingsCount") as string, 10),
      applicationDeadline: deadline,
      requiredSkills: requirements ? requirements.split(",").map(s => s.trim()).filter(Boolean) : [],
      status: "pending_review", // Jobs now go through staff review before being visible
    });

    revalidatePath("/jobs");
    revalidatePath("/jobs/manage");
    
    return { success: true };
  } catch (error: unknown) {
    if (error instanceof ValidationError) {
      return { error: error.message };
    }
    console.error("Job creation error:", error);
    return { error: "Failed to post job." };
  }
}

export async function updateJobStatus(jobId: string, action: "approve" | "reject") {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  
  const role = session.user.role;
  if (role !== "placement_officer") {
    return { error: "Only placement officers can approve company jobs." };
  }

  try {
    const newStatus = action === "approve" ? "approved" : "rejected";
    
    await db.update(jobPostings)
      .set({ 
        status: newStatus,
        verifiedBy: session.user.id,
        verifiedByRole: role,
        verifiedAt: new Date()
      })
      .where(eq(jobPostings.id, jobId));

    await db.insert(auditLogs).values({
      userId: session.user.id,
      action: `review_job_${action}`,
      entityType: "job_posting",
      entityId: jobId,
      details: { newStatus },
    });

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

export async function fetchCompanyJobs(companyId: string) {
  try {
    const jobs = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.postedBy, companyId))
      .orderBy(desc(jobPostings.createdAt));
      
    return jobs;
  } catch (err) {
    console.error("Failed to fetch company jobs:", err);
    return [];
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
    const isAdmin = ["dean", "placement_officer", "principal"].includes(role);

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
