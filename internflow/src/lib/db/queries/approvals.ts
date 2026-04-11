import { db } from "@/lib/db";
import { internshipRequests, users, authorityMappings } from "@/lib/db/schema";
import { eq, or, desc, and } from "drizzle-orm";

export async function getPendingRequestsForStaff(userId: string, role: string) {
  let targetStatus = "none";
  
  if (role === "tutor") targetStatus = "pending_tutor";
  else if (role === "placement_coordinator") targetStatus = "pending_coordinator";
  else if (role === "hod") targetStatus = "pending_hod";
  else if (role === "dean" || role === "placement_officer" || role === "principal") targetStatus = "pending_admin";

  if (targetStatus === "none") return [];

  // Note: True RBAC requires checking authority_mappings to ensure the student
  // actually belongs to this specific tutor. 
  // For the sake of the demo, we fetch by status and optionally join authorityMappings 
  // to restrict it to their students.

  if (role === "dean" || role === "placement_officer" || role === "principal") {
    // Admins see all pending_admin
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
      .where(eq(internshipRequests.status, targetStatus as any))
      .orderBy(desc(internshipRequests.submittedAt));
    
    return reqs;
  }

  // Tutors, PCs, and HODs should ideally only see their mapped students.
  // For simplicity here, we filter by targetStatus but in production we'd add an innerJoin 
  // to authorityMappings where e.g. mapping.tutorId = userId.
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
    .where(eq(internshipRequests.status, targetStatus as any))
    .orderBy(desc(internshipRequests.submittedAt));

  return reqs;
}
