"use client";

import { useState, useMemo } from "react";
import { Trophy, Filter, Calendar, Building2, User } from "lucide-react";

interface SelectionResult {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  jobTitle: string;
  companyName: string | null;
  appliedAt: Date | null;
  updatedAt: Date | null;
}

export default function SelectionResultsSection({ results }: { results: SelectionResult[] }) {
  const [filter, setFilter] = useState<"recent" | "all">("recent");

  const filteredResults = useMemo(() => {
    if (filter === "recent") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return results.filter(r => r.updatedAt && new Date(r.updatedAt) >= thirtyDaysAgo);
    }
    return results;
  }, [results, filter]);

  if (results.length === 0) return null;

  return (
    <div style={{ marginTop: "var(--space-8)", paddingTop: "var(--space-6)", borderTop: "2px solid var(--border-color)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px", fontSize: "1.25rem" }}>
          <Trophy size={22} color="#f59e0b" /> Selection Results
        </h2>
        <div style={{ display: "flex", gap: "6px" }}>
          {(["recent", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? "" : "btn-outline"}`}
              style={{
                borderRadius: "100px", padding: "6px 16px", fontSize: "0.8rem", textTransform: "capitalize", height: "auto",
                background: filter === f ? "var(--color-primary)" : "transparent",
                color: filter === f ? "white" : "var(--text-secondary)",
              }}
            >
              <Filter size={14} style={{ marginRight: "4px" }} /> {f === "recent" ? "Last 30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--text-secondary)" }}>
          No results found in this period. Try switching to &quot;All Time&quot;.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
          {filteredResults.map(r => (
            <div key={r.id} className="card" style={{ borderLeft: "3px solid #f59e0b", padding: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={18} color="#f59e0b" />
                </div>
                <div>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: "0.95rem" }}>{r.studentFirstName} {r.studentLastName}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>{r.jobTitle}</p>
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-secondary)", marginTop: "8px", paddingTop: "8px", borderTop: "1px solid var(--border-color)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Building2 size={12} /> {r.companyName || "Company"}
                </span>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={12} /> {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
