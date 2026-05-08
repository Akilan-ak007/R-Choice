import { db } from "@/lib/db";
import { authorityMappings, studentProfiles } from "@/lib/db/schema";
import { eq, and, ilike, type SQL } from "drizzle-orm";

export async function getApproversForStudent(userId: string) {
  // 1. Get the student's department, section, and year
  const [profile] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, userId))
    .limit(1);

  if (!profile) {
    throw new Error("Student profile not found. Complete your profile first.");
  }

  // 2. Find matching authority mapping
  const conditions: SQL<unknown>[] = [
    ilike(authorityMappings.department, profile.department),
    ilike(authorityMappings.section, profile.section || "A"),
    eq(authorityMappings.year, profile.year),
  ];

  if (profile.school) {
    conditions.push(ilike(authorityMappings.school, profile.school));
  }
  if (profile.course) {
    conditions.push(ilike(authorityMappings.course, profile.course));
  }
  if (profile.programType) {
    conditions.push(ilike(authorityMappings.programType, profile.programType));
  }
  if (profile.batchStartYear) {
    conditions.push(eq(authorityMappings.batchStartYear, profile.batchStartYear));
  }
  if (profile.batchEndYear) {
    conditions.push(eq(authorityMappings.batchEndYear, profile.batchEndYear));
  }

  const [mapping] = await db
    .select()
    .from(authorityMappings)
    .where(and(...conditions))
    .limit(1);

  if (!mapping) {
    throw new Error("No authority mapping found for your school, department, year, and section. Please contact administration.");
  }

  // 3. Return the mapped approvers
  return {
    tutorId: mapping.tutorId,
    placementCoordinatorId: mapping.placementCoordinatorId,
    hodId: mapping.hodId,
    deanId: mapping.deanId,
  };
}
