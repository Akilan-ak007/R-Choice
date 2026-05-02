"use client";

import React, { useState } from "react";
import { Sparkles, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { verifyAndInitializeOD } from "@/app/actions/applications";

export default function VerificationBannerClient({ 
  applicationId, 
  jobTitle, 
  companyName 
}: { 
  applicationId: string, 
  jobTitle: string, 
  companyName: string 
}) {
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    toast.loading("Checking OD status...", { id: "verify-od" });

    try {
      const res = await verifyAndInitializeOD(applicationId, "", "", "");
      if (res.error) {
        toast.error(res.error, { id: "verify-od" });
      } else {
        toast.success("OD Request initiated to your Tutor.", { id: "verify-od" });
        // The page will revalidate from the server action
      }
    } catch {
      toast.error("Process failed.", { id: "verify-od" });
    }
    setIsVerifying(false);
  };

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
          <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: "700" }}>Congratulations! You&apos;ve been selected!</h2>
          <p style={{ marginTop: "8px", opacity: 0.9 }}>
            <strong>{companyName}</strong> has shortlisted you for the role of <strong>{jobTitle}</strong>. 
            The Placement Officer will review this result and raise your On-Duty request after verification.
          </p>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
            gap: "12px", 
            marginTop: "20px",
            background: "rgba(255,255,255,0.1)",
            padding: "16px",
            borderRadius: "8px"
          }}>
            <div style={{ gridColumn: "1 / -1", color: "rgba(255,255,255,0.9)", fontSize: "0.95rem" }}>
              You do not need to enter a verification code anymore. Once the Placement Officer raises the OD request, the approval tracker will appear automatically in your applications page.
            </div>
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button 
                onClick={handleVerify} 
                disabled={isVerifying}
                style={{
                  width: "100%", padding: "8px", backgroundColor: "white", color: "#4F46E5", border: "none", borderRadius: "4px", fontWeight: "bold", cursor: "pointer", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px"
                }}
              >
                {isVerifying ? <span className="spinner" style={{borderColor: "#4f46e5", borderRightColor: "transparent"}}></span> : <ShieldCheck size={16} />}
                Refresh Status
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
