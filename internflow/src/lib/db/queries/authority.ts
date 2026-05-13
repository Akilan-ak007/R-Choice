import { db } from "@/lib/db";
import { authorityMappings, studentProfiles } from "@/lib/db/schema";
import { eq, and, ilike, or, isNull, type SQL } from "drizzle-orm";

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
    or(
      ilike(authorityMappings.department, profile.department),
      eq(authorityMappings.department, "General")
    ) as SQL<unknown>,
    or(
      ilike(authorityMappings.section, profile.section || "A"),
      eq(authorityMappings.section, "ALL")
    ) as SQL<unknown>,
    or(
      eq(authorityMappings.year, profile.year),
      eq(authorityMappings.year, 0)
    ) as SQL<unknown>,
  ];

  if (profile.school) {
    conditions.push(or(isNull(authorityMappings.school), ilike(authorityMappings.school, profile.school)) as SQL<unknown>);
  }
  if (profile.course) {
    conditions.push(or(isNull(authorityMappings.course), ilike(authorityMappings.course, profile.course)) as SQL<unknown>);
  }
  if (profile.programType) {
    conditions.push(or(isNull(authorityMappings.programType), ilike(authorityMappings.programType, profile.programType)) as SQL<unknown>);
  }
  if (profile.batchStartYear) {
    conditions.push(or(isNull(authorityMappings.batchStartYear), eq(authorityMappings.batchStartYear, profile.batchStartYear)) as SQL<unknown>);
  }
  if (profile.batchEndYear) {
    conditions.push(or(isNull(authorityMappings.batchEndYear), eq(authorityMappings.batchEndYear, profile.batchEndYear)) as SQL<unknown>);
  }

  const mappings = await db
    .select()
    .from(authorityMappings)
    .where(and(...conditions));

  if (!mappings || mappings.length === 0) {
    throw new Error("No authority mapping found for your school, department, year, and section. Please contact administration.");
  }

  // Sort by specificity
  mappings.sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;
    if (a.section !== "ALL") scoreA++;
    if (b.section !== "ALL") scoreB++;
    if (a.year !== 0) scoreA++;
    if (b.year !== 0) scoreB++;
    if (a.course !== null) scoreA++;
    if (b.course !== null) scoreB++;
    return scoreB - scoreA;
  });

  const mapping = mappings[0];

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
