"use client";

import { useState } from "react";
import { updateJobStatus } from "@/app/actions/jobs";
import { Check, X, Loader2 } from "lucide-react";

export default function JobApprovalActions({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reason, setReason] = useState("");

  const handleApprove = async () => {
    setLoading("approve");
    const res = await updateJobStatus(jobId, "approve");
    if (res.error) {
      alert(res.error);
    }
    setLoading(null);
  };

  const handleRejectSubmit = async () => {
    if (!reason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }
    setLoading("reject");
    const res = await updateJobStatus(jobId, "reject", reason.trim());
    if (res.error) {
      alert(res.error);
    }
    setShowRejectModal(false);
    setReason("");
    setLoading(null);
  };

  return (
    <>
      <div style={{ display: "flex", gap: "8px" }}>
        <button 
          className="btn btn-primary" 
          style={{ padding: "6px 12px", background: "#22c55e", borderColor: "#22c55e" }}
          onClick={handleApprove}
          disabled={loading !== null}
        >
          {loading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
        </button>
        <button 
          className="btn btn-danger" 
          style={{ padding: "6px 12px" }}
          onClick={() => setShowRejectModal(true)}
          disabled={loading !== null}
        >
          <X size={14} /> Reject
        </button>
      </div>

      {showRejectModal && (
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
          onClick={() => setShowRejectModal(false)}
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
            <h3 style={{ margin: "0 0 4px 0", fontSize: "1.125rem" }}>Rejection Reason</h3>
            <p style={{ margin: "0 0 16px 0", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
              This feedback will be sent to the job poster so they know what to fix.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Incomplete description, stipend too low, missing required fields..."
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
                onClick={() => { setShowRejectModal(false); setReason(""); }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                style={{ padding: "8px 16px" }}
                onClick={handleRejectSubmit}
                disabled={loading === "reject"}
              >
                {loading === "reject" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject Job
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
