import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, studentProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import cloudinary from "@/lib/cloudinary";
import { enforceRateLimit } from "@/lib/rate-limit";
import { captureServerError } from "@/lib/observability";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const rateLimit = await enforceRateLimit({
      namespace: "upload-resume",
      identifier: session.user.id,
      limit: 6,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many resume uploads. Please try again later." }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type (PDF only)
    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are accepted" }, { status: 400 });
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 10MB" }, { status: 400 });
    }

    // Get user info for naming
    const [user] = await db.select().from(users).where(eq(users.id, session.user.id));
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Check if student profile exists FIRST
    // It's required because resumeUrl is stored in the studentProfiles table
    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, session.user.id));

    if (!profile) {
      return NextResponse.json(
        { error: "Please save your Basic Info first before uploading a resume" },
        { status: 400 }
      );
    }

    // Convert to base64 data URI for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary (raw resource type for PDFs - requires .pdf in public_id)
    const result = await cloudinary.uploader.upload(base64, {
      folder: "rchoice/resumes",
      public_id: `resume_${session.user.id}.pdf`,
      overwrite: true,
      resource_type: "raw",
    });

    // Update student profile with resume URL
    await db
      .update(studentProfiles)
      .set({ resumeUrl: result.secure_url, updatedAt: new Date() })
      .where(eq(studentProfiles.userId, session.user.id));

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    captureServerError(error, { scope: "resume-upload-route" });
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
