"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobApplications, jobPostings } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getCompanyContextForUser } from "@/lib/company-context";
import { revalidatePath } from "next/cache";

const VALID_KANBAN_STATUSES = ["applied", "shortlisted", "round_scheduled", "selected", "rejected"] as const;
type KanbanStatus = (typeof VALID_KANBAN_STATUSES)[number];

export async function updateApplicantStatusFromKanban(
  applicationId: string,
  newStatus: string
) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Unauthorized" };
  }

  if (!VALID_KANBAN_STATUSES.includes(newStatus as KanbanStatus)) {
    return { error: "Invalid status" };
  }

  try {
    const [app] = await db
      .select({
        id: jobApplications.id,
        jobId: jobApplications.jobId,
        status: jobApplications.status,
      })
      .from(jobApplications)
      .where(eq(jobApplications.id, applicationId))
      .limit(1);

    if (!app) return { error: "Application not found" };

    // Verify the user has permission (company owner or admin)
    const [job] = await db
      .select({ companyId: jobPostings.companyId })
      .from(jobPostings)
      .where(eq(jobPostings.id, app.jobId))
      .limit(1);

    const companyContext = await getCompanyContextForUser(session.user.id);
    const isAdmin = ["placement_officer", "placement_head", "management_corporation", "mcr"].includes(session.user.role);
    
    if (!isAdmin && (!job || !companyContext || job.companyId !== companyContext.companyId)) {
      return { error: "You can only manage applicants for your own job postings." };
    }

    await db
      .update(jobApplications)
      .set({ status: newStatus, updatedAt: new Date() })
      .where(eq(jobApplications.id, applicationId));

    revalidatePath("/applicants");
    revalidatePath(`/jobs/manage/${app.jobId}/board`);

    return { success: true };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : "Failed to update status" };
  }
}
