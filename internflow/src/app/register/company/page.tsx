"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { registerCompany } from "@/app/actions/auth";
import { Briefcase, Building, MapPin, Loader2 } from "lucide-react";

export default function RegisterCompanyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await registerCompany(formData);
    
    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/?message=registered");
    }
  };

  return (
    <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)", padding: "var(--space-4)" }}>
      <div className="card animate-fade-in" style={{ padding: "var(--space-6)", width: "100%", maxWidth: "600px" }}>
        
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <div style={{ 
            width: "64px", height: "64px", background: "var(--primary-color)", 
            borderRadius: "16px", display: "flex", alignItems: "center", 
            justifyContent: "center", margin: "0 auto var(--space-4)",
            color: "white"
          }}>
            <Building size={32} />
          </div>
          <h2>Partner with R-Choice</h2>
          <p style={{ color: "var(--text-secondary)" }}>Create a company account to hire Rathinam's top talent.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {error && <div style={{ color: "var(--color-danger)", padding: "12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "var(--radius-md)", fontSize: "0.875rem" }}>{error}</div>}

          <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Company/Brand Name *</label>
              <input name="companyName" className="input-field" required placeholder="e.g. Acme Corp" />
            </div>

            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Industry *</label>
              <input name="industry" className="input-field" required placeholder="e.g. Information Technology" />
            </div>

            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Website URL *</label>
              <input type="url" name="website" className="input-field" required placeholder="https://acmecorp.com" />
            </div>

            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <hr style={{ border: 0, borderTop: "1px solid var(--border-color)", margin: "var(--space-4) 0" }} />
              <h4 style={{ margin: "0 0 var(--space-2) 0", color: "var(--text-secondary)" }}>HR POC Details</h4>
            </div>

            <div className="input-group">
              <label>Contact Person (HR) *</label>
              <input name="hrName" className="input-field" required placeholder="Full Name" />
            </div>
            <div className="input-group">
              <label>Contact Phone *</label>
              <input type="tel" name="hrPhone" className="input-field" required placeholder="+91 XXXXX XXXXX" />
            </div>

            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Work Email (Login ID) *</label>
              <input type="email" name="email" className="input-field" required placeholder="name@company.com" />
            </div>

            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Password *</label>
              <input type="password" name="password" className="input-field" required placeholder="Create a strong password" />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: "var(--space-4)", padding: "12px", justifyContent: "center" }} disabled={loading}>
            {loading ? <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><Loader2 className="animate-spin" size={18} /> Setting up workspace...</div> : "Register Company"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "var(--space-6)" }}>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Already a partner? <Link href="/" style={{ color: "var(--primary-color)", fontWeight: 600 }}>Sign in</Link>
          </p>
        </div>

      </div>
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
