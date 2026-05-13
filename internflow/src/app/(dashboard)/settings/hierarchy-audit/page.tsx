import Link from "next/link";
import { redirect } from "next/navigation";

import { AlertTriangle, GitBranch, ShieldAlert, UserRoundSearch } from "lucide-react";
import { eq, or } from "drizzle-orm";

import { getCollegeHierarchy } from "@/app/actions/hierarchy";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { authorityMappings, studentProfiles, users } from "@/lib/db/schema";
import { DuplicateMappingAuditCard } from "./DuplicateMappingAuditCard";
import { BulkMergeSafeDuplicatesButton } from "./BulkMergeSafeDuplicatesButton";

type StudentAudit = {
  userId: string;
  name: string;
  email: string;
  issues: string[];
  recommendation: string;
  repairHref: string;
};

type StaffAudit = {
  userId: string;
  name: string;
  email: string;
  role: string;
  issues: string[];
  recommendation: string;
  repairHref: string;
};

type MappingAudit = {
  label: string;
  issue: string;
  issues: string[];
  recommendation?: string;
  keeperId?: string;
  duplicateIds?: string[];
  canMerge?: boolean;
  rows?: Array<{
    id: string;
    updatedAt: string;
    tutorId?: string | null;
    placementCoordinatorId?: string | null;
    hodId?: string | null;
    deanId?: string | null;
  }>;
};

function roleLabel(role: string) {
  return role.replaceAll("_", " ");
}

