"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Briefcase } from "lucide-react";
import Link from "next/link";
import { createJobPosting } from "@/app/actions/jobs";

export default function CreateJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await createJobPosting(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/jobs/manage");
      router.refresh();
    }
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <Link href="/jobs/manage" className="btn btn-ghost" style={{ padding: "8px 0" }}>
          <ArrowLeft size={16} /> Back to My Postings
        </Link>
      </div>

      <div className="page-header" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ padding: "12px", background: "var(--bg-hover)", borderRadius: "var(--border-radius-md)" }}>
          <Briefcase size={24} color="var(--primary-color)" />
        </div>
        <div>
          <h1>Create New Job Posting</h1>
          <p>Publish an internship opportunity to the Rathinam talent pool.</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
          
          <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Job Title / Role *</label>
              <input name="title" className="input-field" required placeholder="e.g. Software Engineering Intern" />
            </div>
            
            <div className="input-group">
              <label>Location / Work Mode *</label>
              <input name="location" className="input-field" required placeholder="e.g. Remote, Bangalore, Hybrid" />
            </div>
            
            <div className="input-group">
              <label>Stipend Info</label>
              <input name="stipendInfo" className="input-field" placeholder="e.g. ₹20,000/month" />
            </div>
          </div>

          <div className="input-group">
            <label>Job Description *</label>
            <textarea 
              name="description" 
              className="input-field" 
              required 
              placeholder="Describe the role, responsibilities, and learning outcomes..."
              style={{ minHeight: "120px", resize: "vertical" }}
            />
          </div>

          <div className="input-group">
            <label>Requirements</label>
            <textarea 
              name="requirements" 
              className="input-field" 
              placeholder="e.g. React, Node.js, 3rd year students only..."
              style={{ minHeight: "80px", resize: "vertical" }}
            />
          </div>

          <div className="input-group" style={{ maxWidth: "300px" }}>
            <label>Application Deadline *</label>
            <input type="date" name="deadline" className="input-field" required />
          </div>

          {error && <div style={{ color: "var(--color-danger)", fontSize: "0.875rem", padding: "8px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "4px" }}>{error}</div>}

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-4)" }}>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {isLoading ? "Publishing..." : "Publish Job Posting"}
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
