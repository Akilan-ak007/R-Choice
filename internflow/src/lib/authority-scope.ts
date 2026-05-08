import { and, eq, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/lib/db";
import { authorityMappings, studentProfiles, users } from "@/lib/db/schema";

type AuthorityRole = "tutor" | "placement_coordinator" | "hod" | "dean";

export const FULL_STUDENT_ACCESS_ROLES = [
  "placement_officer",
  "coe",
  "principal",
  "management_corporation",
  "mcr",
  "placement_head",
] as const;

export function getManagedUserRoles(role: string) {
  if (role === "tutor" || role === "placement_coordinator") {
    return ["student"] as const;
  }

  if (role === "hod") {
    return ["student", "tutor", "placement_coordinator"] as const;
  }

  if (role === "dean") {
    return ["student", "tutor", "placement_coordinator", "hod"] as const;
  }

  return [] as const;
}

export async function getAuthorityMappingsForRole(userId: string, role: string) {
  if (!["tutor", "placement_coordinator", "hod", "dean"].includes(role)) {
    return [];
  }

  const conditions: Record<AuthorityRole, SQL<unknown>> = {
    tutor: eq(authorityMappings.tutorId, userId),
    placement_coordinator: eq(authorityMappings.placementCoordinatorId, userId),
    hod: eq(authorityMappings.hodId, userId),
    dean: eq(authorityMappings.deanId, userId),
  };

  return db.select().from(authorityMappings).where(conditions[role as AuthorityRole]);
}

export function buildStudentVisibilityConditionFromMappings(
  role: string,
  mappings: Array<typeof authorityMappings.$inferSelect>
) {
  if (FULL_STUDENT_ACCESS_ROLES.includes(role as (typeof FULL_STUDENT_ACCESS_ROLES)[number])) {
    return undefined;
  }

  if (!["tutor", "placement_coordinator", "hod", "dean"].includes(role)) {
    return sql`1=0`;
  }

  if (mappings.length === 0) {
    return sql`1=0`;
  }

  const matchConditions = mappings.map((mapping) => {
    const conditions: SQL<unknown>[] = [];

    if (role === "dean") {
      if (mapping.school) {
        conditions.push(eq(studentProfiles.school, mapping.school));
      } else if (mapping.department) {
        conditions.push(eq(studentProfiles.department, mapping.department));
      }
    } else if (role === "hod" || role === "placement_coordinator") {
      conditions.push(eq(studentProfiles.department, mapping.department));
      if (mapping.school) conditions.push(eq(studentProfiles.school, mapping.school));
      if (mapping.course) conditions.push(eq(studentProfiles.course, mapping.course));
      if (mapping.programType) conditions.push(eq(studentProfiles.programType, mapping.programType));
      if (mapping.batchStartYear) conditions.push(eq(studentProfiles.batchStartYear, mapping.batchStartYear));
      if (mapping.batchEndYear) conditions.push(eq(studentProfiles.batchEndYear, mapping.batchEndYear));
    } else {
      conditions.push(
        eq(studentProfiles.department, mapping.department),
        eq(studentProfiles.year, mapping.year),
        eq(studentProfiles.section, mapping.section)
      );
      if (mapping.school) conditions.push(eq(studentProfiles.school, mapping.school));
      if (mapping.course) conditions.push(eq(studentProfiles.course, mapping.course));
      if (mapping.programType) conditions.push(eq(studentProfiles.programType, mapping.programType));
      if (mapping.batchStartYear) conditions.push(eq(studentProfiles.batchStartYear, mapping.batchStartYear));
      if (mapping.batchEndYear) conditions.push(eq(studentProfiles.batchEndYear, mapping.batchEndYear));
    }

    return and(...conditions);
  });

  return or(...matchConditions);
}

export async function buildStudentVisibilityCondition(userId: string, role: string) {
  const mappings = await getAuthorityMappingsForRole(userId, role);
  return buildStudentVisibilityConditionFromMappings(role, mappings);
}

export async function buildManagedUsersCondition(userId: string, role: string) {
  const managedRoles = [...getManagedUserRoles(role)];
  if (managedRoles.length === 0) {
    return undefined;
  }

  const mappings = await getAuthorityMappingsForRole(userId, role);
  if (mappings.length === 0) {
    return sql`1=0`;
  }

  const studentScope = buildStudentVisibilityConditionFromMappings(role, mappings);
  const resolvedStudentScope: SQL<unknown> = studentScope ?? sql`1=1`;

  const roleConditions: SQL<unknown>[] = [];

  if (managedRoles.includes("student")) {
    roleConditions.push(and(eq(users.role, "student"), resolvedStudentScope) as SQL<unknown>);
  }

  const nonStudentRoles = managedRoles.filter((managedRole) => managedRole !== "student");
  if (nonStudentRoles.length > 0) {
    const schools = Array.from(new Set(mappings.map((m) => m.school).filter(Boolean))) as string[];
    const departments = Array.from(new Set(mappings.map((m) => m.department).filter(Boolean))) as string[];

    let staffMappings: (typeof authorityMappings.$inferSelect)[] = [];

    if (role === "dean" && schools.length > 0) {
      staffMappings = await db.select().from(authorityMappings).where(inArray(authorityMappings.school, schools));
    } else if (departments.length > 0) {
      staffMappings = await db.select().from(authorityMappings).where(inArray(authorityMappings.department, departments));
    }

    const staffIds = new Set<string>();
    for (const sm of staffMappings) {
      if (role === "dean") {
        if (sm.tutorId) staffIds.add(sm.tutorId);
        if (sm.placementCoordinatorId) staffIds.add(sm.placementCoordinatorId);
        if (sm.hodId) staffIds.add(sm.hodId);
      } else if (role === "hod") {
        if (sm.tutorId) staffIds.add(sm.tutorId);
        if (sm.placementCoordinatorId) staffIds.add(sm.placementCoordinatorId);
      }
    }

    if (staffIds.size > 0) {
      roleConditions.push(
        and(
          inArray(users.role, nonStudentRoles as unknown as ("tutor" | "placement_coordinator" | "hod")[]),
          inArray(users.id, Array.from(staffIds))
        ) as SQL<unknown>
      );
    } else {
      roleConditions.push(sql`1=0`);
    }
  }

  if (roleConditions.length === 0) {
    return sql`1=0`;
  }

  return or(...roleConditions);
}
