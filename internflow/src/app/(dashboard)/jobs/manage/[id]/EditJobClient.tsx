"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, Loader2, Plus, X, ListChecks } from "lucide-react";
import { updateJobPosting } from "@/app/actions/jobs";

type RoundDraft = {
  roundName: string;
  roundType: string;
  startsAt: string;
  endsAt: string;
  mode: string;
  meetLink: string;
  location: string;
  description: string;
};

type EditJobData = {
  id: string;
  title: string;
  description: string;
  location: string;
  stipendSalary: string;
  applicationDeadline: string;
  openingsCount: number;
  rounds: RoundDraft[];
};

export default function EditJobClient({ job }: { job: EditJobData }) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [rounds, setRounds] = useState<RoundDraft[]>(
    job.rounds.length > 0
      ? job.rounds
      : [
          {
            roundName: "",
            roundType: "custom",
            startsAt: "",
            endsAt: "",
            mode: "Online",
            meetLink: "",
            location: "",
            description: "",
          },
        ]
  );

  function updateRound(index: number, field: keyof RoundDraft, value: string) {
    setRounds((prev) => prev.map((round, roundIndex) => (
      roundIndex === index ? { ...round, [field]: value } : round
    )));
  }

  function addRound() {
    setRounds((prev) => [
      ...prev,
      {
        roundName: "",
        roundType: "custom",
        startsAt: "",
        endsAt: "",
        mode: "Online",
        meetLink: "",
        location: "",
        description: "",
      },
    ]);
  }

  function removeRound(index: number) {
    setRounds((prev) => prev.filter((_, roundIndex) => roundIndex !== index));
  }

  async function handleSubmit(formData: FormData) {
    setIsSaving(true);
    setError("");

    const normalizedRounds = rounds
      .map((round) => ({
        ...round,
        roundName: round.roundName.trim(),
      }))
      .filter((round) => round.roundName);

    normalizedRounds.forEach((round) => formData.append("selectionSteps", round.roundName));
    formData.set("selectionRoundsJson", JSON.stringify(normalizedRounds));

    const result = await updateJobPosting(job.id, formData);
    if (result.error) {
      setError(result.error);
      setIsSaving(false);
      return;
    }

    router.push("/jobs/manage");
    router.refresh();
  }

  return (
    <div className="animate-fade-in" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <Link href="/jobs/manage" className="btn btn-ghost" style={{ padding: "8px 0", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "var(--text-secondary)" }}>
          <ArrowLeft size={16} /> Back to My Postings
        </Link>
      </div>

      <div className="page-header">
        <h1>Edit Job Posting</h1>
        <p>Update your job details and keep selection rounds accurate for students and staff.</p>
      </div>

      <form action={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        <div className="card" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Job Title</label>
              <input name="title" className="input-field" defaultValue={job.title} required />
            </div>
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Description</label>
              <textarea name="description" className="input-field" defaultValue={job.description} style={{ minHeight: "120px", resize: "vertical" }} />
            </div>
            <div className="input-group">
              <label>Location</label>
              <input name="location" className="input-field" defaultValue={job.location} />
            </div>
            <div className="input-group">
              <label>Stipend / Salary</label>
              <input name="stipendSalary" className="input-field" defaultValue={job.stipendSalary} />
            </div>
            <div className="input-group">
              <label>Application Deadline</label>
              <input type="date" name="deadline" className="input-field" defaultValue={job.applicationDeadline} />
            </div>
            <div className="input-group">
              <label>Openings</label>
              <input type="number" name="openingsCount" className="input-field" min="1" defaultValue={job.openingsCount} />
            </div>
          </div>
        </div>

        <div className="card" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <h3 style={{ display: "flex", alignItems: "center", gap: "10px", margin: 0, fontSize: "1.05rem", fontWeight: 600, borderBottom: "1px solid var(--border-color)", paddingBottom: "var(--space-3)" }}>
            <ListChecks size={18} color="var(--primary-color)" /> Selection Rounds
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {rounds.map((round, index) => (
              <div key={`edit-round-${index}`} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700 }}>Round {index + 1}</div>
                  {rounds.length > 1 && (
                    <button type="button" onClick={() => removeRound(index)} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="input-group">
                    <label>Round Name</label>
                    <input className="input-field" value={round.roundName} onChange={(e) => updateRound(index, "roundName", e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Round Type</label>
                    <select className="input-field" value={round.roundType} onChange={(e) => updateRound(index, "roundType", e.target.value)}>
                      <option value="custom">Custom</option>
                      <option value="aptitude_test">Aptitude Test</option>
                      <option value="coding_test">Coding Test</option>
                      <option value="technical_interview">Technical Interview</option>
                      <option value="hr_interview">HR Interview</option>
                      <option value="group_discussion">Group Discussion</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Start Date & Time</label>
                    <input type="datetime-local" className="input-field" value={round.startsAt} onChange={(e) => updateRound(index, "startsAt", e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>End Date & Time</label>
                    <input type="datetime-local" className="input-field" value={round.endsAt} onChange={(e) => updateRound(index, "endsAt", e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>Mode</label>
                    <select className="input-field" value={round.mode} onChange={(e) => updateRound(index, "mode", e.target.value)}>
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Location</label>
                    <input className="input-field" value={round.location} onChange={(e) => updateRound(index, "location", e.target.value)} />
                  </div>
                  <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Meet Link</label>
                    <input className="input-field" value={round.meetLink} onChange={(e) => updateRound(index, "meetLink", e.target.value)} />
                  </div>
                  <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Notes</label>
                    <textarea className="input-field" value={round.description} onChange={(e) => updateRound(index, "description", e.target.value)} style={{ minHeight: "70px", resize: "vertical" }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button type="button" onClick={addRound} className="btn btn-outline" style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={14} /> Add Round
          </button>
        </div>

        {error && (
          <div style={{ color: "var(--color-danger)", fontSize: "0.875rem", padding: "12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", paddingBottom: "var(--space-6)" }}>
          <Link href="/jobs/manage" className="btn btn-outline" style={{ textDecoration: "none" }}>Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={isSaving} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
