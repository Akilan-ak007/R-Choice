"use client";

import React from "react";
import { Sparkles, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function VerificationBannerClient({ 
  jobTitle, 
  companyName 
}: { 
  jobTitle: string, 
  companyName: string 
}) {
  return (
    <div style={{
      display: "flex",
      flexWrap: "wrap",
      alignItems: "center",
      justifyContent: "space-between",
      background: "rgba(79, 70, 229, 0.04)",
      border: "1px solid rgba(79, 70, 229, 0.15)",
      borderLeft: "3px solid #4F46E5",
      borderRadius: "8px",
      padding: "12px 16px",
      marginBottom: "12px",
      gap: "12px"
    }}>
      <div style={{ display: "flex", gap: "10px", alignItems: "flex-start", flex: "1 1 auto" }}>
        <div style={{ marginTop: "2px" }}>
          <Sparkles size={16} color="#4F46E5" />
        </div>
        <div style={{ fontSize: "0.875rem", lineHeight: "1.4" }}>
          <strong style={{ color: "var(--text-primary)" }}>{companyName}</strong> selected you for <strong>{jobTitle}</strong>. 
          <span style={{ color: "var(--text-secondary)", marginLeft: "4px", display: "inline-block" }}>
            Submit your offer letter and parent consent link first. Then Placement Officer will raise OD.
          </span>
        </div>
      </div>
      <Link
        href="/applications"
        style={{ 
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 12px",
          fontSize: "0.8125rem",
          fontWeight: 600,
          border: "1px solid rgba(79, 70, 229, 0.3)",
          borderRadius: "6px",
          color: "#4F46E5",
          background: "white",
          textDecoration: "none",
          flexShrink: 0,
          transition: "all 0.2s"
        }}
      >
        Tracker <ArrowRight size={14} />
      </Link>
    </div>
  );
}
