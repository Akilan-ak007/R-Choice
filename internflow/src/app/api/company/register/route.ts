import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companyRegistrationLinks, companyInvitations, companyRegistrations, notifications, users } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, ...companyData } = body;

    if (!token) {
      return NextResponse.json({ error: "Missing registration token" }, { status: 400 });
    }

    let isInvitation = false;
    let linkId = null;

    // 1. Check Admin generated links
    const [link] = await db
      .select()
      .from(companyRegistrationLinks)
      .where(
        and(
          eq(companyRegistrationLinks.token, token),
          eq(companyRegistrationLinks.isUsed, false),
          gt(companyRegistrationLinks.expiresAt, new Date())
        )
      )
      .limit(1);

    if (link) {
      linkId = link.id;
    } else {
      // 2. Check MCR invitations
      const [invitation] = await db
        .select()
        .from(companyInvitations)
        .where(
          and(
            eq(companyInvitations.token, token),
            eq(companyInvitations.isUsed, false),
            gt(companyInvitations.expiresAt, new Date())
          )
        )
        .limit(1);

      if (invitation) {
        linkId = invitation.id;
        isInvitation = true;
      }
    }

    if (!linkId) {
      return NextResponse.json({ error: "Invalid or expired registration link" }, { status: 400 });
    }

    // Required field validation
    const requiredFields = ["companyLegalName", "companyType", "industrySector", "website", "hrEmail", "hrName", "hrPhone", "address", "city", "state", "pinCode", "ceoName", "ceoDesignation", "ceoEmail"];
    for (const field of requiredFields) {
      if (!companyData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    // Insert company registration
    const [insertedCompany] = await db.insert(companyRegistrations).values({
      companyLegalName: companyData.companyLegalName,
      brandName: companyData.brandName || null,
      companyDescription: companyData.companyDescription || null,
      companyType: companyData.companyType,
      industrySector: companyData.industrySector,
      yearEstablished: companyData.yearEstablished ? parseInt(companyData.yearEstablished) : null,
      companySize: companyData.companySize || null,
      website: companyData.website,
      address: companyData.address,
      city: companyData.city,
      state: companyData.state,
      pinCode: companyData.pinCode,
      hrName: companyData.hrName,
      hrEmail: companyData.hrEmail,
      hrPhone: companyData.hrPhone,
      altPhone: companyData.altPhone || null,
      gstNumber: companyData.gstNumber || null,
      panNumber: companyData.panNumber || null,
      cinLlpin: companyData.cinLlpin || null,
      coi: companyData.coi || null,
      ceoName: companyData.ceoName || null,
      ceoDesignation: companyData.ceoDesignation || null,
      ceoEmail: companyData.ceoEmail || null,
      ceoPhone: companyData.ceoPhone || null,
      ceoLinkedin: companyData.ceoLinkedin || null,
      ceoPortfolio: companyData.ceoPortfolio || null,
      internshipType: companyData.internshipType || null,
      domains: companyData.domains ? companyData.domains.split(",").map((d: string) => d.trim()) : null,
      duration: companyData.duration || null,
      stipendRange: companyData.stipendRange || null,
      hiringIntention: companyData.hiringIntention || null,
      generalTcAccepted: companyData.generalTcAccepted || false,
      generalTcAcceptedAt: companyData.generalTcAccepted ? new Date() : null,
      status: "pending",
    }).returning();

    // Mark token as used
    if (isInvitation) {
      await db
        .update(companyInvitations)
        .set({ isUsed: true })
        .where(eq(companyInvitations.id, linkId));
    } else {
      await db
        .update(companyRegistrationLinks)
        .set({ isUsed: true, usedByCompanyId: insertedCompany.id })
        .where(eq(companyRegistrationLinks.id, linkId));
    }

    // 3. Notify MCR users that a new registration is pending
    const mcrUsers = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.role, "management_corporation"));

    if (mcrUsers.length > 0) {
      const notifs = mcrUsers.map((u) => ({
        userId: u.id,
        type: "company_registration_pending",
        title: "New Company Registration",
        message: `${companyData.companyLegalName} has submitted a registration application.`,
        linkUrl: "/companies/review",
      }));
      await db.insert(notifications).values(notifs);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Company registration error:", error);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
