"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { advanceApproval, getRequestDetails } from "@/app/actions/approvals";
import { CheckCircle, XCircle, Loader2, X, MessageSquare, Eye, Building, Calendar, GraduationCap } from "lucide-react";
import { toast } from "sonner";

type RequestDetails = {
  request?: {
    applicationType?: string | null;
    status?: string | null;
    submittedAt?: string | Date | null;
    role?: string | null;
    companyName?: string | null;
    companyAddress?: string | null;
    startDate?: string | Date | null;
    endDate?: string | Date | null;
    stipend?: string | null;
    workMode?: string | null;
    offerLetterUrl?: string | null;
  };
  jobDetails?: Record<string, unknown> | null;
  companyDetails?: Record<string, unknown> | null;
  student?: {
    user?: { firstName?: string | null; lastName?: string | null; email?: string | null; phone?: string | null };
    profile?: {
      department?: string | null;
      year?: number | null;
      section?: string | null;
      cgpa?: string | null;
      school?: string | null;
      course?: string | null;
      program?: string | null;
      programType?: string | null;
      registerNo?: string | null;
      resumeUrl?: string | null;
      batchStartYear?: number | null;
      batchEndYear?: number | null;
    }
  };
  externalDetails?: {
    stipend?: unknown;
    hrName?: unknown;
    hrEmail?: unknown;
    hrPhone?: unknown;
    parentConsentUrl?: unknown;
    companyIdProofUrl?: unknown;
    companyWebsite?: unknown;
  } | null;
};

