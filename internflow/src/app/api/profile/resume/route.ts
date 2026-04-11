import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { studentProfiles, users, studentSkills, studentEducation, studentProjects } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.id;
    
    // Fetch user and profile data
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId));
    
    if (!user || !profile) {
      return new NextResponse('Profile not found', { status: 404 });
    }

    // Fetch related data
    const skills = await db.select().from(studentSkills).where(eq(studentSkills.studentId, profile.id));
    const education = await db.select().from(studentEducation).where(eq(studentEducation.studentId, profile.id));
    const projects = await db.select().from(studentProjects).where(eq(studentProjects.studentId, profile.id));

    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();
    
    // Embed the standard font
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Add a blank page
    let page = pdfDoc.addPage([595.28, 841.89]); // A4 Size
    const { width, height } = page.getSize();
    let cursorY = height - 50;
    const marginX = 50;
    
    const drawText = (text: string, size: number, isBold = false, x = marginX) => {
      const currentFont = isBold ? boldFont : font;
      page.drawText(text, {
        x,
        y: cursorY,
        size,
        font: currentFont,
        color: rgb(0, 0, 0),
      });
      cursorY -= (size + 4);
    };

    const addSectionHeader = (title: string) => {
      cursorY -= 10;
      drawText(title.toUpperCase(), 12, true);
      page.drawLine({
        start: { x: marginX, y: cursorY + 2 },
        end: { x: width - marginX, y: cursorY + 2 },
        thickness: 1,
        color: rgb(0.8, 0.8, 0.8)
      });
      cursorY -= 10;
    };

    const checkPageBreak = (neededSpace: number) => {
      if (cursorY - neededSpace < 50) {
        page = pdfDoc.addPage([595.28, 841.89]);
        cursorY = height - 50;
      }
    };

    // --- HEADER ---
    drawText(`${user.firstName} ${user.lastName}`.toUpperCase(), 24, true);
    cursorY -= 5;
    
    const contactInfo = [
      user.email,
      profile.linkedinLink ? `LinkedIn: ${profile.linkedinLink}` : null,
      profile.githubLink ? `GitHub: ${profile.githubLink}` : null
    ].filter(Boolean).join('  |  ');
    
    drawText(contactInfo, 10, false);
    cursorY -= 15;

    // --- SUMMARY ---
    if (profile.professionalSummary) {
      addSectionHeader("Professional Summary");
      
      // Simple text wrapping logic
      const words = profile.professionalSummary.split(' ');
      let line = '';
      for (const word of words) {
        const testLine = line + word + ' ';
        const textWidth = font.widthOfTextAtSize(testLine, 10);
        if (textWidth > width - 100) {
          drawText(line, 10, false);
          line = word + ' ';
          checkPageBreak(15);
        } else {
          line = testLine;
        }
      }
      if (line.trim().length > 0) {
        drawText(line, 10, false);
      }
      cursorY -= 10;
    }

    // --- EDUCATION ---
    if (education.length > 0) {
      addSectionHeader("Education");
      education.forEach(edu => {
        checkPageBreak(30);
        drawText(edu.institution || '', 11, true);
        const details = `${edu.degree} ${edu.fieldOfStudy ? 'in ' + edu.fieldOfStudy : ''} | ${edu.startYear} - ${edu.endYear || 'Present'}`;
        drawText(details, 10, false);
        if (edu.score) {
          drawText(`Grade/CGPA: ${edu.score}`, 10, false);
        }
        cursorY -= 10;
      });
    }

    // --- SKILLS ---
    if (skills.length > 0) {
      addSectionHeader("Skills");
      checkPageBreak(15);
      
      const skillList = skills.map(s => s.skillName).join(', ');
      
      // Wrapping for skills
      const words = skillList.split(', ');
      let line = '';
      for (const word of words) {
        const testLine = line + (line ? ', ' : '') + word;
        const textWidth = font.widthOfTextAtSize(testLine, 10);
        if (textWidth > width - 100) {
          drawText(line + ',', 10, false);
          line = word;
          checkPageBreak(15);
        } else {
          line = testLine;
        }
      }
      if (line.trim().length > 0) {
        drawText(line, 10, false);
      }
      cursorY -= 10;
    }

    // --- PROJECTS ---
    if (projects.length > 0) {
      addSectionHeader("Projects");
      projects.forEach(proj => {
        checkPageBreak(50);
        drawText(`${proj.title} | ${proj.startDate} - ${proj.endDate || 'Present'}`, 11, true);
        if (proj.projectUrl) {
          drawText(`Link: ${proj.projectUrl}`, 9, false);
        }
        
        // Wrapping logic for project description
        if (proj.description) {
          cursorY -= 2;
          const words = proj.description.split(' ');
          let line = '';
          for (const word of words) {
            const testLine = line + word + ' ';
            const textWidth = font.widthOfTextAtSize(testLine, 10);
            if (textWidth > width - 100) {
              drawText(line, 10, false);
              line = word + ' ';
              checkPageBreak(15);
            } else {
              line = testLine;
            }
          }
          if (line.trim().length > 0) {
            drawText(line, 10, false);
          }
        }
        cursorY -= 10;
      });
    }

    const pdfBytes = await pdfDoc.save();
    const buffer = Buffer.from(pdfBytes);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${user.firstName}_${user.lastName}_Resume.pdf"`,
      },
    });

  } catch (error) {
    console.error('Error generating resume:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