export default async function HierarchyAuditPage() {
  const session = await auth();
  const role = session?.user?.role || "";

  if (!session?.user || !["dean", "hod", "placement_officer", "principal", "mcr", "management_corporation"].includes(role)) {
    redirect("/");
  }

  const collegeHierarchy = await getCollegeHierarchy();
  const allStudents = await db
    .select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      registerNo: studentProfiles.registerNo,
      school: studentProfiles.school,
      section: studentProfiles.section,
      course: studentProfiles.course,
      programType: studentProfiles.programType,
      department: studentProfiles.department,
      year: studentProfiles.year,
    })
    .from(users)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(eq(users.role, "student"));

  const allStaff = await db
    .select({
      userId: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      email: users.email,
      role: users.role,
    })
    .from(users)
    .where(
      or(
        eq(users.role, "tutor"),
        eq(users.role, "placement_coordinator"),
        eq(users.role, "hod"),
        eq(users.role, "dean")
      )
    );

  const mappings = await db.select().from(authorityMappings);

  const studentAudits: StudentAudit[] = allStudents
    .map((student) => {
      const issues: string[] = [];

      if (!student.registerNo) issues.push("Missing register number");
      if (!student.school) issues.push("Missing school");
      if (!student.section) issues.push("Missing section");
      if (!student.course) issues.push("Missing course");
      if (!student.department) issues.push("Missing department");
      if (!student.year) issues.push("Missing year");

      const schoolNode = collegeHierarchy.find((node) => node.school === student.school);
      if (student.school && !schoolNode) {
        issues.push("School is not part of the configured college hierarchy");
      }

      const sectionNode = schoolNode?.sections.find((node) => node.section === student.section);
      if (student.section && schoolNode && !sectionNode) {
        issues.push("Section does not exist under the selected school");
      }

      const courseNode = sectionNode?.courses.find(
        (node) => node.course === student.course && (student.programType ? node.programType === student.programType : true)
      );
      if (student.course && sectionNode && !courseNode) {
        issues.push("Course/program does not match the selected school and section");
      }

      const deptMatch = courseNode?.departments.some((node) => node.name === student.department);
      if (student.department && courseNode && !deptMatch) {
        issues.push("Department does not belong to the selected course/program");
      }

      return {
        userId: student.userId,
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        issues,
        recommendation: "Open the student profile and repair school, class, section, department, and year so the correct manager scope can pick up this record.",
        repairHref: `/students/${student.userId}`,
      };
    })
    .filter((student) => student.issues.length > 0);

  const staffAudits: StaffAudit[] = allStaff
    .map((staff) => {
      const issues: string[] = [];
      const relatedMappings = mappings.filter((mapping) => {
        if (staff.role === "tutor") return mapping.tutorId === staff.userId;
        if (staff.role === "placement_coordinator") return mapping.placementCoordinatorId === staff.userId;
        if (staff.role === "hod") return mapping.hodId === staff.userId;
        return mapping.deanId === staff.userId;
      });

      if (relatedMappings.length === 0) {
        issues.push("No authority mapping assigned");
      }

      for (const mapping of relatedMappings) {
        const schoolNode = collegeHierarchy.find((node) => node.school === mapping.school);
        if (!mapping.school || !schoolNode) {
          issues.push(`Mapping ${mapping.id.slice(0, 8)} has an invalid school`);
          continue;
        }

        if (staff.role === "dean") {
          continue;
        }

        const sectionNode = schoolNode.sections.find((node) => node.section === mapping.section);
        if (!mapping.section || !sectionNode) {
          issues.push(`Mapping ${mapping.id.slice(0, 8)} has an invalid section`);
          continue;
        }

        const courseNode = sectionNode.courses.find(
          (node) => node.course === mapping.course && (mapping.programType ? node.programType === mapping.programType : true)
        );
        if (!mapping.course || !courseNode) {
          issues.push(`Mapping ${mapping.id.slice(0, 8)} has an invalid course/program`);
          continue;
        }

        const deptMatch = courseNode.departments.some((node) => node.name === mapping.department);
        if (!mapping.department || !deptMatch) {
          issues.push(`Mapping ${mapping.id.slice(0, 8)} has an invalid department`);
        }

        if (staff.role === "tutor" && (!mapping.year || mapping.year < 1)) {
          issues.push(`Mapping ${mapping.id.slice(0, 8)} is missing a valid tutor year`);
        }
      }

      return {
        userId: staff.userId,
        name: `${staff.firstName} ${staff.lastName}`,
        email: staff.email,
        role: staff.role,
        issues: Array.from(new Set(issues)),
        recommendation: "Open User Management and fix the staff scope mapping so their school and department visibility matches the intended academic hierarchy.",
        repairHref: `/users?role=${encodeURIComponent(staff.role)}&q=${encodeURIComponent(staff.email)}`,
      };
    })
    .filter((staff) => staff.issues.length > 0);

  const duplicateScopeMap = new Map<string, string[]>();
  for (const mapping of mappings) {
    const key = [
      mapping.school || "",
      mapping.section || "",
      mapping.course || "",
      mapping.programType || "",
      mapping.department || "",
      mapping.year || 0,
    ].join("|");
    duplicateScopeMap.set(key, [...(duplicateScopeMap.get(key) || []), mapping.id]);
  }

  const mappingAudits: MappingAudit[] = [];
  let safeDuplicateGroupCount = 0;
  for (const [key, mappingIds] of duplicateScopeMap.entries()) {
    if (mappingIds.length > 1) {
      const duplicateRows = mappings.filter((mapping) => mappingIds.includes(mapping.id));
      const sortedRows = [...duplicateRows].sort((a, b) => {
        const scoreA = [a.tutorId, a.placementCoordinatorId, a.hodId, a.deanId].filter(Boolean).length;
        const scoreB = [b.tutorId, b.placementCoordinatorId, b.hodId, b.deanId].filter(Boolean).length;
        if (scoreA !== scoreB) return scoreB - scoreA;
        return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime();
      });
      const keeper = sortedRows[0];
      const roleColumns = ["tutorId", "placementCoordinatorId", "hodId", "deanId"] as const;
      const canMerge = roleColumns.every((column) => {
        const distinctValues = Array.from(new Set(sortedRows.map((row) => row[column]).filter(Boolean)));
        return distinctValues.length <= 1;
      });
      if (canMerge) {
        safeDuplicateGroupCount += 1;
      }

      mappingAudits.push({
        label: key.replaceAll("|", " / "),
        issue: "Duplicate hierarchy scope rows",
        issues: [
          `Found ${mappingIds.length} rows for the same scope.`,
          `Recommended keeper row: ${keeper.id.slice(0, 8)}`,
        ],
        recommendation: canMerge
          ? "Use the merge action to keep the strongest row and remove the safe duplicates."
          : "Review these rows manually in hierarchy settings because role assignments conflict.",
        keeperId: keeper.id,
        duplicateIds: sortedRows.slice(1).map((row) => row.id),
        canMerge,
        rows: sortedRows.map((row) => ({
          id: row.id,
          updatedAt: row.updatedAt ? new Date(row.updatedAt).toLocaleString("en-IN") : "Unknown",
          tutorId: row.tutorId,
          placementCoordinatorId: row.placementCoordinatorId,
          hodId: row.hodId,
          deanId: row.deanId,
        })),
      });
    }
  }

  const roleAssignments = new Map<string, string[]>();
  for (const mapping of mappings) {
    for (const [label, userId] of [
      ["Tutor", mapping.tutorId],
      ["PC", mapping.placementCoordinatorId],
      ["HOD", mapping.hodId],
      ["Dean", mapping.deanId],
    ] as const) {
      if (!userId) continue;
      const scopes = roleAssignments.get(`${label}:${userId}`) || [];
      scopes.push(`${mapping.school || "?"} / ${mapping.section || "?"} / ${mapping.course || "?"} / ${mapping.department || "?"} / ${mapping.year || 0}`);
      roleAssignments.set(`${label}:${userId}`, scopes);
    }
  }

  for (const [key, scopes] of roleAssignments.entries()) {
    const distinctScopes = Array.from(new Set(scopes));
      if (distinctScopes.length > 1) {
        mappingAudits.push({
          label: key,
          issue: "Same staff member is assigned to multiple distinct scopes",
          issues: distinctScopes,
          recommendation: "Review the staff member in hierarchy settings and keep only the scope rows that match their real assignment.",
        });
      }
    }

  return (
    <div className="dashboard-shell animate-fade-in">
      <section className="hero-panel">
        <div className="page-header" style={{ marginBottom: 0 }}>
          <span className="hero-badge" style={{ marginBottom: "var(--space-3)" }}>Repair Center</span>
          <h1>Hierarchy Audit</h1>
          <p>Review broken student records, missing staff scope, duplicate mappings, and the next recommended fix for each problem.</p>
        </div>
      </section>

      <div className="page-header" style={{ marginBottom: 0 }}>
        <h1>Hierarchy Audit</h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        <AuditCount icon={<UserRoundSearch size={18} />} label="Invalid Students" value={studentAudits.length} color="var(--color-warning)" />
        <AuditCount icon={<ShieldAlert size={18} />} label="Staff Scope Issues" value={staffAudits.length} color="#dc2626" />
        <AuditCount icon={<GitBranch size={18} />} label="Mapping Conflicts" value={mappingAudits.length} color="var(--color-info)" />
      </div>

      <div style={{ display: "grid", gap: "var(--space-5)" }}>
        <AuditSection
          title="Students With Invalid School/Department/Class Data"
          icon={<AlertTriangle size={18} color="var(--color-warning)" />}
          emptyMessage="No invalid student hierarchy records were found."
        >
          {studentAudits.map((student) => (
            <AuditCard
              key={student.userId}
              title={student.name}
              subtitle={student.email}
              issues={student.issues}
              recommendation={student.recommendation}
              href={student.repairHref}
              linkLabel="Fix now"
            />
          ))}
        </AuditSection>

        <AuditSection
          title="Staff With Missing Or Broken Authority Mappings"
          icon={<ShieldAlert size={18} color="#dc2626" />}
          emptyMessage="No staff mapping problems were found."
        >
          {staffAudits.map((staff) => (
            <AuditCard
              key={staff.userId}
              title={`${staff.name} (${roleLabel(staff.role)})`}
              subtitle={staff.email}
              issues={staff.issues}
              recommendation={staff.recommendation}
              href={staff.repairHref}
              linkLabel="Fix now"
            />
          ))}
        </AuditSection>

        <AuditSection
          title="Duplicate Or Conflicting Authority Mappings"
          icon={<GitBranch size={18} color="var(--color-info)" />}
          emptyMessage="No duplicate or conflicting mappings were found."
          actions={
            <BulkMergeSafeDuplicatesButton disabled={safeDuplicateGroupCount === 0} />
          }
        >
          {mappingAudits.map((mapping, index) => (
            mapping.keeperId && mapping.duplicateIds && mapping.rows ? (
              <DuplicateMappingAuditCard
                key={`${mapping.label}-${index}`}
                title={mapping.issue}
                subtitle={mapping.label}
                issues={mapping.issues}
                recommendation={mapping.recommendation}
                keeperId={mapping.keeperId}
                duplicateIds={mapping.duplicateIds}
                rows={mapping.rows}
                canMerge={!!mapping.canMerge}
              />
            ) : (
              <AuditCard
                key={`${mapping.label}-${index}`}
                title={mapping.issue}
                subtitle={mapping.label}
                issues={mapping.issues}
                recommendation={mapping.recommendation}
                href="/settings/hierarchy"
                linkLabel="Fix now"
              />
            )
          ))}
        </AuditSection>
      </div>
    </div>
  );
}

