import { auth } from "@/lib/auth";
import { fetchActiveJobs } from "@/app/actions/jobs";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, Building2, Calendar, Briefcase, ExternalLink } from "lucide-react";
import ApplyButton from "./ApplyButton";

export default async function JobBoardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const role = (session.user as any).role;
  const isStudent = role === "student";

  const jobs = await fetchActiveJobs();

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <h1>Opportunities</h1>
        <p>Browse and apply for verified internships from our corporate partners.</p>
      </div>

      <div style={{ position: "relative", marginBottom: "var(--space-6)" }}>
        <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-secondary)" }} size={20} />
        <input 
          type="text" 
          placeholder="Search by company, role, or technology..." 
          className="input-field" 
          style={{ paddingLeft: "48px", height: "56px", fontSize: "1rem" }}
        />
      </div>

      {jobs.length === 0 ? (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-8)" }}>
          <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>🔍</div>
          <h2 style={{ marginBottom: "var(--space-2)" }}>No Active Postings Found</h2>
          <p style={{ color: "var(--text-secondary)", maxWidth: "500px", margin: "0 auto" }}>
            There are currently no internship opportunities active on the board. Please check back later or submit an external application if you found one independently!
          </p>
        </div>
      ) : (
        <div className="grid grid-2" style={{ gap: "var(--space-5)" }}>
          {jobs.map((job) => (
            <div key={job.id} className="card" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", height: "100%" }}>
              <div style={{ display: "flex", gap: "16px", marginBottom: "var(--space-4)" }}>
                <div style={{ 
                  width: "56px", height: "56px", 
                  background: "var(--bg-hover)", 
                  borderRadius: "12px", 
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "1.5rem", fontWeight: "bold", color: "var(--primary-color)" 
                }}>
                  {job.companyName?.[0] || <Briefcase size={24} />}
                </div>
                <div>
                  <h3 style={{ fontSize: "1.125rem", margin: "0 0 4px 0" }}>{job.title}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    <Building2 size={14} /> {job.companyName}
                  </div>
                </div>
              </div>

              <div style={{ flexGrow: 1 }}>
                <p style={{ 
                  fontSize: "0.875rem", 
                  color: "var(--text-secondary)", 
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                  marginBottom: "var(--space-4)"
                }}>
                  {job.description}
                </p>

                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "var(--space-5)" }}>
                  <span className="job-tag"><MapPin size={12} /> {job.location}</span>
                  <span className="job-tag"><Calendar size={12} /> Apply by {new Date(job.deadline!).toLocaleDateString()}</span>
                  <span className="job-tag">💰 {job.stipendInfo || "Unpaid"}</span>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "var(--space-4)", display: "flex", justifyContent: "center" }}>
                {isStudent ? (
                  <ApplyButton job={job as any} />
                ) : (
                  <Link href={`/jobs/${job.id}`} className="btn btn-outline" style={{ display: "flex", width: "100%", justifyContent: "center", gap: "8px" }}>
                    View Details
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .job-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--bg-hover);
          color: var(--text-secondary);
          border-radius: var(--border-radius-full);
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
