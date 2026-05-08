"use client";

import { useState, useTransition } from "react";

import { Settings2 } from "lucide-react";
import { toast } from "sonner";

import { updateManagedUserScope } from "@/app/actions/hierarchy";
import type { SchoolNode } from "@/lib/constants/hierarchy";

type ScopeValues = {
  school: string;
  section: string;
  course: string;
  programType: string;
  department: string;
  year: number;
  batchStartYear: number | null;
  batchEndYear: number | null;
};

type Props = {
  user: {
    id: string;
    role: string;
    name: string;
  };
  collegeHierarchy: SchoolNode[];
  initialScope: ScopeValues;
};

export function StaffScopeEditorButton({ user, collegeHierarchy, initialScope }: Props) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [school, setSchool] = useState(initialScope.school);
  const [section, setSection] = useState(initialScope.section);
  const [course, setCourse] = useState(initialScope.course);
  const [programType, setProgramType] = useState(initialScope.programType);
  const [department, setDepartment] = useState(initialScope.department);
  const [year, setYear] = useState(initialScope.year ? String(initialScope.year) : "");
  const [batchStartYear, setBatchStartYear] = useState(initialScope.batchStartYear ? String(initialScope.batchStartYear) : "");
  const [batchEndYear, setBatchEndYear] = useState(initialScope.batchEndYear ? String(initialScope.batchEndYear) : "");

  const schoolNode = collegeHierarchy.find((node) => node.school === school);
  const sectionNode = schoolNode?.sections.find((node) => node.section === section);
  const courseNodes = sectionNode?.courses || [];
  const matchingCourseNodes = course ? courseNodes.filter((node) => node.course === course) : [];
  const selectedCourseNode = courseNodes.find((node) => node.course === course && node.programType === programType);
  const departments = selectedCourseNode?.departments || [];
  const isDean = user.role === "dean";

  const handleSubmit = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("targetUserId", user.id);
      formData.set("school", school);
      formData.set("section", section);
      formData.set("course", course);
      formData.set("programType", programType);
      formData.set("department", department);
      formData.set("year", year);
      formData.set("batchStartYear", batchStartYear);
      formData.set("batchEndYear", batchEndYear);

      const result = await updateManagedUserScope(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Staff scope updated.");
      setOpen(false);
    });
  };

  return (
    <>
      <button type="button" className="btn btn-outline" style={{ padding: "6px 10px" }} onClick={() => setOpen(true)}>
        <Settings2 size={14} />
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setOpen(false)}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: "92%", maxWidth: "720px", maxHeight: "88vh", overflowY: "auto", padding: "var(--space-6)" }}
          >
            <div style={{ marginBottom: "var(--space-4)" }}>
              <h2 style={{ margin: 0, fontSize: "1.15rem" }}>Edit Staff Scope</h2>
              <p style={{ margin: "6px 0 0 0", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                {user.name} ({user.role.replaceAll("_", " ")})
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)" }}>
              <Field label="School">
                <select
                  value={school}
                  onChange={(e) => {
                    setSchool(e.target.value);
                    setSection("");
                    setCourse("");
                    setProgramType("");
                    setDepartment("");
                  }}
                  className="input-field"
                >
                  <option value="">Select School</option>
                  {collegeHierarchy.map((node) => (
                    <option key={node.school} value={node.school}>
                      {node.school}
                    </option>
                  ))}
                </select>
              </Field>

              {!isDean && (
                <Field label="Section">
                  <select
                    value={section}
                    onChange={(e) => {
                      setSection(e.target.value);
                      setCourse("");
                      setProgramType("");
                      setDepartment("");
                    }}
                    className="input-field"
                    disabled={!school}
                  >
                    <option value="">Select Section</option>
                    {schoolNode?.sections.map((node) => (
                      <option key={node.section} value={node.section}>
                        {node.section}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {!isDean && (
                <Field label="Course">
                  <select
                    value={course}
                    onChange={(e) => {
                      setCourse(e.target.value);
                      setProgramType("");
                      setDepartment("");
                    }}
                    className="input-field"
                    disabled={!section}
                  >
                    <option value="">Select Course</option>
                    {Array.from(new Set(courseNodes.map((node) => node.course))).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {!isDean && (
                <Field label="Program Type">
                  <select
                    value={programType}
                    onChange={(e) => {
                      setProgramType(e.target.value);
                      setDepartment("");
                    }}
                    className="input-field"
                    disabled={!course}
                  >
                    <option value="">Select Program</option>
                    {Array.from(new Set(matchingCourseNodes.map((node) => node.programType))).map((value) => (
                      <option key={value} value={value}>
                        {value}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              <Field label="Department">
                {isDean ? (
                  <input value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field" placeholder="Optional dean department" />
                ) : (
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field" disabled={!programType}>
                    <option value="">Select Department</option>
                    {departments.map((node) => (
                      <option key={node.name} value={node.name}>
                        {node.name}
                      </option>
                    ))}
                  </select>
                )}
              </Field>

              {!isDean && (
                <Field label={`Year ${user.role === "tutor" ? "*" : ""}`}>
                  <select value={year} onChange={(e) => setYear(e.target.value)} className="input-field">
                    <option value="">All Years</option>
                    {[1, 2, 3, 4, 5].map((value) => (
                      <option key={value} value={value}>
                        Year {value}
                      </option>
                    ))}
                  </select>
                </Field>
              )}

              {!isDean && (
                <>
                  <Field label="Batch Start">
                    <input value={batchStartYear} onChange={(e) => setBatchStartYear(e.target.value)} className="input-field" type="number" min={2000} max={2100} />
                  </Field>
                  <Field label="Batch End">
                    <input value={batchEndYear} onChange={(e) => setBatchEndYear(e.target.value)} className="input-field" type="number" min={2000} max={2100} />
                  </Field>
                </>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-2)", marginTop: "var(--space-5)" }}>
              <button type="button" className="btn btn-outline" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
                {isPending ? "Saving..." : "Save Scope"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: "6px", fontSize: "0.875rem", fontWeight: 500 }}>
      <span>{label}</span>
      {children}
    </label>
  );
}
