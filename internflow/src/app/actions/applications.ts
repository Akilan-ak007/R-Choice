"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { internshipRequests, externalInternshipDetails } from "@/lib/db/schema";
import { getApproversForStudent } from "@/lib/db/queries/authority";
import { revalidatePath } from "next/cache";
import {
  sanitize,
  sanitizeOptional,
  validateEmail,
  validateUrl,
  validateUrlOptional,
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
      currentTier: 1,
      submittedAt: new Date(),
    }).returning({ id: internshipRequests.id });

    const reqId = insertedReq[0].id;

    // 4. Insert External Details if applicable
    if (applicationType === "external") {
      await db.insert(externalInternshipDetails).values({
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

export async function createPortalApplication(jobId: string, companyName: string, roleTitle: string) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const userId = session.user.id;
  const role = session.user.role;

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
  } catch (error: unknown) {
    console.error("Portal apply error:", error);
    const msg = error instanceof Error ? error.message : "Failed to submit portal application.";
    return { error: msg };
  }
}
