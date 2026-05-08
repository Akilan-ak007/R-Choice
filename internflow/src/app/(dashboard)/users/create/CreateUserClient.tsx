"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2, GraduationCap, Building2 } from "lucide-react";
import { createUserAction } from "@/app/actions/admin";
import type { SchoolNode } from "@/lib/constants/hierarchy";

type Props = {
  currentRole: string;
  collegeHierarchy: SchoolNode[];
};

export function CreateUserClient({ currentRole, collegeHierarchy }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState("student");

  // Cascading selects state
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedProgramType, setSelectedProgramType] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const allowedRoles =
    currentRole === "tutor" || currentRole === "placement_coordinator"
      ? [{ value: "student", label: "Student" }]
      : currentRole === "hod"
        ? [
            { value: "student", label: "Student" },
            { value: "tutor", label: "Tutor" },
            { value: "placement_coordinator", label: "Placement Coordinator" },
          ]
        : currentRole === "dean"
          ? [
              { value: "student", label: "Student" },
              { value: "tutor", label: "Tutor" },
              { value: "placement_coordinator", label: "Placement Coordinator" },
              { value: "hod", label: "HOD (Head of Department)" },
            ]
          : [];

  const isStudentRole = selectedRole === "student";
  const isFacultyRole = ["tutor", "placement_coordinator", "hod", "dean"].includes(selectedRole);

  // Cascading hierarchy lookups
  const schoolNode = collegeHierarchy.find((s) => s.school === selectedSchool);
  const sectionNode = schoolNode?.sections.find((s) => s.section === selectedSection);
  const courseNodes = sectionNode?.courses || [];
  const courseNode = courseNodes.find(
    (c) => c.course === selectedCourse && c.programType === selectedProgramType
  );
  const departments = courseNode?.departments || [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createUserAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/users?role=student");
    }
  }

  const inputStyle = {
    padding: "10px",
    borderRadius: "8px",
    border: "1px solid var(--border-color)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    width: "100%",
  };

  const labelStyle = { fontSize: "0.875rem" as const, fontWeight: 500 as const };

  return (
    <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", paddingTop: "var(--space-6)" }}>
      <div className="card" style={{ width: "100%", maxWidth: "680px", padding: "var(--space-8)" }}>
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <ShieldAlert size={48} color="var(--color-primary)" style={{ margin: "0 auto", marginBottom: "var(--space-4)" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Create User Account</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>Create a new user inside your allowed management scope.</p>
        </div>

        {allowedRoles.length === 0 && (
          <div style={{ 
            color: "var(--color-danger)", 
            padding: "16px", 
            marginBottom: "var(--space-4)",
            background: "rgba(239, 68, 68, 0.1)", 
            borderRadius: "var(--radius-md)", 
            fontSize: "0.875rem",
            border: "1px solid rgba(239, 68, 68, 0.2)"
          }}>
            You do not have permission to create users from this page.
          </div>
        )}

        {error && (
          <div style={{ 
            color: "var(--color-danger)", 
            padding: "16px", 
            marginBottom: "var(--space-4)",
            background: "rgba(239, 68, 68, 0.1)", 
            borderRadius: "var(--radius-md)", 
            fontSize: "0.875rem",
            border: "1px solid rgba(239, 68, 68, 0.2)"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={labelStyle}>First Name</label>
              <input name="firstName" required placeholder="John" style={inputStyle} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={labelStyle}>Last Name</label>
              <input name="lastName" required placeholder="Doe" style={inputStyle} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={labelStyle}>Email Address</label>
            <input type="email" name="email" required placeholder="user@rathinam.edu.in" style={inputStyle} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={labelStyle}>Global Role</label>
              <select
                name="role"
                required
                disabled={allowedRoles.length === 0}
                value={selectedRole}
                onChange={(e) => {
                  setSelectedRole(e.target.value);
                  setSelectedSchool("");
                  setSelectedSection("");
                  setSelectedCourse("");
                  setSelectedProgramType("");
                  setSelectedDepartment("");
                }}
                style={inputStyle}
              >
                {allowedRoles.map((role) => (
                  <option key={role.value} value={role.value}>{role.label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={labelStyle}>System Password</label>
              <input type="password" name="password" required placeholder="Min. 8 characters" style={inputStyle} />
            </div>
          </div>

          {/* ── Student-specific fields ── */}
          {isStudentRole && (
            <div style={{
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              background: "var(--bg-secondary)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)", fontWeight: 600, fontSize: "0.9375rem" }}>
                <GraduationCap size={18} color="var(--color-primary)" />
                Student Profile Details
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Register Number *</label>
                  <input name="registerNo" required placeholder="e.g. 23BCACS101" style={inputStyle} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Year *</label>
                  <select name="year" required style={inputStyle}>
                    <option value="">Select Year</option>
                    {[1, 2, 3, 4, 5].map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>School *</label>
                  <select
                    name="school"
                    required
                    value={selectedSchool}
                    onChange={(e) => {
                      setSelectedSchool(e.target.value);
                      setSelectedSection("");
                      setSelectedCourse("");
                      setSelectedProgramType("");
                      setSelectedDepartment("");
                    }}
                    style={inputStyle}
                  >
                    <option value="">Select School</option>
                    {collegeHierarchy.map((s) => (
                      <option key={s.school} value={s.school}>{s.school}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Section *</label>
                  <select
                    name="section"
                    required
                    value={selectedSection}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setSelectedCourse("");
                      setSelectedProgramType("");
                      setSelectedDepartment("");
                    }}
                    disabled={!selectedSchool}
                    style={inputStyle}
                  >
                    <option value="">Select Section</option>
                    {schoolNode?.sections.map((sec) => (
                      <option key={sec.section} value={sec.section}>{sec.section}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Course *</label>
                  <select
                    name="course"
                    required
                    value={selectedCourse ? `${selectedCourse}|${selectedProgramType}` : ""}
                    onChange={(e) => {
                      const [course, programType] = e.target.value.split("|");
                      setSelectedCourse(course || "");
                      setSelectedProgramType(programType || "");
                      setSelectedDepartment("");
                    }}
                    disabled={!selectedSection}
                    style={inputStyle}
                  >
                    <option value="">Select Course</option>
                    {courseNodes.map((c) => (
                      <option key={`${c.course}-${c.programType}`} value={`${c.course}|${c.programType}`}>
                        {c.course} ({c.programType})
                      </option>
                    ))}
                  </select>
                  <input type="hidden" name="programType" value={selectedProgramType} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Department *</label>
                  <select
                    name="department"
                    required
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    disabled={!selectedCourse}
                    style={inputStyle}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Batch Start Year</label>
                  <input name="batchStartYear" type="number" placeholder="e.g. 2023" min={2000} max={2100} style={inputStyle} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Batch End Year</label>
                  <input name="batchEndYear" type="number" placeholder="e.g. 2026" min={2000} max={2100} style={inputStyle} />
                </div>
              </div>
            </div>
          )}

          {/* ── Faculty scope assignment ── */}
          {isFacultyRole && (
            <div style={{
              border: "1px solid var(--border-color)",
              borderRadius: "var(--radius-md)",
              padding: "var(--space-4)",
              background: "var(--bg-secondary)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)", fontWeight: 600, fontSize: "0.9375rem" }}>
                <Building2 size={18} color="var(--color-primary)" />
                {selectedRole === "dean" ? "Dean Scope Assignment" : "Faculty Scope Assignment"}
              </div>
              <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", margin: "0 0 var(--space-3) 0" }}>
                {selectedRole === "dean" 
                  ? "Assign this Dean to a specific school." 
                  : "Assign this faculty member to a specific school, section, course, and department. This determines which students they can manage."}
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>School *</label>
                  <select
                    name="school"
                    required
                    value={selectedSchool}
                    onChange={(e) => {
                      setSelectedSchool(e.target.value);
                      setSelectedSection("");
                      setSelectedCourse("");
                      setSelectedProgramType("");
                      setSelectedDepartment("");
                    }}
                    style={inputStyle}
                  >
                    <option value="">Select School</option>
                    {collegeHierarchy.map((s) => (
                      <option key={s.school} value={s.school}>{s.school}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Section {selectedRole !== "dean" ? "*" : ""}</label>
                  <select
                    name="section"
                    required={selectedRole !== "dean"}
                    value={selectedSection}
                    onChange={(e) => {
                      setSelectedSection(e.target.value);
                      setSelectedCourse("");
                      setSelectedProgramType("");
                      setSelectedDepartment("");
                    }}
                    disabled={!selectedSchool || selectedRole === "dean"}
                    style={inputStyle}
                  >
                    <option value="">Select Section</option>
                    {schoolNode?.sections.map((sec) => (
                      <option key={sec.section} value={sec.section}>{sec.section}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Course {selectedRole !== "dean" ? "*" : ""}</label>
                  <select
                    name="course"
                    required={selectedRole !== "dean"}
                    value={selectedCourse ? `${selectedCourse}|${selectedProgramType}` : ""}
                    onChange={(e) => {
                      const [course, programType] = e.target.value.split("|");
                      setSelectedCourse(course || "");
                      setSelectedProgramType(programType || "");
                      setSelectedDepartment("");
                    }}
                    disabled={!selectedSection || selectedRole === "dean"}
                    style={inputStyle}
                  >
                    <option value="">Select Course</option>
                    {courseNodes.map((c) => (
                      <option key={`${c.course}-${c.programType}`} value={`${c.course}|${c.programType}`}>
                        {c.course} ({c.programType})
                      </option>
                    ))}
                  </select>
                  <input type="hidden" name="programType" value={selectedProgramType} />
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Department {selectedRole !== "dean" ? "*" : ""}</label>
                  <select
                    name="department"
                    required={selectedRole !== "dean"}
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    disabled={!selectedCourse || selectedRole === "dean"}
                    style={inputStyle}
                  >
                    <option value="">Select Department</option>
                    {departments.map((d) => (
                      <option key={d.name} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Year {selectedRole === "tutor" ? "*" : ""}</label>
                  <select name="year" required={selectedRole === "tutor"} defaultValue="" style={inputStyle}>
                    <option value="">All Years</option>
                    {[1, 2, 3, 4, 5].map((y) => (
                      <option key={y} value={y}>Year {y}</option>
                    ))}
                  </select>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <label style={labelStyle}>Batch Period</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input name="batchStartYear" type="number" placeholder="Start" min={2000} max={2100} style={{ ...inputStyle, width: "50%" }} />
                    <input name="batchEndYear" type="number" placeholder="End" min={2000} max={2100} style={{ ...inputStyle, width: "50%" }} />
                  </div>
                </div>
              </div>
            </div>
          )}

          <button type="submit" className="button" disabled={loading || allowedRoles.length === 0} style={{ marginTop: "var(--space-4)", width: "100%", justifyContent: "center", height: "45px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
          </button>
        </form>
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
