"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { authorityMappings, users, userRoleEnum } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function fetchAuthorityMappings() {
  try {
    return await db.select().from(authorityMappings);
  } catch {
    return [];
  }
}

export async function fetchStaffByRole(role: string) {
  try {
    const validRoles = userRoleEnum.enumValues as string[];
    if (!validRoles.includes(role)) {
      throw new Error("Invalid role");
    }
    return await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .where(eq(users.role, role as "student" | "tutor" | "placement_coordinator" | "hod" | "dean" | "placement_officer" | "principal" | "company" | "alumni" | "coe" | "mcr"));
  } catch {
    return [];
  }
}

export async function upsertMapping(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  // Allow Dean, HOD, placement_officer, principal
  if (!["placement_officer", "principal", "dean", "hod"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  const id = formData.get("id") as string | null;
  const school = formData.get("school") as string;
  const section = formData.get("section") as string;
  const course = formData.get("course") as string;
  const programType = formData.get("programType") as string;
  const department = formData.get("department") as string;
  const year = parseInt(formData.get("year") as string, 10);
  const tutorId = (formData.get("tutorId") as string) || null;
  
  // If HOD, they can only edit PC/Tutor, Dean/HOD remains unchanged
  // In frontend we disable the inputs, but here we can rely on existing if present
  let hodId = (formData.get("hodId") as string) || null;
  let deanId = (formData.get("deanId") as string) || null;
  const coordinatorId = (formData.get("coordinatorId") as string) || null;

  if (session.user.role === "hod") {
    // If updating, preserve old HOD and Dean
    if (id) {
      const [existing] = await db.select().from(authorityMappings).where(eq(authorityMappings.id, id)).limit(1);
      if (existing) {
        hodId = existing.hodId;
        deanId = existing.deanId;
      }
    }
  }

  if (!school || !section || !course || !programType || !department || !year) {
    return { error: "All hierarchy fields (School, Section, Course, Program, Dept, Year) are required." };
  }

  try {
    if (id) {
      // Update by ID
      await db
        .update(authorityMappings)
        .set({
          school,
          section,
          course,
          programType,
          department,
          year,
          tutorId,
          hodId,
          deanId,
          placementCoordinatorId: coordinatorId,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(authorityMappings.id, id));
    } else {
      // Insert
      await db.insert(authorityMappings).values({
        school,
        section,
        course,
        programType,
        department,
        year,
        tutorId,
        hodId,
        deanId,
        placementCoordinatorId: coordinatorId,
        updatedBy: session.user.id,
      });
    }

    revalidatePath("/settings/hierarchy");
    return { success: true };
  } catch (error: unknown) {
    console.error("Hierarchy mapping error:", error);
    return { error: `Failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

export async function deleteMapping(mappingId: string) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  if (!["placement_officer", "principal", "dean"].includes(session.user.role)) {
    return { error: "Unauthorized" };
  }

  try {
    await db.delete(authorityMappings).where(eq(authorityMappings.id, mappingId));
    revalidatePath("/settings/hierarchy");
    return { success: true };
  } catch (error: unknown) {
    return { error: `Failed: ${error instanceof Error ? error.message : String(error)}` };
  }
}

import { systemSettings } from "@/lib/db/schema";
import { COLLEGE_HIERARCHY as DEFAULT_HIERARCHY, type SchoolNode } from "@/lib/constants/hierarchy";
const DEAN_SCOPE_SECTION = "ALL";
const DEAN_SCOPE_YEAR = 0;
const MERGEABLE_MAPPING_ROLES = ["dean", "placement_officer", "principal", "mcr", "management_corporation"] as const;
const MERGE_ROLE_COLUMNS = [
  "tutorId",
  "placementCoordinatorId",
  "hodId",
  "deanId",
] as const;

function getMappingCompletenessScore(mapping: typeof authorityMappings.$inferSelect) {
  return MERGE_ROLE_COLUMNS.filter((column) => Boolean(mapping[column])).length;
}

function pickPreferredMapping(rows: Array<typeof authorityMappings.$inferSelect>) {
  return [...rows].sort((a, b) => {
    const scoreA = getMappingCompletenessScore(a);
    const scoreB = getMappingCompletenessScore(b);
    if (scoreA !== scoreB) return scoreB - scoreA;
    return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
  })[0];
}

function canSafelyMergeMappings(rows: Array<typeof authorityMappings.$inferSelect>) {
  return MERGE_ROLE_COLUMNS.every((column) => {
    const distinctValues = Array.from(new Set(rows.map((row) => row[column]).filter(Boolean)));
    return distinctValues.length <= 1;
  });
}

function getManageableStaffRoles(role: string) {
  if (role === "hod") {
    return ["tutor", "placement_coordinator"] as const;
  }
  if (role === "dean") {
    return ["tutor", "placement_coordinator", "hod"] as const;
  }
  if (role === "principal" || role === "mcr" || role === "management_corporation" || role === "placement_officer") {
    return ["tutor", "placement_coordinator", "hod", "dean"] as const;
  }
  return [] as const;
}

export async function getCollegeHierarchy(): Promise<SchoolNode[]> {
  try {
    const [record] = await db.select().from(systemSettings).where(eq(systemSettings.key, "COLLEGE_HIERARCHY")).limit(1);
    if (record && record.value && Array.isArray(record.value)) {
      return record.value as SchoolNode[];
    }
    return DEFAULT_HIERARCHY;
  } catch (e) {
    console.error("Failed to fetch dynamic hierarchy:", e);
    return DEFAULT_HIERARCHY;
  }
}

export async function saveCollegeHierarchy(newHierarchy: any) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "dean") {
    return { error: "Unauthorized. Only Deans can edit the college structure." };
  }

  try {
    await db.insert(systemSettings)
      .values({
        key: "COLLEGE_HIERARCHY",
        value: newHierarchy,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: systemSettings.key,
        set: { value: newHierarchy, updatedAt: new Date() },
      });
      
    revalidatePath("/", "layout"); // Revalidate entire app to reflect structural changes
    return { success: true };
  } catch (error: unknown) {
    console.error("Failed to save hierarchy:", error);
    return { error: "Failed to save college structure." };
  }
}

export async function selfProvisionScope(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  const role = session.user.role;
  const userId = session.user.id;

  const validRoles = ["tutor", "placement_coordinator", "hod", "dean"];
  if (!validRoles.includes(role)) {
    return { error: "Only staff can self-provision scope." };
  }

  const school = formData.get("school") as string;
  const department = formData.get("department") as string;
  const course = formData.get("course") as string;
  const year = formData.get("year") ? parseInt(formData.get("year") as string, 10) : NaN;
  const section = formData.get("section") as string;
  const programType = formData.get("programType") as string || "UG";

  if (!school) {
    return { error: "School is required." };
  }

  if (role === "dean") {
    try {
      await db.insert(authorityMappings).values({
        school,
        department: department || "General",
        section: DEAN_SCOPE_SECTION,
        year: DEAN_SCOPE_YEAR,
        deanId: userId,
        updatedBy: userId,
        updatedAt: new Date(),
      });
      revalidatePath("/");
      return { success: true };
    } catch (error: any) {
      return { error: error?.message || "Failed to provision dean scope." };
    }
  }

  if (!department || !course || !section) {
    return { error: "Missing required scope fields." };
  }

  if (role === "tutor" && (!Number.isInteger(year) || year < 1)) {
    return { error: "Tutor scope requires a valid year." };
  }

  try {
    const updateData: any = {
      school,
      department,
      course,
      year: Number.isInteger(year) ? year : DEAN_SCOPE_YEAR,
      section,
      programType,
      updatedBy: userId,
      updatedAt: new Date(),
    };

    if (role === "tutor") updateData.tutorId = userId;
    else if (role === "placement_coordinator") updateData.placementCoordinatorId = userId;
    else if (role === "hod") updateData.hodId = userId;
    else if (role === "dean") updateData.deanId = userId;

    await db.insert(authorityMappings).values(updateData);
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { error: error?.message || "Failed to provision scope." };
  }
}

export async function updateManagedUserScope(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };

  const allowedRoles = getManageableStaffRoles(session.user.role);
  if (allowedRoles.length === 0) {
    return { error: "Unauthorized" };
  }

  const targetUserId = String(formData.get("targetUserId") || "").trim();
  if (!targetUserId) return { error: "Target user is required." };

  const [targetUser] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!targetUser) return { error: "Target user not found." };
  if (!allowedRoles.some((role) => role === targetUser.role)) {
    return { error: "You cannot edit this user's scope." };
  }

  const school = String(formData.get("school") || "").trim();
  const section = String(formData.get("section") || "").trim();
  const course = String(formData.get("course") || "").trim();
  const programType = String(formData.get("programType") || "").trim();
  const department = String(formData.get("department") || "").trim();
  const yearRaw = String(formData.get("year") || "").trim();
  const batchStartYearRaw = String(formData.get("batchStartYear") || "").trim();
  const batchEndYearRaw = String(formData.get("batchEndYear") || "").trim();

  if (!school) return { error: "School is required." };

  const roleColumn =
    targetUser.role === "tutor"
      ? "tutorId"
      : targetUser.role === "placement_coordinator"
        ? "placementCoordinatorId"
        : targetUser.role === "hod"
          ? "hodId"
          : "deanId";

  try {
    const existingMappings = await db.select().from(authorityMappings);
    const existing = existingMappings.find((mapping) => {
      if (roleColumn === "tutorId") return mapping.tutorId === targetUserId;
      if (roleColumn === "placementCoordinatorId") return mapping.placementCoordinatorId === targetUserId;
      if (roleColumn === "hodId") return mapping.hodId === targetUserId;
      return mapping.deanId === targetUserId;
    });

    if (targetUser.role === "dean") {
      const deanValues = {
        school,
        department: department || "General",
        section: DEAN_SCOPE_SECTION,
        year: DEAN_SCOPE_YEAR,
        updatedBy: session.user.id,
        updatedAt: new Date(),
        deanId: targetUserId,
      };

      if (existing) {
        await db.update(authorityMappings).set(deanValues).where(eq(authorityMappings.id, existing.id));
      } else {
        await db.insert(authorityMappings).values(deanValues);
      }
    } else {
      if (!department || !section || !course || !programType) {
        return { error: "School, section, course, program, and department are required." };
      }

      const parsedYear = yearRaw ? Number(yearRaw) : targetUser.role === "tutor" ? NaN : DEAN_SCOPE_YEAR;
      if (targetUser.role === "tutor" && (!Number.isInteger(parsedYear) || parsedYear < 1)) {
        return { error: "Tutor scope requires a valid year." };
      }

      const mappingValues: Record<string, unknown> = {
        school,
        section,
        course,
        programType,
        department,
        year: Number.isInteger(parsedYear) ? parsedYear : DEAN_SCOPE_YEAR,
        batchStartYear: batchStartYearRaw ? Number(batchStartYearRaw) : null,
        batchEndYear: batchEndYearRaw ? Number(batchEndYearRaw) : null,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      };

      if (roleColumn === "tutorId") mappingValues.tutorId = targetUserId;
      if (roleColumn === "placementCoordinatorId") mappingValues.placementCoordinatorId = targetUserId;
      if (roleColumn === "hodId") mappingValues.hodId = targetUserId;

      if (existing) {
        await db.update(authorityMappings).set(mappingValues).where(eq(authorityMappings.id, existing.id));
      } else {
        await db.insert(authorityMappings).values(mappingValues as typeof authorityMappings.$inferInsert);
      }
    }

    revalidatePath("/users");
    revalidatePath("/students");
    revalidatePath("/dashboard/staff");
    revalidatePath("/settings/hierarchy");
    return { success: true };
  } catch (error: unknown) {
    console.error("Managed user scope update error:", error);
    return { error: error instanceof Error ? error.message : "Failed to update user scope." };
  }
}

export async function mergeDuplicateMappings(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  if (!MERGEABLE_MAPPING_ROLES.includes(session.user.role as (typeof MERGEABLE_MAPPING_ROLES)[number])) {
    return { error: "Unauthorized" };
  }

  const keeperId = String(formData.get("keeperId") || "").trim();
  const duplicateIdsRaw = String(formData.get("duplicateIds") || "").trim();
  const duplicateIds = duplicateIdsRaw.split(",").map((id) => id.trim()).filter(Boolean);

  if (!keeperId || duplicateIds.length === 0) {
    return { error: "Keeper and duplicate mapping ids are required." };
  }

  try {
    const allIds = [keeperId, ...duplicateIds];
    const mappings = await db.select().from(authorityMappings);
    const selectedMappings = mappings.filter((mapping) => allIds.includes(mapping.id));
    const keeper = selectedMappings.find((mapping) => mapping.id === keeperId);

    if (!keeper) {
      return { error: "Keeper mapping not found." };
    }

    const mergedValues: Record<string, unknown> = {
      tutorId: keeper.tutorId,
      placementCoordinatorId: keeper.placementCoordinatorId,
      hodId: keeper.hodId,
      deanId: keeper.deanId,
    };

    for (const mapping of selectedMappings) {
      for (const roleColumn of MERGE_ROLE_COLUMNS) {
        const currentValue = mergedValues[roleColumn] as string | null | undefined;
        const nextValue = mapping[roleColumn];
        if (!currentValue && nextValue) {
          mergedValues[roleColumn] = nextValue;
          continue;
        }
        if (currentValue && nextValue && currentValue !== nextValue) {
          return {
            error: `Cannot auto-merge because ${roleColumn} differs across duplicate rows.`,
          };
        }
      }
    }

    await db
      .update(authorityMappings)
      .set({
        tutorId: mergedValues.tutorId as string | null | undefined,
        placementCoordinatorId: mergedValues.placementCoordinatorId as string | null | undefined,
        hodId: mergedValues.hodId as string | null | undefined,
        deanId: mergedValues.deanId as string | null | undefined,
        updatedBy: session.user.id,
        updatedAt: new Date(),
      })
      .where(eq(authorityMappings.id, keeperId));

    for (const duplicateId of duplicateIds) {
      await db.delete(authorityMappings).where(eq(authorityMappings.id, duplicateId));
    }

    revalidatePath("/settings/hierarchy");
    revalidatePath("/settings/hierarchy-audit");
    revalidatePath("/users");
    revalidatePath("/students");
    return { success: true };
  } catch (error: unknown) {
    console.error("Duplicate mapping merge error:", error);
    return { error: error instanceof Error ? error.message : "Failed to merge duplicate mappings." };
  }
}

export async function mergeAllSafeDuplicateMappings() {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  if (!MERGEABLE_MAPPING_ROLES.includes(session.user.role as (typeof MERGEABLE_MAPPING_ROLES)[number])) {
    return { error: "Unauthorized" };
  }

  try {
    const mappings = await db.select().from(authorityMappings);
    const groupedMappings = new Map<string, Array<typeof authorityMappings.$inferSelect>>();

    for (const mapping of mappings) {
      const key = [
        mapping.school || "",
        mapping.section || "",
        mapping.course || "",
        mapping.programType || "",
        mapping.department || "",
        mapping.year || 0,
      ].join("|");

      groupedMappings.set(key, [...(groupedMappings.get(key) || []), mapping]);
    }

    let mergedGroups = 0;
    let deletedRows = 0;
    let skippedGroups = 0;

    for (const rows of groupedMappings.values()) {
      if (rows.length <= 1) continue;
      if (!canSafelyMergeMappings(rows)) {
        skippedGroups += 1;
        continue;
      }

      const keeper = pickPreferredMapping(rows);
      const duplicates = rows.filter((row) => row.id !== keeper.id);
      if (duplicates.length === 0) continue;

      const mergedValues: Record<string, string | null | undefined> = {
        tutorId: keeper.tutorId,
        placementCoordinatorId: keeper.placementCoordinatorId,
        hodId: keeper.hodId,
        deanId: keeper.deanId,
      };

      for (const row of rows) {
        for (const roleColumn of MERGE_ROLE_COLUMNS) {
          if (!mergedValues[roleColumn] && row[roleColumn]) {
            mergedValues[roleColumn] = row[roleColumn];
          }
        }
      }

      await db
        .update(authorityMappings)
        .set({
          tutorId: mergedValues.tutorId,
          placementCoordinatorId: mergedValues.placementCoordinatorId,
          hodId: mergedValues.hodId,
          deanId: mergedValues.deanId,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(authorityMappings.id, keeper.id));

      for (const duplicate of duplicates) {
        await db.delete(authorityMappings).where(eq(authorityMappings.id, duplicate.id));
      }

      mergedGroups += 1;
      deletedRows += duplicates.length;
    }

    revalidatePath("/settings/hierarchy");
    revalidatePath("/settings/hierarchy-audit");
    revalidatePath("/users");
    revalidatePath("/students");

    return {
      success: true,
      mergedGroups,
      deletedRows,
      skippedGroups,
    };
  } catch (error: unknown) {
    console.error("Bulk duplicate mapping merge error:", error);
    return { error: error instanceof Error ? error.message : "Failed to merge safe duplicate mappings." };
  }
}
