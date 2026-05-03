import Link from "next/link";
import { and, asc, count, desc, eq, inArray, sql, type SQL } from "drizzle-orm";
import { BarChart3, Briefcase, Building2, Filter, GraduationCap, Layers3, Target, Users } from "lucide-react";

import { auth } from "@/lib/auth";
import { buildStudentVisibilityCondition } from "@/lib/authority-scope";
import { db } from "@/lib/db";
import {
  companyRegistrations,
  internshipRequests,
  jobApplications,
  jobPostings,
  studentProfiles,
  users,
} from "@/lib/db/schema";

type SearchParams = Promise<Record<string, string | undefined>>;

const analyticsRoles = [
  "tutor",
  "placement_coordinator",
  "hod",
  "dean",
  "placement_officer",
  "coe",
  "principal",
  "management_corporation",
  "mcr",
  "placement_head",
] as const;

const companyAnalyticsRoles = [
  "placement_officer",
  "principal",
  "management_corporation",
  "mcr",
  "placement_head",
  "coe",
] as const;

function normalizeFilter(value?: string) {
  return value && value !== "all" ? value : "";
}

function parseYearFilter(value?: string) {
  if (!value || value === "all") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildProfileFilterConditions(filters: {
  school?: string;
  department?: string;
  course?: string;
  programType?: string;
  year?: number | null;
}) {
  const conditions: SQL<unknown>[] = [];

  if (filters.school) conditions.push(eq(studentProfiles.school, filters.school));
  if (filters.department) conditions.push(eq(studentProfiles.department, filters.department));
  if (filters.course) conditions.push(eq(studentProfiles.course, filters.course));
  if (filters.programType) conditions.push(eq(studentProfiles.programType, filters.programType));
  if (filters.year) conditions.push(eq(studentProfiles.year, filters.year));

  return conditions;
}

function formatRole(role?: string | null) {
  if (!role) return "Unknown";
  return role.replace(/_/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function StatCard({ title, value, caption, icon, accent }: { title: string; value: string | number; caption: string; icon: React.ReactNode; accent: string }) {
  return (
    <div className="card" style={{ padding: "var(--space-5)", borderTop: `3px solid ${accent}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px" }}>
        <div>
          <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginBottom: "8px" }}>{title}</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, lineHeight: 1.1 }}>{value}</div>
          <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginTop: "8px" }}>{caption}</div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${accent}18`, color: accent, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default async function AnalyticsPage(props: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id || !analyticsRoles.includes(session.user.role as (typeof analyticsRoles)[number])) {
    return (
      <div className="card" style={{ padding: "var(--space-8)", textAlign: "center" }}>
        <h1 style={{ marginBottom: "12px" }}>Analytics unavailable</h1>
        <p style={{ color: "var(--text-secondary)" }}>You do not have permission to view analytics.</p>
      </div>
    );
  }

  const searchParams = await props.searchParams;
  const filters = {
    school: normalizeFilter(searchParams.school),
    department: normalizeFilter(searchParams.department),
    course: normalizeFilter(searchParams.course),
    programType: normalizeFilter(searchParams.programType),
    year: parseYearFilter(searchParams.year),
  };

  const role = session.user.role;
  const canViewCompanyAnalytics = companyAnalyticsRoles.includes(role as (typeof companyAnalyticsRoles)[number]);
  const scopeCondition = await buildStudentVisibilityCondition(session.user.id, role);
  const profileFilterConditions = buildProfileFilterConditions(filters);
  const scopedProfileConditions = scopeCondition ? [scopeCondition, ...profileFilterConditions] : profileFilterConditions;
  const scopedWhere = scopedProfileConditions.length > 0 ? and(...scopedProfileConditions) : sql`1=1`;

  const [filterOptionsRaw, studentKpisResult, statusDistributionRaw, departmentDistributionRaw, schoolDistributionRaw, yearDistributionRaw] = await Promise.all([
    db
      .selectDistinct({
        school: studentProfiles.school,
        department: studentProfiles.department,
        course: studentProfiles.course,
        programType: studentProfiles.programType,
        year: studentProfiles.year,
      })
      .from(studentProfiles)
      .where(scopedWhere),
    db
      .select({
        totalStudents: sql<number>`count(distinct ${users.id})`,
        appliedStudents: sql<number>`count(distinct case when ${internshipRequests.id} is not null then ${users.id} end)`,
        approvedOds: sql<number>`count(case when ${internshipRequests.status} = 'approved' then 1 end)`,
        activeRequests: sql<number>`count(case when ${internshipRequests.status} in ('pending_tutor', 'pending_coordinator', 'pending_hod', 'pending_dean', 'pending_po', 'pending_coe', 'pending_principal') then 1 end)`,
      })
      .from(users)
      .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .leftJoin(internshipRequests, eq(internshipRequests.studentId, users.id))
      .where(and(eq(users.role, "student"), scopedWhere)),
    db
      .select({
        status: internshipRequests.status,
        value: sql<number>`count(*)`,
      })
      .from(internshipRequests)
      .innerJoin(users, eq(users.id, internshipRequests.studentId))
      .innerJoin(studentProfiles, eq(studentProfiles.userId, users.id))
      .where(scopedWhere)
      .groupBy(internshipRequests.status)
      .orderBy(asc(internshipRequests.status)),
    db
      .select({
        label: studentProfiles.department,
        value: sql<number>`count(*)`,
      })
      .from(studentProfiles)
      .where(scopedWhere)
      .groupBy(studentProfiles.department)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({
        label: studentProfiles.school,
        value: sql<number>`count(*)`,
      })
      .from(studentProfiles)
      .where(scopedWhere)
      .groupBy(studentProfiles.school)
      .orderBy(desc(sql`count(*)`)),
    db
      .select({
        label: studentProfiles.year,
        value: sql<number>`count(*)`,
      })
      .from(studentProfiles)
      .where(scopedWhere)
      .groupBy(studentProfiles.year)
      .orderBy(asc(studentProfiles.year)),
  ]);

  const filterOptions = {
    schools: Array.from(new Set(filterOptionsRaw.map((row) => row.school).filter(Boolean))) as string[],
    departments: Array.from(new Set(filterOptionsRaw.map((row) => row.department).filter(Boolean))) as string[],
    courses: Array.from(new Set(filterOptionsRaw.map((row) => row.course).filter(Boolean))) as string[],
    programTypes: Array.from(new Set(filterOptionsRaw.map((row) => row.programType).filter(Boolean))) as string[],
    years: Array.from(new Set(filterOptionsRaw.map((row) => row.year).filter((value): value is number => Number.isFinite(value as number)))).sort((a, b) => a - b),
  };

  const studentKpis = studentKpisResult[0] || {
    totalStudents: 0,
    appliedStudents: 0,
    approvedOds: 0,
    activeRequests: 0,
  };

  const placementRate =
    Number(studentKpis.totalStudents) > 0
      ? Math.round((Number(studentKpis.appliedStudents) / Number(studentKpis.totalStudents)) * 100)
      : 0;

  let companyKpis: {
    totalCompanies: number;
    approvedCompanies: number;
    totalJobs: number;
    approvedJobs: number;
    totalApplicants: number;
    selectedApplicants: number;
  } | null = null;
  let companyLeaderboard: Array<{
    companyId: string | null;
    companyName: string;
    jobId: string;
    jobTitle: string;
    applicants: number;
    shortlisted: number;
    rounds: number;
    selected: number;
    status: string | null;
  }> = [];
  let authorityBreakdown: Array<{ label: string; value: number }> = [];

  if (canViewCompanyAnalytics) {
    const [companyKpisRaw, leaderboardRaw, authorityRaw] = await Promise.all([
      db
        .select({
          totalCompanies: sql<number>`count(distinct ${companyRegistrations.id})`,
          approvedCompanies: sql<number>`count(distinct case when ${companyRegistrations.status} = 'approved' then ${companyRegistrations.id} end)`,
          totalJobs: sql<number>`count(distinct ${jobPostings.id})`,
          approvedJobs: sql<number>`count(distinct case when ${jobPostings.status} = 'approved' then ${jobPostings.id} end)`,
          totalApplicants: sql<number>`count(${jobApplications.id})`,
          selectedApplicants: sql<number>`count(case when ${jobApplications.status} = 'selected' then 1 end)`,
        })
        .from(companyRegistrations)
        .leftJoin(jobPostings, eq(jobPostings.companyId, companyRegistrations.id))
        .leftJoin(jobApplications, eq(jobApplications.jobId, jobPostings.id)),
      db
        .select({
          companyId: companyRegistrations.id,
          companyName: companyRegistrations.companyLegalName,
          jobId: jobPostings.id,
          jobTitle: jobPostings.title,
          status: jobPostings.status,
          applicants: sql<number>`count(${jobApplications.id})`,
          shortlisted: sql<number>`count(case when ${jobApplications.status} = 'shortlisted' then 1 end)`,
          rounds: sql<number>`count(case when ${jobApplications.status} = 'round_scheduled' then 1 end)`,
          selected: sql<number>`count(case when ${jobApplications.status} = 'selected' then 1 end)`,
        })
        .from(jobPostings)
        .leftJoin(companyRegistrations, eq(companyRegistrations.id, jobPostings.companyId))
        .leftJoin(jobApplications, eq(jobApplications.jobId, jobPostings.id))
        .groupBy(jobPostings.id, companyRegistrations.id)
        .orderBy(asc(companyRegistrations.companyLegalName), asc(jobPostings.title)),
      db
        .select({
          label: internshipRequests.status,
          value: sql<number>`count(*)`,
        })
        .from(internshipRequests)
        .groupBy(internshipRequests.status)
        .orderBy(asc(internshipRequests.status)),
    ]);

    companyKpis = companyKpisRaw[0] || null;
    companyLeaderboard = leaderboardRaw.map((item) => ({
      ...item,
      companyName: item.companyName || "Company",
    }));
    authorityBreakdown = authorityRaw.map((item) => ({
      label: formatRole(item.label),
      value: Number(item.value),
    }));
  } else {
    authorityBreakdown = statusDistributionRaw.map((item) => ({
      label: formatRole(item.status),
      value: Number(item.value),
    }));
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Role-aware filters, student scope analytics, and company hiring intelligence.</p>
      </div>

      <div className="card" style={{ padding: "var(--space-5)", marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
          <Filter size={18} />
          <h2 style={{ margin: 0, fontSize: "1rem" }}>Filters</h2>
        </div>
        <form method="GET" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
          <select className="input-field" name="school" defaultValue={filters.school || "all"}>
            <option value="all">All Schools</option>
            {filterOptions.schools.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select className="input-field" name="department" defaultValue={filters.department || "all"}>
            <option value="all">All Departments</option>
            {filterOptions.departments.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select className="input-field" name="course" defaultValue={filters.course || "all"}>
            <option value="all">All Courses</option>
            {filterOptions.courses.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select className="input-field" name="programType" defaultValue={filters.programType || "all"}>
            <option value="all">UG + PG</option>
            {filterOptions.programTypes.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <select className="input-field" name="year" defaultValue={filters.year?.toString() || "all"}>
            <option value="all">All Years</option>
            {filterOptions.years.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
          <div style={{ display: "flex", gap: "8px" }}>
            <button type="submit" className="btn btn-primary">Apply</button>
            <Link href="/analytics" className="btn btn-outline" style={{ textDecoration: "none" }}>Reset</Link>
          </div>
        </form>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
        <StatCard title="Students in Scope" value={studentKpis.totalStudents} caption="Students visible within your current authority scope." icon={<GraduationCap size={22} />} accent="#2563eb" />
        <StatCard title="Applied Students" value={studentKpis.appliedStudents} caption="Students who have at least one internship or OD application." icon={<Users size={22} />} accent="#7c3aed" />
        <StatCard title="Approved ODs" value={studentKpis.approvedOds} caption="Approved internship OD requests in the selected slice." icon={<Target size={22} />} accent="#16a34a" />
        <StatCard title="Active OD Queue" value={studentKpis.activeRequests} caption="Pending requests still moving through the approval chain." icon={<Layers3 size={22} />} accent="#f59e0b" />
        <StatCard title="Placement Reach" value={`${placementRate}%`} caption="Applied students divided by visible students." icon={<BarChart3 size={22} />} accent="#ec4899" />
        {companyKpis && <StatCard title="Job Applicants" value={companyKpis.totalApplicants} caption="All company-side job applications across visible hiring activity." icon={<Briefcase size={22} />} accent="#0ea5e9" />}
      </div>

      <div className="grid grid-2" style={{ gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <div className="card" style={{ padding: "var(--space-5)" }}>
          <h2 style={{ marginBottom: "16px", fontSize: "1.05rem" }}>Student Distribution by Department</h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {departmentDistributionRaw.length === 0 ? (
              <p style={{ color: "var(--text-secondary)" }}>No department data in this filter scope.</p>
            ) : (
              departmentDistributionRaw.slice(0, 10).map((item) => (
                <div key={`${item.label}-${item.value}`} style={{ display: "flex", justifyContent: "space-between", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                  <span>{item.label || "Unassigned"}</span>
                  <strong>{Number(item.value)}</strong>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card" style={{ padding: "var(--space-5)" }}>
          <h2 style={{ marginBottom: "16px", fontSize: "1.05rem" }}>Scope Breakdown</h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {(schoolDistributionRaw.length > 0 ? schoolDistributionRaw : yearDistributionRaw).slice(0, 10).map((item) => (
              <div key={`${item.label}-${item.value}`} style={{ display: "flex", justifyContent: "space-between", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                <span>{item.label || "Not set"}</span>
                <strong>{Number(item.value)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: "var(--space-6)", marginBottom: "var(--space-6)" }}>
        <div className="card" style={{ padding: "var(--space-5)" }}>
          <h2 style={{ marginBottom: "16px", fontSize: "1.05rem" }}>Approval Pipeline Snapshot</h2>
          <div style={{ display: "grid", gap: "10px" }}>
            {authorityBreakdown.map((item) => (
              <div key={item.label} style={{ display: "flex", justifyContent: "space-between", gap: "12px", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px" }}>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {companyKpis ? (
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <h2 style={{ marginBottom: "16px", fontSize: "1.05rem" }}>Company & Job Analytics</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: "12px" }}>
              <MiniMetric label="Companies" value={companyKpis.totalCompanies} />
              <MiniMetric label="Approved Companies" value={companyKpis.approvedCompanies} />
              <MiniMetric label="Jobs" value={companyKpis.totalJobs} />
              <MiniMetric label="Approved Jobs" value={companyKpis.approvedJobs} />
              <MiniMetric label="Applicants" value={companyKpis.totalApplicants} />
              <MiniMetric label="Selected" value={companyKpis.selectedApplicants} />
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: "var(--space-5)" }}>
            <h2 style={{ marginBottom: "12px", fontSize: "1.05rem" }}>Company-side Analytics</h2>
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
              Full company and job applicant analytics are reserved for Placement Officer, Principal, COE, and MCR-level governance roles.
            </p>
          </div>
        )}
      </div>

      {companyKpis && (
        <div className="card" style={{ padding: "var(--space-5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: "1.05rem" }}>Company Hiring Leaderboard</h2>
              <p style={{ margin: "6px 0 0", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Job-wise applicant volume and selection outcomes, ordered A-Z by company and job.
              </p>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th>Job</th>
                  <th>Status</th>
                  <th>Applicants</th>
                  <th>Shortlisted</th>
                  <th>Rounds</th>
                  <th>Selected</th>
                </tr>
              </thead>
              <tbody>
                {companyLeaderboard.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "24px", color: "var(--text-secondary)" }}>
                      No company job analytics available yet.
                    </td>
                  </tr>
                ) : (
                  companyLeaderboard.map((item) => (
                    <tr key={item.jobId}>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.companyName || "Company"}</div>
                        {item.companyId && (
                          <Link href={`/companies/${item.companyId}`} style={{ fontSize: "0.8rem", textDecoration: "none" }}>
                            View Details
                          </Link>
                        )}
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{item.jobTitle}</div>
                        <Link href={`/jobs/${item.jobId}`} style={{ fontSize: "0.8rem", textDecoration: "none" }}>
                          View Details
                        </Link>
                      </td>
                      <td>{formatRole(item.status)}</td>
                      <td>{Number(item.applicants)}</td>
                      <td>{Number(item.shortlisted)}</td>
                      <td>{Number(item.rounds)}</td>
                      <td>{Number(item.selected)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ padding: "14px", borderRadius: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
      <div style={{ fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: "6px" }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: "1.2rem" }}>{value}</div>
    </div>
  );
}
