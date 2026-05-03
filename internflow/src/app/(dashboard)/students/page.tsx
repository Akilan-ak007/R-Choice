import { db } from "@/lib/db";
import { users, studentProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { buildStudentVisibilityCondition } from "@/lib/authority-scope";
import StudentsClient from "./StudentsClient";

export default async function StudentsPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const queryParam = (searchParams.q || "").toLowerCase();
  const session = await auth();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  const hierarchyConditions = userId && userRole
    ? await buildStudentVisibilityCondition(userId, userRole)
    : undefined;

  const baseConditions = [eq(users.role, "student")];
  if (hierarchyConditions) baseConditions.push(hierarchyConditions!);

  let students = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      department: studentProfiles.department,
      year: studentProfiles.year,
      section: studentProfiles.section,
      school: studentProfiles.school,
      program: studentProfiles.program,
      course: studentProfiles.course,
      batchStartYear: studentProfiles.batchStartYear,
      batchEndYear: studentProfiles.batchEndYear,
      phone: users.phone,
      registerNo: studentProfiles.registerNo,
      cgpa: studentProfiles.cgpa,
      dob: studentProfiles.dob,
      professionalSummary: studentProfiles.professionalSummary,
      githubLink: studentProfiles.githubLink,
      linkedinLink: studentProfiles.linkedinLink,
      portfolioUrl: studentProfiles.portfolioUrl
    })
    .from(users)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(and(...baseConditions));

  if (queryParam) {
    students = students.filter(s => 
      s.firstName.toLowerCase().includes(queryParam) || 
      s.lastName.toLowerCase().includes(queryParam) ||
      (s.email && s.email.toLowerCase().includes(queryParam))
    );
  }

  return (
    <StudentsClient initialStudents={students as any} queryParam={queryParam} />
  );
}
