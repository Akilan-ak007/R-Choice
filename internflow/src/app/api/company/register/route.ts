import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, or } from "drizzle-orm";

import { db } from "@/lib/db";
import {
  auditLogs,
  companyRegistrationLinks,
  companyRegistrations,
  notifications,
  users,
} from "@/lib/db/schema";
import { enforceRateLimit } from "@/lib/rate-limit";
import { captureServerError } from "@/lib/observability";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, ...companyData } = body;

    if (!token) {
      return NextResponse.json({ error: "Missing registration token" }, { status: 400 });
    }

    const rateLimit = await enforceRateLimit({
      namespace: "company-register",
      identifier: `${req.headers.get("x-forwarded-for") || "anonymous"}:${token}`,
      limit: 15,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many registration attempts. Please try again later." }, { status: 429 });
    }

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

    if (!link) {
      return NextResponse.json({ error: "Invalid or expired registration link" }, { status: 400 });
    }

    const requiredFields = [
      "companyLegalName",
      "companyType",
      "industrySector",
      "website",
      "hrEmail",
      "hrName",
      "hrPhone",
      "address",
      "city",
      "state",
      "pinCode",
      "ceoName",
      "ceoDesignation",
      "ceoEmail",
    ];

    for (const field of requiredFields) {
      if (!companyData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    let registrationId = "";
    let wasUpdated = false;

    await db.transaction(async (tx) => {
      const [existingRegistration] = await tx
        .select({
          id: companyRegistrations.id,
          status: companyRegistrations.status,
          userId: companyRegistrations.userId,
        })
        .from(companyRegistrations)
        .where(
          or(
            and(
              eq(companyRegistrations.companyLegalName, companyData.companyLegalName),
              eq(companyRegistrations.hrEmail, companyData.hrEmail)
            ),
            eq(companyRegistrations.ceoEmail, companyData.ceoEmail)
          )
        )
        .limit(1);

      const registrationPayload = {
        companyLegalName: companyData.companyLegalName,
        brandName: companyData.brandName || null,
        companyDescription: companyData.companyDescription || null,
        companyType: companyData.companyType,
        industrySector: companyData.industrySector,
        yearEstablished: companyData.yearEstablished ? parseInt(companyData.yearEstablished, 10) : null,
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
        domains:
          typeof companyData.domains === "string" && companyData.domains.trim()
            ? companyData.domains.split(",").map((domain: string) => domain.trim()).filter(Boolean)
            : null,
        duration: companyData.duration || null,
        stipendRange: companyData.stipendRange || null,
        hiringIntention: companyData.hiringIntention || null,
        generalTcAccepted: !!companyData.generalTcAccepted,
        generalTcAcceptedAt: companyData.generalTcAccepted ? new Date() : null,
        status: "registration_submitted" as const,
        reviewedBy: null,
        reviewedByRole: null,
        reviewComment: null,
        reviewedAt: null,
      };

      if (existingRegistration && existingRegistration.status !== "approved") {
        wasUpdated = true;
        registrationId = existingRegistration.id;

        await tx
          .update(companyRegistrations)
          .set(registrationPayload)
          .where(eq(companyRegistrations.id, existingRegistration.id));
      } else {
        const [insertedCompany] = await tx
          .insert(companyRegistrations)
          .values(registrationPayload)
          .returning({ id: companyRegistrations.id });

        registrationId = insertedCompany.id;
      }

      await tx
        .update(companyRegistrationLinks)
        .set({
          usedByCompanyId: registrationId,
        })
        .where(eq(companyRegistrationLinks.id, link.id));

      await tx.insert(auditLogs).values({
        userId: link.generatedBy,
        action: wasUpdated ? "company_registration_resubmitted" : "company_registration_submitted",
        entityType: "company_registration",
        entityId: registrationId,
        details: {
          companyLegalName: companyData.companyLegalName,
          hrEmail: companyData.hrEmail,
          ceoEmail: companyData.ceoEmail,
          tokenId: link.id,
        },
      });

      const mcrUsers = await tx
        .select({ id: users.id })
        .from(users)
        .where(eq(users.role, "management_corporation"));

      if (mcrUsers.length > 0) {
        await tx.insert(notifications).values(
          mcrUsers.map((user) => ({
            userId: user.id,
            type: "company_registration_pending",
            title: wasUpdated ? "Company Registration Updated" : "New Company Registration",
            message: wasUpdated
              ? `${companyData.companyLegalName} has resubmitted its registration for review.`
              : `${companyData.companyLegalName} has submitted a registration application.`,
            linkUrl: "/companies/review",
          }))
        );
      }
    });

    return NextResponse.json({ success: true, registrationId, updated: wasUpdated });
  } catch (error) {
    captureServerError(error, {
      scope: "POST /api/company/register",
    });
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