function AuditCount({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px" }}>
      <div>
        <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>{label}</div>
        <div style={{ fontSize: "1.8rem", fontWeight: 700, color }}>{value}</div>
      </div>
      <div style={{ width: 42, height: 42, borderRadius: "12px", background: "var(--bg-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icon}
      </div>
    </div>
  );
}

function AuditSection({
  title,
  icon,
  emptyMessage,
  actions,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  emptyMessage: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const items = Array.isArray(children) ? children.filter(Boolean) : children ? [children] : [];
  return (
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {icon}
          <h2 style={{ margin: 0, fontSize: "1.05rem" }}>{title}</h2>
        </div>
        {actions}
      </div>
      {items.length === 0 ? (
        <p style={{ margin: 0, color: "var(--text-secondary)" }}>{emptyMessage}</p>
      ) : (
        <div style={{ display: "grid", gap: "var(--space-3)" }}>{items}</div>
      )}
    </div>
  );
}

function AuditCard({
  title,
  subtitle,
  issues,
  recommendation,
  href,
  linkLabel,
}: {
  title: string;
  subtitle: string;
  issues: string[];
  recommendation?: string;
  href: string;
  linkLabel: string;
}) {
  const severity = issues.length >= 3 ? "high" : issues.length === 2 ? "medium" : "low";
  return (
    <div style={{ border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "var(--space-4)", background: "var(--bg-secondary)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", marginBottom: "var(--space-2)", flexWrap: "wrap" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
            <div style={{ fontWeight: 600 }}>{title}</div>
            <span className={`severity-badge severity-${severity}`}>
              {severity === "high" ? "High severity" : severity === "medium" ? "Needs review" : "Minor issue"}
            </span>
          </div>
          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{subtitle}</div>
        </div>
        <Link href={href} className="btn btn-outline" style={{ textDecoration: "none" }}>
          {linkLabel}
        </Link>
      </div>
      {recommendation && (
        <div className="recommendation-panel" style={{ marginBottom: "var(--space-3)" }}>
          <div style={{ fontWeight: 700, marginBottom: "4px" }}>Recommended fix</div>
          <div style={{ fontSize: "0.84rem", color: "var(--text-secondary)" }}>{recommendation}</div>
        </div>
      )}
      <div style={{ display: "grid", gap: "6px" }}>
        {issues.map((issue, index) => (
          <div key={index} style={{ fontSize: "0.875rem", color: "var(--text-primary)" }}>
            - {issue}
          </div>
        ))}
      </div>
    </div>
  );
}
