import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, users, companyRegistrations, selectionProcessRounds } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { MapPin, Clock, Banknote, Building2, ArrowLeft, Video } from "lucide-react";

export default async function JobDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [job] = await db
    .select()
    .from(jobPostings)
    .where(eq(jobPostings.id, params.id))
    .limit(1);

  if (!job) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
        <h2>Job Not Found</h2>
        <p style={{ color: "var(--text-secondary)" }}>This job posting may have been removed.</p>
        <Link href="/jobs" className="btn btn-primary" style={{ marginTop: "var(--space-4)" }}>Back to Jobs</Link>
      </div>
    );
  }

  // Fetch poster info
  const [poster] = await db
    .select({ firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.id, job.postedBy))
    .limit(1);

  // Fetch company if linked
  let company = null;
  if (job.companyId) {
    const [c] = await db.select().from(companyRegistrations).where(eq(companyRegistrations.id, job.companyId)).limit(1);
    company = c;
  }

  const rounds = await db
    .select({
      id: selectionProcessRounds.id,
      roundNumber: selectionProcessRounds.roundNumber,
      roundName: selectionProcessRounds.roundName,
      roundType: selectionProcessRounds.roundType,
      startsAt: selectionProcessRounds.startsAt,
      endsAt: selectionProcessRounds.endsAt,
      mode: selectionProcessRounds.mode,
      meetLink: selectionProcessRounds.meetLink,
      location: selectionProcessRounds.location,
      description: selectionProcessRounds.description,
    })
    .from(selectionProcessRounds)
    .where(eq(selectionProcessRounds.jobId, job.id))
    .orderBy(asc(selectionProcessRounds.roundNumber));

  return (
    <div className="animate-fade-in" style={{ maxWidth: "900px" }}>
      <Link href="/jobs" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", textDecoration: "none", marginBottom: "var(--space-4)", fontSize: "0.875rem" }}>
        <ArrowLeft size={16} /> Back to Job Board
      </Link>

      <div className="card" style={{ padding: "var(--space-6)" }}>
        {/* Header */}
        <div style={{ marginBottom: "var(--space-5)" }}>
          <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap", marginBottom: "12px" }}>
            <span style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, background: job.jobType === "full_time" ? "rgba(16,185,129,0.1)" : "rgba(59,130,246,0.1)", color: job.jobType === "full_time" ? "#10b981" : "#3b82f6" }}>
              {(job.jobType || "internship").replace(/_/g, " ").toUpperCase()}
            </span>
            {job.isPpoAvailable && (
              <span style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, background: "rgba(139,92,246,0.1)", color: "#8b5cf6" }}>
                PPO Available
              </span>
            )}
            {job.isCampusHiring && (
              <span style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", fontWeight: 700, background: "rgba(245,158,11,0.1)", color: "#f59e0b" }}>
                Campus Hiring
              </span>
            )}
          </div>
          <h1 style={{ margin: "0 0 8px 0", fontSize: "1.75rem" }}>{job.title}</h1>
          <div style={{ display: "flex", gap: "20px", flexWrap: "wrap", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Building2 size={15} /> {company?.companyLegalName || poster?.firstName || "Staff"}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={15} /> {job.location}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={15} /> {job.duration}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Banknote size={15} /> {job.stipendSalary}</span>
          </div>
        </div>

        <hr style={{ border: "none", borderTop: "1px solid var(--border-color)", margin: "var(--space-5) 0" }} />

        {/* Description */}
        <div style={{ marginBottom: "var(--space-5)" }}>
          <h3 style={{ marginBottom: "var(--space-3)" }}>Job Description</h3>
          <p style={{ lineHeight: 1.7, color: "var(--text-secondary)", whiteSpace: "pre-wrap" }}>{job.description}</p>
        </div>

        {/* Details Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
          <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-hover)" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Work Mode</p>
            <p style={{ fontWeight: 600, margin: 0 }}>{job.workMode}</p>
          </div>
          <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-hover)" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Openings</p>
            <p style={{ fontWeight: 600, margin: 0 }}>{job.openingsCount}</p>
          </div>
          <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-hover)" }}>
            <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Deadline</p>
            <p style={{ fontWeight: 600, margin: 0 }}>{new Date(job.applicationDeadline).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
          </div>
          {job.interviewMode && (
            <div style={{ padding: "16px", borderRadius: "8px", background: "var(--bg-hover)" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", marginBottom: "4px" }}>Interview Mode</p>
              <p style={{ fontWeight: 600, margin: 0 }}>{job.interviewMode}</p>
            </div>
          )}
        </div>

        {/* Skills */}
        {job.requiredSkills && job.requiredSkills.length > 0 && (
          <div style={{ marginBottom: "var(--space-5)" }}>
            <h3 style={{ marginBottom: "var(--space-3)" }}>Required Skills</h3>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {job.requiredSkills.map((skill, i) => (
                <span key={i} style={{ padding: "6px 14px", borderRadius: "100px", fontSize: "0.8125rem", background: "rgba(99, 102, 241, 0.08)", color: "var(--primary-color)", fontWeight: 500 }}>
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Selection Rounds */}
        {rounds.length > 0 && (
          <div style={{ marginBottom: "var(--space-5)" }}>
            <h3 style={{ marginBottom: "var(--space-3)" }}>Selection Process</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {rounds.map((round) => (
                <div key={round.id} style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 16px", borderRadius: "8px", border: "1px solid var(--border-color)" }}>
                  <div style={{ width: "28px", height: "28px", borderRadius: "50%", background: "var(--primary-color)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.75rem", fontWeight: 700, flexShrink: 0 }}>
                    {round.roundNumber}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "0.9rem" }}>{round.roundName}</p>
                    <div style={{ marginTop: "4px", fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", gap: "10px", flexWrap: "wrap" }}>
                      <span>{(round.roundType || "custom").replace(/_/g, " ")}</span>
                      {round.mode && <span>{round.mode}</span>}
                      {round.startsAt && <span>{new Date(round.startsAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>}
                      {round.location && <span>{round.location}</span>}
                    </div>
                    {round.description && <p style={{ margin: "6px 0 0 0", fontSize: "0.8rem", color: "var(--text-secondary)" }}>{round.description}</p>}
                  </div>
                  {round.meetLink && (
                    <a href={round.meetLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ fontSize: "0.8rem", padding: "6px 12px", display: "inline-flex", gap: "4px" }}>
                      <Video size={14} /> Join
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
