import { auth } from "@/lib/auth";
import { fetchCompanyJobs, deleteJobPosting } from "@/app/actions/jobs";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, Users, Edit, MapPin, Banknote, Clock, Trash2 } from "lucide-react";

export default async function ManageJobsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const role = session.user.role;
  if (role !== "company" && role !== "company_staff") {
    redirect("/");
  }

  const [userRec] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  const jobs = await fetchCompanyJobs(session.user.id, role, userRec?.companyId);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1>My Job Postings</h1>
          <p>Manage your active internship listings and view applicants.</p>
        </div>
        <Link href="/jobs/create" className="btn btn-primary" style={{ display: "flex", gap: "8px" }}>
          <PlusCircle size={18} />
          Post New Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>🏢</div>
          <h2 style={{ marginBottom: "var(--space-2)" }}>No Active Postings</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
            You haven&apos;t posted any internship opportunities to the talent pool yet. Create one to start receiving applications.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          {jobs.map((job) => (
            <div key={job.id} className="card" style={{ padding: "var(--space-5)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
                <div>
                  <h3 style={{ fontSize: "1.25rem", margin: "0 0 8px 0" }}>{job.title}</h3>
                  <div style={{ display: "flex", gap: "16px", fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><MapPin size={14} /> {job.location}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Banknote size={14} /> {job.stipendSalary || "Unpaid"}</span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}><Clock size={14} /> Deadline: {new Date(job.applicationDeadline!).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="badge" style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>
                  {(job.status || "draft").toUpperCase()}
                </span>
              </div>
              
              <div style={{ padding: "16px", background: "var(--bg-hover)", borderRadius: "var(--border-radius-md)", display: "flex", justifyContent: "space-around" }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary-color)" }}>0</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Total Applicants</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--rathinam-blue)" }}>0</div>
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", textTransform: "uppercase" }}>Shortlisted</div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "var(--space-4)", paddingTop: "var(--space-4)", borderTop: "1px solid var(--border-color)" }}>
                <Link href={`/applicants?jobId=${job.id}`} className="btn btn-outline" style={{ display: "flex", gap: "6px", flex: 1, justifyContent: "center" }}>
                  <Users size={16} /> View Applicants
                </Link>
                <button className="btn btn-ghost" style={{ padding: "8px" }} title="Edit Posting">
                  <Edit size={16} />
                </button>
                {/* Only restrict active/approved jobs if needed, but since we allow it in actions for draft/rejected/pending, let's keep it consistent or just allow the server action to reject invalid states. Actually, let's explicitly show it for allowed states. */}
                {(job.status === "draft" || job.status === "rejected" || job.status === "pending_mcr_approval" || job.status === "pending_review") && (
                  <form action={deleteJobPosting.bind(null, job.id) as any}>
                    <button type="submit" className="btn btn-ghost" style={{ padding: "8px", color: "var(--color-danger)" }} title="Delete Job Posting">
                      <Trash2 size={16} />
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
