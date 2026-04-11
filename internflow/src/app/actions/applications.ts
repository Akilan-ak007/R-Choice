"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { internshipRequests, externalInternshipDetails } from "@/lib/db/schema";
import { getApproversForStudent } from "@/lib/db/queries/authority";
import { revalidatePath } from "next/cache";

export async function submitInternshipRequest(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const userId = session.user.id;
  const role = (session.user as any).role;

  if (role !== "student") {
    return { error: "Only students can submit internship applications." };
  }

  try {
    // 1. Get the authority mapping for the student
    // This will throw if the student has no profile or no mapping exists
    const approvers = await getApproversForStudent(userId);

    // Ensure they have a tutor assigned (Tier 1)
    if (!approvers.tutorId) {
      return { error: "No class tutor mapped to your department/section. Cannot submit request." };
    }

    // 2. Extract form data
    const applicationType = (formData.get("applicationType") as "portal" | "external") || "external";
    const companyName = formData.get("companyName") as string;
    const companyAddress = formData.get("companyAddress") as string;
    const roleTitle = formData.get("role") as string;
    const startDate = formData.get("startDate") as string;
    const endDate = formData.get("endDate") as string;
    const stipend = formData.get("stipend") as string;
    const workMode = formData.get("workMode") as string;
    
    // External specifics
    const companyWebsite = formData.get("companyWebsite") as string;
    const hrName = formData.get("hrName") as string;
    const hrEmail = formData.get("hrEmail") as string;
    const hrPhone = formData.get("hrPhone") as string;
    const offerLetterUrl = formData.get("offerLetterUrl") as string;
    const companyIdProofUrl = formData.get("companyIdProofUrl") as string;
    const parentConsentUrl = formData.get("parentConsentUrl") as string;
    const discoverySource = formData.get("discoverySource") as string;

    if (!companyName || !roleTitle || !startDate || !endDate || (!hrName && applicationType === "external")) {
      return { error: "Missing required fields." };
    }

    // 3. Create the internship request
    const insertedReq = await db.insert(internshipRequests).values({
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
      currentTier: 1, // 1=Tutor, 2=PC, 3=HOD, 4=Dean
      submittedAt: new Date(),
    }).returning({ id: internshipRequests.id });

    const reqId = insertedReq[0].id;

    // 4. Insert External Details if applicable
    if (applicationType === "external") {
      await db.insert(externalInternshipDetails).values({
        requestId: reqId,
        companyWebsite: companyWebsite || "Not provided",
        hrName,
        hrEmail,
        hrPhone,
        companyIdProofUrl: companyIdProofUrl || "Not provided",
        parentConsentUrl: parentConsentUrl || "Not provided",
        workMode,
        discoverySource: discoverySource || "Other",
      });
    }

    revalidatePath("/applications");
    revalidatePath("/dashboard/student");
    
    return { success: true };
  } catch (error: any) {
    console.error("Application submission error:", error);
    return { error: error.message || "Failed to submit application." };
  }
}

export async function createPortalApplication(jobId: string, companyName: string, roleTitle: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const userId = session.user.id;
  const role = (session.user as any).role;

  if (role !== "student") return { error: "Only students can apply." };

  try {
    const approvers = await getApproversForStudent(userId);
    if (!approvers.tutorId) {
      return { error: "No class tutor mapped to your department/section. Cannot apply." };
    }

    // Portal requests start immediately at pending_tutor tier 1
    await db.insert(internshipRequests).values({
      studentId: userId,
      applicationType: "portal",
      companyName,
      companyAddress: "Virtual / See Posting",
      role: roleTitle,
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split("T")[0],
      stipend: "See Posting",
      workMode: "Portal",
      status: "pending_tutor", 
      currentTier: 1, 
      submittedAt: new Date(),
    });

    revalidatePath("/applications");
    revalidatePath("/jobs");
    
    return { success: true };
  } catch (error: any) {
    console.error("Portal apply error:", error);
    return { error: error.message || "Failed to submit portal application." };
  }
}
