"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMapping, upsertMapping } from "@/app/actions/hierarchy";
import { YEARS, type SchoolNode } from "@/lib/constants/hierarchy";
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  Crown,
  Filter,
  GitBranch,
  GraduationCap,
  Loader2,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
  Workflow,
  X,
} from "lucide-react";
import { toast } from "sonner";

type StaffMember = { id: string; firstName: string; lastName: string };
type Mapping = {
  id: string;
  school?: string | null;
  section?: string | null;
  course?: string | null;
  department: string;
  year: number;
  programType?: string | null;
  tutorId: string | null;
  placementCoordinatorId: string | null;
  hodId: string | null;
  deanId: string | null;
};

type TabKey = "mappings" | "assignments" | "conflicts";

const labelStyle: React.CSSProperties = {
  fontSize: "0.8125rem",
  fontWeight: 600,
  color: "var(--text-secondary)",
  display: "block",
  marginBottom: "6px",
};

export default function HierarchyClient({
  initialMappings,
  tutors,
  coordinators,
  hods,
  deans,
  currentUserRole,
  collegeHierarchy,
}: {
  initialMappings: Mapping[];
  tutors: StaffMember[];
  coordinators: StaffMember[];
  hods: StaffMember[];
  deans: StaffMember[];
  currentUserRole: string;
  collegeHierarchy: SchoolNode[];
}) {
  const [mappings] = useState<Mapping[]>(initialMappings);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("mappings");
  const [search, setSearch] = useState("");
  const [filterSchool, setFilterSchool] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [school, setSchool] = useState("");
  const [section, setSection] = useState("");
  const [course, setCourse] = useState("");
  const [programType, setProgramType] = useState("");
  const [dept, setDept] = useState("");
  const [year, setYear] = useState(1);
  const [tutorId, setTutorId] = useState("");
  const [coordinatorId, setCoordinatorId] = useState("");
  const [hodId, setHodId] = useState("");
  const [deanId, setDeanId] = useState("");
  const canCreateOrDeleteMappings = currentUserRole === "dean";
  const canEditScopePath = currentUserRole === "dean";
  const canEditHodDeanAssignments = currentUserRole === "dean";

  const resetForm = () => {
    setSchool("");
    setSection("");
    setCourse("");
    setProgramType("");
    setDept("");
    setYear(1);
    setTutorId("");
    setCoordinatorId("");
    setHodId("");
    setDeanId("");
    setEditId(null);
  };

  const openEdit = (mapping: Mapping) => {
    setSchool(mapping.school || "");
    setSection(mapping.section || "");
    setCourse(mapping.course || "");
    setProgramType(mapping.programType || "");
    setDept(mapping.department || "");
    setYear(mapping.year || 1);
    setTutorId(mapping.tutorId || "");
    setCoordinatorId(mapping.placementCoordinatorId || "");
    setHodId(mapping.hodId || "");
    setDeanId(mapping.deanId || "");
    setEditId(mapping.id);
    setShowForm(true);
  };

  const handleSave = () => {
    startTransition(async () => {
      const fd = new FormData();
      if (editId) fd.set("id", editId);
      fd.set("school", school);
      fd.set("section", section);
      fd.set("course", course);
      fd.set("programType", programType);
      fd.set("department", dept);
      fd.set("year", String(year));
      fd.set("tutorId", tutorId);
      fd.set("coordinatorId", coordinatorId);
      fd.set("hodId", hodId);
      fd.set("deanId", deanId);

      const result = await upsertMapping(fd);
      if (result?.error) {
        toast.error(result.error);
        return;
      }

      toast.success(editId ? "Mapping updated." : "New mapping created.");
      setShowForm(false);
      resetForm();
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to remove this mapping?")) return;
    startTransition(async () => {
      const result = await deleteMapping(id);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Mapping removed.");
      router.refresh();
    });
  };

  const getName = (id: string | null, list: StaffMember[]) => {
    if (!id) return "Not assigned";
    const found = list.find((staff) => staff.id === id);
    return found ? `${found.firstName} ${found.lastName}` : "Unknown";
  };

  const filteredMappings = useMemo(() => {
    const q = search.trim().toLowerCase();
    return mappings.filter((mapping) => {
      if (filterSchool && (mapping.school || "") !== filterSchool) return false;
      if (filterSection && (mapping.section || "") !== filterSection) return false;
      if (!q) return true;
      const haystack = [
        mapping.school,
        mapping.section,
        mapping.course,
        mapping.programType,
        mapping.department,
        getName(mapping.tutorId, tutors),
        getName(mapping.placementCoordinatorId, coordinators),
        getName(mapping.hodId, hods),
        getName(mapping.deanId, deans),
        String(mapping.year || ""),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [mappings, filterSchool, filterSection, search, tutors, coordinators, hods, deans]);

  const groupedMappings = useMemo(() => {
    const groups = new Map<string, Mapping[]>();
    for (const mapping of filteredMappings) {
      const key = [mapping.school || "Unknown School", mapping.section || "Unknown Section", mapping.course || "Unknown Class", mapping.department || "Unknown Department"].join(" | ");
      groups.set(key, [...(groups.get(key) || []), mapping]);
    }
    return Array.from(groups.entries()).map(([key, rows]) => ({
      key,
      rows: rows.sort((a, b) => (a.year || 0) - (b.year || 0)),
    }));
  }, [filteredMappings]);

  const duplicateGroups = useMemo(() => {
    const grouped = new Map<string, Mapping[]>();
    for (const mapping of mappings) {
      const key = [mapping.school || "", mapping.section || "", mapping.course || "", mapping.programType || "", mapping.department || "", mapping.year || 0].join("|");
      grouped.set(key, [...(grouped.get(key) || []), mapping]);
    }
    return Array.from(grouped.entries()).filter(([, rows]) => rows.length > 1);
  }, [mappings]);

  const assignmentAlerts = useMemo(() => {
    const alerts: Array<{ label: string; scopes: string[] }> = [];
    const roleAssignments = new Map<string, string[]>();
    for (const mapping of mappings) {
      for (const [label, userId] of [
        ["Tutor", mapping.tutorId],
        ["PC", mapping.placementCoordinatorId],
        ["HOD", mapping.hodId],
        ["Dean", mapping.deanId],
      ] as const) {
        if (!userId) continue;
        const key = `${label}:${userId}`;
        const scope = `${mapping.school || "?"} / ${mapping.section || "?"} / ${mapping.course || "?"} / ${mapping.department || "?"} / Year ${mapping.year || 0}`;
        roleAssignments.set(key, [...(roleAssignments.get(key) || []), scope]);
      }
    }
    for (const [label, scopes] of roleAssignments.entries()) {
      const distinct = Array.from(new Set(scopes));
      if (distinct.length > 1) {
        alerts.push({ label, scopes: distinct });
      }
    }
    return alerts;
  }, [mappings]);

  const schoolNode = collegeHierarchy.find((node) => node.school === school);
  const sectionNode = schoolNode?.sections.find((node) => node.section === section);
  const courseNodes = sectionNode?.courses || [];
  const selectedCourseNode = courseNodes.find((node) => node.course === course && node.programType === programType);
  const previewChips = [
    school && `School: ${school}`,
    section && `Section: ${section}`,
    course && `Class: ${course}`,
    programType && `Program: ${programType}`,
    dept && `Dept: ${dept}`,
    year && `Year: ${year}`,
  ].filter(Boolean) as string[];

  const filteredSections = filterSchool ? collegeHierarchy.find((node) => node.school === filterSchool)?.sections || [] : [];

  return (
    <div className="dashboard-shell animate-fade-in">
      <section className="hero-panel">
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          <span className="hero-badge">
            <Workflow size={14} />
            Mapping Studio
          </span>
          <div className="page-header" style={{ marginBottom: 0 }}>
            <h1>Authority Hierarchy</h1>
            <p>Manage class-level authority mappings, spot broken assignments, and keep student visibility aligned across tutors, PCs, HODs, and deans.</p>
          </div>
          <div className="metric-strip">
            <StatBlock label="Total mappings" value={mappings.length} />
            <StatBlock label="Grouped scopes" value={groupedMappings.length} accent="var(--text-link)" />
            <StatBlock label="Duplicate conflicts" value={duplicateGroups.length} accent={duplicateGroups.length > 0 ? "#b45309" : "var(--rathinam-green)"} />
            <StatBlock label="Assignment alerts" value={assignmentAlerts.length} accent={assignmentAlerts.length > 0 ? "#dc2626" : "var(--rathinam-green)"} />
          </div>
        </div>
      </section>

      <div className="toolbar-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1rem" }}>Filter and navigate</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Use school and section first to keep the mapping table compact and easier to audit.
            </p>
          </div>
          {canCreateOrDeleteMappings ? (
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus size={18} /> New Mapping
            </button>
          ) : null}
        </div>
        <div className="filter-grid">
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={labelStyle}>Search</span>
            <div style={{ position: "relative" }}>
              <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search class, dept, or staff" className="input-field" style={{ paddingLeft: "36px" }} />
            </div>
          </label>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={labelStyle}>School</span>
            <select value={filterSchool} onChange={(e) => { setFilterSchool(e.target.value); setFilterSection(""); }} className="input-field">
              <option value="">All schools</option>
              {collegeHierarchy.map((node) => <option key={node.school} value={node.school}>{node.school}</option>)}
            </select>
          </label>
          <label style={{ display: "grid", gap: "6px" }}>
            <span style={labelStyle}>Section</span>
            <select value={filterSection} onChange={(e) => setFilterSection(e.target.value)} className="input-field" disabled={!filterSchool}>
              <option value="">All sections</option>
              {filteredSections.map((node) => <option key={node.section} value={node.section}>{node.section}</option>)}
            </select>
          </label>
        </div>
      </div>

      <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
        <TabButton active={activeTab === "mappings"} onClick={() => setActiveTab("mappings")} icon={<GitBranch size={16} />} label="Mappings" />
        <TabButton active={activeTab === "assignments"} onClick={() => setActiveTab("assignments")} icon={<Users size={16} />} label="Assignments" />
        <TabButton active={activeTab === "conflicts"} onClick={() => setActiveTab("conflicts")} icon={<AlertTriangle size={16} />} label="Conflicts" />
      </div>

      {activeTab === "mappings" && (
        <div className="dashboard-shell">
          {groupedMappings.length === 0 ? (
            <EmptyState
              icon={<Filter size={40} />}
              title="No mappings match the current filters"
              detail="Choose a different school or section, or create a new mapping to start building the authority chain."
            />
          ) : (
            groupedMappings.map((group) => {
              const [groupSchool, groupSection, groupCourse, groupDepartment] = group.key.split(" | ");
              return (
                <div key={group.key} className="card-glass" style={{ padding: "var(--space-5)", borderRadius: "var(--border-radius-xl)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px", flexWrap: "wrap", marginBottom: "var(--space-4)" }}>
                    <div>
                      <h2 style={{ marginTop: 0, marginBottom: "6px" }}>{groupCourse} • {groupDepartment}</h2>
                      <div className="scope-meta">
                        <span className="scope-chip">{groupSchool}</span>
                        <span className="scope-chip">{groupSection}</span>
                        <span className="scope-chip">{group.rows[0]?.programType || "UG"}</span>
                        <span className="scope-chip">{group.rows.length} mapping row{group.rows.length === 1 ? "" : "s"}</span>
                      </div>
                    </div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.84rem" }}>
                      Grouped by school, section, class, and department
                    </div>
                  </div>

                  <div style={{ display: "grid", gap: "var(--space-3)" }}>
                    {group.rows.map((mapping) => {
                      const missingAssignments = [mapping.tutorId, mapping.placementCoordinatorId, mapping.hodId, mapping.deanId].filter(Boolean).length < 4;
                      return (
                        <div key={mapping.id} className="card" style={{ padding: "var(--space-4)", background: "rgba(255,255,255,0.9)" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "12px", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                                <strong>Year {mapping.year}</strong>
                                <span className={`severity-badge ${missingAssignments ? "severity-medium" : "severity-low"}`}>
                                  {missingAssignments ? "Needs assignment review" : "Fully assigned"}
                                </span>
                              </div>
                              <div className="scope-meta">
                                <span className="scope-chip">Tutor: {getName(mapping.tutorId, tutors)}</span>
                                <span className="scope-chip">PC: {getName(mapping.placementCoordinatorId, coordinators)}</span>
                                <span className="scope-chip">HOD: {getName(mapping.hodId, hods)}</span>
                                <span className="scope-chip">Dean: {getName(mapping.deanId, deans)}</span>
                              </div>
                            </div>
                            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                              <button onClick={() => openEdit(mapping)} className="btn btn-outline">Edit</button>
                              {canCreateOrDeleteMappings ? (
                                <button onClick={() => handleDelete(mapping.id)} className="btn btn-secondary" style={{ color: "#dc2626" }}>
                                  <Trash2 size={14} /> Remove
                                </button>
                              ) : null}
                            </div>
                          </div>
                          {missingAssignments && (
                            <div className="recommendation-panel">
                              <div style={{ fontWeight: 700, marginBottom: "4px" }}>Recommended action</div>
                              <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                                Complete the missing tutor, PC, HOD, or dean assignments so approval routing and visibility stay predictable for this class scope.
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === "assignments" && (
        <div className="dashboard-shell">
          {filteredMappings.length === 0 ? (
            <EmptyState
              icon={<Users size={40} />}
              title="No assignment rows to show"
              detail="Create or filter mappings first, then come back here to inspect the people assigned to each scope."
            />
          ) : (
            <div className="card-glass" style={{ padding: "var(--space-5)", borderRadius: "var(--border-radius-xl)" }}>
              <h2 style={{ marginTop: 0, marginBottom: "var(--space-4)" }}>Compact assignment table</h2>
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>School</th>
                      <th>Section</th>
                      <th>Class</th>
                      <th>Dept</th>
                      <th>Year</th>
                      <th>Tutor</th>
                      <th>PC</th>
                      <th>HOD</th>
                      <th>Dean</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMappings.map((mapping) => (
                      <tr key={mapping.id}>
                        <td>{mapping.school || "-"}</td>
                        <td>{mapping.section || "-"}</td>
                        <td>{mapping.course || "-"}</td>
                        <td>{mapping.department || "-"}</td>
                        <td>Year {mapping.year || 0}</td>
                        <td>{getName(mapping.tutorId, tutors)}</td>
                        <td>{getName(mapping.placementCoordinatorId, coordinators)}</td>
                        <td>{getName(mapping.hodId, hods)}</td>
                        <td>{getName(mapping.deanId, deans)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "conflicts" && (
        <div className="dashboard-shell">
          {duplicateGroups.length === 0 && assignmentAlerts.length === 0 ? (
            <EmptyState
              icon={<AlertTriangle size={40} />}
              title="No mapping conflicts detected"
              detail="Your hierarchy rows do not currently show duplicate scope keys or multi-scope assignment alerts."
            />
          ) : (
            <>
              {duplicateGroups.length > 0 && (
                <div className="card">
                  <h2 style={{ marginTop: 0, marginBottom: "var(--space-4)" }}>Duplicate scope rows</h2>
                  <div style={{ display: "grid", gap: "var(--space-3)" }}>
                    {duplicateGroups.map(([key, rows]) => (
                      <div key={key} className="recommendation-panel">
                        <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "6px" }}>
                          <strong>{key.replaceAll("|", " / ")}</strong>
                          <span className="severity-badge severity-medium">{rows.length} rows</span>
                        </div>
                        <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                          Clean these duplicates from the audit page or review them individually here before adding more mappings for the same class scope.
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {assignmentAlerts.length > 0 && (
                <div className="card">
                  <h2 style={{ marginTop: 0, marginBottom: "var(--space-4)" }}>Staff assignment alerts</h2>
                  <div style={{ display: "grid", gap: "var(--space-3)" }}>
                    {assignmentAlerts.map((alert) => (
                      <div key={alert.label} className="recommendation-panel">
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "6px" }}>
                          <strong>{alert.label}</strong>
                          <span className="severity-badge severity-high">Multiple distinct scopes</span>
                        </div>
                        <div style={{ display: "grid", gap: "4px" }}>
                          {alert.scopes.map((scope) => (
                            <div key={scope} style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>
                              - {scope}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {showForm && (
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
          onClick={() => {
            setShowForm(false);
            resetForm();
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              width: "92%",
              maxWidth: "760px",
              padding: "var(--space-6)",
              position: "relative",
              maxHeight: "88vh",
              overflowY: "auto",
            }}
          >
            <button onClick={() => { setShowForm(false); resetForm(); }} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}>
              <X size={20} />
            </button>

            <div style={{ display: "grid", gap: "var(--space-5)" }}>
              <div>
                <h2 style={{ marginTop: 0, marginBottom: "6px" }}>{editId ? "Edit mapping" : "New authority mapping"}</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                  Define one exact academic scope, then assign tutor, PC, HOD, and dean for that path.
                </p>
              </div>

              <div className="recommendation-panel">
                <div style={{ fontWeight: 700, marginBottom: "6px" }}>Live scope preview</div>
                <div className="scope-meta">
                  {previewChips.length > 0 ? previewChips.map((chip) => <span key={chip} className="scope-chip">{chip}</span>) : <span className="scope-chip">Choose school and class to begin</span>}
                </div>
              </div>

              <div className="filter-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                <Field label="School">
                  <select value={school} onChange={(e) => { setSchool(e.target.value); setSection(""); setCourse(""); setProgramType(""); setDept(""); }} className="input-field" disabled={!canEditScopePath}>
                    <option value="">Select School...</option>
                    {collegeHierarchy.map((node) => <option key={node.school} value={node.school}>{node.school}</option>)}
                  </select>
                </Field>
                <Field label="Section">
                  <select value={section} onChange={(e) => { setSection(e.target.value); setCourse(""); setProgramType(""); setDept(""); }} className="input-field" disabled={!school || !canEditScopePath}>
                    <option value="">Select Section...</option>
                    {schoolNode?.sections.map((node) => <option key={node.section} value={node.section}>{node.section}</option>)}
                  </select>
                </Field>
                <Field label="Course">
                  <select value={course} onChange={(e) => { setCourse(e.target.value); setProgramType(""); setDept(""); }} className="input-field" disabled={!section || !canEditScopePath}>
                    <option value="">Select Course...</option>
                    {Array.from(new Set(courseNodes.map((node) => node.course))).map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </Field>
                <Field label="Program Type">
                  <select value={programType} onChange={(e) => { setProgramType(e.target.value); setDept(""); setYear(1); }} className="input-field" disabled={!course || !canEditScopePath}>
                    <option value="">Select Program...</option>
                    {Array.from(new Set(courseNodes.filter((node) => node.course === course).map((node) => node.programType))).map((value) => <option key={value} value={value}>{value}</option>)}
                  </select>
                </Field>
                <Field label="Department">
                  <select value={dept} onChange={(e) => setDept(e.target.value)} className="input-field" disabled={!programType || !canEditScopePath}>
                    <option value="">Select Department...</option>
                    {selectedCourseNode?.departments.map((node) => <option key={node.name} value={node.name}>{node.name}</option>)}
                  </select>
                </Field>
                <Field label="Year">
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="input-field" disabled={!canEditScopePath}>
                    {(programType === "PG" ? [1, 2] : programType === "UG" ? [1, 2, 3] : YEARS).map((value) => <option key={value} value={value}>Year {value}</option>)}
                  </select>
                </Field>
              </div>

              <div className="scope-grid">
                <StaffSelect label="Tutor" value={tutorId} onChange={setTutorId} options={tutors} />
                <StaffSelect label="Placement Coordinator" value={coordinatorId} onChange={setCoordinatorId} options={coordinators} />
                <StaffSelect label="Head of Department" value={hodId} onChange={setHodId} options={hods} disabled={!canEditHodDeanAssignments} />
                <StaffSelect label="Dean" value={deanId} onChange={setDeanId} options={deans} disabled={!canEditHodDeanAssignments} />
              </div>

              <div className="sticky-action-bar">
                <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
                  Save only after the scope preview matches the exact school, section, class, department, and year you want this approval chain to control.
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <button onClick={() => { setShowForm(false); resetForm(); }} className="btn btn-secondary">Cancel</button>
                  <button onClick={handleSave} disabled={isPending} className="btn btn-primary">
                    {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {editId ? "Update Mapping" : "Create Mapping"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "grid", gap: "6px" }}>
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function StaffSelect({
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: StaffMember[];
  disabled?: boolean;
}) {
  return (
    <Field label={label}>
      <select value={value} onChange={(e) => onChange(e.target.value)} className="input-field" disabled={disabled}>
        <option value="">Not Assigned</option>
        {options.map((staff) => (
          <option key={staff.id} value={staff.id}>
            {staff.firstName} {staff.lastName}
          </option>
        ))}
      </select>
    </Field>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button onClick={onClick} className={active ? "btn btn-primary" : "btn btn-secondary"}>
      {icon}
      {label}
    </button>
  );
}

function StatBlock({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="glass-stat">
      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "4px" }}>{label}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: 800, color: accent || "var(--text-primary)" }}>{value}</div>
    </div>
  );
}

function EmptyState({ icon, title, detail }: { icon: React.ReactNode; title: string; detail: string }) {
  return (
    <div className="card" style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--text-secondary)" }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "var(--space-4)", opacity: 0.5 }}>{icon}</div>
      <h3 style={{ marginBottom: "8px" }}>{title}</h3>
      <p style={{ margin: 0 }}>{detail}</p>
    </div>
  );
}
