import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companyRegistrationLinks, companyRegistrations } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";
import { enforceRateLimit } from "@/lib/rate-limit";
import { captureServerError } from "@/lib/observability";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing token" }, { status: 400 });
  }

  try {
    const rateLimit = await enforceRateLimit({
      namespace: "company-validate-token",
      identifier: `${req.headers.get("x-forwarded-for") || "anonymous"}:${token}`,
      limit: 40,
      windowMs: 15 * 60 * 1000,
    });

    if (!rateLimit.success) {
      return NextResponse.json({ valid: false, error: "Too many validation attempts" }, { status: 429 });
    }

    const [link] = await db
      .select({
        id: companyRegistrationLinks.id,
        isUsed: companyRegistrationLinks.isUsed,
        usedByCompanyId: companyRegistrationLinks.usedByCompanyId,
      })
      .from(companyRegistrationLinks)
      .where(
        and(
          eq(companyRegistrationLinks.token, token),
          eq(companyRegistrationLinks.isUsed, false),
          gt(companyRegistrationLinks.expiresAt, new Date())
        )
      )
      .limit(1);

    if (!link || link.isUsed) {
      return NextResponse.json({ valid: false });
    }

    const [company] = link.usedByCompanyId
      ? await db
          .select({
            id: companyRegistrations.id,
            companyLegalName: companyRegistrations.companyLegalName,
            brandName: companyRegistrations.brandName,
            companyDescription: companyRegistrations.companyDescription,
            companyType: companyRegistrations.companyType,
            industrySector: companyRegistrations.industrySector,
            yearEstablished: companyRegistrations.yearEstablished,
            companySize: companyRegistrations.companySize,
            website: companyRegistrations.website,
            address: companyRegistrations.address,
            city: companyRegistrations.city,
            state: companyRegistrations.state,
            pinCode: companyRegistrations.pinCode,
            hrName: companyRegistrations.hrName,
            hrEmail: companyRegistrations.hrEmail,
            hrPhone: companyRegistrations.hrPhone,
            altPhone: companyRegistrations.altPhone,
            gstNumber: companyRegistrations.gstNumber,
            panNumber: companyRegistrations.panNumber,
            cinLlpin: companyRegistrations.cinLlpin,
            coi: companyRegistrations.coi,
            ceoName: companyRegistrations.ceoName,
            ceoDesignation: companyRegistrations.ceoDesignation,
            ceoEmail: companyRegistrations.ceoEmail,
            ceoPhone: companyRegistrations.ceoPhone,
            ceoLinkedin: companyRegistrations.ceoLinkedin,
            ceoPortfolio: companyRegistrations.ceoPortfolio,
            internshipType: companyRegistrations.internshipType,
            domains: companyRegistrations.domains,
            duration: companyRegistrations.duration,
            stipendRange: companyRegistrations.stipendRange,
            hiringIntention: companyRegistrations.hiringIntention,
            generalTcAccepted: companyRegistrations.generalTcAccepted,
            status: companyRegistrations.status,
            reviewComment: companyRegistrations.reviewComment,
            reviewedAt: companyRegistrations.reviewedAt,
          })
          .from(companyRegistrations)
          .where(eq(companyRegistrations.id, link.usedByCompanyId))
          .limit(1)
      : [];

    return NextResponse.json({
      valid: true,
      company: company || null,
    });
  } catch (error) {
    captureServerError(error, {
      scope: "GET /api/company/validate-token",
    });
    return NextResponse.json({ valid: false, error: "Validation failed" }, { status: 500 });
  }
}
