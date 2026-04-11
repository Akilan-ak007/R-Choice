import { Calendar, MapPin, Building, Link as LinkIcon, Users } from "lucide-react";
import Link from "next/link";
import { db } from "@/lib/db";
import { jobPostings, companyRegistrations } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";

export default async function DrivesPage() {
  const activeJobs = await db
    .select({
      id: jobPostings.id,
      title: jobPostings.title,
      type: jobPostings.jobType,
      location: jobPostings.location,
      deadline: jobPostings.applicationDeadline,
      companyName: companyRegistrations.companyLegalName,
    })
    .from(jobPostings)
    .innerJoin(companyRegistrations, eq(jobPostings.companyId, companyRegistrations.id))
    .where(eq(jobPostings.status, 'approved'))
    .orderBy(desc(jobPostings.createdAt));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Placement Drives & Active Postings</h1>
        <p>Explore all the approved job postings and scheduled campus placement drives.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-6)" }}>
        {/* On-campus drives (Static representation for V1) */}
        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Users size={20} color="var(--primary-color)" /> Upcoming Campus Drives
          </h2>
          <div className="card" style={{ padding: "var(--space-6)" }}>
            <div style={{ display: "flex", justifyContent: "center", padding: "var(--space-4)" }}>
               <div style={{ textAlign: "center", color: "var(--text-secondary)" }}>
                  There are no scheduled major on-campus drives for this week.
               </div>
            </div>
          </div>
        </section>

        {/* Off-campus & General Postings */}
        <section>
          <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Building size={20} color="var(--primary-color)" /> Approved Hiring Postings
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
            {activeJobs.length === 0 ? (
              <div className="card" style={{ gridColumn: "1 / -1", textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
                No active approved job postings available.
              </div>
            ) : (
              activeJobs.map((job) => (
                <div key={job.id} className="card" style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-5)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ fontSize: "1.125rem", fontWeight: 600 }}>{job.title}</h3>
                      <div style={{ color: "var(--primary-color)", fontWeight: 500, fontSize: "0.875rem", marginTop: "2px" }}>{job.companyName}</div>
                    </div>
                    <span className="badge" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border-color)", fontSize: "0.75rem" }}>
                      {job.type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      <MapPin size={14} /> {job.location}
                    </div>
                    {job.deadline && (
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                        <Calendar size={14} /> Apply by {format(new Date(job.deadline), "MMM d, yyyy")}
                      </div>
                    )}
                  </div>

                  <div style={{ marginTop: "auto", paddingTop: "var(--space-4)", borderTop: "1px solid var(--border-color)" }}>
                    <Link href={`/jobs/${job.id}`} className="btn btn-outline" style={{ width: "100%", justifyContent: "center" }}>
                      <LinkIcon size={16} /> View Details
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
