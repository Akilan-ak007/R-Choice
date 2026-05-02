import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobApplications, jobPostings, users, companyRegistrations, studentProfiles } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { redirect } from "next/navigation";
import { Trophy, Building2, Briefcase, GraduationCap } from "lucide-react";

export default async function ShortlistedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const staffRoles = ["tutor", "placement_coordinator", "hod", "dean", "placement_officer", "coe", "placement_head", "management_corporation", "principal"];
  if (!staffRoles.includes(session.user.role)) redirect("/dashboard/student");

  const shortlisted = await db
    .select({
      id: jobApplications.id,
      studentId: jobApplications.studentId,
      studentFirstName: users.firstName,
      studentLastName: users.lastName,
      studentEmail: users.email,
      registerNo: studentProfiles.registerNo,
      department: studentProfiles.department,
      jobTitle: jobPostings.title,
      companyName: companyRegistrations.companyLegalName,
      status: jobApplications.status,
      appliedAt: jobApplications.appliedAt,
      updatedAt: jobApplications.updatedAt,
    })
    .from(jobApplications)
    .innerJoin(users, eq(jobApplications.studentId, users.id))
    .innerJoin(jobPostings, eq(jobApplications.jobId, jobPostings.id))
    .leftJoin(companyRegistrations, eq(jobPostings.companyId, companyRegistrations.id))
    .leftJoin(studentProfiles, eq(users.id, studentProfiles.userId))
    .where(eq(jobApplications.status, "shortlisted"))
    .orderBy(desc(jobApplications.updatedAt));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Trophy size={28} style={{ color: "var(--rathinam-green)" }} />
          <div>
            <h1>Shortlisted Students</h1>
            <p>Students who have been shortlisted by companies for interview rounds.</p>
          </div>
        </div>
      </div>

      {shortlisted.length === 0 ? (
        <div className="card" style={{ padding: "var(--space-8)", textAlign: "center" }}>
          <Trophy size={48} style={{ opacity: 0.2, margin: "0 auto var(--space-4)", display: "block" }} />
          <p style={{ color: "var(--text-secondary)" }}>No shortlisted students yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-4)" }}>
          {shortlisted.map((s) => (
            <div key={s.id} className="card" style={{ padding: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <div style={{ width: "44px", height: "44px", borderRadius: "50%", background: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <GraduationCap size={20} style={{ color: "var(--primary-color)" }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600 }}>{s.studentFirstName} {s.studentLastName}</p>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                    {s.registerNo || "N/A"} · {s.department || "N/A"}
                  </p>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <p style={{ margin: 0, fontWeight: 600, display: "flex", alignItems: "center", gap: "6px", justifyContent: "flex-end" }}>
                  <Briefcase size={14} /> {s.jobTitle}
                </p>
                <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "4px", justifyContent: "flex-end" }}>
                  <Building2 size={12} /> {s.companyName || "Internal Posting"}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
