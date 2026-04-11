import { db } from "@/lib/db";
import { authorityMappings, studentProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

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
  const [mapping] = await db
    .select()
    .from(authorityMappings)
    .where(
      and(
        eq(authorityMappings.department, profile.department),
        eq(authorityMappings.section, profile.section || "A"),
        eq(authorityMappings.year, profile.year)
      )
    )
    .limit(1);

  if (!mapping) {
    throw new Error("No authority mapping found for your department, year, and section. Please contact administration.");
  }

  // 3. Return the mapped approvers
  return {
    tutorId: mapping.tutorId,
    placementCoordinatorId: mapping.placementCoordinatorId,
    hodId: mapping.hodId,
    deanId: mapping.deanId,
  };
}
