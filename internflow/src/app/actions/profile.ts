"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  studentProfiles, studentEducation, studentSkills, studentProjects, studentCertifications, studentJobInterests, studentLinks, users 
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

type DbErrorWithCode = {
  code?: string;
};

// Auto-create a minimal student profile if one doesn't exist.
// This prevents "Profile missing" errors when students save education/skills/etc before basic info.
async function ensureStudentProfile(userId: string): Promise<string> {
  const [existing] = await db.select({ id: studentProfiles.id }).from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);
  if (existing) return existing.id;
  
  const [newProfile] = await db.insert(studentProfiles).values({
    userId,
    registerNo: `TMP-${userId.substring(0, 8)}`,
    department: "",
    year: 1,
    section: "",
    cgpa: null,
    professionalSummary: "",
    profileCompletionScore: 0,
  }).returning({ id: studentProfiles.id });
  return newProfile.id;
}

// Helper to recalculate and update score
async function updateProfileScore(profileId: string) {
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.id, profileId)).limit(1);
  if (!profile) return;

  let score = 0;
  if (profile.registerNo) score += 10;
  if (profile.department) score += 10;
  if (profile.year) score += 5;
  if (profile.cgpa) score += 5;
  if (profile.professionalSummary && profile.professionalSummary.length > 20) score += 20;

  const [eduRes, skillRes, projRes, linkRes] = await Promise.all([
    db.execute(`SELECT COUNT(*) FROM student_education WHERE student_id = '${profileId}'`),
    db.execute(`SELECT COUNT(*) FROM student_skills WHERE student_id = '${profileId}'`),
    db.execute(`SELECT COUNT(*) FROM student_projects WHERE student_id = '${profileId}'`),
    db.execute(`SELECT COUNT(*) FROM student_links WHERE student_id = '${profileId}'`)
  ]);

  const eduCount = Number(eduRes.rows[0]?.count || 0);
  const skillCount = Number(skillRes.rows[0]?.count || 0);
  const projCount = Number(projRes.rows[0]?.count || 0);
  const linkCount = Number(linkRes.rows[0]?.count || 0);

  if (Number(eduCount) > 0) score += 15;
  if (Number(skillCount) > 0) score += 15;
  if (Number(projCount) > 0) score += 10;
  if (Number(linkCount) > 0) score += 10;

  // Max score is 100.
  score = Math.min(score, 100);

  await db.update(studentProfiles).set({ profileCompletionScore: score }).where(eq(studentProfiles.id, profileId));
}

export async function saveBasicProfile(formData: {
  registerNo: string;
  department: string;
  year: number;
  section: string;
  school?: string;
  course?: string;
  program?: string;
  programType?: string;
  batchStartYear?: number;
  batchEndYear?: number;
  cgpa: string;
  professionalSummary: string;
  roles?: string[];
  dob?: string;
  githubLink?: string;
  linkedinLink?: string;
  portfolioUrl?: string;
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

    if (existingProfile) {
      profileId = existingProfile.id;
      await db.update(studentProfiles).set({
        registerNo: formData.registerNo,
        department: formData.department,
        year: formData.year,
        section: formData.section,
        school: formData.school || null,
        course: formData.course || null,
        program: formData.program || null,
        programType: formData.programType || null,
        batchStartYear: formData.batchStartYear || null,
        batchEndYear: formData.batchEndYear || null,
        cgpa: cgpaVal,
        professionalSummary: formData.professionalSummary,
        dob: formData.dob || null,
        githubLink: formData.githubLink || null,
        linkedinLink: formData.linkedinLink || null,
        portfolioUrl: formData.portfolioUrl || null,
        profileCompletionScore: score 
      }).where(eq(studentProfiles.id, existingProfile.id));
    } else {
      const [newProfile] = await db.insert(studentProfiles).values({
        userId,
        registerNo: formData.registerNo,
        department: formData.department,
        year: formData.year,
        section: formData.section,
        school: formData.school || null,
        course: formData.course || null,
        program: formData.program || null,
        programType: formData.programType || null,
        batchStartYear: formData.batchStartYear || null,
        batchEndYear: formData.batchEndYear || null,
        cgpa: cgpaVal,
        professionalSummary: formData.professionalSummary,
        dob: formData.dob || null,
        githubLink: formData.githubLink || null,
        linkedinLink: formData.linkedinLink || null,
        portfolioUrl: formData.portfolioUrl || null,
        profileCompletionScore: score,
      }).returning({ id: studentProfiles.id });
      profileId = newProfile.id;
    }

    if (formData.roles && formData.roles.length > 0) {
      await db.delete(studentJobInterests).where(eq(studentJobInterests.studentId, profileId));
      for (const role of formData.roles.slice(0, 5)) {
        await db.insert(studentJobInterests).values({
          studentId: profileId,
          roleCategory: "General",
          roleName: role
        });
      }
    }

    revalidatePath("/profile");
    return { success: true, score };
  } catch (error: unknown) {
    if ((error as DbErrorWithCode).code === "23505") return { error: "Register Number is already in use by another student." };
    return { error: "Failed to save profile. Please try again." };
  }
}

