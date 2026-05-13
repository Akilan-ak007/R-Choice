import { auth } from "@/lib/auth";
import { fetchCompanyJobs, fetchStaffJobs } from "@/app/actions/jobs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PlusCircle, Users, Edit, MapPin, Banknote, Clock } from "lucide-react";
import { getCompanyContextForUser } from "@/lib/company-context";

export default async function ManageJobsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const role = session.user.role;
  const isCompanyRole = role === "company" || role === "company_staff";
  
  const companyContext = await getCompanyContextForUser(session.user.id);
  if (isCompanyRole && !companyContext) {
    redirect("/");
  }

  const jobs = isCompanyRole 
    ? await fetchCompanyJobs(session.user.id) 
    : await fetchStaffJobs(session.user.id);

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
                <Link href={`/jobs/manage/${job.id}`} className="btn btn-ghost" style={{ padding: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center" }} title="Edit Posting">
                  <Edit size={16} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
