import { db } from "@/lib/db";
import { users, internshipRequests } from "@/lib/db/schema";
import { Briefcase, Building, Calendar, CheckCircle } from "lucide-react";
import { eq, desc } from "drizzle-orm";
import { format } from "date-fns";

export default async function StudentsAppliedPage() {
  const applications = await db
    .select({
      id: internshipRequests.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      company: internshipRequests.companyName,
      role: internshipRequests.role,
      status: internshipRequests.status,
      startDate: internshipRequests.startDate,
      submittedAt: internshipRequests.submittedAt
    })
    .from(internshipRequests)
    .innerJoin(users, eq(users.id, internshipRequests.studentId))
    .orderBy(desc(internshipRequests.submittedAt));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Students Applied</h1>
        <p>Monitor all active internship applications submitted by students.</p>
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Student</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Placement Details</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Status</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Timeline</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
                    No applications have been submitted yet.
                  </td>
                </tr>
              ) : (
                applications.map((app) => (
                  <tr key={app.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ fontWeight: 600 }}>{app.firstName} {app.lastName}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{app.email}</div>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Briefcase size={16} /> {app.role}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "var(--space-2)", marginTop: "4px" }}>
                        <Building size={14} /> {app.company}
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <span className={`badge ${
                        app.status === 'approved' ? 'badge-success' : 
                        app.status === 'rejected' ? 'badge-error' : 
                        'badge-warning'
                      }`}>
                        <CheckCircle size={14} style={{ marginRight: "4px" }} />
                        {(app.status || 'pending').replace(/_/g, ' ').toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                          <Calendar size={14} /> Applied: {app.submittedAt ? format(new Date(app.submittedAt), "MMM d, yyyy") : "N/A"}
                        </span>
                        <span>Starts: {format(new Date(app.startDate), "MMM d, yyyy")}</span>
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
