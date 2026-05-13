"use client";

import { useTransition } from "react";
import Link from "next/link";

import { toast } from "sonner";

import { mergeDuplicateMappings } from "@/app/actions/hierarchy";

type MappingRow = {
  id: string;
  updatedAt: string;
  tutorId?: string | null;
  placementCoordinatorId?: string | null;
  hodId?: string | null;
  deanId?: string | null;
};

export function DuplicateMappingAuditCard({
  title,
  subtitle,
  issues,
  recommendation,
  keeperId,
  duplicateIds,
  rows,
  canMerge,
}: {
  title: string;
  subtitle: string;
  issues: string[];
  recommendation?: string;
  keeperId: string;
  duplicateIds: string[];
  rows: MappingRow[];
  canMerge: boolean;
}) {
  const [isPending, startTransition] = useTransition();

  const handleMerge = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("keeperId", keeperId);
      formData.set("duplicateIds", duplicateIds.join(","));
      const result = await mergeDuplicateMappings(formData);
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      toast.success("Duplicate mappings merged.");
    });
  };

  return (
    <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", background: "var(--bg-secondary)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "var(--space-2)", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <div style={{ fontWeight: 600 }}>{title}</div>
            <span className={`severity-badge ${canMerge ? "severity-medium" : "severity-high"}`}>
              {canMerge ? "Safe merge available" : "Conflict detected"}
            </span>
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{subtitle}</div>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link href="/settings/hierarchy" className="btn btn-outline" style={{ textDecoration: "none" }}>
            Open hierarchy
          </Link>
          <button type="button" className="btn btn-primary" onClick={handleMerge} disabled={!canMerge || isPending}>
            {isPending ? "Merging..." : "Merge duplicates"}
          </button>
        </div>
      </div>

      {recommendation && (
        <div className="recommendation-panel" style={{ marginBottom: "var(--space-3)" }}>
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>Recommended fix</div>
          <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>{recommendation}</div>
        </div>
      )}

      <div style={{ display: "grid", gap: "6px", marginBottom: "var(--space-3)" }}>
        {issues.map((issue, index) => (
          <div key={index} style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
            - {issue}
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gap: "10px" }}>
        {rows.map((row) => (
          <div
            key={row.id}
            style={{
              border: row.id === keeperId ? "1px solid var(--color-success)" : "1px solid var(--border-color)",
              borderRadius: "10px",
              padding: "10px 12px",
              background: row.id === keeperId ? "rgba(34, 197, 94, 0.08)" : "var(--bg-primary)",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: "4px" }}>
              {row.id === keeperId ? "Recommended keeper" : "Duplicate row"}: {row.id.slice(0, 8)}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
              Updated: {row.updatedAt}
            </div>
            <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "4px" }}>
              Tutor: {row.tutorId ? row.tutorId.slice(0, 8) : "None"} | PC: {row.placementCoordinatorId ? row.placementCoordinatorId.slice(0, 8) : "None"} | HOD: {row.hodId ? row.hodId.slice(0, 8) : "None"} | Dean: {row.deanId ? row.deanId.slice(0, 8) : "None"}
            </div>
          </div>
        ))}
      </div>

      {!canMerge && (
        <p style={{ margin: "10px 0 0 0", fontSize: "0.875rem", color: "#b45309" }}>
          Merge is disabled because staff assignments conflict across these rows. Review them in hierarchy settings first.
        </p>
      )}
    </div>
  );
}
