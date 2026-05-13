"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { saveCollegeHierarchy } from "@/app/actions/hierarchy";
import {
  School, BookOpen, GraduationCap, Plus, Trash2, Save,
  Loader2, ChevronDown, ChevronRight, X, Edit3, Check
} from "lucide-react";
import { toast } from "sonner";

type DepartmentNode = { name: string };
type CourseNode = { course: string; programType: "UG" | "PG"; departments: DepartmentNode[] };
type SectionNode = { section: string; courses: CourseNode[] };
type SchoolNode = { school: string; sections: SectionNode[] };

export default function CollegeStructureClient({ initialHierarchy }: { initialHierarchy: SchoolNode[] }) {
  const [hierarchy, setHierarchy] = useState<SchoolNode[]>(initialHierarchy);
  const [expandedSchool, setExpandedSchool] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [expandedCourse, setExpandedCourse] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [hasChanges, setHasChanges] = useState(false);
  const router = useRouter();

  // ── Modal states ──
  const [showModal, setShowModal] = useState<"school" | "section" | "course" | "dept" | null>(null);
  const [modalTarget, setModalTarget] = useState<{ schoolIdx: number; sectionIdx?: number; courseIdx?: number }>({ schoolIdx: 0 });
  const [modalValue, setModalValue] = useState("");
  const [modalProgramType, setModalProgramType] = useState<"UG" | "PG">("UG");

  // ── Editing inline ──
  const [editingItem, setEditingItem] = useState<{ type: string; path: number[]; value: string } | null>(null);

  const markChanged = () => setHasChanges(true);

  const addSchool = () => {
    if (!modalValue.trim()) return;
    const h = [...hierarchy];
    h.push({ school: modalValue.trim(), sections: [] });
    setHierarchy(h);
    markChanged();
    closeModal();
  };

  const deleteSchool = (schoolIdx: number) => {
    const h = [...hierarchy];
    h.splice(schoolIdx, 1);
    setHierarchy(h);
    markChanged();
  };

  // ── Section CRUD ──
  const addSection = () => {
    if (!modalValue.trim()) return;
    const h = [...hierarchy];
    h[modalTarget.schoolIdx].sections.push({ section: modalValue.trim(), courses: [] });
    setHierarchy(h);
    markChanged();
    closeModal();
  };

  const deleteSection = (schoolIdx: number, sectionIdx: number) => {
    const h = [...hierarchy];
    h[schoolIdx].sections.splice(sectionIdx, 1);
    setHierarchy(h);
    markChanged();
  };

  // ── Course CRUD ──
  const addCourse = () => {
    if (!modalValue.trim()) return;
    const h = [...hierarchy];
    h[modalTarget.schoolIdx].sections[modalTarget.sectionIdx!].courses.push({
      course: modalValue.trim(),
      programType: modalProgramType,
      departments: [],
    });
    setHierarchy(h);
    markChanged();
    closeModal();
  };

  const deleteCourse = (schoolIdx: number, sectionIdx: number, courseIdx: number) => {
    const h = [...hierarchy];
    h[schoolIdx].sections[sectionIdx].courses.splice(courseIdx, 1);
    setHierarchy(h);
    markChanged();
  };

  // ── Department CRUD ──
  const addDepartment = () => {
    if (!modalValue.trim()) return;
    const h = [...hierarchy];
    h[modalTarget.schoolIdx].sections[modalTarget.sectionIdx!].courses[modalTarget.courseIdx!].departments.push({
      name: modalValue.trim(),
    });
    setHierarchy(h);
    markChanged();
    closeModal();
  };

  const deleteDepartment = (schoolIdx: number, sectionIdx: number, courseIdx: number, deptIdx: number) => {
    const h = [...hierarchy];
    h[schoolIdx].sections[sectionIdx].courses[courseIdx].departments.splice(deptIdx, 1);
    setHierarchy(h);
    markChanged();
  };

  // ── Inline Edit ──
  const startEdit = (type: string, path: number[], currentValue: string) => {
    setEditingItem({ type, path, value: currentValue });
  };

  const applyEdit = () => {
    if (!editingItem || !editingItem.value.trim()) return;
    const h = [...hierarchy];
    const [si, sei, ci, di] = editingItem.path;
    if (editingItem.type === "section") {
      h[si].sections[sei].section = editingItem.value.trim();
    } else if (editingItem.type === "course") {
      h[si].sections[sei].courses[ci].course = editingItem.value.trim();
    } else if (editingItem.type === "dept") {
      h[si].sections[sei].courses[ci].departments[di].name = editingItem.value.trim();
    }
    setHierarchy(h);
    markChanged();
    setEditingItem(null);
  };

  // ── Save ──
  const handleSave = () => {
    startTransition(async () => {
      const result = await saveCollegeHierarchy(hierarchy);
      if (result?.error) {
        toast.error(result.error);
      } else {
        toast.success("College structure saved successfully!");
        setHasChanges(false);
        router.refresh();
      }
    });
  };

  // ── Modal helpers ──
  const openModal = (type: "school" | "section" | "course" | "dept", target: typeof modalTarget) => {
    setShowModal(type);
    setModalTarget(target);
    setModalValue("");
    setModalProgramType("UG");
  };

  const closeModal = () => {
    setShowModal(null);
    setModalValue("");
  };

  const labelTitles: Record<string, string> = {
    school: "School Name",
    section: "Section Name",
    course: "Course Name",
    dept: "Department / Specialization Name",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
      {/* Save Bar */}
      {hasChanges && (
        <div style={{
          position: "sticky", top: 0, zIndex: 50,
          padding: "var(--space-3) var(--space-5)",
          background: "linear-gradient(135deg, rgba(34,197,94,0.15), rgba(99,102,241,0.15))",
          border: "1px solid rgba(34,197,94,0.3)",
          borderRadius: "var(--radius-md)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          backdropFilter: "blur(8px)",
        }}>
          <span style={{ fontWeight: 600, color: "#22c55e" }}>⚠ You have unsaved changes</span>
          <button onClick={handleSave} disabled={isPending} className="btn btn-primary" style={{ padding: "8px 20px", display: "flex", alignItems: "center", gap: "6px" }}>
            {isPending ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : <Save size={16} />}
            Save All Changes
          </button>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => openModal("school", { schoolIdx: hierarchy.length })}
          className="btn btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <Plus size={16} /> Add School
        </button>
      </div>

      {/* Schools */}
      {hierarchy.map((school, si) => (
        <div key={school.school} className="card" style={{ padding: 0, overflow: "hidden" }}>
          {/* School Header (static — no CRUD) */}
          <button
            onClick={() => setExpandedSchool(expandedSchool === school.school ? null : school.school)}
            style={{
              width: "100%", padding: "var(--space-4) var(--space-5)",
              display: "flex", alignItems: "center", gap: "var(--space-3)",
              background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(168,85,247,0.08))",
              border: "none", cursor: "pointer", color: "var(--text-primary)",
              fontSize: "1.05rem", fontWeight: 700,
              borderBottom: expandedSchool === school.school ? "1px solid var(--border-color)" : "none",
            }}
          >
            <School size={20} style={{ color: "#6366f1" }} />
            {school.school}
            <span style={{ marginLeft: "auto", color: "var(--text-secondary)", fontSize: "0.8rem" }}>
              {school.sections.length} sections
            </span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                deleteSchool(si);
              }}
              style={{ display: "inline-flex", alignItems: "center", color: "#ef4444" }}
              role="button"
              aria-label={`Delete ${school.school}`}
            >
              <Trash2 size={14} />
            </span>
            {expandedSchool === school.school ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
          </button>

          {expandedSchool === school.school && (
            <div style={{ padding: "var(--space-4) var(--space-5)" }}>
              {/* Add Section button */}
              <button
                onClick={() => openModal("section", { schoolIdx: si })}
                className="btn btn-outline"
                style={{ marginBottom: "var(--space-4)", padding: "6px 14px", fontSize: "0.8125rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
              >
                <Plus size={14} /> Add Section
              </button>

              {school.sections.length === 0 && (
                <p style={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: "0.875rem" }}>No sections yet. Add one to get started.</p>
              )}

              {school.sections.map((section, sei) => (
                <div key={sei} style={{
                  marginBottom: "var(--space-3)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-md)",
                  overflow: "hidden",
                }}>
                  {/* Section Header */}
                  <div style={{
                    display: "flex", alignItems: "center", gap: "var(--space-2)",
                    padding: "var(--space-3) var(--space-4)",
                    background: "var(--bg-secondary)",
                    cursor: "pointer",
                  }}
                    onClick={() => setExpandedSection(expandedSection === `${si}-${sei}` ? null : `${si}-${sei}`)}
                  >
                    <BookOpen size={16} style={{ color: "#0ea5e9" }} />
                    {editingItem?.type === "section" && editingItem.path[0] === si && editingItem.path[1] === sei ? (
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }} onClick={e => e.stopPropagation()}>
                        <input
                          autoFocus
                          className="input-field"
                          value={editingItem.value}
                          onChange={e => setEditingItem({ ...editingItem, value: e.target.value })}
                          onKeyDown={e => { if (e.key === "Enter") applyEdit(); if (e.key === "Escape") setEditingItem(null); }}
                          style={{ padding: "4px 8px", fontSize: "0.875rem" }}
                        />
                        <button onClick={applyEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "#22c55e" }}><Check size={16} /></button>
                        <button onClick={() => setEditingItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><X size={16} /></button>
                      </div>
                    ) : (
                      <span style={{ fontWeight: 600, fontSize: "0.9375rem", flex: 1 }}>{section.section}</span>
                    )}
                    <span style={{ color: "var(--text-secondary)", fontSize: "0.75rem" }}>{section.courses.length} courses</span>
                    <button onClick={(e) => { e.stopPropagation(); startEdit("section", [si, sei], section.section); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><Edit3 size={14} /></button>
                    <button onClick={(e) => { e.stopPropagation(); deleteSection(si, sei); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 size={14} /></button>
                    {expandedSection === `${si}-${sei}` ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </div>

                  {expandedSection === `${si}-${sei}` && (
                    <div style={{ padding: "var(--space-3) var(--space-4) var(--space-3) var(--space-6)" }}>
                      <button
                        onClick={() => openModal("course", { schoolIdx: si, sectionIdx: sei })}
                        className="btn btn-outline"
                        style={{ marginBottom: "var(--space-3)", padding: "4px 12px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                      >
                        <Plus size={12} /> Add Course
                      </button>

                      {section.courses.map((crs, ci) => (
                        <div key={ci} style={{
                          marginBottom: "var(--space-2)",
                          border: "1px solid color-mix(in srgb, var(--border-color) 60%, transparent)",
                          borderRadius: "var(--radius-sm)",
                          overflow: "hidden",
                        }}>
                          {/* Course Header */}
                          <div style={{
                            display: "flex", alignItems: "center", gap: "var(--space-2)",
                            padding: "var(--space-2) var(--space-3)",
                            background: "color-mix(in srgb, var(--bg-secondary) 50%, transparent)",
                            cursor: "pointer",
                          }}
                            onClick={() => setExpandedCourse(expandedCourse === `${si}-${sei}-${ci}` ? null : `${si}-${sei}-${ci}`)}
                          >
                            <GraduationCap size={14} style={{ color: "#a855f7" }} />
                            {editingItem?.type === "course" && editingItem.path[0] === si && editingItem.path[1] === sei && editingItem.path[2] === ci ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }} onClick={e => e.stopPropagation()}>
                                <input autoFocus className="input-field" value={editingItem.value} onChange={e => setEditingItem({ ...editingItem, value: e.target.value })} onKeyDown={e => { if (e.key === "Enter") applyEdit(); if (e.key === "Escape") setEditingItem(null); }} style={{ padding: "3px 6px", fontSize: "0.8125rem" }} />
                                <button onClick={applyEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "#22c55e" }}><Check size={14} /></button>
                                <button onClick={() => setEditingItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><X size={14} /></button>
                              </div>
                            ) : (
                              <span style={{ fontWeight: 600, fontSize: "0.875rem", flex: 1 }}>{crs.course}</span>
                            )}
                            <span style={{
                              padding: "2px 8px", borderRadius: "999px", fontSize: "0.6875rem", fontWeight: 700,
                              background: crs.programType === "UG" ? "rgba(34,197,94,0.1)" : "rgba(99,102,241,0.1)",
                              color: crs.programType === "UG" ? "#22c55e" : "#6366f1",
                              border: `1px solid ${crs.programType === "UG" ? "rgba(34,197,94,0.3)" : "rgba(99,102,241,0.3)"}`,
                            }}>{crs.programType}</span>
                            <span style={{ color: "var(--text-secondary)", fontSize: "0.6875rem" }}>{crs.departments.length} depts</span>
                            <button onClick={(e) => { e.stopPropagation(); startEdit("course", [si, sei, ci], crs.course); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><Edit3 size={12} /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteCourse(si, sei, ci); }} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 size={12} /></button>
                            {expandedCourse === `${si}-${sei}-${ci}` ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          </div>

                          {expandedCourse === `${si}-${sei}-${ci}` && (
                            <div style={{ padding: "var(--space-2) var(--space-3) var(--space-2) var(--space-6)" }}>
                              <button
                                onClick={() => openModal("dept", { schoolIdx: si, sectionIdx: sei, courseIdx: ci })}
                                className="btn btn-outline"
                                style={{ marginBottom: "var(--space-2)", padding: "3px 10px", fontSize: "0.6875rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                <Plus size={10} /> Add Department
                              </button>

                              {crs.departments.length === 0 && (
                                <p style={{ color: "var(--text-secondary)", fontStyle: "italic", fontSize: "0.75rem" }}>No departments. Add one.</p>
                              )}

                              {crs.departments.map((dept, di) => (
                                <div key={di} style={{
                                  display: "flex", alignItems: "center", gap: "var(--space-2)",
                                  padding: "var(--space-1) var(--space-2)",
                                  borderBottom: di < crs.departments.length - 1 ? "1px solid color-mix(in srgb, var(--border-color) 40%, transparent)" : "none",
                                }}>
                                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#f59e0b", flexShrink: 0 }} />
                                  {editingItem?.type === "dept" && editingItem.path[0] === si && editingItem.path[1] === sei && editingItem.path[2] === ci && editingItem.path[3] === di ? (
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", flex: 1 }}>
                                      <input autoFocus className="input-field" value={editingItem.value} onChange={e => setEditingItem({ ...editingItem, value: e.target.value })} onKeyDown={e => { if (e.key === "Enter") applyEdit(); if (e.key === "Escape") setEditingItem(null); }} style={{ padding: "2px 6px", fontSize: "0.75rem" }} />
                                      <button onClick={applyEdit} style={{ background: "none", border: "none", cursor: "pointer", color: "#22c55e" }}><Check size={12} /></button>
                                      <button onClick={() => setEditingItem(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><X size={12} /></button>
                                    </div>
                                  ) : (
                                    <span style={{ flex: 1, fontSize: "0.8125rem" }}>{dept.name}</span>
                                  )}
                                  <button onClick={() => startEdit("dept", [si, sei, ci, di], dept.name)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}><Edit3 size={11} /></button>
                                  <button onClick={() => deleteDepartment(si, sei, ci, di)} style={{ background: "none", border: "none", cursor: "pointer", color: "#ef4444" }}><Trash2 size={11} /></button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* ── Add Modal ── */}
      {showModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 999,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)",
        }} onClick={closeModal}>
          <div onClick={e => e.stopPropagation()} className="card" style={{
            width: "90%", maxWidth: "420px",
            padding: "var(--space-6)", position: "relative",
            animation: "fadeIn 0.2s ease-out",
          }}>
            <button onClick={closeModal} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
              <X size={20} />
            </button>

            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, marginBottom: "var(--space-4)" }}>
              Add New {showModal === "school" ? "School" : showModal === "section" ? "Section" : showModal === "course" ? "Course" : "Department"}
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase" }}>
                  {labelTitles[showModal]}
                </label>
                <input
                  autoFocus
                  className="input-field"
                  value={modalValue}
                  onChange={e => setModalValue(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") {
                      if (showModal === "school") addSchool();
                      else if (showModal === "section") addSection();
                      else if (showModal === "course") addCourse();
                      else addDepartment();
                    }
                  }}
                  placeholder={`e.g. ${showModal === "school" ? "School of Computing" : showModal === "section" ? "Commerce 5" : showModal === "course" ? "B.Tech" : "Data Science"}`}
                  style={{ width: "100%" }}
                />
              </div>

              {showModal === "course" && (
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", marginBottom: "4px", textTransform: "uppercase" }}>
                    Program Type
                  </label>
                  <select
                    className="input-field"
                    value={modalProgramType}
                    onChange={e => setModalProgramType(e.target.value as "UG" | "PG")}
                    style={{ width: "100%" }}
                  >
                    <option value="UG">Undergraduate (UG)</option>
                    <option value="PG">Postgraduate (PG)</option>
                  </select>
                </div>
              )}

              <button
                onClick={() => {
                  if (showModal === "school") addSchool();
                  else if (showModal === "section") addSection();
                  else if (showModal === "course") addCourse();
                  else addDepartment();
                }}
                className="btn btn-primary"
                style={{ padding: "10px 20px", display: "flex", alignItems: "center", gap: "6px", justifyContent: "center" }}
              >
                <Plus size={16} /> Add {showModal === "school" ? "School" : showModal === "section" ? "Section" : showModal === "course" ? "Course" : "Department"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
