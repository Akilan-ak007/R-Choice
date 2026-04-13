import { db } from "@/lib/db";
import { internshipRequests, users, authorityMappings } from "@/lib/db/schema";
import { eq, lte, desc, and } from "drizzle-orm";

export async function getFilteredRequestsForStaff(userId: string, role: string, filterStatus: string = "pending") {
  let targetStatus = "none";
  
  if (filterStatus === "approved") targetStatus = "approved";
  else if (filterStatus === "rejected") targetStatus = "rejected";
  else {
    if (role === "tutor") targetStatus = "pending_tutor";
    else if (role === "placement_coordinator") targetStatus = "pending_coordinator";
    else if (role === "hod") targetStatus = "pending_hod";
    else if (role === "dean" || role === "placement_officer" || role === "principal") targetStatus = "pending_admin";
  }

  if (targetStatus === "none") return [];

  let condition: any = undefined;

  if (filterStatus === "pending") {
    const baseConditions = [eq(internshipRequests.status, targetStatus as any)];
    if (role === "dean" || role === "placement_officer" || role === "principal") {
      if (role === "dean") baseConditions.push(eq(internshipRequests.currentTier, 4));
      else if (role === "placement_officer") baseConditions.push(eq(internshipRequests.currentTier, 5));
      else if (role === "principal") baseConditions.push(eq(internshipRequests.currentTier, 6));
    }
    condition = and(...baseConditions);
  } else if (filterStatus === "approved") {
    condition = eq(internshipRequests.status, "approved");
  } else if (filterStatus === "rejected") {
    condition = eq(internshipRequests.status, "rejected");
  }

  const reqs = await db
    .select({
      id: internshipRequests.id,
      role: internshipRequests.role,
      companyName: internshipRequests.companyName,
      applicationType: internshipRequests.applicationType,
      status: internshipRequests.status,
      submittedAt: internshipRequests.submittedAt,
      studentName: users.firstName,
    })
    .from(internshipRequests)
    .innerJoin(users, eq(internshipRequests.studentId, users.id))
    .where(condition)
    .orderBy(desc(internshipRequests.submittedAt));

  return reqs;
}

export async function getPendingRequestsForStaff(userId: string, role: string) {
  return getFilteredRequestsForStaff(userId, role, "pending");
}
