"use client";

import React from "react";
import { Sparkles } from "lucide-react";
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
      background: "linear-gradient(to right, #4F46E5 0%, #7C3AED 100%)",
      borderRadius: "12px",
      padding: "24px",
      color: "white",
      marginBottom: "24px",
      boxShadow: "0 10px 25px -5px rgba(79, 70, 229, 0.4)"
    }}>
      <div style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
        <div style={{ background: "rgba(255,255,255,0.2)", padding: "12px", borderRadius: "50%" }}>
          <Sparkles size={32} color="white" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700" }}>Selected for internship</h2>
          <p style={{ marginTop: "8px", opacity: 0.9 }}>
            <strong>{companyName}</strong> selected you for <strong>{jobTitle}</strong>. Placement Officer review is pending before OD starts.
          </p>

          <div style={{ 
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            marginTop: "20px",
            background: "rgba(255,255,255,0.1)",
            padding: "16px",
            borderRadius: "8px"
          }}>
            <div style={{ color: "rgba(255,255,255,0.9)", fontSize: "0.95rem" }}>
              No verification code is needed. Your OD tracker will appear automatically in My Applications once Placement Officer raises it.
            </div>
            <Link
              href="/applications"
              className="btn btn-outline"
              style={{ alignSelf: "flex-start", textDecoration: "none", background: "white", color: "#4F46E5", borderColor: "white" }}
            >
              View My Applications
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
