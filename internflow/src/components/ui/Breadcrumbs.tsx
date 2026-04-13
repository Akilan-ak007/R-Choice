"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";

const ROUTE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  student: "Student",
  staff: "Staff",
  admin: "Admin",
  company: "Company",
  profile: "Profile",
  links: "My Links",
  resume: "Resume",
  jobs: "Jobs",
  create: "Create",
  manage: "Manage",
  applications: "Applications",
  new: "New Application",
  approvals: "Approvals",
  reports: "Reports",
  drives: "Placement Drives",
  students: "Students",
  applied: "Applied",
  users: "Users",
  companies: "Companies",
  settings: "Settings",
  analytics: "Analytics",
  applicants: "Applicants",
};

export function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length <= 1) return null;

  return (
    <nav aria-label="Breadcrumb" style={{
      display: "flex",
      alignItems: "center",
      gap: "6px",
      fontSize: "0.8125rem",
      color: "var(--text-muted)",
      marginBottom: "var(--space-4)",
      fontFamily: "var(--font-body)",
    }}>
      <Link href="/dashboard/student" style={{
        display: "flex",
        alignItems: "center",
        color: "var(--text-muted)",
        textDecoration: "none",
        transition: "color var(--transition-fast)",
      }}>
        <Home size={14} />
      </Link>

      {segments.map((segment, index) => {
        const href = "/" + segments.slice(0, index + 1).join("/");
        const isLast = index === segments.length - 1;
        const label = ROUTE_LABELS[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <span key={href} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <ChevronRight size={12} style={{ opacity: 0.4 }} />
            {isLast ? (
              <span style={{
                color: "var(--color-primary)",
                fontWeight: 600,
              }}>
                {label}
              </span>
            ) : (
              <Link href={href} style={{
                color: "var(--text-muted)",
                textDecoration: "none",
                transition: "color var(--transition-fast)",
              }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-primary)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
              >
                {label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
