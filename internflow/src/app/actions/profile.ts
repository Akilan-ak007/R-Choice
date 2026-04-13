"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  studentProfiles, studentEducation, studentSkills, studentProjects, studentCertifications, studentJobInterests, studentLinks, users 
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function saveBasicProfile(formData: {
  registerNo: string;
  department: string;
  year: number;
  section: string;
  cgpa: string;
  professionalSummary: string;
  roles?: string[];
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const userId = session.user.id;

  try {
    const [existingProfile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);

    const cgpaVal = formData.cgpa ? parseFloat(formData.cgpa).toString() : null;
    let score = 0;
    if (formData.registerNo) score += 10;
    if (formData.department) score += 10;
    if (formData.year) score += 5;
    if (formData.cgpa) score += 5;
    if (formData.professionalSummary && formData.professionalSummary.length > 20) score += 20;

    let profileId: string;

    await db.transaction(async (tx) => {
      if (existingProfile) {
        profileId = existingProfile.id;
        await tx.update(studentProfiles).set({
          registerNo: formData.registerNo,
          department: formData.department,
          year: formData.year,
          section: formData.section,
          cgpa: cgpaVal,
          professionalSummary: formData.professionalSummary,
          profileCompletionScore: score 
        }).where(eq(studentProfiles.id, existingProfile.id));
      } else {
        const [newProfile] = await tx.insert(studentProfiles).values({
          userId,
          registerNo: formData.registerNo,
          department: formData.department,
          year: formData.year,
          section: formData.section,
          cgpa: cgpaVal,
          professionalSummary: formData.professionalSummary,
          profileCompletionScore: score,
        }).returning({ id: studentProfiles.id });
        profileId = newProfile.id;
      }

      if (formData.roles && formData.roles.length > 0) {
        await tx.delete(studentJobInterests).where(eq(studentJobInterests.studentId, profileId));
        for (const role of formData.roles.slice(0, 5)) {
          await tx.insert(studentJobInterests).values({
            studentId: profileId,
            roleCategory: "General",
            roleName: role
          });
        }
      }
    });

    revalidatePath("/profile");
    return { success: true, score };
  } catch (error: any) {
    if (error.code === '23505') return { error: "Register Number is already in use by another student." };
    return { error: "Failed to save profile. Please try again." };
  }
}

export async function saveDeanProfile(formData: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "dean") {
    return { error: "Not authorized" };
  }

  const userId = session.user.id;

  try {
    await db
      .update(users)
      .set({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone || null,
        email: formData.email,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));

    revalidatePath("/profile");
    return { success: true };
  } catch (error: any) {
    console.error("Dean profile save error:", error);
    if (error.code === '23505') { 
      return { error: "Email is already in use by another user." };
    }
    return { error: "Failed to save profile. Please try again." };
  }
}

export async function saveEducation(educationData: any[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, session.user.id)).limit(1);
  if (!profile) return { error: "Profile missing" };

  try {
    await db.delete(studentEducation).where(eq(studentEducation.studentId, profile.id));
    for (const edu of educationData) {
      if (edu.institution && edu.degree) {
        await db.insert(studentEducation).values({
          studentId: profile.id,
          institution: edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy || null,
          startYear: edu.startYear ? Number(edu.startYear) : null,
          endYear: edu.endYear ? Number(edu.endYear) : null,
          score: edu.score ? edu.score.toString() : null
        });
      }
    }
    revalidatePath("/profile");
    return { success: true };
  } catch { return { error: "Failed to save education." }; }
}

export async function saveSkills(skillsData: {name: string, type: string}[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, session.user.id)).limit(1);
  if (!profile) return { error: "Profile missing" };

  try {
    await db.delete(studentSkills).where(eq(studentSkills.studentId, profile.id));
    for (const skill of skillsData) {
      await db.insert(studentSkills).values({
        studentId: profile.id,
        skillName: skill.name,
        skillType: (skill.type === "language" ? "language" : skill.type === "hard" ? "hard" : "soft") as "hard" | "soft" | "language",
      });
    }
    revalidatePath("/profile");
    return { success: true };
  } catch { return { error: "Failed to save skills." }; }
}

export async function saveProjects(projectsData: any[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, session.user.id)).limit(1);
  if (!profile) return { error: "Profile missing" };

  try {
    await db.delete(studentProjects).where(eq(studentProjects.studentId, profile.id));
    for (const p of projectsData) {
      if (p.title && p.description) {
        await db.insert(studentProjects).values({
          studentId: profile.id,
          title: p.title,
          description: p.description,
          projectUrl: p.projectUrl || null,
        });
      }
    }
    revalidatePath("/profile");
    return { success: true };
  } catch { return { error: "Failed to save projects." }; }
}

export async function saveCertifications(certsData: any[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, session.user.id)).limit(1);
  if (!profile) return { error: "Profile missing" };

  try {
    await db.delete(studentCertifications).where(eq(studentCertifications.studentId, profile.id));
    for (const c of certsData) {
      if (c.name && c.issuingOrg) {
        await db.insert(studentCertifications).values({
          studentId: profile.id,
          name: c.name,
          issuingOrg: c.issuingOrg,
          credentialUrl: c.credentialUrl || null,
        });
      }
    }
    revalidatePath("/profile");
    return { success: true };
  } catch { return { error: "Failed to save certs." }; }
}

export async function saveLinks(linksData: any[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, session.user.id)).limit(1);
  if (!profile) return { error: "Profile missing" };

  try {
    await db.delete(studentLinks).where(eq(studentLinks.studentId, profile.id));
    for (const l of linksData) {
      if (l.title && l.url) {
        await db.insert(studentLinks).values({
          studentId: profile.id,
          platform: l.platform,
          title: l.title,
          url: l.url,
        });
      }
    }
    revalidatePath("/profile/links");
    return { success: true };
  } catch { return { error: "Failed to save links." }; }
}
