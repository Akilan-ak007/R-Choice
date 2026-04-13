import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { CheckCircle, XCircle, Building2 } from "lucide-react";
import JobApprovalActions from "./JobApprovalActions";

export default async function JobApprovalsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const role = session.user.role;
  if (role !== "placement_officer") {
    redirect("/");
  }

  const jobs = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      companyName: users.firstName,
      stipend: jobPostings.stipendSalary,
      location: jobPostings.location,
      createdAt: jobPostings.createdAt
    })
    .from(jobPostings)
    .innerJoin(users, eq(jobPostings.postedBy, users.id))
    .where(eq(jobPostings.status, "pending_review"))
    .orderBy(desc(jobPostings.createdAt));

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <h1>Job Postings Review</h1>
        <p>Review and verify internship opportunities posted by companies before making them visible to students.</p>
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
        <div style={{ overflowX: "auto" }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Job Title</th>
                <th>Location</th>
                <th>Stipend</th>
                <th>Date Posted</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td style={{ fontWeight: 600 }}>{job.companyName}</td>
                  <td>{job.title}</td>
                  <td>{job.location}</td>
                  <td>{job.stipend}</td>
                  <td>{job.createdAt ? new Date(job.createdAt).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <JobApprovalActions jobId={job.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <style>{`
        .data-table {
          width: 100%;
          border-collapse: collapse;
          background: var(--bg-primary);
          border-radius: var(--border-radius-lg);
          overflow: hidden;
          box-shadow: var(--shadow-sm);
        }
        .data-table th, .data-table td {
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid var(--border-color);
        }
        .data-table th {
          background: var(--bg-hover);
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-secondary);
          letter-spacing: 0.05em;
        }
      `}</style>
    </div>
  );
}
