"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import NotificationsDropdown from "./NotificationsDropdown";
import {
  LayoutDashboard,
  User,
  FileText,
  Briefcase,
  ClipboardCheck,
  BarChart3,
  Users,
  Building2,
  Bell,
  LogOut,
  Settings,
  GraduationCap,
  Link2,
  FileDown,
  CalendarDays,
} from "lucide-react";
import styles from "../../app/(dashboard)/layout.module.css";

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: number;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

function getNavSections(role: string): NavSection[] {
  const common: NavItem[] = [];

  switch (role) {
    case "student":
      return [
        {
          label: "Main",
          items: [
            { label: "Dashboard", href: "/dashboard/student", icon: <LayoutDashboard size={20} /> },
            { label: "My Profile", href: "/profile", icon: <User size={20} /> },
            { label: "My Links", href: "/profile/links", icon: <Link2 size={20} /> },
            { label: "Resume", href: "/profile/resume", icon: <FileDown size={20} /> },
          ],
        },
        {
          label: "Internships",
          items: [
            { label: "Browse Jobs", href: "/jobs", icon: <Briefcase size={20} /> },
            { label: "My Applications", href: "/applications", icon: <FileText size={20} /> },
            { label: "Work Reports", href: "/reports", icon: <ClipboardCheck size={20} /> },
          ],
        },
      ];

    case "tutor":
    case "placement_coordinator":
      return [
        {
          label: "Main",
          items: [
            { label: "Dashboard", href: "/dashboard/staff", icon: <LayoutDashboard size={20} /> },
            { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={20} />, badge: 5 },
          ],
        },
        {
          label: "Students",
          items: [
            { label: "My Students", href: "/students", icon: <GraduationCap size={20} /> },
            { label: "Applied Students", href: "/students/applied", icon: <Users size={20} /> },
          ],
        },
        {
          label: "Opportunities",
          items: [
            { label: "Current Openings", href: "/jobs", icon: <Briefcase size={20} /> },
            { label: "Post a Job", href: "/jobs/create", icon: <FileText size={20} /> },
          ],
        },
      ];

    case "hod":
      return [
        {
          label: "Main",
          items: [
            { label: "Dashboard", href: "/dashboard/staff", icon: <LayoutDashboard size={20} /> },
            { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={20} />, badge: 3 },
          ],
        },
        {
          label: "Department",
          items: [
            { label: "Students", href: "/students", icon: <GraduationCap size={20} /> },
            { label: "All Tutors", href: "/users?role=tutor", icon: <Users size={20} /> },
          ],
        },
        {
          label: "Opportunities",
          items: [
            { label: "Current Openings", href: "/jobs", icon: <Briefcase size={20} /> },
            { label: "Post a Job", href: "/jobs/create", icon: <FileText size={20} /> },
          ],
        },
      ];

    case "principal":
      return [
        {
          label: "Main",
          items: [
            { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard size={20} /> },
            { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={20} />, badge: 8 },
            { label: "Analytics", href: "/analytics", icon: <BarChart3 size={20} /> },
          ],
        },
        {
          label: "Manage",
          items: [
            { label: "All Students", href: "/students", icon: <GraduationCap size={20} /> },
            { label: "User Accounts", href: "/users", icon: <Users size={20} /> },
            { label: "Companies", href: "/companies", icon: <Building2 size={20} /> },
          ],
        },
        {
          label: "My Profile",
          items: [
            { label: "View Profile", href: "/profile", icon: <User size={20} /> },
            { label: "Update Profile", href: "/settings", icon: <Settings size={20} /> },
          ]
        },
      ];

    case "dean":
    case "placement_officer":
      return [
        {
          label: "Main",
          items: [
            { label: "Dashboard", href: "/dashboard/admin", icon: <LayoutDashboard size={20} /> },
            { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={20} /> },
            { label: "Job Approvals", href: "/approvals/jobs", icon: <ClipboardCheck size={20} /> },
            { label: "Analytics", href: "/analytics", icon: <BarChart3 size={20} /> },
          ],
        },
        {
          label: "Manage",
          items: [
            { label: "All Students", href: "/students", icon: <GraduationCap size={20} /> },
            { label: "User Accounts", href: "/users", icon: <Users size={20} /> },
            { label: "Companies", href: "/companies", icon: <Building2 size={20} /> },
          ],
        },
        {
          label: "Opportunities",
          items: [
            { label: "Job Postings", href: "/jobs", icon: <Briefcase size={20} /> },
          ],
        },
      ];

    case "company":
      return [
        {
          label: "Main",
          items: [
            { label: "Dashboard", href: "/dashboard/company", icon: <LayoutDashboard size={20} /> },
            { label: "My Jobs", href: "/jobs/manage", icon: <Briefcase size={20} /> },
            { label: "Applicants", href: "/applicants", icon: <Users size={20} /> },
          ],
        },
      ];


    default:
      return [];
  }
}

