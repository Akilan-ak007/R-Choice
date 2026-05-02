"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MapPin, Building2, Calendar, Briefcase, Sparkles, Zap, Clock, AlertTriangle, Layers, Grid2x2, Banknote } from "lucide-react";
import ApplyButton from "./ApplyButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SwipeDeck } from "@/components/dashboard/jobs/SwipeDeck";
import { CompanyMarquee } from "@/components/dashboard/jobs/CompanyMarquee";
import { SalarySlider } from "@/components/dashboard/jobs/SalarySlider";

type JobCard = {
  id: string;
  title: string;
  description: string;
  location: string;
  companyName: string | null;
  stipendInfo: string | null;
  stipendSalary?: string | null;
  deadline: string;
  verifiedAt?: string | Date | null;
  verifierName?: string | null;
  jobType?: string;
  isPpoAvailable?: boolean;
};

type Interest = {
  roleName: string;
};

function DeadlineBadge({ deadline }: { deadline: string }) {
  const now = new Date();
  const dl = new Date(deadline);
  const daysLeft = Math.ceil((dl.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (daysLeft < 0) return <span className="job-tag" style={{ color: "var(--status-rejected)", background: "rgba(225, 38, 28, 0.08)" }}><AlertTriangle size={12} /> Expired</span>;
  if (daysLeft <= 3) return (
    <span className="job-tag" style={{ color: "var(--status-rejected)", background: "rgba(225, 38, 28, 0.08)", animation: "deadlinePulse 2s ease-in-out infinite" }}>
      <Clock size={12} /> {daysLeft === 0 ? "Last day!" : `${daysLeft}d left`}
    </span>
  );
  if (daysLeft <= 7) return <span className="job-tag" style={{ color: "var(--color-warning)", background: "rgba(244, 122, 42, 0.08)" }}><Clock size={12} /> {daysLeft}d left</span>;
  return <span className="job-tag" suppressHydrationWarning><Calendar size={12} /> {dl.toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>;
}

function VelocityBadge() {
  return (
    <span style={{
      display: "inline-flex",
      alignItems: "center",
      gap: "4px",
      fontSize: "0.6875rem",
      fontWeight: 700,
      color: "#f59e0b",
      background: "rgba(245, 158, 11, 0.1)",
      padding: "3px 10px",
      borderRadius: "100px",
    }}>
      <Zap size={11} /> Urgently Hiring
    </span>
  );
}

function OpportunityBadge({ type, ppo }: { type?: string, ppo?: boolean }) {
  if (!type) return null;
  
  if (type === "internship_to_full_time" || (type === "internship" && ppo)) {
    return <span className="job-tag" style={{ background: "rgba(139, 92, 246, 0.1)", color: "#8b5cf6", border: "1px solid rgba(139, 92, 246, 0.2)" }}><Briefcase size={12} /> Intern + Full Time</span>;
  }
  if (type === "full_time" || type === "fulltime") {
    return <span className="job-tag" style={{ background: "rgba(16, 185, 129, 0.1)", color: "#10b981", border: "1px solid rgba(16, 185, 129, 0.2)" }}><Briefcase size={12} /> Full Time</span>;
  }
  if (type === "part_time" || type === "parttime") {
    return <span className="job-tag" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", border: "1px solid rgba(245, 158, 11, 0.2)" }}><Briefcase size={12} /> Part Time</span>;
  }
  return <span className="job-tag" style={{ background: "rgba(59, 130, 246, 0.1)", color: "#3b82f6", border: "1px solid rgba(59, 130, 246, 0.2)" }}><Briefcase size={12} /> Internship</span>;
}

export default function JobBoardClient({ jobs, interests, isStudent, appliedJobIds = [] }: { jobs: JobCard[]; interests: Interest[]; isStudent: boolean; appliedJobIds?: string[] }) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "swipe">("grid");
  const [minSalary, setMinSalary] = useState(0);
  const [activeFilter, setActiveFilter] = useState<"all" | "remote" | "onsite" | "paid" | "unpaid">("all");

  // Lazy initialize state to capture current time once without violating purity rules
  const [nowMs] = useState(() => Date.now());

  const roleKeywords = useMemo(() => interests.map((i) => i.roleName.toLowerCase()), [interests]);

  const sortedAndFilteredJobs = useMemo(() => {
    let result = [...jobs];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.companyName?.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q)
      );
    }
    
    if (activeFilter === "remote") {
      result = result.filter(j => j.location.toLowerCase().includes("remote"));
    } else if (activeFilter === "onsite") {
      result = result.filter(j => !j.location.toLowerCase().includes("remote"));
    } else if (activeFilter === "paid") {
      result = result.filter(j => j.stipendInfo && !j.stipendInfo.toLowerCase().includes("unpaid") && j.stipendInfo.trim() !== "");
    } else if (activeFilter === "unpaid") {
      result = result.filter(j => !j.stipendInfo || j.stipendInfo.toLowerCase().includes("unpaid") || j.stipendInfo.trim() === "");
    }

    if (minSalary > 0 && activeFilter === "paid") {
      result = result.filter(j => {
        // Attempt to parse salary/stipend text to extract a number representing monthly pay
        const str = (j.stipendSalary || j.stipendInfo || "").replace(/,/g, '');
        const match = str.match(/\d+/);
        if (!match) return false;
        let num = parseInt(match[0], 10);
        // If they wrote 15k
        if (str.toLowerCase().includes('k')) num *= 1000;
        // If it's an annual CTC (e.g. 500000+), try to average to month to see if it meets criteria
        if (str.toLowerCase().includes('lpa')) num = (num * 100000) / 12;
        if (num > 100000) num = num / 12; // Basic heuristic for yearly vs monthly
        return num >= minSalary;
      });
    }

    result.sort((a, b) => {
      const aMatch = roleKeywords.some(
        (kw) => a.title.toLowerCase().includes(kw) || a.description.toLowerCase().includes(kw)
      );
      const bMatch = roleKeywords.some(
        (kw) => b.title.toLowerCase().includes(kw) || b.description.toLowerCase().includes(kw)
      );
      if (aMatch && !bMatch) return -1;
      if (!aMatch && bMatch) return 1;
      return 0;
    });

    return result;
  }, [jobs, searchTerm, roleKeywords, activeFilter, minSalary]);

  return (
    <>
      <CompanyMarquee jobs={jobs} />

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "280px" }}>
          <Search
            style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }}
            size={20}
          />
          <input
            type="text"
            placeholder="Search by company, role, or technology..."
            className="input-field"
            style={{ paddingLeft: "48px", height: "56px", fontSize: "1rem" }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", background: "var(--bg-secondary)", padding: "4px", borderRadius: "12px" }}>
          <button 
            className={`btn ${viewMode === "grid" ? "" : "btn-ghost"}`}
            style={{ whiteSpace: "nowrap", padding: "8px 16px", background: viewMode === "grid" ? "var(--bg-card)" : "transparent", boxShadow: viewMode === "grid" ? "var(--shadow-sm)" : "none", color: viewMode === "grid" ? "var(--color-primary)" : "var(--text-secondary)", height: "auto" }}
            onClick={() => setViewMode("grid")}
          >
            <Grid2x2 size={18} style={{ marginRight: 8 }} /> Grid
          </button>
          <button 
            className={`btn ${viewMode === "swipe" ? "" : "btn-ghost"}`}
            style={{ whiteSpace: "nowrap", display: "flex", alignItems: "center", padding: "8px 16px", background: viewMode === "swipe" ? "var(--bg-card)" : "transparent", boxShadow: viewMode === "swipe" ? "var(--shadow-sm)" : "none", color: viewMode === "swipe" ? "var(--color-primary)" : "var(--text-secondary)", height: "auto" }}
            onClick={() => setViewMode("swipe")}
          >
            <Layers size={18} style={{ marginRight: 8 }} /> Swipe Mode 
            <span style={{ marginLeft: 8, background: "var(--gradient-accent)", color: "white", padding: "2px 6px", borderRadius: 100, fontSize: "0.65rem", fontWeight: "bold" }}>NEW</span>
          </button>
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "var(--space-2)" }}>
        {(["all", "remote", "onsite", "paid", "unpaid"] as const).map(f => (
          <button
            key={f}
            className={`btn ${activeFilter === f ? "" : "btn-outline"}`}
            style={{ 
              borderRadius: "100px", 
              padding: "6px 16px", 
              fontSize: "0.875rem", 
              textTransform: "capitalize", 
              minWidth: "max-content", 
              height: "auto",
              background: activeFilter === f ? "var(--color-primary)" : "transparent",
              color: activeFilter === f ? "white" : "var(--text-secondary)"
            }}
            onClick={() => {
              setActiveFilter(f);
              if (f !== "paid") setMinSalary(0);
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {viewMode === "grid" && activeFilter === "paid" && (
        <div style={{ background: "var(--bg-secondary)", padding: "var(--space-4)", borderRadius: "12px", marginBottom: "var(--space-6)" }}>
          <SalarySlider min={0} max={50000} value={minSalary} onChange={setMinSalary} />
        </div>
      )}

      {sortedAndFilteredJobs.length === 0 ? (
        <EmptyState
          variant={searchTerm ? "search" : "noJobs"}
          title={searchTerm ? "No results found" : undefined}
          description={searchTerm ? "Try adjusting your search or filter criteria." : undefined}
        />
      ) : viewMode === "swipe" ? (
        <div style={{ paddingBottom: "80px" }}>
          <SwipeDeck
            jobs={sortedAndFilteredJobs}
            isStudent={isStudent}
            appliedJobIds={appliedJobIds}
            onViewDetails={(id) => router.push(`/jobs/${id}`)}
          />
        </div>
      ) : (
        <div className="grid grid-2" style={{ gap: "var(--space-5)", paddingBottom: "80px" }}>
          {sortedAndFilteredJobs.map((job, idx) => {
            const isRecommended = roleKeywords.some(
              (kw) => job.title.toLowerCase().includes(kw) || job.description.toLowerCase().includes(kw)
            );
            const daysUntilDeadline = job.deadline
              ? Math.ceil((new Date(job.deadline).getTime() - nowMs) / (1000 * 60 * 60 * 24))
              : 999;
            const isUrgent = daysUntilDeadline >= 0 && daysUntilDeadline <= 3;

            return (
              <div
                key={job.id}
                className="card stagger-1"
                style={{
                  padding: "var(--space-5)",
                  display: "flex",
                  flexDirection: "column",
                  height: "100%",
                  position: "relative",
                  animationDelay: `${idx * 50}ms`,
                  boxShadow: isUrgent
                    ? "0 0 0 1px rgba(225, 38, 28, 0.15), 0 0 12px rgba(225, 38, 28, 0.06)"
                    : undefined,
                  transition: "box-shadow var(--transition-normal), transform var(--transition-normal)",
                }}
              >
                {isRecommended && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-10px",
                      right: "16px",
                      background: "var(--gradient-primary)",
                      color: "white",
                      padding: "4px 12px",
                      borderRadius: "100px",
                      fontSize: "0.75rem",
                      fontWeight: "bold",
                      display: "flex",
                      alignItems: "center",
                      gap: "4px",
                      boxShadow: "var(--shadow-md)",
                    }}
                  >
                    <Sparkles size={12} /> Recommended
                  </div>
                )}

                <div style={{ display: "flex", gap: "16px", marginBottom: "var(--space-4)", marginTop: isRecommended ? "8px" : "0" }}>
                  <div
                    style={{
                      width: "56px",
                      height: "56px",
                      background: "var(--bg-hover)",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.5rem",
                      fontWeight: "bold",
                      color: "var(--color-primary)",
                    }}
                  >
                    {job.companyName?.[0] || <Briefcase size={24} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: "1.125rem", margin: "0 0 4px 0" }}>{job.title}</h3>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-secondary)", fontSize: "0.875rem", flexWrap: "wrap" }}>
                      <Building2 size={14} /> {job.companyName}
                      {isUrgent && <VelocityBadge />}
                    </div>
                    {job.verifierName && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: "4px",
                        marginTop: "6px", padding: "2px 10px", borderRadius: "100px",
                        background: "rgba(16, 185, 129, 0.1)", color: "#10b981",
                        fontSize: "0.7rem", fontWeight: 600,
                      }}>
                        ✓ Approved by {job.verifierName}
                        {job.verifiedAt && <span style={{ opacity: 0.7 }} suppressHydrationWarning> • {new Date(job.verifiedAt).toLocaleDateString("en-IN", { year: "numeric", month: "short", day: "numeric" })}</span>}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ flexGrow: 1 }}>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      display: "-webkit-box",
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                      marginBottom: "var(--space-4)",
                    }}
                  >
                    {job.description}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "var(--space-5)" }}>
                    <span className="job-tag"><MapPin size={12} /> {job.location}</span>
                    {job.deadline && <DeadlineBadge deadline={job.deadline} />}
                    <span className="job-tag"><Banknote size={12} /> {job.stipendInfo || "Unpaid"}</span>
                    <OpportunityBadge type={job.jobType} ppo={job.isPpoAvailable} />
                  </div>
                </div>

                <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "var(--space-4)", display: "flex", justifyContent: "center" }}>
                  {isStudent ? (
                    <div style={{ display: "flex", width: "100%", gap: "8px" }}>
                      <Link href={`/jobs/${job.id}`} className="btn btn-outline" style={{ display: "flex", flex: 1, justifyContent: "center", gap: "8px" }}>
                        View Details
                      </Link>
                      <ApplyButton job={job} isApplied={appliedJobIds.includes(job.id)} />
                    </div>
                  ) : (
                    <Link href={`/jobs/${job.id}`} className="btn btn-outline" style={{ display: "flex", width: "100%", justifyContent: "center", gap: "8px" }}>
                      View Details
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes deadlinePulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(225, 38, 28, 0); }
          50% { box-shadow: 0 0 0 3px rgba(225, 38, 28, 0.12); }
        }
      `}</style>
    </>
  );
}
