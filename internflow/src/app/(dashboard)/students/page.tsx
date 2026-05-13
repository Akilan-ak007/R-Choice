import { db } from "@/lib/db";
import { users, studentProfiles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { buildStudentVisibilityCondition, getAuthorityMappingsForRole } from "@/lib/authority-scope";
import { redirect } from "next/navigation";
import StudentsClient from "./StudentsClient";

export default async function StudentsPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const queryParam = (searchParams.q || "").toLowerCase();
  
  // Extract filters from searchParams
  const schoolFilter = searchParams.school;
  const departmentFilter = searchParams.department;
  const courseFilter = searchParams.course;
  const yearFilter = searchParams.year;
  const sectionFilter = searchParams.section;

  const session = await auth();
  const userRole = session?.user?.role;
  const userId = session?.user?.id;

  if (userRole === "tutor") {
    redirect("/users?role=student");
  }
  if (userRole === "company" || userRole === "company_staff") {
    redirect("/applicants");
  }

  const hideSchoolDepartmentFilters = ["placement_coordinator", "hod"].includes(userRole || "");
  const scopeMappings = userId && userRole
    ? await getAuthorityMappingsForRole(userId, userRole)
    : [];

  const hierarchyConditions = userId && userRole
    ? await buildStudentVisibilityCondition(userId, userRole)
    : undefined;

  const baseConditions = [eq(users.role, "student")];
  if (hierarchyConditions) baseConditions.push(hierarchyConditions!);
  
  // Apply explicit filters if provided (mostly for full-access roles)
  if (schoolFilter && !hideSchoolDepartmentFilters) baseConditions.push(eq(studentProfiles.school, schoolFilter));
  if (departmentFilter && !hideSchoolDepartmentFilters) baseConditions.push(eq(studentProfiles.department, departmentFilter));
  if (courseFilter) baseConditions.push(eq(studentProfiles.course, courseFilter));
  if (yearFilter && Number.isInteger(Number(yearFilter))) {
    baseConditions.push(eq(studentProfiles.year, Number(yearFilter)));
  }
  if (sectionFilter) baseConditions.push(eq(studentProfiles.section, sectionFilter));
  
  // High-level roles (admin, principal, dean) MUST apply at least one filter 
  // to avoid loading thousands of students at once. 
  // If no filters are applied, return empty array for them, OR just limit the query.
  // We will pass down a flag to StudentsClient to tell it that filters are required.
  const isHighLevelRole = ["admin", "principal", "dean"].includes(userRole || "");
  const hasFilters = !!(schoolFilter || departmentFilter || courseFilter || yearFilter || sectionFilter || queryParam);
  
  // If it's a high-level role and no filters are applied, we don't query the DB yet.
  let students: any[] = [];
  const filtersRequired = isHighLevelRole && !hasFilters;

  if (!filtersRequired) {
    let queryStudents = await db
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
      .where(and(...baseConditions))
      .limit(1000); // add limit to prevent huge loads even with filters

    if (queryParam) {
      queryStudents = queryStudents.filter(s => 
        s.firstName.toLowerCase().includes(queryParam) || 
        s.lastName.toLowerCase().includes(queryParam) ||
        (s.email && s.email.toLowerCase().includes(queryParam))
      );
    }
    students = queryStudents;
  }

  return (
    <div className="dashboard-shell animate-fade-in">
      {scopeMappings.length > 0 && (
        <section className="hero-panel" style={{ padding: "var(--space-6)" }}>
          <div>
            <span className="hero-badge" style={{ marginBottom: "var(--space-3)" }}>Student visibility map</span>
            <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Your Student Visibility Scope</h2>
            <p style={{ margin: "6px 0 0 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
              This identity view explains why students appear in your directory and how class-based filtering works for your role.
            </p>
          </div>
          <div className="scope-grid">
            {scopeMappings.map((mapping) => (
              <div key={mapping.id} className="scope-card">
                <div className="scope-card-title">
                  {(userRole || "staff").replaceAll("_", " ")}
                </div>
                <div className="scope-meta">
                  {mapping.school && <span className="scope-chip">School: {mapping.school}</span>}
                  {mapping.department && <span className="scope-chip">Dept: {mapping.department}</span>}
                  {mapping.course && <span className="scope-chip">Class: {mapping.course}</span>}
                  {mapping.programType && <span className="scope-chip">Program: {mapping.programType}</span>}
                  {mapping.section && mapping.section !== "ALL" && <span className="scope-chip">Section: {mapping.section}</span>}
                  {mapping.year && mapping.year > 0 && <span className="scope-chip">Year: {mapping.year}</span>}
                  {mapping.batchStartYear && mapping.batchEndYear && <span className="scope-chip">Batch: {mapping.batchStartYear} - {mapping.batchEndYear}</span>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <StudentsClient 
        initialStudents={students as any} 
        queryParam={queryParam}
        activeFilters={{
          school: hideSchoolDepartmentFilters ? "" : schoolFilter || "",
          department: hideSchoolDepartmentFilters ? "" : departmentFilter || "",
          course: courseFilter || "",
          year: yearFilter || "",
          section: sectionFilter || "",
        }}
        filtersRequired={filtersRequired}
        role={userRole || ""}
      />
    </div>
  );
}
