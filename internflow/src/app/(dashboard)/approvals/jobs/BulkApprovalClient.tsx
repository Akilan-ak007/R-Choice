"use client";

import { useState } from "react";
import Link from "next/link";
import { updateBulkJobStatus } from "@/app/actions/jobs";
import JobApprovalActions from "./JobApprovalActions";
import { Building2, Check, Loader2, X } from "lucide-react";

type JobType = {
  id: string;
  title: string;
  companyId: string | null;
  companyName: string | null;
  stipend: string | null;
  location: string | null;
  description: string | null;
  requiredSkills: string[] | null;
  openingsCount: number | null;
  createdAt: Date | null;
};

export default function BulkApprovalClient({ jobs }: { jobs: JobType[] }) {
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [isBulkLoading, setIsBulkLoading] = useState<"approve" | "reject" | null>(null);
  const [showBulkRejectModal, setShowBulkRejectModal] = useState(false);
  const [bulkReason, setBulkReason] = useState("");

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedJobs(new Set(jobs.map((job) => job.id)));
    } else {
      setSelectedJobs(new Set());
    }
  };

  const handleSelectJob = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedJobs);
    if (checked) {
      newSelected.add(id);
    } else {
      newSelected.delete(id);
    }
    setSelectedJobs(newSelected);
  };

  const handleBulkApprove = async () => {
    if (selectedJobs.size === 0) return;
    setIsBulkLoading("approve");
    const res = await updateBulkJobStatus(Array.from(selectedJobs), "approve");
    if (res.error) {
      alert(res.error);
    } else {
      setSelectedJobs(new Set());
    }
    setIsBulkLoading(null);
  };

  const handleBulkRejectSubmit = async () => {
    if (!bulkReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    setIsBulkLoading("reject");
    const res = await updateBulkJobStatus(Array.from(selectedJobs), "reject", bulkReason.trim());
    if (res.error) {
      alert(res.error);
    } else {
      setSelectedJobs(new Set());
    }
    setShowBulkRejectModal(false);
    setBulkReason("");
    setIsBulkLoading(null);
  };

  if (jobs.length === 0) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
        <div style={{ marginBottom: "var(--space-4)", display: "flex", justifyContent: "center", color: "var(--color-primary)" }}>
          <Building2 size={48} />
        </div>
        <h2 style={{ marginBottom: "var(--space-2)" }}>No Pending Jobs</h2>
        <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
          There are currently no job postings waiting for your review.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)", padding: "var(--space-3)", background: "var(--bg-secondary)", borderRadius: "var(--border-radius-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <input
            type="checkbox"
            checked={selectedJobs.size === jobs.length && jobs.length > 0}
            onChange={handleSelectAll}
            style={{ width: "18px", height: "18px", cursor: "pointer" }}
          />
          <span style={{ fontWeight: 600 }}>Select All ({selectedJobs.size} selected)</span>
        </div>
        {selectedJobs.size > 0 && (
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              className="btn btn-primary"
              style={{ background: "#22c55e", borderColor: "#22c55e", padding: "6px 12px" }}
              onClick={handleBulkApprove}
              disabled={isBulkLoading !== null}
            >
              {isBulkLoading === "approve" ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />} Bulk Approve
            </button>
            <button
              className="btn btn-danger"
              style={{ padding: "6px 12px" }}
              onClick={() => setShowBulkRejectModal(true)}
              disabled={isBulkLoading !== null}
            >
              {isBulkLoading === "reject" ? <Loader2 size={16} className="animate-spin" /> : <X size={16} />} Bulk Reject
            </button>
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        {jobs.map((job) => (
          <div key={job.id} className="card" style={{ display: "flex", gap: "16px", padding: "var(--space-5)" }}>
            <div style={{ paddingTop: "4px" }}>
              <input
                type="checkbox"
                checked={selectedJobs.has(job.id)}
                onChange={(e) => handleSelectJob(job.id, e.target.checked)}
                style={{ width: "18px", height: "18px", cursor: "pointer" }}
              />
            </div>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-4)" }}>
                <div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "1.25rem", color: "var(--text-primary)" }}>{job.title}</h3>
                  <div style={{ display: "flex", gap: "16px", color: "var(--text-secondary)", fontSize: "0.875rem", flexWrap: "wrap" }}>
                    {job.companyName && <span style={{ fontWeight: 600, color: "var(--primary-color)" }}>{job.companyName}</span>}
                    <span>• {job.location}</span>
                    <span>• {job.stipend}</span>
                    <span>• {job.openingsCount} Vacancies</span>
                    <span>• Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <JobApprovalActions jobId={job.id} />
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <Link href={`/jobs/${job.id}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                  View Internship
                </Link>
                {job.companyId && (
                  <Link href={`/companies/${job.companyId}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                    View Company
                  </Link>
                )}
              </div>

              <div style={{ background: "var(--bg-hover)", padding: "var(--space-4)", borderRadius: "var(--border-radius-md)" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Job Description & Requirements</h4>
                <p style={{ margin: "0 0 16px 0", fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {job.description}
                </p>

                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Required Skills</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {job.requiredSkills.map((skill, idx) => (
                        <span key={idx} style={{ padding: "4px 10px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "100px", fontSize: "0.875rem" }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>

      {showBulkRejectModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          backdropFilter: "blur(4px)",
        }}
          onClick={() => setShowBulkRejectModal(false)}
        >
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--border-radius-lg)",
              padding: "var(--space-6)",
              width: "100%",
              maxWidth: "480px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
              border: "1px solid var(--border-color)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.125rem" }}>Bulk Rejection Reason</h3>
            <p style={{ margin: "0 0 16px 0", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              This reason will be applied to all {selectedJobs.size} selected job(s) and sent to their posters.
            </p>
            <textarea
              value={bulkReason}
              onChange={(e) => setBulkReason(e.target.value)}
              placeholder="e.g., Does not meet minimum requirements, insufficient details..."
              rows={4}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "var(--border-radius-md)",
                border: "1px solid var(--border-color)",
                background: "var(--bg-primary)",
                color: "var(--text-primary)",
                fontSize: "0.875rem",
                resize: "vertical",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button
                className="btn btn-outline"
                style={{ padding: "8px 16px" }}
                onClick={() => { setShowBulkRejectModal(false); setBulkReason(""); }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{ padding: "8px 16px" }}
                onClick={handleBulkRejectSubmit}
                disabled={isBulkLoading === "reject"}
              >
                {isBulkLoading === "reject" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject {selectedJobs.size} Job(s)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