export default function ApprovalActions({ requestId }: { requestId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const [done, setDone] = useState(false);
  const [, startTransition] = useTransition();
  const [showModal, setShowModal] = useState<"approve" | "reject" | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [infoData, setInfoData] = useState<RequestDetails | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [comment, setComment] = useState("");
  const router = useRouter();

  const handleFetchDetails = async () => {
    setLoadingInfo(true);
    setShowInfoModal(true);
    try {
      const res = await getRequestDetails(requestId);
      if (res.success && res.data) {
        setInfoData(res.data);
      } else {
        toast.error("Failed to load details.");
        setShowInfoModal(false);
      }
    } catch {
      toast.error("Error loading details");
      setShowInfoModal(false);
    }
    setLoadingInfo(false);
  };

  const openModal = (type: "approve" | "reject") => {
    setComment("");
    setShowModal(type);
  };

  const handleSubmit = () => {
    if (showModal === "reject" && comment.trim().length === 0) {
      toast.error("Please provide a reason for rejection.");
      return;
    }

    setLoading(showModal);
    const action = showModal!;
    const finalComment = comment.trim() || undefined;
    setShowModal(null);

    startTransition(async () => {
      try {
        const result = await advanceApproval(requestId, action, finalComment);
        if (result?.error) {
          toast.error(result.error);
          setLoading(null);
          return;
        }
        if (action === "approve") {
          toast.success("Request approved and forwarded!", {
            description: finalComment
              ? `Your endorsement: "${finalComment}"`
              : "The request has been sent to the next approval level.",
          });
        } else {
          toast.error("Request rejected", {
            description: `Reason: ${finalComment}`,
          });
        }
        setDone(true);
        router.refresh();
      } catch {
        toast.error("Action failed. Please try again.");
      }
      setLoading(null);
    });
  };

  if (done) {
    return <span style={{ color: "var(--text-secondary)", fontWeight: 500, fontSize: "0.875rem" }}>Processed</span>;
  }

  return (
    <>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={handleFetchDetails}
          disabled={loadingInfo}
          className="btn btn-outline"
          style={{
            padding: "6px 12px",
            fontSize: "0.8125rem",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            borderRadius: "var(--border-radius-sm)",
          }}
          title="View comprehensive OD/Internship Request details"
        >
          {loadingInfo ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
          Details
        </button>
        <button
          onClick={() => openModal("approve")}
          disabled={loading !== null}
          className="btn"
          style={{
            padding: "6px 12px",
            background: "rgba(34, 197, 94, 0.1)",
            color: "#22c55e",
            border: "none",
            transition: "all var(--transition-fast)",
            borderRadius: "var(--border-radius-sm)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.8125rem",
          }}
          title="Approve & Send to Next Level"
        >
          {loading === "approve" ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
          Approve
        </button>
        <button
          onClick={() => openModal("reject")}
          disabled={loading !== null}
          className="btn"
          style={{
            padding: "6px 12px",
            background: "rgba(239, 68, 68, 0.1)",
            color: "#ef4444",
            border: "none",
            transition: "all var(--transition-fast)",
            borderRadius: "var(--border-radius-sm)",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "0.8125rem",
          }}
          title="Reject Request"
        >
          {loading === "reject" ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
          Reject
        </button>
      </div>

      {/* Comment Modal */}
      {showModal && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 999,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)"
          }}
          onClick={() => setShowModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="card"
            style={{
              width: "90%", maxWidth: "460px",
              padding: "var(--space-6)", position: "relative",
              animation: "fadeIn 0.2s ease-out"
            }}
          >
            <button
              onClick={() => setShowModal(null)}
              style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", cursor: "pointer", color: "var(--text-secondary)" }}
            >
              <X size={20} />
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "var(--space-4)" }}>
              <div style={{
                width: 40, height: 40, borderRadius: "10px",
                background: showModal === "approve" ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {showModal === "approve"
                  ? <CheckCircle size={22} color="#22c55e" />
                  : <XCircle size={22} color="#ef4444" />}
              </div>
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>
                  {showModal === "approve" ? "Approve Application" : "Reject Application"}
                </h3>
                <p style={{ fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                  {showModal === "approve"
                    ? "Optionally add an endorsement or suggestion."
                    : "A reason for rejection is required."}
                </p>
              </div>
            </div>

            <div style={{ marginBottom: "var(--space-4)" }}>
              <label style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--text-secondary)", display: "block", marginBottom: "6px" }}>
                <MessageSquare size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                {showModal === "approve" ? "Endorsement / Suggestion (Optional)" : "Reason for Rejection *"}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={showModal === "approve"
                  ? "e.g. Strong candidate, well-suited for this role..."
                  : "e.g. Incomplete documentation, missing offer letter..."}
                className="input-field"
                rows={4}
                style={{
                  width: "100%", resize: "vertical", minHeight: "80px",
                  fontFamily: "inherit",
                }}
                autoFocus
              />
            </div>

            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowModal(null)}
                className="btn btn-outline"
                style={{ padding: "8px 16px" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="btn"
                style={{
                  padding: "8px 20px",
                  background: showModal === "approve" ? "#22c55e" : "#ef4444",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--border-radius-sm)",
                  fontWeight: 600,
                }}
              >
                {showModal === "approve" ? "Confirm Approval" : "Confirm Rejection"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      {showInfoModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setShowInfoModal(false)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: "90%", maxWidth: "700px", maxHeight: "90vh", overflowY: "auto", position: "relative", padding: "32px", animation: "fadeIn 0.2s ease-out" }}>
            <button onClick={() => setShowInfoModal(false)} style={{ position: "absolute", top: "16px", right: "16px", background: "var(--bg-elevated)", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer" }}>
              <X size={20} color="var(--text-primary)" />
            </button>
            
            {loadingInfo ? (
              <div style={{ padding: "40px", textAlign: "center" }}><Loader2 size={32} className="animate-spin" style={{ margin: "auto", color: "var(--primary-color)" }} /><p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>Loading request data...</p></div>
            ) : infoData ? (
              <div>
                <h2 style={{ fontSize: "1.5rem", marginBottom: "8px", fontWeight: 700 }}>Request Overview</h2>
                <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
                  <span style={{ fontSize: "0.75rem", padding: "4px 8px", background: "var(--bg-hover)", borderRadius: "4px", textTransform: "capitalize", fontWeight: 600 }}>{infoData.request?.applicationType || "unknown"} Entry</span>
                  <span style={{ fontSize: "0.75rem", padding: "4px 8px", background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", borderRadius: "4px", fontWeight: 600 }}>Status: {infoData.request?.status || "unknown"}</span>
                </div>

                <div className="info-grid" style={{ marginBottom: "24px" }}>
                  <div style={{ background: "var(--bg-elevated)", padding: "16px", borderRadius: "8px" }}>
                    <h3 style={{ fontSize: "0.875rem", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}><GraduationCap size={16} /> Student </h3>
                      <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>{infoData.student?.user?.firstName} {infoData.student?.user?.lastName}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                        {infoData.student?.profile?.department} (Yr {infoData.student?.profile?.year}, Sec {infoData.student?.profile?.section})
                      </div>
                    <div style={{ fontSize: "0.875rem", marginTop: "8px", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "var(--text-secondary)" }}>CGPA:</span> <span style={{ fontWeight: 600 }}>{infoData.student?.profile?.cgpa || "N/A"}</span>
                    </div>
                    <div style={{ fontSize: "0.875rem", marginTop: "8px", display: "grid", gap: "6px" }}>
                      <div><span style={{ color: "var(--text-secondary)" }}>Register No:</span> <span style={{ fontWeight: 600 }}>{infoData.student?.profile?.registerNo || "N/A"}</span></div>
                      <div><span style={{ color: "var(--text-secondary)" }}>School:</span> <span style={{ fontWeight: 600 }}>{infoData.student?.profile?.school || "N/A"}</span></div>
                      <div><span style={{ color: "var(--text-secondary)" }}>Class:</span> <span style={{ fontWeight: 600 }}>{infoData.student?.profile?.course || "N/A"}</span></div>
                      <div><span style={{ color: "var(--text-secondary)" }}>Program:</span> <span style={{ fontWeight: 600 }}>{infoData.student?.profile?.programType || infoData.student?.profile?.program || "N/A"}</span></div>
                      <div><span style={{ color: "var(--text-secondary)" }}>Email:</span> <span style={{ fontWeight: 600 }}>{infoData.student?.user?.email || "N/A"}</span></div>
                      <div><span style={{ color: "var(--text-secondary)" }}>Phone:</span> <span style={{ fontWeight: 600 }}>{infoData.student?.user?.phone || "N/A"}</span></div>
                    </div>
                  </div>

                  <div style={{ background: "var(--bg-elevated)", padding: "16px", borderRadius: "8px" }}>
                    <h3 style={{ fontSize: "0.875rem", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}><Building size={16} /> Internship/Company</h3>
                    <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>{infoData.request?.role || "Intern"}</div>
                    <div style={{ fontSize: "0.875rem", color: "var(--primary-color)", fontWeight: 500, marginTop: "4px" }}>{infoData.request?.companyName || "N/A"}</div>
                    <div style={{ fontSize: "0.875rem", marginTop: "8px", display: "grid", gap: "6px" }}>
                      <div><span style={{ color: "var(--text-secondary)" }}>Company address:</span> <span style={{ fontWeight: 500 }}>{infoData.request?.companyAddress || "N/A"}</span></div>
                      <div><span style={{ color: "var(--text-secondary)" }}>Internship dates:</span> <span style={{ fontWeight: 500 }}>{infoData.request?.startDate ? new Date(infoData.request.startDate).toLocaleDateString("en-IN") : "N/A"} to {infoData.request?.endDate ? new Date(infoData.request.endDate).toLocaleDateString("en-IN") : "N/A"}</span></div>
                      <div><span style={{ color: "var(--text-secondary)" }}>Work mode:</span> <span style={{ fontWeight: 500 }}>{infoData.request?.workMode || "N/A"}</span></div>
                      <div><span style={{ color: "var(--text-secondary)" }}>Stipend:</span> <span style={{ fontWeight: 500 }}>{infoData.request?.stipend || "Not specified"}</span></div>
                    </div>
                  </div>
                </div>

                <div style={{ background: "var(--bg-elevated)", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
                  <h3 style={{ fontSize: "0.875rem", textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}><Calendar size={16} /> Full Submission Details</h3>
                  <div className="logistics-grid" style={{ fontSize: "0.875rem" }}>
                    <div><span style={{ color: "var(--text-secondary)" }}>Submitted on:</span> <span style={{ fontWeight: 500 }}>{infoData.request?.submittedAt ? new Date(infoData.request.submittedAt).toLocaleString("en-IN") : "N/A"}</span></div>
                    <div><span style={{ color: "var(--text-secondary)" }}>Application type:</span> <span style={{ fontWeight: 500 }}>{infoData.request?.applicationType || "N/A"}</span></div>
                    <div><span style={{ color: "var(--text-secondary)" }}>HR Name:</span> <span style={{ fontWeight: 500 }}>{String(infoData.externalDetails?.hrName ?? "N/A")}</span></div>
                    <div><span style={{ color: "var(--text-secondary)" }}>HR Email:</span> <span style={{ fontWeight: 500 }}>{String(infoData.externalDetails?.hrEmail ?? "N/A")}</span></div>
                    <div><span style={{ color: "var(--text-secondary)" }}>HR Phone:</span> <span style={{ fontWeight: 500 }}>{String(infoData.externalDetails?.hrPhone ?? "N/A")}</span></div>
                    <div><span style={{ color: "var(--text-secondary)" }}>Company website:</span> <span style={{ fontWeight: 500 }}>{String(infoData.externalDetails?.companyWebsite ?? "N/A")}</span></div>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "12px" }}>
                    {infoData.request?.offerLetterUrl ? (
                      <a href={infoData.request.offerLetterUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "6px 12px", background: "var(--primary-color)", color: "white", textDecoration: "none", borderRadius: "4px", fontWeight: 600 }}>Offer Letter</a>
                    ) : null}
                    {typeof infoData.externalDetails?.parentConsentUrl === "string" ? (
                      <a href={infoData.externalDetails.parentConsentUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "6px 12px", background: "var(--bg-hover)", color: "var(--text-primary)", textDecoration: "none", borderRadius: "4px", fontWeight: 600 }}>Parent Consent</a>
                    ) : null}
                    {typeof infoData.externalDetails?.companyIdProofUrl === "string" ? (
                      <a href={infoData.externalDetails.companyIdProofUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "6px 12px", background: "var(--bg-hover)", color: "var(--text-primary)", textDecoration: "none", borderRadius: "4px", fontWeight: 600 }}>Company Proof</a>
                    ) : null}
                    {infoData.student?.profile?.resumeUrl ? (
                      <a href={infoData.student.profile.resumeUrl} target="_blank" rel="noreferrer" style={{ display: "inline-block", padding: "6px 12px", background: "var(--bg-hover)", color: "var(--text-primary)", textDecoration: "none", borderRadius: "4px", fontWeight: 600 }}>Student Resume</a>
                    ) : null}
                  </div>
                </div>
                
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                   <button onClick={() => { setShowInfoModal(false); openModal("reject"); }} className="btn btn-outline" style={{ color: "#ef4444", borderColor: "#ef4444" }}>Reject Request</button>
                   <button onClick={() => { setShowInfoModal(false); openModal("approve"); }} className="btn" style={{ background: "#22c55e", color: "white", border: "none" }}>Approve Request</button>
                </div>
              </div>
            ) : <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>No data found.</div>}
          </div>
        </div>
      )}

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        
        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        .logistics-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        
        @media (max-width: 600px) {
          .info-grid {
            grid-template-columns: 1fr;
            gap: 16px;
          }
          .logistics-grid {
            grid-template-columns: 1fr;
            gap: 12px;
          }
        }
      `}</style>
    </>
  );
}