function getMobileNavItems(role: string): NavItem[] {
  switch (role) {
    case "student":
      return [
        { label: "Home", href: "/dashboard/student", icon: <LayoutDashboard size={22} /> },
        { label: "Jobs", href: "/jobs", icon: <Briefcase size={22} /> },
        { label: "Profile", href: "/profile", icon: <User size={22} /> },
        { label: "Apps", href: "/applications", icon: <FileText size={22} /> },
        { label: "More", href: "/settings", icon: <Settings size={22} /> },
      ];
    case "tutor":
    case "placement_coordinator":
    case "hod":
      return [
        { label: "Home", href: "/dashboard/staff", icon: <LayoutDashboard size={22} /> },
        { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={22} /> },
        { label: "Students", href: "/students", icon: <GraduationCap size={22} /> },
        { label: "Jobs", href: "/jobs", icon: <Briefcase size={22} /> },
        { label: "More", href: "/settings", icon: <Settings size={22} /> },
      ];
    case "dean":
    case "placement_officer":
    case "principal":
      return [
        { label: "Home", href: "/dashboard/admin", icon: <LayoutDashboard size={22} /> },
        { label: "Approvals", href: "/approvals", icon: <ClipboardCheck size={22} /> },
        { label: "Analytics", href: "/analytics", icon: <BarChart3 size={22} /> },
        { label: "Manage", href: "/users", icon: <Users size={22} /> },
        { label: "More", href: "/settings", icon: <Settings size={22} /> },
      ];
    default:
      return [
        { label: "Home", href: "/dashboard/student", icon: <LayoutDashboard size={22} /> },
      ];
  }
}

export function DashboardShell({
  children,
  userName,
  userRole,
  userEmail,
  userAvatar,
}: {
  children: React.ReactNode;
  userName: string;
  userRole: string;
  userEmail: string;
  userAvatar?: string | null;
}) {
  const pathname = usePathname();
  const navSections = getNavSections(userRole);
  const mobileNav = getMobileNavItems(userRole);
  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const roleLabel = userRole.replace(/_/g, " ");

  return (
    <div className={styles.dashboardLayout}>
      {/* ── Desktop Sidebar ── */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div className={styles.sidebarLogo}>R</div>
          <div className={styles.sidebarBrand} style={{ color: "var(--color-secondary)" }}>
            R-<span>Choice</span>
          </div>
        </div>

        <nav className={styles.sidebarNav}>
          {navSections.map((section) => (
            <div key={section.label} className={styles.navSection}>
              <p className={styles.navSectionLabel}>{section.label}</p>
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
                  >
                    {item.icon}
                    {item.label}
                    {item.badge ? (
                      <span className={styles.navBadge}>{item.badge}</span>
                    ) : null}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.sidebarFooter}>
          <div className={styles.userAvatar}>{initials}</div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{userName}</p>
            <p className={styles.userRole}>{roleLabel}</p>
          </div>
          <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/" })}
              className={styles.navItem}
              style={{ padding: "8px", cursor: "pointer", border: "none", background: "none" }}
              aria-label="Sign out"
            >
              <LogOut size={18} />
            </button>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className={styles.mainContent}>
        {/* Desktop Top Bar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <h1 className={styles.topBarTitle}>
              {navSections
                .flatMap((s) => s.items)
                .find((i) => pathname === i.href || pathname.startsWith(i.href + "/"))
                ?.label || "Dashboard"}
            </h1>
          </div>
          <div className={styles.topBarRight}>
            <NotificationsDropdown />
            <Link href="/profile" style={{ textDecoration: "none" }}>
              <div className={styles.userAvatar} style={{ width: 32, height: 32, fontSize: "0.75rem", cursor: "pointer" }}>
                {initials}
              </div>
            </Link>
          </div>
        </header>

        {/* Mobile Header */}
        <header className={styles.mobileHeader}>
          <div className={styles.mobileHeaderLogo}>
            <div className={styles.mobileHeaderLogoIcon}>R</div>
            <span className={styles.mobileHeaderBrand} style={{ color: "var(--color-secondary)" }}>
              R-<span>Choice</span>
            </span>
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <NotificationsDropdown />
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.pageContent}>
          <Breadcrumbs />
          {children}
        </div>
      </main>

      {/* ── Mobile Bottom Nav ── */}
      <nav className={styles.mobileBottomNav}>
        <div className={styles.mobileNavInner}>
          {mobileNav.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.mobileNavItem} ${
                  isActive ? styles.mobileNavItemActive : ""
                }`}
              >
                {item.icon}
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
