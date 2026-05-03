"use client";

import { useState } from "react";
import { generateCompanyRegistrationLink } from "@/app/actions/mcr";
import { Copy, Plus, Mail } from "lucide-react";
import { toast } from "sonner";

export default function InvitationsClient() {
  const [expiryDays, setExpiryDays] = useState(7);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState("");

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setGeneratedLink("");

    const result = await generateCompanyRegistrationLink(expiryDays);
    if (result.error) {
      toast.error(result.error);
    } else if (result.success) {
      setGeneratedLink(`${window.location.origin}${result.link}`);
      toast.success("Registration link generated successfully!");
    }
    setLoading(false);
  }

  function copyLink() {
    navigator.clipboard.writeText(generatedLink);
    toast.success("Copied to clipboard!");
  }

  return (
    <div style={{ maxWidth: 600, padding: 24, background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12 }}>
      <h2>Generate Company Registration Link</h2>
      <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>
        Generate a secure onboarding link and keep it visible on this dashboard until it expires.
      </p>

      <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div className="input-group">
          <label>Link Expiry (days)</label>
          <input
            type="number"
            className="input-field"
            value={expiryDays}
            min={1}
            max={30}
            onChange={e => setExpiryDays(Number(e.target.value) || 7)}
            required
          />
        </div>
        <button type="submit" disabled={loading} className="btn btn-primary" style={{ alignSelf: "flex-start", display: "flex", gap: 8, alignItems: "center" }}>
          <Plus size={18} />
          {loading ? "Generating..." : "Generate Registration Link"}
        </button>
      </form>

      {generatedLink && (
        <div style={{ marginTop: 24, padding: 16, background: "rgba(0,0,0,0.4)", border: "1px dashed var(--color-primary)", borderRadius: 8 }}>
          <p style={{ fontWeight: 600, marginBottom: 8, display: "flex", alignItems: "center", gap: 8 }}>
            <Mail size={16} /> Link Generated!
          </p>
          <div style={{ background: "#000", padding: "12px 16px", borderRadius: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontFamily: "monospace", overflowX: "auto", whiteSpace: "nowrap" }}>{generatedLink}</span>
            <button onClick={copyLink} style={{ background: "transparent", border: "none", color: "var(--color-primary)", cursor: "pointer", marginLeft: 16 }}>
              <Copy size={18} />
            </button>
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: 12 }}>This link will remain visible in the dashboard until it expires.</p>
        </div>
      )}
    </div>
  );
}
