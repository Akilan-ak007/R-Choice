import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Building2 } from "lucide-react";
import JobApprovalActions from "./JobApprovalActions";

export const dynamic = "force-dynamic";
export default async function JobApprovalsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const role = session.user.role;
  if (role !== "placement_officer" && role !== "management_corporation") {
    redirect("/");
  }

  const targetStatus = role === "management_corporation" ? "pending_mcr_approval" : "pending_review";

  const jobs = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      companyName: users.firstName,
      stipend: jobPostings.stipendSalary,
      location: jobPostings.location,
      description: jobPostings.description,
      requiredSkills: jobPostings.requiredSkills,
      openingsCount: jobPostings.openingsCount,
      createdAt: jobPostings.createdAt
    })
    .from(jobPostings)
    .innerJoin(users, eq(jobPostings.postedBy, users.id))
    .where(eq(jobPostings.status, targetStatus))
    .orderBy(desc(jobPostings.createdAt));

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <h1>Job Postings Review</h1>
        <p>
          {role === "management_corporation" 
            ? "Review and approve internship/job opportunities posted by companies before they are sent to the Placement Officer."
            : "Review and verify internship opportunities before making them visible to students."}
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ marginBottom: "var(--space-4)", display: "flex", justifyContent: "center", color: "var(--color-primary)" }}>
            <Building2 size={48} />
          </div>
          <h2 style={{ marginBottom: "var(--space-2)" }}>No Pending Jobs</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
            There are currently no job postings waiting for your review.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {jobs.map((job) => (
            <div key={job.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)", padding: "var(--space-5)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-4)" }}>
                <div>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "1.25rem", color: "var(--text-primary)" }}>{job.title}</h3>
                  <div style={{ display: "flex", gap: "16px", color: "var(--text-secondary)", fontSize: "0.875rem", flexWrap: "wrap" }}>
                    <span style={{ fontWeight: 600, color: "var(--primary-color)" }}>{job.companyName}</span>
                    <span>• {job.location}</span>
                    <span>• {job.stipend}</span>
                    <span>• {job.openingsCount} Vacancies</span>
                    <span>• Posted: {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}</span>
                  </div>
                </div>
                <div style={{ flexShrink: 0 }}>
                  <JobApprovalActions jobId={job.id} />
                </div>
              </div>

              <div style={{ background: "var(--bg-hover)", padding: "var(--space-4)", borderRadius: "var(--border-radius-md)" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Job Description & Requirements</h4>
                <p style={{ margin: "0 0 16px 0", fontSize: "0.95rem", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {job.description}
                </p>
                
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <div>
                    <h4 style={{ margin: "0 0 8px 0", fontSize: "0.875rem", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary)" }}>Required Skills</h4>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                      {job.requiredSkills.map((skill, idx) => (
                        <span key={idx} style={{ padding: "4px 10px", background: "var(--bg-primary)", border: "1px solid var(--border-color)", borderRadius: "100px", fontSize: "0.875rem" }}>
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
