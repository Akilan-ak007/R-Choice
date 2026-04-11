"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2, CheckCircle2 } from "lucide-react";
import { createPortalApplication } from "@/app/actions/applications";

export default function ApplyButton({ job }: { job: any }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "applied">("idle");
  const [error, setError] = useState("");

  const handleApply = async () => {
    setStatus("loading");
    setError("");

    const result = await createPortalApplication(job.id, job.companyName, job.title);

    if (result.error) {
      setError(result.error);
      setStatus("idle");
      alert(result.error); // Simple fallback alert for now
    } else {
      setStatus("applied");
    }
  };

  if (status === "applied") {
    return (
      <button className="btn btn-secondary" disabled style={{ width: "100%", display: "flex", justifyContent: "center", gap: "8px", background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", border: "1px solid #22c55e" }}>
        <CheckCircle2 size={16} /> Applied Successfully!
      </button>
    );
  }

  return (
    <button 
      onClick={handleApply}
      disabled={status === "loading"}
      className="btn btn-primary" 
      style={{ display: "flex", width: "100%", justifyContent: "center", gap: "8px" }}
    >
      {status === "loading" ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
      {status === "loading" ? "Submitting..." : "Apply in Portal"}
    </button>
  );
}
