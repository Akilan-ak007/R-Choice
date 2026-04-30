import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { companyRegistrationLinks, companyInvitations } from "@/lib/db/schema";
import { eq, and, gt } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ valid: false, error: "Missing token" }, { status: 400 });
  }

  try {
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

    if (link) return NextResponse.json({ valid: true });

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

    if (invitation) return NextResponse.json({ valid: true });

    return NextResponse.json({ valid: false });
  } catch (error) {
    console.error("Token validation error:", error);
    return NextResponse.json({ valid: false, error: "Validation failed" }, { status: 500 });
  }
}
