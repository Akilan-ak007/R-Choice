import { db } from "@/lib/db";
import { users, jobPostings, internshipRequests, companyRegistrations } from "@/lib/db/schema";
import { FileText, UserCircle, Briefcase, Calendar } from "lucide-react";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { format } from "date-fns";
import Link from "next/link";

export default async function ApplicantsPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return <div>Unauthorized</div>;

  // Find company record to filter only this company's applicants
  const companyRecord = await db
    .select()
    .from(companyRegistrations)
    .where(eq(companyRegistrations.userId, userId))
    .limit(1);

  const companyId = companyRecord[0]?.id;

  let applicants: { id: string; firstName: string; lastName: string; email: string; phone: string | null; role: string; status: string | null; submittedAt: Date | null; jobTitle: string }[] = [];
  if (companyId) {
    applicants = await db
      .select({
        id: internshipRequests.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone,
        role: internshipRequests.role,
        status: internshipRequests.status,
        submittedAt: internshipRequests.submittedAt,
        jobTitle: jobPostings.title
      })
      .from(internshipRequests)
      .innerJoin(users, eq(internshipRequests.studentId, users.id))
      .innerJoin(jobPostings, eq(internshipRequests.jobPostingId, jobPostings.id))
      .where(eq(jobPostings.companyId, companyId))
      .orderBy(desc(internshipRequests.submittedAt));
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Applicants</h1>
        <p>Review and filter students who have applied for your postings.</p>
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Candidate</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Applied For</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Status</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {applicants.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
                    No applications received yet.
                  </td>
                </tr>
              ) : (
                applicants.map((app) => (
                  <tr key={app.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--bg-elevated)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <UserCircle size={24} color="var(--text-secondary)" />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600 }}>{app.firstName} {app.lastName}</div>
                          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{app.email}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Briefcase size={16} /> {app.role}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px" }}>
                        Req: {app.jobTitle}
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <span className={`status-pill status-${(app.status || 'pending').split('_')[0]}`}>
                        {(app.status || 'pending').replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={14} /> {app.submittedAt ? format(new Date(app.submittedAt), "MMM d, yyyy") : "N/A"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
