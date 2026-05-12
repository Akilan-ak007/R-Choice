"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Building2, CalendarDays, ExternalLink, FileCheck2, ShieldCheck } from "lucide-react";

import { submitPortalOdRequestFromSelection } from "@/app/actions/applications";

type PendingPortalSelection = {
  appId: string;
  jobId: string;
  companyId: string | null;
  jobTitle: string;
  companyName: string | null;
  defaultStartDate: string;
  defaultEndDate: string;
  odStatus: string | null;
};

export default function PortalOdInitiationCard({ selections }: { selections: PendingPortalSelection[] }) {
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<string, { startDate: string; endDate: string; offerLetterUrl: string; parentConsentUrl: string }>>(
    Object.fromEntries(
      selections.map((selection) => [
        selection.appId,
        {
          startDate: selection.defaultStartDate,
          endDate: selection.defaultEndDate,
          offerLetterUrl: "",
          parentConsentUrl: "",
        },
      ])
    )
  );

  const updateDraft = (appId: string, field: "startDate" | "endDate" | "offerLetterUrl" | "parentConsentUrl", value: string) => {
    setDrafts((prev) => ({
      ...prev,
      [appId]: {
        ...prev[appId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (selection: PendingPortalSelection) => {
    const draft = drafts[selection.appId];
    if (!draft?.startDate || !draft?.endDate || !draft?.offerLetterUrl || !draft?.parentConsentUrl) {
      toast.error("Fill the OD dates, offer letter link, and parent consent link before submitting.");
      return;
    }

    setSubmittingId(selection.appId);
    const result = await submitPortalOdRequestFromSelection({
      applicationId: selection.appId,
      startDate: draft.startDate,
      endDate: draft.endDate,
      offerLetterUrl: draft.offerLetterUrl,
      parentConsentUrl: draft.parentConsentUrl,
    });

    if (result.error) {
      toast.error(result.error);
      setSubmittingId(null);
      return;
    }

    toast.success("Documents submitted. Waiting for Placement Officer to raise OD.");
    setSubmittingId(null);
  };

  return (
    <div className="card" style={{ padding: "var(--space-5)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
        <ShieldCheck size={18} color="#6366f1" />
        <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Selected Students: Start OD Request</h2>
      </div>
      <p style={{ marginTop: 0, marginBottom: "16px", color: "var(--text-secondary)" }}>
        Once a company selects you, submit the internship dates, offer letter link, and parent consent link here. After that, the Placement Officer will manually click Raise OD to start the approval pipeline.
      </p>

      <div style={{ display: "grid", gap: "12px" }}>
        {selections.map((selection) => {
          const draft = drafts[selection.appId];
          const alreadySubmitted = selection.odStatus === "awaiting_po_raise" || selection.odStatus === "od_raised";
          const alreadyRaised = selection.odStatus === "od_raised";
          return (
            <div
              key={selection.appId}
              style={{
                padding: "14px",
                borderRadius: "10px",
                background: "rgba(99, 102, 241, 0.08)",
                border: "1px solid rgba(99, 102, 241, 0.18)",
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: "4px" }}>{selection.jobTitle}</div>
              <div style={{ color: "var(--text-secondary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Building2 size={14} /> {selection.companyName || "Company"}
              </div>

              <div style={{ marginBottom: "12px", padding: "10px 12px", borderRadius: "8px", background: alreadyRaised ? "rgba(34, 197, 94, 0.08)" : alreadySubmitted ? "rgba(245, 158, 11, 0.08)" : "rgba(99, 102, 241, 0.08)", color: "var(--text-secondary)", fontSize: "0.84rem" }}>
                {alreadyRaised
                  ? "Placement Officer already raised the OD request. Follow the approval tracker below."
                  : alreadySubmitted
                    ? "Your documents are already submitted. Waiting for Placement Officer to click Raise OD."
                    : "Student document submission is step 1. Placement Officer manual Raise OD is step 2."}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "12px" }}>
                <label style={{ display: "grid", gap: "6px" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>OD Start Date</span>
                  <input type="date" className="input-field" value={draft?.startDate || ""} onChange={(e) => updateDraft(selection.appId, "startDate", e.target.value)} disabled={alreadySubmitted} />
                </label>
                <label style={{ display: "grid", gap: "6px" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>OD End Date</span>
                  <input type="date" className="input-field" value={draft?.endDate || ""} onChange={(e) => updateDraft(selection.appId, "endDate", e.target.value)} disabled={alreadySubmitted} />
                </label>
                <label style={{ display: "grid", gap: "6px", gridColumn: "1 / -1" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>Offer Letter Link</span>
                  <input type="url" className="input-field" placeholder="https://drive.google.com/..." value={draft?.offerLetterUrl || ""} onChange={(e) => updateDraft(selection.appId, "offerLetterUrl", e.target.value)} disabled={alreadySubmitted} />
                </label>
                <label style={{ display: "grid", gap: "6px", gridColumn: "1 / -1" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-secondary)" }}>Parent Consent Link</span>
                  <input type="url" className="input-field" placeholder="https://drive.google.com/..." value={draft?.parentConsentUrl || ""} onChange={(e) => updateDraft(selection.appId, "parentConsentUrl", e.target.value)} disabled={alreadySubmitted} />
                </label>
              </div>

              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                <button type="button" className="btn btn-primary" onClick={() => handleSubmit(selection)} disabled={submittingId === selection.appId || alreadySubmitted}>
                  <FileCheck2 size={16} />
                  {alreadyRaised ? "OD Already Raised" : alreadySubmitted ? "Submitted to PO" : submittingId === selection.appId ? "Submitting..." : "Submit to Placement Officer"}
                </button>
                <Link href={`/jobs/${selection.jobId}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                  <CalendarDays size={14} /> View Internship
                </Link>
                {selection.companyId ? (
                  <Link href={`/companies/${selection.companyId}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                    <ExternalLink size={14} /> View Company
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
