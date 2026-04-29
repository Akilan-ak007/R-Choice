"use server";

import { db } from "@/lib/db";
import { companyInvitations, companyRegistrations } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function submitCompanyRegistration(token: string, formData: FormData) {
  try {
    // 1. Validate Token
    const [invitation] = await db.select().from(companyInvitations).where(eq(companyInvitations.token, token)).limit(1);
    if (!invitation) return { error: "Invalid invitation token." };
    if (invitation.isUsed) return { error: "This invitation has already been used." };
    if (new Date(invitation.expiresAt) < new Date()) return { error: "This invitation has expired." };

    // 2. Parse Form Data
    const rawData = Object.fromEntries(formData.entries());
    
    // Core Company
    const companyLegalName = String(rawData.companyLegalName || "");
    const website = String(rawData.website || "");
    const hrEmail = String(rawData.officeMail || ""); // Using as official mail
    const address = String(rawData.address || "");
    const city = String(rawData.city || "");
    const state = String(rawData.state || "");
    const pinCode = String(rawData.pinCode || "");
    const hrPhone = String(rawData.contactNo || "");
    const industrySector = String(rawData.industry || "");
    const companySize = String(rawData.companySize || "");
    const companyType = String(rawData.companyType || "");
    const companyDescription = String(rawData.companyDescription || "");
    const yearEstablished = parseInt(String(rawData.yearEstablished || "0"), 10);
    const gstNumber = String(rawData.gstin || "");
    const panNumber = String(rawData.panCard || "");
    const coiUrl = String(rawData.coiUrl || "");

    // Founder Info
    const founderDetails = {
      name: String(rawData.founderName || ""),
      designation: String(rawData.founderDesignation || ""),
      officeMail: String(rawData.founderMail || ""),
      phone: String(rawData.founderPhone || ""),
      linkedin: String(rawData.founderLinkedin || ""),
      portfolio: String(rawData.founderPortfolio || ""),
      idProofUrl: String(rawData.founderIdProof || ""),
    };

    // Preferences
    const internshipPreferences = {
      type: String(rawData.prefInternshipType || ""),
      domains: String(rawData.prefDomains || ""),
      duration: String(rawData.prefDuration || ""),
      isPaid: rawData.prefIsPaid === "true",
      stipendRange: String(rawData.prefStipendRange || ""),
      hiringIntention: String(rawData.prefHiringIntention || ""),
    };

    const authenticityConfirmed = rawData.authenticityConfirmed === "true";

    // Insert Registration
    await db.insert(companyRegistrations).values({
        companyLegalName,
        website,
        hrEmail,
        address,
        hrPhone,
        hrName: founderDetails.name || "Default HR", // Fallback for schema requirement
        city,
        state,
        pinCode,
        industrySector,
        companySize,
        companyType,
        companyDescription,
        yearEstablished,
        gstNumber,
        panNumber,
        coiUrl,
        founderDetails,
        internshipPreferences,
        authenticityConfirmed,
        status: "pending",
      });

      // Mark token as used
      await db.update(companyInvitations)
        .set({ isUsed: true })
        .where(eq(companyInvitations.id, invitation.id));

    return { success: true };
  } catch (error: unknown) {
    console.error("Submit registration error:", error);
    return { error: "Failed to submit registration. Please contact administration." };
  }
}
