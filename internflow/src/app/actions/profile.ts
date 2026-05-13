"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { 
  studentProfiles, studentEducation, studentSkills, studentProjects, studentCertifications, studentJobInterests, studentLinks, users 
} from "@/lib/db/schema";
import { count, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

type DbErrorWithCode = {
  code?: string;
  detail?: string;
};

const STUDENT_MANAGER_ROLES = [
  "tutor",
  "placement_coordinator",
  "hod",
  "dean",
  "placement_officer",
  "principal",
  "mcr",
  "management_corporation",
] as const;

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

function revalidateStudentProfileViews(userId: string) {
  revalidatePath("/profile");
  revalidatePath("/profile/links");
  revalidatePath("/dashboard/student");
  revalidatePath("/applications");
  revalidatePath("/jobs");
  revalidatePath("/students");
  revalidatePath(`/students/${userId}`);
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
    db.select({ value: count() }).from(studentEducation).where(eq(studentEducation.studentId, profileId)),
    db.select({ value: count() }).from(studentSkills).where(eq(studentSkills.studentId, profileId)),
    db.select({ value: count() }).from(studentProjects).where(eq(studentProjects.studentId, profileId)),
    db.select({ value: count() }).from(studentLinks).where(eq(studentLinks.studentId, profileId)),
  ]);

  const eduCount = Number(eduRes[0]?.value || 0);
  const skillCount = Number(skillRes[0]?.value || 0);
  const projCount = Number(projRes[0]?.value || 0);
  const linkCount = Number(linkRes[0]?.value || 0);

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
  resumeUrl?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const userId = session.user.id;

  try {
    const normalizedRegisterNo = formData.registerNo?.trim() || "";
    const normalizedDepartment = formData.department?.trim() || "";
    const normalizedSection = formData.section?.trim() || "";
    const normalizedSummary = formData.professionalSummary?.trim() || "";

    if (!normalizedRegisterNo) {
      return { error: "Register number is required." };
    }

    if (!normalizedDepartment) {
      return { error: "Department is required." };
    }

    const [existingProfile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId)).limit(1);

    const parsedCgpa = formData.cgpa ? Number.parseFloat(formData.cgpa) : null;
    if (formData.cgpa && (parsedCgpa === null || !Number.isFinite(parsedCgpa) || parsedCgpa < 0 || parsedCgpa > 10)) {
      return { error: "CGPA must be a valid number between 0 and 10." };
    }

    const cgpaVal = parsedCgpa !== null ? parsedCgpa.toFixed(2) : null;
    let score = 0;
    if (normalizedRegisterNo) score += 10;
    if (normalizedDepartment) score += 10;
    if (formData.year) score += 5;
    if (cgpaVal) score += 5;
    if (normalizedSummary.length > 20) score += 20;

    let profileId: string;

    if (existingProfile) {
      profileId = existingProfile.id;
      await db.update(studentProfiles).set({
        registerNo: normalizedRegisterNo,
        department: normalizedDepartment,
        year: formData.year,
        section: normalizedSection,
        school: formData.school || null,
        course: formData.course || null,
        program: formData.program || null,
        programType: formData.programType || null,
        batchStartYear: formData.batchStartYear || null,
        batchEndYear: formData.batchEndYear || null,
        cgpa: cgpaVal,
        professionalSummary: normalizedSummary,
        dob: formData.dob || null,
        githubLink: formData.githubLink || null,
        linkedinLink: formData.linkedinLink || null,
        portfolioUrl: formData.portfolioUrl || null,
        resumeUrl: formData.resumeUrl || null,
        profileCompletionScore: score 
      }).where(eq(studentProfiles.id, existingProfile.id));
    } else {
      const [newProfile] = await db.insert(studentProfiles).values({
        userId,
        registerNo: normalizedRegisterNo,
        department: normalizedDepartment,
        year: formData.year,
        section: normalizedSection,
        school: formData.school || null,
        course: formData.course || null,
        program: formData.program || null,
        programType: formData.programType || null,
        batchStartYear: formData.batchStartYear || null,
        batchEndYear: formData.batchEndYear || null,
        cgpa: cgpaVal,
        professionalSummary: normalizedSummary,
        dob: formData.dob || null,
        githubLink: formData.githubLink || null,
        linkedinLink: formData.linkedinLink || null,
        portfolioUrl: formData.portfolioUrl || null,
        resumeUrl: formData.resumeUrl || null,
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

    revalidateStudentProfileViews(userId);
    revalidatePath("/settings");
    return { success: true, score };
  } catch (error: unknown) {
    console.error("Basic profile save error:", error);
    if ((error as DbErrorWithCode).code === "23505") return { error: "Register Number is already in use by another student." };
    return { error: `Failed to save profile. ${error instanceof Error ? error.message : "Please try again."}` };
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

    revalidateStudentProfileViews(session.user.id);
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
    const sanitizedEducation = educationData
      .map((edu) => ({
        institution: edu.institution?.trim() || "",
        degree: edu.degree?.trim() || "",
        fieldOfStudy: edu.fieldOfStudy?.trim() || null,
        startYear: edu.startYear ? Number(edu.startYear) : null,
        endYear: edu.endYear ? Number(edu.endYear) : null,
        score: edu.score?.toString().trim() || null,
      }))
      .filter((edu) => edu.institution && edu.degree);

    await db.delete(studentEducation).where(eq(studentEducation.studentId, profileId));
    for (const edu of sanitizedEducation) {
        await db.insert(studentEducation).values({
          studentId: profileId,
          institution: edu.institution,
          degree: edu.degree,
          fieldOfStudy: edu.fieldOfStudy,
          startYear: edu.startYear,
          endYear: edu.endYear,
          score: edu.score
        });
    }
    await updateProfileScore(profileId);
    revalidateStudentProfileViews(session.user.id);
    return { success: true };
  } catch (err) { console.error("Education save error:", err); return { error: "Failed to save education." }; }
}

export async function saveSkills(skillsData: {name: string, type: string, isTop?: boolean}[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profileId = await ensureStudentProfile(session.user.id);

  try {
    const sanitizedSkills = skillsData
      .map((skill) => ({
        name: skill.name?.trim() || "",
        type: skill.type === "language" ? "language" : skill.type === "soft" ? "soft" : "hard",
        isTop: !!skill.isTop,
      }))
      .filter((skill) => skill.name);

    await db.delete(studentSkills).where(eq(studentSkills.studentId, profileId));
    for (const skill of sanitizedSkills) {
      await db.insert(studentSkills).values({
        studentId: profileId,
        skillName: skill.name,
        skillType: skill.type as "hard" | "soft" | "language",
        isTop: skill.isTop,
      });
    }
    await updateProfileScore(profileId);
    revalidateStudentProfileViews(session.user.id);
    return { success: true };
  } catch (err) { console.error("Skills save error:", err); return { error: "Failed to save skills." }; }
}

export async function saveProjects(projectsData: { title?: string; description?: string; projectUrl?: string }[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profileId = await ensureStudentProfile(session.user.id);

  try {
    const sanitizedProjects = projectsData
      .map((project) => ({
        title: project.title?.trim() || "",
        description: project.description?.trim() || "",
        projectUrl: project.projectUrl?.trim() || null,
      }))
      .filter((project) => project.title && project.description);

    await db.delete(studentProjects).where(eq(studentProjects.studentId, profileId));
    for (const p of sanitizedProjects) {
        await db.insert(studentProjects).values({
          studentId: profileId,
          title: p.title,
          description: p.description,
          projectUrl: p.projectUrl,
        });
    }
    await updateProfileScore(profileId);
    revalidateStudentProfileViews(session.user.id);
    return { success: true };
  } catch (err) { console.error("Projects save error:", err); return { error: "Failed to save projects." }; }
}

export async function saveCertifications(certsData: { name?: string; issuingOrg?: string; credentialUrl?: string }[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profileId = await ensureStudentProfile(session.user.id);

  try {
    const sanitizedCerts = certsData
      .map((cert) => ({
        name: cert.name?.trim() || "",
        issuingOrg: cert.issuingOrg?.trim() || "",
        credentialUrl: cert.credentialUrl?.trim() || null,
      }))
      .filter((cert) => cert.name && cert.issuingOrg);

    await db.delete(studentCertifications).where(eq(studentCertifications.studentId, profileId));
    for (const c of sanitizedCerts) {
        await db.insert(studentCertifications).values({
          studentId: profileId,
          name: c.name,
          issuingOrg: c.issuingOrg,
          credentialUrl: c.credentialUrl,
        });
    }
    await updateProfileScore(profileId);
    revalidateStudentProfileViews(session.user.id);
    return { success: true };
  } catch (err) { console.error("Certs save error:", err); return { error: "Failed to save certs." }; }
}

export async function saveLinks(linksData: { title?: string; url?: string; platform: string }[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const profileId = await ensureStudentProfile(session.user.id);

  try {
    const sanitizedLinks = linksData
      .map((link) => ({
        title: link.title?.trim() || "",
        url: link.url?.trim() || "",
        platform: link.platform?.trim() || "Other",
      }))
      .filter((link) => link.title && link.url);

    await db.delete(studentLinks).where(eq(studentLinks.studentId, profileId));
    for (const l of sanitizedLinks) {
        await db.insert(studentLinks).values({
          studentId: profileId,
          platform: l.platform,
          title: l.title,
          url: l.url,
        });
    }
    await updateProfileScore(profileId);
    revalidateStudentProfileViews(session.user.id);
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

export async function updateStudentProfileByManager(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id || !STUDENT_MANAGER_ROLES.includes(session.user.role as (typeof STUDENT_MANAGER_ROLES)[number])) {
    return { error: "Not authorized to update student records." };
  }

  const userId = String(formData.get("userId") || "").trim();
  const registerNo = String(formData.get("registerNo") || "").trim();
  const school = String(formData.get("school") || "").trim();
  const section = String(formData.get("section") || "").trim();
  const course = String(formData.get("course") || "").trim();
  const programType = String(formData.get("programType") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const year = Number(formData.get("year"));
  const batchStartYearRaw = String(formData.get("batchStartYear") || "").trim();
  const batchEndYearRaw = String(formData.get("batchEndYear") || "").trim();

  if (!userId) return { error: "Student id is required." };
  if (!registerNo) return { error: "Register number is required." };
  if (!school || !section || !course || !department) {
    return { error: "School, section, course, and department are required." };
  }
  if (!Number.isInteger(year) || year < 1 || year > 5) {
    return { error: "Please choose a valid year." };
  }

  const batchStartYear = batchStartYearRaw ? Number(batchStartYearRaw) : null;
  const batchEndYear = batchEndYearRaw ? Number(batchEndYearRaw) : null;

  try {
    const [targetUser] = await db.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!targetUser || targetUser.role !== "student") {
      return { error: "Student not found." };
    }

    const [existingProfile] = await db
      .select({ id: studentProfiles.id })
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    if (existingProfile) {
      await db
        .update(studentProfiles)
        .set({
          registerNo,
          school,
          section,
          course,
          programType: programType || null,
          department,
          year,
          batchStartYear,
          batchEndYear,
          updatedAt: new Date(),
        })
        .where(eq(studentProfiles.id, existingProfile.id));
    } else {
      await db.insert(studentProfiles).values({
        userId,
        registerNo,
        school,
        section,
        course,
        programType: programType || null,
        department,
        year,
        batchStartYear,
        batchEndYear,
      });
    }

    revalidateStudentProfileViews(userId);
    revalidatePath("/users");
    return { success: true };
  } catch (error: unknown) {
    console.error("Manager student update error:", error);
    if ((error as DbErrorWithCode).code === "23505") {
      return { error: "Register number is already used by another student." };
    }
    return { error: error instanceof Error ? error.message : "Failed to update student profile." };
  }
}

