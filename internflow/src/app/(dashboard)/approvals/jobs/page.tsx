import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, companyRegistrations } from "@/lib/db/schema";
import { desc, eq, inArray } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Building2 } from "lucide-react";
import JobApprovalActions from "./JobApprovalActions";

export const dynamic = "force-dynamic";
export default async function JobApprovalsPage(props: { searchParams: Promise<{ queue?: string }> }) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const role = session.user.role;
  if (!["placement_officer", "management_corporation", "mcr"].includes(role)) {
    redirect("/");
  }

  const searchParams = await props.searchParams;
  const queue = searchParams.queue || (role === "placement_officer" ? "po" : "mcr");
  const targetStatuses: Array<"pending_review" | "pending_mcr_approval"> = queue === "po" ? ["pending_review"] : ["pending_mcr_approval"];

  const jobs = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      companyId: companyRegistrations.id,
      companyName: companyRegistrations.companyLegalName,
      stipend: jobPostings.stipendSalary,
      location: jobPostings.location,
      description: jobPostings.description,
      requiredSkills: jobPostings.requiredSkills,
      openingsCount: jobPostings.openingsCount,
      createdAt: jobPostings.createdAt
    })
    .from(jobPostings)
    .leftJoin(companyRegistrations, eq(jobPostings.companyId, companyRegistrations.id))
    .where(inArray(jobPostings.status, targetStatuses))
    .orderBy(desc(jobPostings.createdAt));

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <h1>Job Postings Review</h1>
        <p>
          Review and approve internship and job opportunities before they become visible to students and staff.
        </p>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "var(--space-3)" }}>
          <Link href="/approvals/jobs?queue=po" className={queue === "po" ? "btn btn-primary" : "btn btn-outline"} style={{ textDecoration: "none" }}>
            PO Review Queue
          </Link>
          <Link href="/approvals/jobs?queue=mcr" className={queue === "mcr" ? "btn btn-primary" : "btn btn-outline"} style={{ textDecoration: "none" }}>
            MCR Review Queue
          </Link>
        </div>
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

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  <Link href={`/jobs/${job.id}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                    View Internship
                  </Link>
                {job.companyId && (
                  <Link href={`/companies/${job.companyId}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                    View Company
                  </Link>
                )}
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
