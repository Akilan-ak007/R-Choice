"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, studentProfiles, internshipRequests } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const EXPORT_ROLES = ["tutor", "placement_coordinator", "hod", "dean", "placement_officer", "coe", "management_corporation", "principal", "company", "company_staff"];

export async function exportStudentData(columns: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  if (!EXPORT_ROLES.includes(session.user.role)) return { error: "Unauthorized" };

  try {
    const students = await db
      .select({
        userId: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        registerNo: studentProfiles.registerNo,
        school: studentProfiles.school,
        department: studentProfiles.department,
        course: studentProfiles.course,
        section: studentProfiles.section,
        year: studentProfiles.year,
        batchStartYear: studentProfiles.batchStartYear,
        batchEndYear: studentProfiles.batchEndYear,
        program: studentProfiles.program,
        cgpa: studentProfiles.cgpa,
      })
      .from(users)
      .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .where(eq(users.role, "student"));

    // Filter to only requested columns
    const filteredData = students.map(s => {
      const row: Record<string, unknown> = {};
      for (const col of columns) {
        if (col in s) row[col] = (s as Record<string, unknown>)[col];
      }
      return row;
    });

    return { success: true, data: filteredData, columns };
  } catch (error) {
    console.error("Export error:", error);
    return { error: "Failed to export data" };
  }
}

export async function exportInternshipData(columns: string[]) {
  const session = await auth();
  if (!session?.user?.id) return { error: "Not authenticated" };
  if (!EXPORT_ROLES.includes(session.user.role)) return { error: "Unauthorized" };

  try {
    const requests = await db
      .select({
        studentName: users.firstName,
        studentLastName: users.lastName,
        email: users.email,
        companyName: internshipRequests.companyName,
        role: internshipRequests.role,
        status: internshipRequests.status,
        startDate: internshipRequests.startDate,
        endDate: internshipRequests.endDate,
        applicationType: internshipRequests.applicationType,
        submittedAt: internshipRequests.submittedAt,
      })
      .from(internshipRequests)
      .innerJoin(users, eq(internshipRequests.studentId, users.id));

    const filteredData = requests.map(r => {
      const row: Record<string, unknown> = {};
      for (const col of columns) {
        if (col in r) row[col] = (r as Record<string, unknown>)[col];
      }
      return row;
    });

    return { success: true, data: filteredData, columns };
  } catch (error) {
    console.error("Export error:", error);
    return { error: "Failed to export data" };
  }
}
