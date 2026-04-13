"use server";

import { db } from "@/lib/db";
import { users, studentProfiles, studentSkills, studentLinks, studentProjects, studentCertifications } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function getPublicProfile(userId: string) {
  try {
    const userRes = await db.select({
      firstName: users.firstName,
      lastName: users.lastName,
      about: users.about,
      avatarUrl: users.avatarUrl,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

    if (userRes.length === 0) return null;
    const user = userRes[0];

    const profileRes = await db.select({
      id: studentProfiles.id,
      department: studentProfiles.department,
      year: studentProfiles.year,
      professionalSummary: studentProfiles.professionalSummary,
      isProfilePublic: studentProfiles.isProfilePublic,
    })
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, userId))
    .limit(1);

    if (profileRes.length === 0 || !profileRes[0].isProfilePublic) {
      // Return basic info if profile isn't public or doesn't exist fully
      return { ...user, isPublic: false };
    }

    const profile = profileRes[0];

    const [skillsArr, linksArr, projectsArr, certsArr] = await Promise.all([
      db.select().from(studentSkills).where(eq(studentSkills.studentId, profile.id)),
      db.select().from(studentLinks).where(and(eq(studentLinks.studentId, profile.id), eq(studentLinks.isActive, true))).orderBy(studentLinks.displayOrder),
      db.select().from(studentProjects).where(eq(studentProjects.studentId, profile.id)),
      db.select().from(studentCertifications).where(eq(studentCertifications.studentId, profile.id)),
    ]);

    return {
      ...user,
      ...profile,
      isPublic: true,
      skills: skillsArr,
      links: linksArr,
      projects: projectsArr,
      certifications: certsArr,
    };
  } catch (error) {
    console.error("V-Card Load Error:", error);
    return null;
  }
}