export async function saveDeanProfile(formData: {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  currentPassword?: string;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "dean") {
    return { error: "Not authorized" };
  }

  const userId = session.user.id;

  try {
    // If email is being changed, require password verification
    if (formData.email !== session.user.email) {
      if (!formData.currentPassword) {
        return { error: "Current password is required to change email." };
      }
      const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      if (!user) return { error: "User not found" };
      const isValid = await bcrypt.compare(formData.currentPassword, user.passwordHash);
      if (!isValid) return { error: "Incorrect password." };
    }

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
  } catch (error: unknown) {
    console.error("Dean profile save error:", error);
    if ((error as DbErrorWithCode).code === "23505") {
      return { error: "Email is already in use by another user." };
    }
    return { error: "Failed to save profile. Please try again." };
  }
}

export async function saveEducation(educationData: { institution?: string; degree?: string; fieldOfStudy?: string; startYear?: string | number; endYear?: string | number; score?: string | number }[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profileId = await ensureStudentProfile(session.user.id);

  try {
    await db.delete(studentEducation).where(eq(studentEducation.studentId, profileId));
    for (const edu of educationData) {
      if (edu.institution && edu.degree) {
        await db.insert(studentEducation).values({
          studentId: profileId,
          institution: edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy || null,
          startYear: edu.startYear ? Number(edu.startYear) : null,
          endYear: edu.endYear ? Number(edu.endYear) : null,
          score: edu.score ? edu.score.toString() : null
        });
      }
    }
    await updateProfileScore(profileId);
    revalidatePath("/profile");
    return { success: true };
  } catch (err) { console.error("Education save error:", err); return { error: "Failed to save education." }; }
}

export async function saveSkills(skillsData: {name: string, type: string, isTop?: boolean}[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profileId = await ensureStudentProfile(session.user.id);

  try {
    await db.delete(studentSkills).where(eq(studentSkills.studentId, profileId));
    for (const skill of skillsData) {
      await db.insert(studentSkills).values({
        studentId: profileId,
        skillName: skill.name,
        skillType: (skill.type === "language" ? "language" : skill.type === "hard" ? "hard" : "soft") as "hard" | "soft" | "language",
        isTop: skill.isTop || false,
      });
    }
    await updateProfileScore(profileId);
    revalidatePath("/profile");
    return { success: true };
  } catch (err) { console.error("Skills save error:", err); return { error: "Failed to save skills." }; }
}

export async function saveProjects(projectsData: { title?: string; description?: string; projectUrl?: string }[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profileId = await ensureStudentProfile(session.user.id);

  try {
    await db.delete(studentProjects).where(eq(studentProjects.studentId, profileId));
    for (const p of projectsData) {
      if (p.title && p.description) {
        await db.insert(studentProjects).values({
          studentId: profileId,
          title: p.title,
          description: p.description,
          projectUrl: p.projectUrl || null,
        });
      }
    }
    await updateProfileScore(profileId);
    revalidatePath("/profile");
    return { success: true };
  } catch (err) { console.error("Projects save error:", err); return { error: "Failed to save projects." }; }
}

export async function saveCertifications(certsData: { name?: string; issuingOrg?: string; credentialUrl?: string }[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profileId = await ensureStudentProfile(session.user.id);

  try {
    await db.delete(studentCertifications).where(eq(studentCertifications.studentId, profileId));
    for (const c of certsData) {
      if (c.name && c.issuingOrg) {
        await db.insert(studentCertifications).values({
          studentId: profileId,
          name: c.name,
          issuingOrg: c.issuingOrg,
          credentialUrl: c.credentialUrl || null,
        });
      }
    }
    await updateProfileScore(profileId);
    revalidatePath("/profile");
    return { success: true };
  } catch (err) { console.error("Certs save error:", err); return { error: "Failed to save certs." }; }
}

export async function saveLinks(linksData: { title?: string; url?: string; platform: string }[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profileId = await ensureStudentProfile(session.user.id);

  try {
    await db.delete(studentLinks).where(eq(studentLinks.studentId, profileId));
    for (const l of linksData) {
      if (l.title && l.url) {
        await db.insert(studentLinks).values({
          studentId: profileId,
          platform: l.platform,
          title: l.title,
          url: l.url,
        });
      }
    }
    await updateProfileScore(profileId);
    revalidatePath("/profile/links");
    return { success: true };
  } catch (err) { console.error("Links save error:", err); return { error: "Failed to save links." }; }
}

export async function fetchFullStudentProfile(studentId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { error: "Not authenticated" };

    // Fetch the core user + profile
    const [user] = await db.select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      phone: users.phone,
      avatarUrl: users.avatarUrl
    }).from(users).where(eq(users.id, studentId)).limit(1);

    if (!user) return { error: "Student not found" };

    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, studentId)).limit(1);

    if (!profile) return { error: "Student profile not found" };

    // Fetch sub-relations
    const [education, skills, projects, certs, links] = await Promise.all([
      db.select().from(studentEducation).where(eq(studentEducation.studentId, profile.id)),
      db.select().from(studentSkills).where(eq(studentSkills.studentId, profile.id)),
      db.select().from(studentProjects).where(eq(studentProjects.studentId, profile.id)),
      db.select().from(studentCertifications).where(eq(studentCertifications.studentId, profile.id)),
      db.select().from(studentLinks).where(eq(studentLinks.studentId, profile.id)),
    ]);

    return {
      success: true,
      data: {
        user,
        profile,
        education,
        skills,
        projects,
        certs,
        links
      }
    };
  } catch (error) {
    console.error("Failed to fetch full student profile:", error);
    return { error: "Database error occurred." };
  }
}

