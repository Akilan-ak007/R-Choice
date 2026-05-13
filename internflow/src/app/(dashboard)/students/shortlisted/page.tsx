import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobApplications, jobPostings, users, companyRegistrations, studentProfiles } from "@/lib/db/schema";
import { and, desc, inArray, eq } from "drizzle-orm";
import { buildStudentVisibilityCondition } from "@/lib/authority-scope";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Building2, Briefcase, GraduationCap, ExternalLink, UserRound } from "lucide-react";

export default async function ShortlistedPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const staffRoles = ["tutor", "placement_coordinator", "hod", "dean", "placement_officer", "coe", "placement_head", "management_corporation", "mcr", "principal"];
  if (!staffRoles.includes(session.user.role)) redirect("/dashboard/student");

  const hierarchyCondition = await buildStudentVisibilityCondition(session.user.id, session.user.role);
  const shortlistCondition = hierarchyCondition
    ? and(inArray(jobApplications.status, ["shortlisted", "round_scheduled", "selected"]), hierarchyCondition)
    : inArray(jobApplications.status, ["shortlisted", "round_scheduled", "selected"]);

  const shortlisted = await db
    .select({
      id: jobApplications.id,
      studentId: jobApplications.studentId,
      jobId: jobApplications.jobId,
      studentFirstName: users.firstName,
      studentLastName: users.lastName,
      studentEmail: users.email,
      registerNo: studentProfiles.registerNo,
      department: studentProfiles.department,
      jobTitle: jobPostings.title,
      companyId: companyRegistrations.id,
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
    .where(shortlistCondition)
    .orderBy(desc(jobApplications.updatedAt));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Trophy size={28} style={{ color: "var(--rathinam-green)" }} />
          <div>
            <h1>Shortlisted Students</h1>
          <p>Students shortlisted, scheduled for rounds, or selected by companies within your access scope.</p>
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
            <div key={s.id} className="card" style={{ padding: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: "var(--space-4)", flexWrap: "wrap" }}>
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
                <p style={{ margin: "6px 0 0", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                  {s.status === "round_scheduled" ? "Round Scheduled" : s.status === "selected" ? "Selected" : "Shortlisted"}
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginLeft: "auto" }}>
                <Link href={`/students/${s.studentId}`} className="btn btn-outline" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <UserRound size={14} /> View Student
                </Link>
                {s.companyId && (
                  <Link href={`/companies/${s.companyId}`} className="btn btn-outline" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <Building2 size={14} /> View Company
                  </Link>
                )}
                <Link href={`/jobs/${s.jobId}`} className="btn btn-outline" style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <ExternalLink size={14} /> View Internship
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
