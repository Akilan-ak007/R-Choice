import { Download, FileText, Share2, Printer } from "lucide-react";
import Link from 'next/link';

export default function ProfileResumePage() {
  return (
    <div className="animate-fade-in" style={{ height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ flexShrink: 0, marginBottom: "var(--space-4)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1>Auto-Generated Resume</h1>
            <p>Your resume is dynamically generated from your profile, skills, and project data.</p>
          </div>
          <div style={{ display: "flex", gap: "var(--space-3)" }}>
            <Link href="/api/profile/resume" target="_blank" className="btn btn-outline">
              <Printer size={16} style={{ marginRight: "var(--space-2)" }} /> Print
            </Link>
            <a href="/api/profile/resume" download="R-Choice_Resume.pdf" className="btn btn-primary">
              <Download size={16} /> Download PDF
            </a>
          </div>
        </div>
      </div>

      <div className="card" style={{ flexGrow: 1, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "var(--space-3) var(--space-4)", backgroundColor: "var(--surface)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: "8px" }}>
          <FileText size={16} color="var(--text-secondary)" />
          <span style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>Resume Preview</span>
        </div>
        <div style={{ flexGrow: 1, position: "relative", backgroundColor: "#333" }}>
          <iframe 
            src="/api/profile/resume" 
            style={{ width: "100%", height: "100%", border: "none" }}
            title="Resume PDF Preview"
          />
        </div>
      </div>
    </div>
  );
}
