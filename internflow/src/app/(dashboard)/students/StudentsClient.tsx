"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Award, CheckSquare, Square, Search, Mail, Download, Eye } from "lucide-react";
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



export default function StudentsClient({ initialStudents, queryParam }: { initialStudents: StudentRow[], queryParam: string }) {
  const [students] = useState<StudentRow[]>(initialStudents);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1>Student Directory</h1>
          <p>Comprehensive list of all registered students and their academic profiles.</p>
        </div>
        <form method="GET" style={{ display: "flex", gap: "var(--space-2)" }}>
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

      {/* Bulk Actions Toolbar (Animated) */}
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
              {selectedIds.size} students selected
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

      {/* Export All (always visible) */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--space-3)" }}>
        <button onClick={exportCSV} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", fontSize: "0.875rem" }}>
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
              {students.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
                    No students found.
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
                        </td>
                        <td style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                          <div style={{ display: "flex", gap: "16px" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <Award size={14} /> Year {student.year || "-"}
                            </span>
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
                            <Eye size={16} /> View
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
