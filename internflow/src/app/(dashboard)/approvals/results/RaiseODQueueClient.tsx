"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarDays, Building2, User, Briefcase, ExternalLink, CheckCircle2, Milestone, Check, Clock3 } from "lucide-react";
import { raiseODFromSelection } from "@/app/actions/applications";

type QueueRow = {
  resultPublicationId: string;
  applicationId: string;
  studentId: string;
  studentName: string;
  studentEmail: string;
  companyId: string;
  companyName: string;
  jobId: string;
  jobTitle: string;
  publishedAt: string;
  notes: string | null;
  odStatus: string | null;
  internshipRequestId: string | null;
};

type RoundProgress = {
  currentRound: { roundNumber: number; roundName: string; startsAt: string | null } | null;
  clearedRounds: Array<{ roundNumber: number; roundName: string; reviewedAt: string | null }>;
};

export default function RaiseODQueueClient({
  rows,
  roundProgressByApplication,
}: {
  rows: QueueRow[];
  roundProgressByApplication: Record<string, RoundProgress>;
}) {
  const initialDates = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return rows.reduce<Record<string, { startDate: string; endDate: string }>>((acc, row) => {
      acc[row.resultPublicationId] = { startDate: today, endDate: today };
      return acc;
    }, {});
  }, [rows]);

  const [dates, setDates] = useState(initialDates);
  const [raisingId, setRaisingId] = useState<string | null>(null);

  const updateDate = (id: string, field: "startDate" | "endDate", value: string) => {
    setDates((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleRaise = async (row: QueueRow) => {
    const selectedDates = dates[row.resultPublicationId];
    if (!selectedDates?.startDate || !selectedDates?.endDate) {
      toast.error("Select both OD start and end dates.");
      return;
    }

    setRaisingId(row.resultPublicationId);
    toast.loading("Raising OD request...", { id: row.resultPublicationId });

    try {
      const result = await raiseODFromSelection(
        row.resultPublicationId,
        selectedDates.startDate,
        selectedDates.endDate
      );

      if (result.error) {
        toast.error(result.error, { id: row.resultPublicationId });
      } else {
        toast.success("OD request raised successfully.", { id: row.resultPublicationId });
      }
    } catch {
      toast.error("Failed to raise OD request.", { id: row.resultPublicationId });
    } finally {
      setRaisingId(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      {rows.map((row) => {
        const alreadyRaised = row.odStatus === "od_raised" || Boolean(row.internshipRequestId);
        const selectedDates = dates[row.resultPublicationId] || { startDate: "", endDate: "" };
        const roundProgress = roundProgressByApplication[row.applicationId];
        const currentRound = roundProgress?.currentRound || null;
        const clearedRounds = roundProgress?.clearedRounds || [];

        return (
          <div key={row.resultPublicationId} className="card" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-4)", flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem" }}>{row.jobTitle}</h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Building2 size={15} /> {row.companyName}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <User size={15} /> {row.studentName}
                  </span>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Briefcase size={15} /> Published {new Date(row.publishedAt).toLocaleDateString("en-IN")}
                  </span>
                </div>
              </div>

              <div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    background: alreadyRaised ? "rgba(34, 197, 94, 0.12)" : "rgba(245, 158, 11, 0.12)",
                    color: alreadyRaised ? "#16a34a" : "#d97706",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  {alreadyRaised ? <CheckCircle2 size={14} /> : <CalendarDays size={14} />}
                  {alreadyRaised ? "OD Raised" : "Awaiting PO Raise"}
                </span>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-3)" }}>
              <div className="card" style={{ padding: "var(--space-3)", background: "var(--bg-secondary)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Student</div>
                <div style={{ fontWeight: 600 }}>{row.studentName}</div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{row.studentEmail}</div>
                <Link href={`/students/${row.studentId}`} style={{ display: "inline-flex", gap: "6px", alignItems: "center", marginTop: "8px", color: "var(--primary-color)", textDecoration: "none", fontSize: "0.875rem" }}>
                  <ExternalLink size={14} /> View student
                </Link>
              </div>

              <div className="card" style={{ padding: "var(--space-3)", background: "var(--bg-secondary)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Company</div>
                <div style={{ fontWeight: 600 }}>{row.companyName}</div>
                <Link href={`/companies/${row.companyId}`} style={{ display: "inline-flex", gap: "6px", alignItems: "center", marginTop: "8px", color: "var(--primary-color)", textDecoration: "none", fontSize: "0.875rem" }}>
                  <ExternalLink size={14} /> View company
                </Link>
              </div>

              <div className="card" style={{ padding: "var(--space-3)", background: "var(--bg-secondary)" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Job</div>
                <div style={{ fontWeight: 600 }}>{row.jobTitle}</div>
                <Link href={`/jobs/${row.jobId}`} style={{ display: "inline-flex", gap: "6px", alignItems: "center", marginTop: "8px", color: "var(--primary-color)", textDecoration: "none", fontSize: "0.875rem" }}>
                  <ExternalLink size={14} /> View job
                </Link>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-3)" }}>
              <div className="card" style={{ padding: "var(--space-3)", background: "rgba(139, 92, 246, 0.08)" }}>
                <div style={{ fontSize: "0.75rem", color: "#8b5cf6", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Round Evidence
                </div>
                {currentRound ? (
                  <>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 600, marginBottom: "4px" }}>
                      <Milestone size={15} /> Current Round: {currentRound.roundName}
                    </div>
                    <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      Round {currentRound.roundNumber}
                    </div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Clock3 size={13} /> {currentRound.startsAt ? new Date(currentRound.startsAt).toLocaleString("en-IN") : "No round date recorded"}
                    </div>
                  </>
                ) : (
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    No active round is currently scheduled. This candidate has either cleared all listed rounds or the company posted the final result directly.
                  </div>
                )}
              </div>

              <div className="card" style={{ padding: "var(--space-3)", background: "rgba(34, 197, 94, 0.08)" }}>
                <div style={{ fontSize: "0.75rem", color: "#16a34a", marginBottom: "6px", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                  Cleared Rounds
                </div>
                {clearedRounds.length === 0 ? (
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    No cleared rounds were recorded before the final result.
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {clearedRounds.map((round) => (
                      <div key={`${row.resultPublicationId}-${round.roundNumber}`} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.875rem" }}>
                        <Check size={14} color="#16a34a" />
                        <span>
                          Round {round.roundNumber}: {round.roundName}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {row.notes && (
              <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.08)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                {row.notes}
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "180px" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 600 }}>OD Start Date</span>
                <input
                  type="date"
                  className="input-field"
                  value={selectedDates.startDate}
                  onChange={(e) => updateDate(row.resultPublicationId, "startDate", e.target.value)}
                  disabled={alreadyRaised}
                />
              </label>
              <label style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "180px" }}>
                <span style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", fontWeight: 600 }}>OD End Date</span>
                <input
                  type="date"
                  className="input-field"
                  value={selectedDates.endDate}
                  onChange={(e) => updateDate(row.resultPublicationId, "endDate", e.target.value)}
                  disabled={alreadyRaised}
                />
              </label>
              <button
                type="button"
                className="btn btn-primary"
                disabled={alreadyRaised || raisingId === row.resultPublicationId}
                onClick={() => handleRaise(row)}
                style={{ minWidth: "180px" }}
              >
                {alreadyRaised ? "Already Raised" : raisingId === row.resultPublicationId ? "Raising..." : "Raise OD"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
