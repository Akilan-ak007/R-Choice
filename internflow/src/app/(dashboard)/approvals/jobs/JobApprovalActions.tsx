"use client";

import { useState } from "react";
import { updateJobStatus } from "@/app/actions/jobs";
import { Check, X, Loader2 } from "lucide-react";

export default function JobApprovalActions({ jobId }: { jobId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(action);
    const res = await updateJobStatus(jobId, action);
    if (res.error) {
      alert(res.error);
    }
    setLoading(null);
  };

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button 
        className="btn btn-primary" 
        style={{ padding: "6px 12px", background: "#22c55e", borderColor: "#22c55e" }}
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
      >
        {loading === "approve" ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Approve
      </button>
      <button 
        className="btn btn-danger" 
        style={{ padding: "6px 12px" }}
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
      >
        {loading === "reject" ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />} Reject
      </button>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
