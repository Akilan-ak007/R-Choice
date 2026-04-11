"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { submitInternshipRequest } from "@/app/actions/applications";

export default function NewApplicationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    formData.append("applicationType", "external"); // Force external for manual form

    const result = await submitInternshipRequest(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/applications");
      router.refresh();
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <Link href="/applications" className="btn btn-ghost" style={{ padding: "8px 0" }}>
          <ArrowLeft size={16} /> Back to Applications
        </Link>
      </div>

      <div className="page-header">
        <h1>Submit External Internship</h1>
        <p>Found an opportunity outside the portal? Submit it here for staff approval.</p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          
          <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-2)" }}>Company Details</h3>
          
          <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
            <div className="input-group">
              <label>Company Name *</label>
              <input name="companyName" className="input-field" required placeholder="e.g. Google, Zoho, TCS..." />
            </div>
            <div className="input-group">
              <label>Work Mode *</label>
              <select name="workMode" className="input-field" required>
                <option value="onsite">On-site</option>
                <option value="hybrid">Hybrid</option>
                <option value="remote">Remote</option>
              </select>
            </div>
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Company/Office Address</label>
              <input name="companyAddress" className="input-field" placeholder="Full address including city..." />
            </div>
          </div>

          <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-2)", marginTop: "var(--space-2)" }}>Role Details</h3>
          
          <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Job Role / Title *</label>
              <input name="role" className="input-field" required placeholder="e.g. Frontend Developer Intern" />
            </div>
            <div className="input-group">
              <label>Start Date *</label>
              <input type="date" name="startDate" className="input-field" required />
            </div>
            <div className="input-group">
              <label>End Date *</label>
              <input type="date" name="endDate" className="input-field" required />
            </div>
            <div className="input-group">
              <label>Stipend (Monthly)</label>
              <input name="stipend" className="input-field" placeholder="e.g. ₹15,000 or Unpaid" />
            </div>
          </div>

          <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-2)", marginTop: "var(--space-2)" }}>Verification & HR Details</h3>
          
          <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
            <div className="input-group">
              <label>HR / Manager Name *</label>
              <input name="hrName" className="input-field" required placeholder="Full Name" />
            </div>
            <div className="input-group">
              <label>HR / Manager Email *</label>
              <input type="email" name="hrEmail" className="input-field" required placeholder="name@company.com" />
            </div>
            <div className="input-group">
              <label>HR / Manager Phone *</label>
              <input type="tel" name="hrPhone" className="input-field" required placeholder="+91..." />
            </div>
            <div className="input-group">
              <label>Company Website *</label>
              <input type="url" name="companyWebsite" className="input-field" required placeholder="https://..." />
            </div>
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Discovery Source *</label>
              <select name="discoverySource" className="input-field" required>
                <option value="LinkedIn">LinkedIn</option>
                <option value="Internshala">Internshala / Job Board</option>
                <option value="Referral">Alumni Referral</option>
                <option value="Direct">Direct Application / Walk-in</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <h3 style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-2)", marginTop: "var(--space-2)" }}>Required Documents</h3>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: "var(--space-2)" }}>Paste viewable GDrive/Dropbox links for verification.</p>

          <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
            <div className="input-group">
              <label>Offer Letter URL *</label>
              <input type="url" name="offerLetterUrl" className="input-field" required placeholder="https://drive.google.com/..." />
            </div>
            <div className="input-group">
              <label>Company ID/GST Proof URL *</label>
              <input type="url" name="companyIdProofUrl" className="input-field" required placeholder="https://drive.google.com/..." />
            </div>
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Parent Consent Letter URL *</label>
              <input type="url" name="parentConsentUrl" className="input-field" required placeholder="https://drive.google.com/..." />
            </div>
          </div>

          {error && <div style={{ color: "var(--color-danger)", fontSize: "0.875rem", padding: "8px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "4px" }}>{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isLoading ? "Submitting..." : "Submit for Approval"}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
