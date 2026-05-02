"use client";

import { usePathname } from "next/navigation";
import { signOut as clientSignOut } from "next-auth/react";
import { useEffect } from "react";
import { initPushNotifications } from "@/lib/pushNotifications";

import Link from "next/link";
import { Breadcrumbs } from "@/components/ui/Breadcrumbs";
import NotificationsDropdown from "./NotificationsDropdown";
import { LogOut } from "lucide-react";
import styles from "../../app/(dashboard)/layout.module.css";

import { getNavSections, getMobileNavItems } from "@/config/navigation";

async function handleLogout(buttonId: string) {
  const btn = document.getElementById(buttonId);
  if (btn) {
    btn.innerHTML = '<span class="spinner" style="width: 14px; height: 14px; border-width: 2px;"></span>';
  }

  await clientSignOut({ redirect: false });
  window.location.assign("/");
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

  useEffect(() => {
    initPushNotifications();
  }, []);

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
                const allHrefs = navSections.flatMap(s => s.items.map(i => i.href));
                const hasMoreSpecificMatch = allHrefs.some(h => h !== item.href && h.startsWith(item.href + "/") && (pathname === h || pathname.startsWith(h + "/")));
                const isActive = hasMoreSpecificMatch ? false : (pathname === item.href || pathname.startsWith(item.href + "/"));
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
          <div
            className={styles.userAvatar}
            style={{
              overflow: "hidden",
              backgroundImage: userAvatar ? `url(${userAvatar})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
            aria-label={userName}
            title={userEmail}
          >
            {!userAvatar ? initials : null}
          </div>
          <div className={styles.userInfo}>
            <p className={styles.userName}>{userName}</p>
            <p className={styles.userRole} title={userEmail}>{roleLabel}</p>
          </div>
          <button
            type="button"
            onClick={() => handleLogout("logout-btn")}
            id="logout-btn"
            className={styles.logoutButton}
            aria-label="Sign out"
            title="Sign out"
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
              <div
                className={styles.userAvatar}
                style={{
                  width: 32,
                  height: 32,
                  fontSize: "0.75rem",
                  cursor: "pointer",
                  overflow: "hidden",
                  backgroundImage: userAvatar ? `url(${userAvatar})` : undefined,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                }}
                title={userEmail}
                aria-label={userName}
              >
                {!userAvatar ? initials : null}
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
          <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
            <NotificationsDropdown />
            <button
              type="button"
              onClick={() => handleLogout("mobile-logout-btn")}
              id="mobile-logout-btn"
              aria-label="Sign out"
              title="Sign out"
              style={{ background: "transparent", border: "none", color: "var(--color-text)", cursor: "pointer", display: "flex", padding: "0.25rem" }}
            >
              <LogOut size={22} />
            </button>
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
