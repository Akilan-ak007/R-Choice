"use client";

import { useState, useMemo } from "react";
import { Trophy, Filter, Calendar, Building2, User, CheckCircle2, Clock, AlertCircle, ShieldCheck, SendHorizonal, Loader2 } from "lucide-react";
import { raiseODForStudents } from "@/app/actions/applications";
import { toast } from "sonner";
import Link from "next/link";

interface SelectionResult {
  id: string;
  studentId: string;
  studentFirstName: string;
  studentLastName: string;
  jobTitle: string;
  companyName: string | null;
  appliedAt: Date | null;
  updatedAt: Date | null;
  isVerified?: boolean | null;
  verificationCode?: string | null;
}

function getODStatusBadge(isVerified: boolean | null | undefined, odStatus: string | undefined, hasCode: boolean | undefined) {
  if (odStatus === "approved") {
    return <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 700, background: "rgba(34, 197, 94, 0.12)", color: "#22c55e" }}><CheckCircle2 size={11} /> OD Approved</span>;
  }
  if (odStatus && odStatus.startsWith("pending_")) {
    const stage = odStatus.replace("pending_", "").replace(/_/g, " ");
    return <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 700, background: "rgba(14, 165, 233, 0.12)", color: "#0ea5e9" }}><Clock size={11} /> OD: {stage}</span>;
  }
  if (odStatus === "rejected") {
    return <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 700, background: "rgba(239, 68, 68, 0.12)", color: "#ef4444" }}><AlertCircle size={11} /> OD Rejected</span>;
  }
  if (isVerified) {
    return <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 700, background: "rgba(16, 185, 129, 0.12)", color: "#10b981" }}><ShieldCheck size={11} /> Verified</span>;
  }
  if (hasCode) {
    return <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 700, background: "rgba(168, 85, 247, 0.12)", color: "#a855f7" }}><SendHorizonal size={11} /> Code Sent</span>;
  }
  return <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 10px", borderRadius: "100px", fontSize: "0.65rem", fontWeight: 700, background: "rgba(245, 158, 11, 0.12)", color: "#f59e0b" }}><Clock size={11} /> Awaiting Verification</span>;
}

export default function SelectionResultsSection({ results, odStatusMap = {}, viewerRole }: { results: SelectionResult[]; odStatusMap?: Record<string, string>; viewerRole?: string }) {
  const [filter, setFilter] = useState<"recent" | "all">("recent");
  const [isRaisingOD, setIsRaisingOD] = useState(false);

  const isAuthority = ["tutor", "placement_coordinator", "hod", "dean", "placement_officer", "principal", "placement_head", "coe"].includes(viewerRole || "");
  const isPO = viewerRole === "placement_officer";

  const filteredResults = useMemo(() => {
    if (filter === "recent") {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return results.filter(r => r.updatedAt && new Date(r.updatedAt) >= thirtyDaysAgo);
    }
    return results;
  }, [results, filter]);

  // Students who haven't had a verification code generated yet and haven't started OD
  const unverifiedStudents = filteredResults.filter(r => !r.isVerified && !odStatusMap[r.studentId] && !r.verificationCode);

  const handleRaiseOD = async () => {
    if (unverifiedStudents.length === 0) {
      toast.info("All students have already started the OD process.");
      return;
    }

    setIsRaisingOD(true);
    try {
      const studentIds = unverifiedStudents.map(r => r.studentId);
      const res = await raiseODForStudents(studentIds);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.message || "OD process raised successfully!");
      }
    } catch {
      toast.error("Failed to raise OD.");
    }
    setIsRaisingOD(false);
  };

  if (results.length === 0) return null;

  return (
    <div style={{ marginTop: "var(--space-8)", paddingTop: "var(--space-6)", borderTop: "2px solid var(--border-color)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-5)", flexWrap: "wrap", gap: "12px" }}>
        <h2 style={{ margin: 0, display: "flex", alignItems: "center", gap: "10px", fontSize: "1.25rem" }}>
          <Trophy size={22} color="#f59e0b" /> Selection Results
        </h2>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          {/* Raise OD CTA — visible only to Placement Officer */}
          {isPO && unverifiedStudents.length > 0 && (
            <button
              onClick={handleRaiseOD}
              disabled={isRaisingOD}
              className="btn"
              style={{
                borderRadius: "100px",
                padding: "8px 20px",
                fontSize: "0.8rem",
                height: "auto",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "white",
                border: "none",
                fontWeight: 600,
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.3)",
              }}
            >
              {isRaisingOD ? <Loader2 size={14} className="animate-spin" /> : <SendHorizonal size={14} />}
              Raise OD ({unverifiedStudents.length})
            </button>
          )}
          {(["recent", "all"] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? "" : "btn-outline"}`}
              style={{
                borderRadius: "100px", padding: "6px 16px", fontSize: "0.8rem", textTransform: "capitalize", height: "auto",
                background: filter === f ? "var(--color-primary)" : "transparent",
                color: filter === f ? "white" : "var(--text-secondary)",
              }}
            >
              <Filter size={14} style={{ marginRight: "4px" }} /> {f === "recent" ? "Last 30 Days" : "All Time"}
            </button>
          ))}
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-6)", color: "var(--text-secondary)" }}>
          No results found in this period. Try switching to &quot;All Time&quot;.
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
          {filteredResults.map(r => (
            <div key={r.id} className="card" style={{ borderLeft: "3px solid #f59e0b", padding: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "rgba(245, 158, 11, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <User size={18} color="#f59e0b" />
                </div>
                <div style={{ flex: 1 }}>
                  <Link href={`/portfolio/${r.studentId}`} style={{ fontWeight: 600, margin: 0, fontSize: "0.95rem", color: "var(--primary-color)", textDecoration: "none" }}>
                    {r.studentFirstName} {r.studentLastName}
                  </Link>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: 0 }}>{r.jobTitle}</p>
                </div>
              </div>

              {/* OD Status Badge — visible to authorities and the student themselves */}
              {(isAuthority || viewerRole === "student") && (
                <div style={{ marginBottom: "8px" }}>
                  {getODStatusBadge(r.isVerified, odStatusMap[r.studentId], !!r.verificationCode)}
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--text-secondary)", paddingTop: "8px", borderTop: "1px solid var(--border-color)" }}>
                <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Building2 size={12} /> {r.companyName || "Company"}
                </span>
                <span suppressHydrationWarning style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <Calendar size={12} /> {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "N/A"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
