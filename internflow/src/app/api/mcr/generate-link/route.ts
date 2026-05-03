import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateCompanyRegistrationLink } from "@/app/actions/mcr";
import { enforceRateLimit } from "@/lib/rate-limit";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !["management_corporation", "mcr"].includes(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = await enforceRateLimit({
    namespace: "mcr-generate-link",
    identifier: session.user.id,
    limit: 20,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.success) {
    return NextResponse.json({ error: "Too many link generations. Please try again later." }, { status: 429 });
  }

  let expiryDays = 7;
  try {
    const body = await req.json();
    if (body.expiryDays && typeof body.expiryDays === 'number') {
      expiryDays = body.expiryDays;
    }
  } catch {
    // ignore JSON parsing errors and use default
  }

  const result = await generateCompanyRegistrationLink(expiryDays);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ link: result.link, expiryDays });
}
