"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Award, CheckSquare, Square, Search, Mail, Download, Eye, Filter } from "lucide-react";
import Link from "next/link";

type StudentRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  department?: string | null;
  year?: number | null;
  section?: string | null;
  school?: string | null;
  program?: string | null;
  course?: string | null;
  batchStartYear?: number | null;
  batchEndYear?: number | null;
  phone?: string | null;
  registerNo?: string | null;
  cgpa?: string | null;
  dob?: string | null;
  professionalSummary?: string | null;
  githubLink?: string | null;
  linkedinLink?: string | null;
  portfolioUrl?: string | null;
};



export default function StudentsClient({ 
  initialStudents, 
  queryParam,
  activeFilters,
  filtersRequired = false,
  role,
}: { 
  initialStudents: StudentRow[], 
  queryParam: string,
  activeFilters: {
    school: string;
    department: string;
    course: string;
    year: string;
    section: string;
  };
  filtersRequired?: boolean;
  role: string;
}) {
  const [students] = useState<StudentRow[]>(initialStudents);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const hideSchoolDepartmentFilters = role === "placement_coordinator" || role === "hod";

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === students.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(students.map(s => s.id)));
  };

  const exportCSV = () => {
    const selected = students.filter(s => selectedIds.has(s.id));
    const data = selected.length > 0 ? selected : students;
    const headers = ["First Name", "Last Name", "Email", "Department", "Year", "Section", "Phone", "Register No"];
    const rows = data.map(s => [
      s.firstName, s.lastName, s.email, s.department || "", s.year || "", s.section || "", s.phone || "", s.registerNo || ""
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map((c: string | number) => `"${String(c)}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `students_export_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const departmentColors: Record<string, string> = {
    "Computer Science": "var(--color-primary)",
    "Information Technology": "var(--color-success)",
    "Artificial Intelligence": "var(--color-warning)",
    "Electronics": "var(--color-danger)",
    "Mechanical": "#8b5cf6",
  };

  const getDeptColor = (dept?: string | null) => {
    for (const [key, color] of Object.entries(departmentColors)) {
      if (dept?.toLowerCase().includes(key.toLowerCase())) return color;
    }
    return "var(--text-secondary)";
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1>Student Directory</h1>
          <p>Find students by class, school, department, and year with a cleaner, role-aware workflow.</p>
        </div>
        <form method="GET" className="toolbar-card" style={{ minWidth: "min(100%, 360px)" }}>
          <div style={{ fontSize: "0.78rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--text-secondary)" }}>
            Quick search
          </div>
          <div style={{ position: "relative" }}>
            <Search size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} />
            <input 
              type="search" 
              name="q" 
              placeholder="Search students..." 
              defaultValue={queryParam}
              className="input-field"
              style={{ paddingLeft: "36px", width: "250px" }}
            />
          </div>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>
      </div>

      <form method="GET" className="toolbar-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1rem" }}>Filter Students</h2>
            <p style={{ margin: "4px 0 0 0", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
              Choose class details first. This keeps the list accurate and avoids showing irrelevant students.
            </p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
            <button type="submit" className="btn btn-primary">Apply Filters</button>
            <Link href="/students" className="btn btn-outline" style={{ textDecoration: "none" }}>
              Reset
            </Link>
          </div>
        </div>
        <div className="filter-grid">
          <input type="search" name="q" placeholder="Name or email" defaultValue={queryParam} className="input-field" />
          {!hideSchoolDepartmentFilters ? <input type="text" name="school" placeholder="School" defaultValue={activeFilters.school} className="input-field" /> : null}
          {!hideSchoolDepartmentFilters ? <input type="text" name="department" placeholder="Department" defaultValue={activeFilters.department} className="input-field" /> : null}
          <input type="text" name="course" placeholder="Course" defaultValue={activeFilters.course} className="input-field" />
          <select name="year" defaultValue={activeFilters.year} className="input-field">
            <option value="">All Years</option>
            {[1, 2, 3, 4, 5].map((year) => (
              <option key={year} value={year}>Year {year}</option>
            ))}
          </select>
          <input type="text" name="section" placeholder="Section" defaultValue={activeFilters.section} className="input-field" />
        </div>
      </form>

      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ 
              background: "var(--bg-card)", 
              padding: "12px 24px", 
              borderRadius: "12px", 
              marginBottom: "var(--space-4)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "12px",
              boxShadow: "0 8px 30px rgba(0,0,0,0.12)",
              border: "1px solid var(--color-primary)"
            }}
          >
            <div style={{ fontWeight: "bold", color: "var(--color-primary)" }}>
              {selectedIds.size} student{selectedIds.size === 1 ? "" : "s"} selected
            </div>
            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              <button onClick={exportCSV} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px" }}>
                <Download size={16} /> Export Selected
              </button>
              <button className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "6px 12px" }}>
                <Mail size={16} /> Email Group
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "var(--space-3)" }}>
        <div style={{ color: "var(--text-secondary)", fontSize: "0.88rem" }}>
          {students.length} visible record{students.length === 1 ? "" : "s"}
        </div>
        <button onClick={exportCSV} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", fontSize: "0.875rem", opacity: students.length === 0 ? 0.5 : 1, pointerEvents: students.length === 0 ? "none" : "auto" }}>
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-secondary)" }}>
                <th style={{ padding: "var(--space-4)", width: "50px", textAlign: "center", cursor: "pointer" }} onClick={toggleAll}>
                  {selectedIds.size === students.length && students.length > 0 ? <CheckSquare size={18} color="var(--color-primary)" /> : <Square size={18} color="var(--text-muted)" />}
                </th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Student Name</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Department</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Academic Year</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Contact Info</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem", textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtersRequired ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--space-4)" }}>
                      <Filter size={48} color="var(--text-muted)" />
                      <div style={{ maxWidth: "400px" }}>
                        <h3 style={{ margin: "0 0 8px 0", color: "var(--text-primary)" }}>Please Apply Filters</h3>
                        <p style={{ margin: 0, fontSize: "0.875rem" }}>
                          As an administrator, loading the entire student directory may degrade performance. 
                          Please search by name/email or use filters to narrow by academic scope before loading records.
                        </p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
                    No students match the current class, department, or search filters.
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {students.map((student, idx) => {
                    const isSelected = selectedIds.has(student.id);
                    const deptColor = getDeptColor(student.department);
                    
                    return (
                      <motion.tr 
                        key={student.id} 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: idx * 0.05 }}
                        whileHover={{ backgroundColor: "var(--bg-hover)" }}
                        style={{ 
                          borderBottom: "1px solid var(--border-color)", 
                          backgroundColor: isSelected ? "var(--bg-hover)" : "transparent",
                          cursor: "pointer",
                          transition: "background-color 0.2s"
                        }}
                        onClick={() => toggleSelect(student.id)}
                      >
                        <td style={{ padding: "var(--space-4)", textAlign: "center" }}>
                          <motion.div animate={isSelected ? { scale: [1, 1.2, 1] } : { scale: 1 }}>
                            {isSelected ? <CheckSquare size={18} color="var(--color-primary)" /> : <Square size={18} color="var(--text-muted)" />}
                          </motion.div>
                        </td>
                        <td style={{ padding: "var(--space-4)" }}>
                          <div style={{ fontWeight: 600, display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{ width: 32, height: 32, borderRadius: "50%", background: "var(--gradient-accent)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.875rem", flexShrink: 0 }}>
                              {student.firstName[0]}{student.lastName[0]}
                            </div>
                            <div>
                              {student.firstName} {student.lastName}
                              <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", fontWeight: "normal" }}>{student.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "var(--space-4)" }}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: `color-mix(in srgb, ${deptColor} 10%, transparent)`, color: deptColor, padding: "4px 10px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: "bold" }}>
                            <GraduationCap size={14} />
                            {student.department || "Unassigned"}
                          </div>
                          <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "8px" }}>
                            {student.school || "No school"} {student.course ? `• ${student.course}` : ""}
                          </div>
                        </td>
                        <td style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                          <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Award size={14} /> Year {student.year || "-"}
                            </span>
                            <span>Section {student.section || "-"}</span>
                          </div>
                        </td>
                        <td style={{ padding: "var(--space-4)" }}>
                          <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                            {student.phone || "No contact saved"}
                          </div>
                        </td>
                        <td style={{ padding: "var(--space-4)", textAlign: "center" }}>
                          <Link
                            href={`/students/${student.id}`}
                            className="btn btn-ghost"
                            style={{ padding: "6px 10px", minHeight: "auto", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.8125rem", textDecoration: "none" }}
                            title="View student details"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Eye size={16} /> View Student
                          </Link>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
