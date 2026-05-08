"use client";

import { useState, useTransition } from "react";

import { toast } from "sonner";

import { updateStudentProfileByManager } from "@/app/actions/profile";
import type { SchoolNode } from "@/lib/constants/hierarchy";

type Props = {
  studentId: string;
  initialValues: {
    registerNo: string;
    school: string;
    section: string;
    course: string;
    programType: string;
    department: string;
    year: number;
    batchStartYear: number | null;
    batchEndYear: number | null;
  };
  collegeHierarchy: SchoolNode[];
};

export function StudentHierarchyEditor({ studentId, initialValues, collegeHierarchy }: Props) {
  const [isPending, startTransition] = useTransition();
  const [registerNo, setRegisterNo] = useState(initialValues.registerNo);
  const [school, setSchool] = useState(initialValues.school);
  const [section, setSection] = useState(initialValues.section);
  const [course, setCourse] = useState(initialValues.course);
  const [programType, setProgramType] = useState(initialValues.programType);
  const [department, setDepartment] = useState(initialValues.department);
  const [year, setYear] = useState(String(initialValues.year || 1));
  const [batchStartYear, setBatchStartYear] = useState(initialValues.batchStartYear ? String(initialValues.batchStartYear) : "");
  const [batchEndYear, setBatchEndYear] = useState(initialValues.batchEndYear ? String(initialValues.batchEndYear) : "");

  const schoolNode = collegeHierarchy.find((node) => node.school === school);
  const sectionNode = schoolNode?.sections.find((node) => node.section === section);
  const courseNodes = sectionNode?.courses || [];
  const matchingCourseNodes = course ? courseNodes.filter((node) => node.course === course) : [];
  const selectedCourseNode = courseNodes.find((node) => node.course === course && node.programType === programType);
  const departments = selectedCourseNode?.departments || [];
  const uniqueCourses = Array.from(new Set(courseNodes.map((node) => node.course)));
  const suggestedCourse = !course && uniqueCourses.length === 1 ? uniqueCourses[0] : "";
  const suggestedProgramType = course && !programType && matchingCourseNodes.length === 1 ? matchingCourseNodes[0].programType : "";
  const suggestedDepartment = programType && !department && departments.length === 1 ? departments[0].name : "";
  const hasSuggestion = !!(suggestedCourse || suggestedProgramType || suggestedDepartment);
  const scopePreview = [
    school && `School: ${school}`,
    section && `Section: ${section}`,
    course && `Class: ${course}`,
    programType && `Program: ${programType}`,
    department && `Dept: ${department}`,
    year && `Year: ${year}`,
  ].filter(Boolean) as string[];

  const handleSubmit = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", studentId);
      formData.set("registerNo", registerNo);
      formData.set("school", school);
      formData.set("section", section);
      formData.set("course", course);
      formData.set("programType", programType);
      formData.set("department", department);
      formData.set("year", year);
      formData.set("batchStartYear", batchStartYear);
      formData.set("batchEndYear", batchEndYear);

      const result = await updateStudentProfileByManager(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Student academic scope updated.");
    });
  };

  return (
    <div style={{ display: "grid", gap: "var(--space-4)" }}>
      <div className="recommendation-panel">
        <div style={{ fontWeight: 700, marginBottom: "6px" }}>Live repair preview</div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "var(--space-3)" }}>
          Update the student only after this scope preview matches the correct school, class, section, department, and year.
        </div>
        <div className="scope-meta">
          {scopePreview.length > 0 ? scopePreview.map((item) => <span key={item} className="scope-chip">{item}</span>) : <span className="scope-chip">Scope incomplete</span>}
          {registerNo && <span className="scope-chip">Register No: {registerNo}</span>}
          {batchStartYear && batchEndYear && <span className="scope-chip">Batch: {batchStartYear} - {batchEndYear}</span>}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)" }}>
        <Field label="Register Number">
          <input value={registerNo} onChange={(e) => setRegisterNo(e.target.value)} className="input-field" />
        </Field>
        <Field label="Year">
          <select value={year} onChange={(e) => setYear(e.target.value)} className="input-field">
            {[1, 2, 3, 4, 5].map((value) => (
              <option key={value} value={value}>
                Year {value}
              </option>
            ))}
          </select>
        </Field>
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
        <Field label="Department">
          <select value={department} onChange={(e) => setDepartment(e.target.value)} className="input-field" disabled={!programType}>
            <option value="">Select Department</option>
            {departments.map((node) => (
              <option key={node.name} value={node.name}>
                {node.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Batch Start">
          <input value={batchStartYear} onChange={(e) => setBatchStartYear(e.target.value)} className="input-field" type="number" min={2000} max={2100} />
        </Field>
        <Field label="Batch End">
          <input value={batchEndYear} onChange={(e) => setBatchEndYear(e.target.value)} className="input-field" type="number" min={2000} max={2100} />
        </Field>
      </div>

      {hasSuggestion && (
        <div style={{ border: "1px solid rgba(37, 99, 235, 0.2)", background: "rgba(37, 99, 235, 0.06)", borderRadius: "12px", padding: "var(--space-4)" }}>
          <div style={{ fontWeight: 600, marginBottom: "6px" }}>Suggested hierarchy match</div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "var(--space-3)" }}>
            Based on the selected school, section, and course path, the configured hierarchy suggests the next valid values below.
          </div>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {suggestedCourse && (
              <button type="button" className="btn btn-outline" onClick={() => setCourse(suggestedCourse)}>
                Use Course: {suggestedCourse}
              </button>
            )}
            {suggestedProgramType && (
              <button type="button" className="btn btn-outline" onClick={() => setProgramType(suggestedProgramType)}>
                Use Program: {suggestedProgramType}
              </button>
            )}
            {suggestedDepartment && (
              <button type="button" className="btn btn-outline" onClick={() => setDepartment(suggestedDepartment)}>
                Use Department: {suggestedDepartment}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="sticky-action-bar">
        <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.875rem" }}>
          Use this to repair wrong school, class, or department assignments when students are hidden from the correct manager scope.
        </p>
        <button type="button" className="btn btn-primary" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Saving..." : "Save Academic Scope"}
        </button>
      </div>
    </div>
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
