"use client";

import { useState } from "react";
import { advanceApproval } from "@/app/actions/approvals";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function ApprovalActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(action);
    await advanceApproval(requestId, action);
    setLoading(null);
  };

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button 
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        className="btn" 
        style={{ padding: "6px", background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", border: "none" }}
        title="Approve & Send to Next Level"
      >
        {loading === "approve" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
      </button>
      <button 
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        className="btn" 
        style={{ padding: "6px", background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", border: "none" }}
        title="Reject Request"
      >
        {loading === "reject" ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
      </button>
      
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
