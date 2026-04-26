import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateCompanyRegistrationLink } from "@/app/actions/mcr";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "management_corporation") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let expiryDays = 7;
  try {
    const body = await req.json();
    if (body.expiryDays && typeof body.expiryDays === 'number') {
      expiryDays = body.expiryDays;
    }
  } catch (e) {
    // ignore JSON parsing errors and use default
  }

  const result = await generateCompanyRegistrationLink(expiryDays);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ link: result.link, expiryDays });
}
