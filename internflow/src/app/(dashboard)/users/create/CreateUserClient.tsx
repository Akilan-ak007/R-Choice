"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  GraduationCap,
  Loader2,
  ShieldAlert,
  Sparkles,
  UserCog,
  Users,
} from "lucide-react";

import { createUserAction } from "@/app/actions/admin";
import type { SchoolNode } from "@/lib/constants/hierarchy";

type Props = {
  currentRole: string;
  collegeHierarchy: SchoolNode[];
};

type StepId = 1 | 2 | 3;

type RoleOption = {
  value: string;
  label: string;
  icon: React.ReactNode;
  summary: string;
};

const inputStyle = {
  padding: "10px",
  borderRadius: "10px",
  border: "1px solid var(--border-color)",
  background: "var(--bg-primary)",
  color: "var(--text-primary)",
  width: "100%",
} as const;

const labelStyle = { fontSize: "0.875rem" as const, fontWeight: 600 as const };

export function CreateUserClient({ currentRole, collegeHierarchy }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<StepId>(1);

  const allowedRoles: RoleOption[] =
    currentRole === "tutor" || currentRole === "placement_coordinator"
      ? [{ value: "student", label: "Student", icon: <GraduationCap size={18} />, summary: "Create a student inside your assigned academic scope." }]
      : currentRole === "hod"
        ? [
            { value: "student", label: "Student", icon: <GraduationCap size={18} />, summary: "Add a student under your department scope." },
            { value: "tutor", label: "Tutor", icon: <Users size={18} />, summary: "Assign a tutor to a class and year." },
            { value: "placement_coordinator", label: "Placement Coordinator", icon: <UserCog size={18} />, summary: "Add a coordinator for class-level placement management." },
          ]
        : currentRole === "dean"
          ? [
              { value: "student", label: "Student", icon: <GraduationCap size={18} />, summary: "Create a student profile with academic hierarchy." },
              { value: "tutor", label: "Tutor", icon: <Users size={18} />, summary: "Assign a tutor for a department, class, and year." },
              { value: "placement_coordinator", label: "Placement Coordinator", icon: <UserCog size={18} />, summary: "Create a PC with school and department visibility." },
              { value: "hod", label: "HOD", icon: <Building2 size={18} />, summary: "Assign a head of department under your school." },
            ]
          : [];

  const [selectedRole, setSelectedRole] = useState(allowedRoles[0]?.value || "student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [registerNo, setRegisterNo] = useState("");
  const [year, setYear] = useState("");
  const [batchStartYear, setBatchStartYear] = useState("");
  const [batchEndYear, setBatchEndYear] = useState("");

  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedProgramType, setSelectedProgramType] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

  const isStudentRole = selectedRole === "student";
  const isFacultyRole = ["tutor", "placement_coordinator", "hod", "dean"].includes(selectedRole);
  const roleCard = allowedRoles.find((role) => role.value === selectedRole);

  const schoolNode = collegeHierarchy.find((s) => s.school === selectedSchool);
  const sectionNode = schoolNode?.sections.find((s) => s.section === selectedSection);
  const courseNodes = sectionNode?.courses || [];
  const uniqueCourseOptions = Array.from(new Map(courseNodes.map((node) => [`${node.course}|${node.programType}`, node])).values());
  const matchingCourseNodes = selectedCourse ? courseNodes.filter((node) => node.course === selectedCourse) : [];
  const courseNode = courseNodes.find((c) => c.course === selectedCourse && c.programType === selectedProgramType);
  const departments = courseNode?.departments || [];

  const scopeSummary = useMemo(
    () =>
      [
        selectedSchool && `School: ${selectedSchool}`,
        selectedSection && `Section: ${selectedSection}`,
        selectedCourse && `Class: ${selectedCourse}`,
        selectedProgramType && `Program: ${selectedProgramType}`,
        selectedDepartment && `Dept: ${selectedDepartment}`,
        year && `Year: ${year}`,
      ].filter(Boolean) as string[],
    [selectedSchool, selectedSection, selectedCourse, selectedProgramType, selectedDepartment, year]
  );

  function resetHierarchy() {
    setSelectedSchool("");
    setSelectedSection("");
    setSelectedCourse("");
    setSelectedProgramType("");
    setSelectedDepartment("");
    setYear("");
    setBatchStartYear("");
    setBatchEndYear("");
    setRegisterNo("");
  }

  function canContinueFromIdentity() {
    return firstName.trim() && lastName.trim() && email.trim() && password.trim() && selectedRole;
  }

  function canContinueFromScope() {
    if (isStudentRole) {
      return registerNo.trim() && year && selectedSchool && selectedSection && selectedCourse && selectedProgramType && selectedDepartment;
    }
    if (selectedRole === "dean") {
      return selectedSchool;
    }
    return selectedSchool && selectedSection && selectedCourse && selectedProgramType && selectedDepartment && (selectedRole !== "tutor" || year);
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);

    const formData = new FormData();
    formData.set("firstName", firstName);
    formData.set("lastName", lastName);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("role", selectedRole);

    if (registerNo) formData.set("registerNo", registerNo);
    if (year) formData.set("year", year);
    if (selectedSchool) formData.set("school", selectedSchool);
    if (selectedSection) formData.set("section", selectedSection);
    if (selectedCourse) formData.set("course", selectedCourse);
    if (selectedProgramType) formData.set("programType", selectedProgramType);
    if (selectedDepartment) formData.set("department", selectedDepartment);
    if (batchStartYear) formData.set("batchStartYear", batchStartYear);
    if (batchEndYear) formData.set("batchEndYear", batchEndYear);

    const result = await createUserAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/users?role=${encodeURIComponent(selectedRole)}`);
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", paddingTop: "var(--space-5)", paddingBottom: "var(--space-8)" }}>
      <div style={{ width: "100%", maxWidth: "1080px", display: "grid", gap: "var(--space-5)" }}>
        <section className="hero-panel">
          <div style={{ display: "grid", gap: "var(--space-4)" }}>
            <span className="hero-badge">
              <Sparkles size={14} />
              Guided Onboarding Flow
            </span>
            <div className="page-header" style={{ marginBottom: 0 }}>
              <h1>Create User Account</h1>
              <p>Create a new student or academic staff member with live scope preview before the record is saved.</p>
            </div>
            <div className="step-grid">
              {[
                { id: 1 as StepId, title: "Identity", detail: "Basic account details" },
                { id: 2 as StepId, title: "Academic Scope", detail: "School, class, department" },
                { id: 3 as StepId, title: "Review", detail: "Check before creating" },
              ].map((item) => (
                <div key={item.id} className={`step-card ${step === item.id ? "active" : ""}`}>
                  <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Step {item.id}</div>
                  <div style={{ fontWeight: 700, marginBottom: "4px" }}>{item.title}</div>
                  <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {allowedRoles.length === 0 && (
          <div className="card" style={{ color: "var(--color-danger)" }}>
            You do not have permission to create users from this page.
          </div>
        )}

        {error && (
          <div style={{ color: "var(--color-danger)", padding: "16px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "16px", fontSize: "0.875rem", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
            {error}
          </div>
        )}

        <div className="dashboard-split" style={{ gridTemplateColumns: "minmax(0, 1.25fr) minmax(280px, 0.75fr)" }}>
          <div className="card-glass" style={{ padding: "var(--space-6)", borderRadius: "var(--border-radius-xl)" }}>
            {step === 1 && (
              <div style={{ display: "grid", gap: "var(--space-5)" }}>
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: "6px" }}>Choose role and identity</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Start with the account basics, then choose which kind of user you are onboarding.</p>
                </div>

                <div className="step-grid">
                  {allowedRoles.map((role) => (
                    <button
                      key={role.value}
                      type="button"
                      onClick={() => {
                        setSelectedRole(role.value);
                        resetHierarchy();
                      }}
                      className={`role-option-card ${selectedRole === role.value ? "selected" : ""}`}
                      style={{ textAlign: "left" }}
                    >
                      <div style={{ display: "inline-flex", width: 40, height: 40, alignItems: "center", justifyContent: "center", borderRadius: "12px", background: "rgba(30, 155, 215, 0.08)", marginBottom: "var(--space-3)" }}>
                        {role.icon}
                      </div>
                      <div style={{ fontWeight: 700, marginBottom: "4px" }}>{role.label}</div>
                      <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>{role.summary}</div>
                    </button>
                  ))}
                </div>

                <div className="filter-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                  <Field label="First Name"><input value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="John" style={inputStyle} /></Field>
                  <Field label="Last Name"><input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Doe" style={inputStyle} /></Field>
                  <Field label="Email Address"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="user@rathinam.edu.in" style={inputStyle} /></Field>
                  <Field label="System Password"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 8 characters" style={inputStyle} /></Field>
                </div>
              </div>
            )}

            {step === 2 && (
              <div style={{ display: "grid", gap: "var(--space-5)" }}>
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: "6px" }}>{isStudentRole ? "Student academic scope" : "Staff management scope"}</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                    {isStudentRole
                      ? "These values decide where the student appears and who can manage them."
                      : "These assignments control student visibility, tutor/class ownership, and faculty management scope."}
                  </p>
                </div>

                {isStudentRole && (
                  <div className="filter-grid">
                    <Field label="Register Number"><input value={registerNo} onChange={(e) => setRegisterNo(e.target.value)} placeholder="e.g. 23BCACS101" style={inputStyle} /></Field>
                    <Field label="Year">
                      <select value={year} onChange={(e) => setYear(e.target.value)} style={inputStyle}>
                        <option value="">Select Year</option>
                        {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                    </Field>
                  </div>
                )}

                <div className="filter-grid">
                  <Field label="School">
                    <select
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
                      {collegeHierarchy.map((s) => <option key={s.school} value={s.school}>{s.school}</option>)}
                    </select>
                  </Field>

                  <Field label={`Section${selectedRole !== "dean" ? " *" : ""}`}>
                    <select
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
                      <option value="">{selectedRole === "dean" ? "Not needed for dean" : "Select Section"}</option>
                      {schoolNode?.sections.map((sec) => <option key={sec.section} value={sec.section}>{sec.section}</option>)}
                    </select>
                  </Field>

                  <Field label={`Course${selectedRole !== "dean" ? " *" : ""}`}>
                    <select
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
                      <option value="">{selectedRole === "dean" ? "Not needed for dean" : "Select Course"}</option>
                      {uniqueCourseOptions.map((c) => (
                        <option key={`${c.course}-${c.programType}`} value={`${c.course}|${c.programType}`}>
                          {c.course} ({c.programType})
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field label={`Department${selectedRole !== "dean" ? " *" : ""}`}>
                    <select
                      value={selectedDepartment}
                      onChange={(e) => setSelectedDepartment(e.target.value)}
                      disabled={!selectedCourse || selectedRole === "dean"}
                      style={inputStyle}
                    >
                      <option value="">{selectedRole === "dean" ? "Optional for dean" : "Select Department"}</option>
                      {departments.map((d) => <option key={d.name} value={d.name}>{d.name}</option>)}
                    </select>
                  </Field>

                  {!isStudentRole && (
                    <Field label={`Year${selectedRole === "tutor" ? " *" : ""}`}>
                      <select value={year} onChange={(e) => setYear(e.target.value)} style={inputStyle}>
                        <option value="">{selectedRole === "tutor" ? "Select Year" : "All Years"}</option>
                        {[1, 2, 3, 4, 5].map((y) => <option key={y} value={y}>Year {y}</option>)}
                      </select>
                    </Field>
                  )}

                  <Field label="Batch Start">
                    <input value={batchStartYear} onChange={(e) => setBatchStartYear(e.target.value)} type="number" min={2000} max={2100} placeholder="e.g. 2023" style={inputStyle} />
                  </Field>

                  <Field label="Batch End">
                    <input value={batchEndYear} onChange={(e) => setBatchEndYear(e.target.value)} type="number" min={2000} max={2100} placeholder="e.g. 2026" style={inputStyle} />
                  </Field>
                </div>
              </div>
            )}

            {step === 3 && (
              <div style={{ display: "grid", gap: "var(--space-5)" }}>
                <div>
                  <h2 style={{ marginTop: 0, marginBottom: "6px" }}>Review before creating</h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>Check the role, identity, and academic scope now to avoid hidden or mismatched records later.</p>
                </div>

                <div className="scope-grid">
                  <div className="scope-card">
                    <div className="scope-card-title">Identity</div>
                    <div className="scope-meta">
                      <span className="scope-chip">{firstName || "First"} {lastName || "Last"}</span>
                      <span className="scope-chip">{email || "Email pending"}</span>
                      <span className="scope-chip">Role: {roleCard?.label || selectedRole}</span>
                    </div>
                  </div>
                  <div className="scope-card">
                    <div className="scope-card-title">Academic scope</div>
                    <div className="scope-meta">
                      {scopeSummary.length > 0 ? scopeSummary.map((item) => <span key={item} className="scope-chip">{item}</span>) : <span className="scope-chip">No scope selected yet</span>}
                      {registerNo && <span className="scope-chip">Register No: {registerNo}</span>}
                      {batchStartYear && batchEndYear && <span className="scope-chip">Batch: {batchStartYear} - {batchEndYear}</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="sticky-action-bar" style={{ marginTop: "var(--space-5)" }}>
              <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                {step === 1 && "Start by choosing the right role. That drives the rest of the form."}
                {step === 2 && "This scope decides visibility in Students, User Management, and hierarchy-based approvals."}
                {step === 3 && "Create the account only after the academic scope preview looks correct."}
              </div>
              <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
                {step > 1 && (
                  <button type="button" className="btn btn-secondary" onClick={() => setStep((step - 1) as StepId)} disabled={loading}>
                    <ArrowLeft size={16} /> Back
                  </button>
                )}
                {step < 3 && (
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() => setStep((step + 1) as StepId)}
                    disabled={loading || (step === 1 ? !canContinueFromIdentity() : !canContinueFromScope())}
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                )}
                {step === 3 && (
                  <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={loading || !canContinueFromScope() || !canContinueFromIdentity()}>
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : "Create Account"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="dashboard-shell">
            <div className="card">
              <div style={{ display: "inline-flex", width: 42, height: 42, alignItems: "center", justifyContent: "center", borderRadius: "12px", background: "rgba(30, 155, 215, 0.08)", marginBottom: "var(--space-3)" }}>
                {roleCard?.icon || <ShieldAlert size={18} />}
              </div>
              <h2 style={{ marginTop: 0, marginBottom: "6px" }}>{roleCard?.label || "User role"}</h2>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "var(--space-3)" }}>
                {roleCard?.summary || "Select a role to see how this account will behave."}
              </p>
              <div className="recommendation-panel">
                <div style={{ fontWeight: 700, marginBottom: "4px" }}>Dynamic academic scope preview</div>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                  The chips below update as you fill the form so you can catch wrong school, class, department, or year before saving.
                </div>
              </div>
            </div>

            <div className="card">
              <h2 style={{ marginTop: 0, marginBottom: "var(--space-3)" }}>Live Scope Card</h2>
              <div className="scope-card" style={{ background: "linear-gradient(180deg, rgba(20,95,132,0.96), rgba(13,67,94,0.98))", color: "white" }}>
                <div className="scope-card-title" style={{ color: "white" }}>
                  <Building2 size={16} />
                  {roleCard?.label || "Selected role"} identity
                </div>
                <div className="scope-meta">
                  {scopeSummary.length > 0 ? (
                    scopeSummary.map((item) => (
                      <span key={item} className="scope-chip" style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
                        {item}
                      </span>
                    ))
                  ) : (
                    <span className="scope-chip" style={{ background: "rgba(255,255,255,0.12)", color: "white" }}>
                      Scope not complete yet
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <h2 style={{ marginTop: 0, marginBottom: "var(--space-3)" }}>Why this matters</h2>
              <div style={{ display: "grid", gap: "10px" }}>
                <FlowLine title="Student visibility" detail="Wrong class or department will hide students from the correct tutor, HOD, dean, or PC." />
                <FlowLine title="User management filters" detail="Staff records appear based on hierarchy mappings, not just the role field." />
                <FlowLine title="Future tutor changes" detail="When scope changes later, the identity card and visibility rules update from the same data." />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: "8px" }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function FlowLine({ title, detail }: { title: string; detail: string }) {
  return (
    <div style={{ padding: "var(--space-3)", borderRadius: "14px", background: "rgba(30, 155, 215, 0.06)" }}>
      <div style={{ fontWeight: 700, marginBottom: "4px" }}>{title}</div>
      <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{detail}</div>
    </div>
  );
}
