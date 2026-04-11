import { db } from "@/lib/db";
import { users, studentProfiles } from "@/lib/db/schema";
import { GraduationCap, Award, BookOpen } from "lucide-react";
import { eq } from "drizzle-orm";

export default async function StudentsPage() {
  const students = await db
    .select({
      id: studentProfiles.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      department: studentProfiles.department,
      year: studentProfiles.year,
      section: studentProfiles.section,
      phone: users.phone
    })
    .from(studentProfiles)
    .innerJoin(users, eq(users.id, studentProfiles.userId));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Student Directory</h1>
        <p>Comprehensive list of all registered students and their academic profiles.</p>
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Student Name</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Department</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Batch / Section</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Contact Info</th>
              </tr>
            </thead>
            <tbody>
              {students.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
                    No students have registered their profiles yet.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ fontWeight: 600 }}>{student.firstName} {student.lastName}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{student.email}</div>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <GraduationCap size={16} color="var(--primary-color)" />
                        {student.department || "Unassigned"}
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-4)", color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", gap: "var(--space-3)" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Award size={14} /> Yr {student.year || "-"}
                        </span>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <BookOpen size={14} /> Sec {student.section || "-"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                        {student.phone || "No contact saved"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
