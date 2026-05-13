import { db } from "@/lib/db";
import { internshipRequests, users } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function getFilteredRequestsForStaff(userId: string, role: string, filterStatus: string = "pending", page: number = 1, pageSize: number = 25) {
  let targetStatus = "none";

  if (filterStatus === "approved") targetStatus = "approved";
  else if (filterStatus === "rejected") targetStatus = "rejected";
  else {
    if (role === "tutor") targetStatus = "pending_tutor";
    else if (role === "placement_coordinator") targetStatus = "pending_coordinator";
    else if (role === "hod") targetStatus = "pending_hod";
    else if (role === "dean") targetStatus = "pending_dean";
    else if (role === "placement_officer") targetStatus = "pending_po";
    else if (role === "coe") targetStatus = "pending_coe";
    else if (role === "principal") targetStatus = "pending_principal";
  }

  if (targetStatus === "none") return { data: [], totalPages: 0 };

  let condition = undefined;

  if (filterStatus === "pending") {
    const baseConditions = [eq(internshipRequests.status, targetStatus as "draft" | "pending_tutor" | "pending_coordinator" | "pending_hod" | "pending_dean" | "pending_po" | "pending_coe" | "pending_principal" | "approved" | "rejected" | "returned")];
    if (role === "dean" || role === "placement_officer" || role === "coe" || role === "principal") {
      if (role === "dean") baseConditions.push(eq(internshipRequests.currentTier, 4));
      else if (role === "placement_officer") baseConditions.push(eq(internshipRequests.currentTier, 5));
      else if (role === "coe") baseConditions.push(eq(internshipRequests.currentTier, 6));
      else if (role === "principal") baseConditions.push(eq(internshipRequests.currentTier, 7));
    }
    condition = and(...baseConditions);
  } else if (filterStatus === "downward") {
    const activeStatuses = ["pending_tutor", "pending_coordinator", "pending_hod", "pending_dean", "pending_po", "pending_coe", "pending_principal"];
    const baseConditions = [sql`${internshipRequests.status} IN (${sql.join(activeStatuses.map(s => sql`${s}`), sql`, `)})`];
    
    if (role === "dean") baseConditions.push(sql`${internshipRequests.currentTier} < 4`);
    else if (role === "hod") baseConditions.push(sql`${internshipRequests.currentTier} < 3`);
    else if (role === "placement_coordinator") baseConditions.push(sql`${internshipRequests.currentTier} < 2`);
    else if (role === "placement_officer") baseConditions.push(sql`${internshipRequests.currentTier} < 5`);
    else if (role === "coe") baseConditions.push(sql`${internshipRequests.currentTier} < 6`);
    else if (role === "principal") baseConditions.push(sql`${internshipRequests.currentTier} < 7`);
    else baseConditions.push(sql`1=0`); // Should not be accessible for lower roles

    condition = and(...baseConditions);
  } else if (filterStatus === "approved") {
    condition = eq(internshipRequests.status, "approved");
  } else if (filterStatus === "rejected") {
    condition = eq(internshipRequests.status, "rejected");
  }

  const limitCount = pageSize;
  const offsetCount = (page - 1) * pageSize;

  let hierarchyConditions = undefined;
  if (["tutor", "placement_coordinator", "hod", "dean"].includes(role)) {
    const { authorityMappings, studentProfiles } = require("@/lib/db/schema");
    const { or, eq, sql, and } = require("drizzle-orm");
    let mappingCondition;
    if (role === "tutor") mappingCondition = eq(authorityMappings.tutorId, userId);
    else if (role === "placement_coordinator") mappingCondition = eq(authorityMappings.placementCoordinatorId, userId);
    else if (role === "hod") mappingCondition = eq(authorityMappings.hodId, userId);
    else if (role === "dean") mappingCondition = eq(authorityMappings.deanId, userId);

    if (mappingCondition) {
      const mappings = await db.select().from(authorityMappings).where(mappingCondition);
      if (mappings.length > 0) {
        const matchConditions = mappings.map((m: any) => {
          const conds = [
            eq(studentProfiles.department, m.department),
            eq(studentProfiles.year, m.year),
            eq(studentProfiles.section, m.section)
          ];
          if (m.school) conds.push(eq(studentProfiles.school, m.school));
          if (m.course) conds.push(eq(studentProfiles.course, m.course));
          if (m.programType) conds.push(eq(studentProfiles.programType, m.programType));
          if (m.batchStartYear) conds.push(eq(studentProfiles.batchStartYear, m.batchStartYear));
          if (m.batchEndYear) conds.push(eq(studentProfiles.batchEndYear, m.batchEndYear));
          return and(...conds);
        });
        hierarchyConditions = or(...matchConditions);
      } else {
        hierarchyConditions = sql`1=0`;
      }
    }
  }

  const { studentProfiles } = require("@/lib/db/schema");
  const finalCondition = hierarchyConditions ? and(condition, hierarchyConditions) : condition;

  const [countResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(internshipRequests)
    .innerJoin(users, eq(internshipRequests.studentId, users.id))
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(finalCondition);

  const totalRecords = countResult?.count || 0;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const reqs = await db
    .select({
      id: internshipRequests.id,
      studentId: internshipRequests.studentId,
      role: internshipRequests.role,
      companyName: internshipRequests.companyName,
      applicationType: internshipRequests.applicationType,
      status: internshipRequests.status,
      submittedAt: internshipRequests.submittedAt,
      updatedAt: internshipRequests.updatedAt,
      currentTier: internshipRequests.currentTier,
      currentTierEnteredAt: internshipRequests.currentTierEnteredAt,
      currentTierSlaHours: internshipRequests.currentTierSlaHours,
      studentName: users.firstName,
    })
    .from(internshipRequests)
    .innerJoin(users, eq(internshipRequests.studentId, users.id))
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(finalCondition)
    .orderBy(desc(internshipRequests.submittedAt))
    .limit(limitCount)
    .offset(offsetCount);

  return {
    data: reqs,
    totalPages
  };
}

export async function getPendingRequestsForStaff(userId: string, role: string, page = 1) {
  return getFilteredRequestsForStaff(userId, role, "pending", page);
}
