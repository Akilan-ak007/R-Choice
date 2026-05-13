import { NextRequest, NextResponse } from "next/server";
import { and, eq, gt, or } from "drizzle-orm";
import bcrypt from "bcryptjs";

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

function asTrimmedString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function asOptionalString(value: unknown) {
  const normalized = asTrimmedString(value);
  return normalized || null;
}

function asOptionalInt(value: string | null) {
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

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

    const normalizedCompanyData = {
      companyLegalName: asTrimmedString(companyData.companyLegalName),
      brandName: asOptionalString(companyData.brandName),
      companyDescription: asOptionalString(companyData.companyDescription),
      companyType: asTrimmedString(companyData.companyType),
      industrySector: asTrimmedString(companyData.industrySector),
      yearEstablished: asTrimmedString(companyData.yearEstablished),
      companySize: asOptionalString(companyData.companySize),
      website: asTrimmedString(companyData.website),
      address: asTrimmedString(companyData.address),
      city: asTrimmedString(companyData.city),
      state: asTrimmedString(companyData.state),
      pinCode: asTrimmedString(companyData.pinCode),
      hrName: asTrimmedString(companyData.hrName),
      hrEmail: asTrimmedString(companyData.hrEmail),
      hrPhone: asTrimmedString(companyData.hrPhone),
      altPhone: asOptionalString(companyData.altPhone),
      gstNumber: asOptionalString(companyData.gstNumber),
      panNumber: asOptionalString(companyData.panNumber),
      cinLlpin: asOptionalString(companyData.cinLlpin),
      coi: asOptionalString(companyData.coi),
      ceoName: asTrimmedString(companyData.ceoName),
      ceoDesignation: asTrimmedString(companyData.ceoDesignation),
      ceoEmail: asTrimmedString(companyData.ceoEmail),
      ceoPhone: asOptionalString(companyData.ceoPhone),
      ceoLinkedin: asOptionalString(companyData.ceoLinkedin),
      ceoPortfolio: asOptionalString(companyData.ceoPortfolio),
      internshipType: asOptionalString(companyData.internshipType),
      domains: asTrimmedString(companyData.domains),
      duration: asOptionalString(companyData.duration),
      stipendRange: asOptionalString(companyData.stipendRange),
      hiringIntention: asOptionalString(companyData.hiringIntention),
      accountPassword: asTrimmedString(companyData.accountPassword),
      confirmPassword: asTrimmedString(companyData.confirmPassword),
      generalTcAccepted:
        companyData.generalTcAccepted === true || companyData.generalTcAccepted === "true",
    };

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
    ] as const;

    for (const field of requiredFields) {
      if (!normalizedCompanyData[field]) {
        return NextResponse.json({ error: `Missing required field: ${field}` }, { status: 400 });
      }
    }

    if (!normalizedCompanyData.generalTcAccepted) {
      return NextResponse.json({ error: "You must accept the general terms and conditions." }, { status: 400 });
    }

    if (normalizedCompanyData.accountPassword.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters long." }, { status: 400 });
    }

    if (normalizedCompanyData.accountPassword !== normalizedCompanyData.confirmPassword) {
      return NextResponse.json({ error: "Password and confirm password do not match." }, { status: 400 });
    }

    let registrationId = "";
    let wasUpdated = false;

    await (async (tx) => {
      const matchingConditions = [
        and(
          eq(companyRegistrations.companyLegalName, normalizedCompanyData.companyLegalName),
          eq(companyRegistrations.hrEmail, normalizedCompanyData.hrEmail)
        ),
      ];

      if (normalizedCompanyData.ceoEmail) {
        matchingConditions.push(eq(companyRegistrations.ceoEmail, normalizedCompanyData.ceoEmail));
      }

      const [existingRegistration] = await tx
        .select({
          id: companyRegistrations.id,
          status: companyRegistrations.status,
          userId: companyRegistrations.userId,
        })
        .from(companyRegistrations)
        .where(matchingConditions.length === 1 ? matchingConditions[0] : or(...matchingConditions))
        .limit(1);

      const registrationPayload = {
        companyLegalName: normalizedCompanyData.companyLegalName,
        brandName: normalizedCompanyData.brandName,
        companyDescription: normalizedCompanyData.companyDescription,
        companyType: normalizedCompanyData.companyType,
        industrySector: normalizedCompanyData.industrySector,
        yearEstablished: asOptionalInt(normalizedCompanyData.yearEstablished),
        companySize: normalizedCompanyData.companySize,
        website: normalizedCompanyData.website,
        address: normalizedCompanyData.address,
        city: normalizedCompanyData.city,
        state: normalizedCompanyData.state,
        pinCode: normalizedCompanyData.pinCode,
        hrName: normalizedCompanyData.hrName,
        hrEmail: normalizedCompanyData.hrEmail,
        hrPhone: normalizedCompanyData.hrPhone,
        altPhone: normalizedCompanyData.altPhone,
        gstNumber: normalizedCompanyData.gstNumber,
        panNumber: normalizedCompanyData.panNumber,
        cinLlpin: normalizedCompanyData.cinLlpin,
        coi: normalizedCompanyData.coi,
        ceoName: normalizedCompanyData.ceoName,
        ceoDesignation: normalizedCompanyData.ceoDesignation,
        ceoEmail: normalizedCompanyData.ceoEmail,
        ceoPhone: normalizedCompanyData.ceoPhone,
        ceoLinkedin: normalizedCompanyData.ceoLinkedin,
        ceoPortfolio: normalizedCompanyData.ceoPortfolio,
        internshipType: normalizedCompanyData.internshipType,
        domains:
          normalizedCompanyData.domains
            ? normalizedCompanyData.domains.split(",").map((domain: string) => domain.trim()).filter(Boolean)
            : null,
        duration: normalizedCompanyData.duration,
        stipendRange: normalizedCompanyData.stipendRange,
        hiringIntention: normalizedCompanyData.hiringIntention,
        generalTcAccepted: normalizedCompanyData.generalTcAccepted,
        generalTcAcceptedAt: normalizedCompanyData.generalTcAccepted ? new Date() : null,
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

      const passwordHash = await bcrypt.hash(normalizedCompanyData.accountPassword, 10);
      const loginEmail = normalizedCompanyData.ceoEmail || normalizedCompanyData.hrEmail;

      if (existingRegistration?.userId) {
        const [conflictingUser] = await tx
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(eq(users.email, loginEmail))
          .limit(1);

        if (conflictingUser && conflictingUser.id !== existingRegistration.userId) {
          throw new Error("The selected company contact email is already used by another account.");
        }

        await tx
          .update(users)
          .set({
            email: loginEmail,
            passwordHash,
            role: "company",
            firstName: normalizedCompanyData.ceoName || normalizedCompanyData.hrName || "Company",
            lastName: normalizedCompanyData.companyLegalName,
            phone: normalizedCompanyData.ceoPhone || normalizedCompanyData.hrPhone || null,
            companyId: registrationId,
            isActive: false,
            updatedAt: new Date(),
          })
          .where(eq(users.id, existingRegistration.userId));
      } else {
        const [existingLoginUser] = await tx
          .select({ id: users.id, role: users.role })
          .from(users)
          .where(eq(users.email, loginEmail))
          .limit(1);

        if (existingLoginUser && !["company"].includes(existingLoginUser.role)) {
          throw new Error("The selected company contact email is already used by another account.");
        }

        if (existingLoginUser) {
          await tx
            .update(users)
            .set({
              passwordHash,
              role: "company",
              firstName: normalizedCompanyData.ceoName || normalizedCompanyData.hrName || "Company",
              lastName: normalizedCompanyData.companyLegalName,
              phone: normalizedCompanyData.ceoPhone || normalizedCompanyData.hrPhone || null,
              companyId: registrationId,
              isActive: false,
              updatedAt: new Date(),
            })
            .where(eq(users.id, existingLoginUser.id));

          await tx
            .update(companyRegistrations)
            .set({ userId: existingLoginUser.id })
            .where(eq(companyRegistrations.id, registrationId));
        } else {
          const [createdUser] = await tx
            .insert(users)
            .values({
              email: loginEmail,
              passwordHash,
              role: "company",
              firstName: normalizedCompanyData.ceoName || normalizedCompanyData.hrName || "Company",
              lastName: normalizedCompanyData.companyLegalName,
              phone: normalizedCompanyData.ceoPhone || normalizedCompanyData.hrPhone || null,
              isActive: false,
              companyId: registrationId,
            })
            .returning({ id: users.id });

          await tx
            .update(companyRegistrations)
            .set({ userId: createdUser.id })
            .where(eq(companyRegistrations.id, registrationId));
        }
      }

      await tx.insert(auditLogs).values({
        userId: link.generatedBy,
        action: wasUpdated ? "company_registration_resubmitted" : "company_registration_submitted",
        entityType: "company_registration",
        entityId: registrationId,
        details: {
          companyLegalName: normalizedCompanyData.companyLegalName,
          hrEmail: normalizedCompanyData.hrEmail,
          ceoEmail: normalizedCompanyData.ceoEmail,
          tokenId: link.id,
        },
      });

      const mcrUsers = await tx
        .select({ id: users.id })
        .from(users)
        .where(or(eq(users.role, "management_corporation"), eq(users.role, "mcr")));

      if (mcrUsers.length > 0) {
        await tx.insert(notifications).values(
          mcrUsers.map((user) => ({
            userId: user.id,
            type: "company_registration_pending",
            title: wasUpdated ? "Company Registration Updated" : "New Company Registration",
            message: wasUpdated
              ? `${normalizedCompanyData.companyLegalName} has resubmitted its registration for review.`
              : `${normalizedCompanyData.companyLegalName} has submitted a registration application.`,
            linkUrl: "/companies/review",
          }))
        );
      }
    })(db);

    return NextResponse.json({ success: true, registrationId, updated: wasUpdated });
  } catch (error) {
    captureServerError(error, {
      scope: "POST /api/company/register",
    });
    const message = error instanceof Error ? error.message : "Registration failed. Please try again.";
    const status = message.includes("already used") ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
