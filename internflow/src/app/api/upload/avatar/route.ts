import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
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
      namespace: "upload-avatar",
      identifier: session.user.id,
      limit: 10,
      windowMs: 10 * 60 * 1000,
    });
    if (!rateLimit.success) {
      return NextResponse.json({ error: "Too many avatar uploads. Please try again later." }, { status: 429 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "File must be an image" }, { status: 400 });
    }

    // Validate size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
    }

    // Convert to base64 data URI for Cloudinary upload
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64, {
      folder: "rchoice/avatars",
      public_id: `user_${session.user.id}`,
      overwrite: true,
      transformation: [
        { width: 256, height: 256, crop: "fill", gravity: "face" },
        { quality: "auto", fetch_format: "auto" },
      ],
    });

    // Update user's avatar URL in database
    await db
      .update(users)
      .set({ avatarUrl: result.secure_url, updatedAt: new Date() })
      .where(eq(users.id, session.user.id));

    return NextResponse.json({ url: result.secure_url });
  } catch (error) {
    captureServerError(error, { scope: "avatar-upload-route" });
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
