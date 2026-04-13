"use client";

import { useState } from "react";
import { advanceApproval } from "@/app/actions/approvals";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function ApprovalActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);

  const handleAction = async (action: "approve" | "reject") => {
    setLoading(action);
    try {
      await advanceApproval(requestId, action);
      if (action === "approve") {
        toast.success("Request approved and forwarded!", {
          description: "The request has been sent to the next approval level.",
        });
      } else {
        toast.error("Request rejected", {
          description: "The applicant has been notified.",
        });
      }
    } catch {
      toast.error("Action failed. Please try again.");
    }
    setLoading(null);
  };

  return (
    <div style={{ display: "flex", gap: "8px" }}>
      <button
        onClick={() => handleAction("approve")}
        disabled={loading !== null}
        className="btn"
        style={{
          padding: "6px 12px",
          background: "rgba(34, 197, 94, 0.1)",
          color: "#22c55e",
          border: "none",
          transition: "all var(--transition-fast)",
          borderRadius: "var(--border-radius-sm)",
        }}
        title="Approve & Send to Next Level"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(34, 197, 94, 0.2)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(34, 197, 94, 0.1)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {loading === "approve" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
      </button>
      <button
        onClick={() => handleAction("reject")}
        disabled={loading !== null}
        className="btn"
        style={{
          padding: "6px 12px",
          background: "rgba(239, 68, 68, 0.1)",
          color: "#ef4444",
          border: "none",
          transition: "all var(--transition-fast)",
          borderRadius: "var(--border-radius-sm)",
        }}
        title="Reject Request"
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(239, 68, 68, 0.2)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "rgba(239, 68, 68, 0.1)";
          e.currentTarget.style.transform = "scale(1)";
        }}
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
