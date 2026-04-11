import { db } from "@/lib/db";
import { internshipRequests, users, studentProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

export async function GET(
  request: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const requestId = id;

    // Fetch all required data for the bonafide
    const [internshipReq] = await db
      .select({
        studentId: internshipRequests.studentId,
        companyName: internshipRequests.companyName,
        role: internshipRequests.role,
        startDate: internshipRequests.startDate,
        endDate: internshipRequests.endDate,
        status: internshipRequests.status,
      })
      .from(internshipRequests)
      .where(eq(internshipRequests.id, requestId))
      .limit(1);

    if (!internshipReq || internshipReq.status !== "approved") {
      return NextResponse.json({ error: "Certificate not found or not approved yet." }, { status: 404 });
    }

    const [user] = await db.select().from(users).where(eq(users.id, internshipReq.studentId!)).limit(1);
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, internshipReq.studentId!)).limit(1);

    if (!user || !profile) {
      return NextResponse.json({ error: "Student details missing." }, { status: 400 });
    }

    // Generate PDF using pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
    const { width, height } = page.getSize();

    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

    // Title Placeholder
    page.drawText("RATHINAM COLLEGE OF ARTS AND SCIENCE", {
      x: width / 2 - 190,
      y: height - 100,
      size: 18,
      font: fontBold,
      color: rgb(0.12, 0.16, 0.42),
    });

    page.drawText("BONAFIDE CERTIFICATE", {
      x: width / 2 - 100,
      y: height - 140,
      size: 16,
      font: fontBold,
      color: rgb(0, 0, 0),
    });

    // Date
    page.drawText(`Date: ${new Date().toLocaleDateString()}`, {
      x: width - 200,
      y: height - 200,
      size: 12,
      font: fontRegular,
    });

    // Body Text
    const certText = `This is to certify that Mr./Ms. ${user.firstName} ${user.lastName},
bearing Register Number ${profile.registerNo}, is a bonafide student of 
this institution studying ${profile.department} during the academic year ${new Date().getFullYear()}.

This certificate is issued to permit the student to undergo an internship
as a ${internshipReq.role} at ${internshipReq.companyName} 
for the period from ${internshipReq.startDate} to ${internshipReq.endDate}.`;

    page.drawText(certText, {
      x: 70,
      y: height - 280,
      size: 13,
      font: fontRegular,
      lineHeight: 30,
      color: rgb(0.2, 0.2, 0.2),
    });

    // Signatures
    page.drawText("Head of Department", {
      x: 70,
      y: 200,
      size: 12,
      font: fontBold,
    });

    page.drawText("Principal", {
      x: width - 150,
      y: 200,
      size: 12,
      font: fontBold,
    });

    const pdfBytes = await pdfDoc.save();

    return new Response(Buffer.from(pdfBytes), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="Bonafide_${profile.registerNo}.pdf"`,
      },
    });

  } catch (error) {
    console.error("PDF generation error:", error);
    return NextResponse.json({ error: "Failed to generate certificate." }, { status: 500 });
  }
}
