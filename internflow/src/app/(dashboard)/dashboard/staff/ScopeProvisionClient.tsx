"use client";

import { useState } from "react";
import { ShieldAlert, Loader2, Building2 } from "lucide-react";
import type { SchoolNode } from "@/lib/constants/hierarchy";
import { selfProvisionScope } from "@/app/actions/hierarchy";
import { useRouter } from "next/navigation";

type Props = {
  collegeHierarchy: SchoolNode[];
  hasScope: boolean;
  role: string;
};

export function ScopeProvisionClient({ collegeHierarchy, hasScope, role }: Props) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(!hasScope);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cascading selects state
  const [selectedSchool, setSelectedSchool] = useState("");
  const [selectedSection, setSelectedSection] = useState("");
  const [selectedCourse, setSelectedCourse] = useState("");
  const [selectedProgramType, setSelectedProgramType] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");

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
    const result = await selfProvisionScope(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.refresh();
      setIsOpen(false);
      setLoading(false);
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

  if (!isOpen && hasScope) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="button button-outline"
        style={{ marginBottom: "var(--space-6)" }}
      >
        Configure Responsibility Scope
      </button>
    );
  }

  return (
    <div className="card animate-fade-in" style={{ marginBottom: "var(--space-6)", border: "1px solid var(--color-primary)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)", fontWeight: 600, fontSize: "1.125rem" }}>
        <Building2 size={24} color="var(--color-primary)" />
        Configure My Responsibility Scope
      </div>
      
      {!hasScope ? (
        <div style={{
          background: "rgba(234, 179, 8, 0.1)",
          borderLeft: "4px solid #eab308",
          padding: "var(--space-4)",
          borderRadius: "var(--border-radius-md)",
          marginBottom: "var(--space-4)",
          fontSize: "0.875rem",
          color: "var(--text-primary)"
        }}>
          <strong>Action Required:</strong> You currently have no responsibility scope assigned. Please configure your scope below to view your students and manage approvals.
        </div>
      ) : (
        <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "var(--space-4)" }}>
          You can append a new scope or replace an existing one based on your current role mapping.
        </p>
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
            <label style={labelStyle}>Section {role !== "dean" ? "*" : ""}</label>
            <select
              name="section"
              required={role !== "dean"}
              value={selectedSection}
              onChange={(e) => {
                setSelectedSection(e.target.value);
                setSelectedCourse("");
                setSelectedProgramType("");
                setSelectedDepartment("");
              }}
              disabled={!selectedSchool || role === "dean"}
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
            <label style={labelStyle}>Course {role !== "dean" ? "*" : ""}</label>
            <select
              name="course"
              required={role !== "dean"}
              value={selectedCourse ? `${selectedCourse}|${selectedProgramType}` : ""}
              onChange={(e) => {
                const [course, programType] = e.target.value.split("|");
                setSelectedCourse(course || "");
                setSelectedProgramType(programType || "");
                setSelectedDepartment("");
              }}
              disabled={!selectedSection || role === "dean"}
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
            <label style={labelStyle}>Department {role !== "dean" ? "*" : ""}</label>
            <select
              name="department"
              required={role !== "dean"}
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              disabled={!selectedCourse || role === "dean"}
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
            <label style={labelStyle}>Year {role === "tutor" ? "*" : ""}</label>
            <select name="year" defaultValue="" required={role === "tutor"} style={inputStyle}>
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

        <div style={{ display: "flex", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
          <button type="submit" className="button" disabled={loading} style={{ flex: 1, justifyContent: "center", height: "45px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Save Scope"}
          </button>
          {hasScope && (
            <button type="button" onClick={() => setIsOpen(false)} className="button button-outline" style={{ flex: 1, justifyContent: "center", height: "45px" }}>
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
