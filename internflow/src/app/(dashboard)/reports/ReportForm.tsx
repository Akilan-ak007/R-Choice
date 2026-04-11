"use client";

import { useState } from "react";
import { submitWorkReport } from "@/app/actions/reports";
import { Loader2, Send } from "lucide-react";
import { useRouter } from "next/navigation";

export default function ReportForm({ schedules }: { schedules: any[] }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await submitWorkReport(formData);

    if (result.error) {
      setError(result.error);
    } else {
      e.currentTarget.reset();
      router.refresh(); // Refresh to show the new report in the list
    }
    
    setIsLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
      <div className="input-group">
        <label>Reporting Schedule *</label>
        <select name="scheduleId" className="input-field" required>
          <option value="">Select Schedule</option>
          {schedules.map((s) => (
            <option key={s.id} value={s.id}>
              {s.frequency.charAt(0).toUpperCase() + s.frequency.slice(1)} Report 
              {s.nextDueDate ? ` (Due: ${s.nextDueDate})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
        <div className="input-group">
          <label>Period Label *</label>
          <input name="reportPeriod" className="input-field" required placeholder="e.g. Week 1 (Oct 1 - Oct 7)" />
        </div>
        <div className="input-group">
          <label>Hours Logged *</label>
          <input type="number" name="hoursSpent" className="input-field" required min="1" max="100" placeholder="e.g. 40" />
        </div>
      </div>

      <div className="input-group">
        <label>Tasks Completed *</label>
        <textarea 
          name="tasksCompleted" 
          className="input-field" 
          required 
          placeholder="Describe what you worked on..."
          rows={3}
        />
      </div>

      <div className="input-group">
        <label>Key Learnings / Notes</label>
        <textarea 
          name="learnings" 
          className="input-field" 
          placeholder="Any new skills or challenges you faced?"
          rows={2}
        />
      </div>

      {error && (
        <div style={{ color: "var(--color-danger)", fontSize: "0.875rem", padding: "8px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "4px" }}>
          {error}
        </div>
      )}

      <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ marginTop: "var(--space-2)" }}>
        {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {isLoading ? "Submitting..." : "Submit Report"}
      </button>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </form>
  );
}
