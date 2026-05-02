"use client";

import { useState, useEffect } from "react";
import { Download, Filter, Search, Loader2 } from "lucide-react";
import { fetchPlacementReport } from "@/app/actions/analyticsReports";

type ReportData = Awaited<ReturnType<typeof fetchPlacementReport>>;

export default function ReportsClient({
  filterOptions,
}: {
  filterOptions: {
    schools: string[];
    departments: string[];
    sections: string[];
    courses: string[];
    batches: { start: number; end: number }[];
  };
}) {
  const [data, setData] = useState<ReportData>([]);
  const [loading, setLoading] = useState(true);
  
  // Filter States
  const [type, setType] = useState<"all" | "internship" | "full-time">("all");
  const [school, setSchool] = useState<string>("");
  const [department, setDepartment] = useState<string>("");
  const [section, setSection] = useState<string>("");
  const [course, setCourse] = useState<string>("");
  const [batch, setBatch] = useState<string>("");

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type, school, department, section, course, batch]);

  async function loadData() {
    setLoading(true);
    
    let batchStart, batchEnd;
    if (batch) {
      const [start, end] = batch.split("-").map(Number);
      batchStart = start;
      batchEnd = end;
    }

    try {
      const result = await fetchPlacementReport({
        type,
        school: school || undefined,
        department: department || undefined,
        section: section || undefined,
        course: course || undefined,
        batchStartYear: batchStart,
        batchEndYear: batchEnd,
      });
      setData(result);
    } catch (error) {
      console.error("Failed to load report data", error);
    } finally {
      setLoading(false);
    }
  }

  function handleExportCsv() {
    if (!data.length) return;

    const headers = [
      "Register No",
      "Student Name",
      "School",
      "Department",
      "Course",
      "Section",
      "Batch",
      "Company",
      "Role",
      "Job Type",
      "Application Type",
      "Status",
      "Applied Date"
    ];

    const rows = data.map(r => [
      r.registerNo || "N/A",
      `${r.firstName} ${r.lastName}`,
      r.school || "N/A",
      r.department || "N/A",
      r.course || "N/A",
      r.section || "N/A",
      r.batchStartYear ? `${r.batchStartYear}-${r.batchEndYear}` : "N/A",
      r.companyName || "N/A",
      r.role || "N/A",
      r.jobType || "Internship",
      r.applicationType,
      r.status,
      r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : "N/A"
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `placement_report_${type}_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
      
      {/* ── Filter Controls ── */}
      <div className="card" style={{ padding: "var(--space-5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "1.1rem", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
            <Filter size={18} className="text-primary" /> Report Filters
          </h2>
          <button 
            onClick={handleExportCsv}
            disabled={loading || data.length === 0}
            className="btn btn-primary" 
            style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px" }}
          >
            <Download size={16} /> Export to CSV
          </button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)" }}>
          <div className="input-group">
            <label>Report Type</label>
            <select className="input-field" value={type} onChange={e => setType(e.target.value as "all" | "internship" | "full-time")}>
              <option value="all">All Placements</option>
              <option value="internship">Internships</option>
              <option value="full-time">Full-Time Employment</option>
            </select>
          </div>

          <div className="input-group">
            <label>School</label>
            <select className="input-field" value={school} onChange={e => setSchool(e.target.value)}>
              <option value="">All Schools</option>
              {filterOptions.schools.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Department</label>
            <select className="input-field" value={department} onChange={e => setDepartment(e.target.value)}>
              <option value="">All Departments</option>
              {filterOptions.departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Course</label>
            <select className="input-field" value={course} onChange={e => setCourse(e.target.value)}>
              <option value="">All Courses</option>
              {filterOptions.courses.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Section</label>
            <select className="input-field" value={section} onChange={e => setSection(e.target.value)}>
              <option value="">All Sections</option>
              {filterOptions.sections.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div className="input-group">
            <label>Batch Year</label>
            <select className="input-field" value={batch} onChange={e => setBatch(e.target.value)}>
              <option value="">All Batches</option>
              {filterOptions.batches.map(b => (
                <option key={`${b.start}-${b.end}`} value={`${b.start}-${b.end}`}>
                  {b.start} - {b.end}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Data Table ── */}
      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--border-color)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "1rem" }}>Report Results <span style={{ color: "var(--text-secondary)", fontWeight: "normal", fontSize: "0.875rem", marginLeft: "8px" }}>({data.length} records)</span></h3>
        </div>

        {loading ? (
          <div style={{ padding: "var(--space-8)", display: "flex", justifyContent: "center", alignItems: "center", color: "var(--text-secondary)" }}>
            <Loader2 className="animate-spin" size={24} style={{ marginRight: "8px" }} /> Loading report data...
          </div>
        ) : data.length === 0 ? (
          <div style={{ padding: "var(--space-8)", textAlign: "center", color: "var(--text-secondary)" }}>
            <Search size={48} style={{ opacity: 0.2, margin: "0 auto var(--space-4)" }} />
            <p>No placement records found matching the selected filters.</p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead style={{ background: "var(--bg-secondary)", textAlign: "left" }}>
                <tr>
                  <th style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>Register No</th>
                  <th style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>Student Name</th>
                  <th style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>School / Dept</th>
                  <th style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>Batch</th>
                  <th style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>Company</th>
                  <th style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>Job Role</th>
                  <th style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-color)" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row) => (
                  <tr key={`${row.studentId}-${row.companyName}`} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{row.registerNo || "N/A"}</td>
                    <td style={{ padding: "12px 16px" }}>{row.firstName} {row.lastName}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: "0.875rem" }}>{row.school || "N/A"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{row.department || "N/A"}</div>
                    </td>
                    <td style={{ padding: "12px 16px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      {row.batchStartYear ? `${row.batchStartYear}-${row.batchEndYear}` : "N/A"} <br/>
                      {row.section ? `Sec: ${row.section}` : ""}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: 500 }}>{row.companyName}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontSize: "0.875rem" }}>{row.role}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                        {row.jobType || (row.applicationType === "portal" ? "Internship" : "External")}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className={`badge badge-${row.status === "approved" ? "success" : row.status === "rejected" ? "danger" : "warning"}`}>
                        {(row.status || "pending").replace(/_/g, " ")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
