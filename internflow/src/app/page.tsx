"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  GraduationCap,
  BookOpen,
  ClipboardList,
  Building2,
  Star,
  BarChart3,
  Crown,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  LogIn,
  Loader2,
  CheckCircle2,
  FileCheck2,
  Shield,
  Zap,
  ChevronDown,
} from "lucide-react";
import styles from "./login.module.css";

type Role = {
  id: string;
  label: string;
  icon: React.ReactNode;
  desc: string;
  category: "student" | "staff" | "admin" | "external";
};

const ROLES: Role[] = [
  { id: "student", label: "Student", icon: <GraduationCap size={20} />, desc: "Apply & track", category: "student" },
  { id: "tutor", label: "Tutor", icon: <BookOpen size={20} />, desc: "Tier 1 approver", category: "staff" },
  { id: "placement_coordinator", label: "Placement Coordinator", icon: <ClipboardList size={20} />, desc: "Tier 2 approver", category: "staff" },
  { id: "hod", label: "HOD", icon: <Building2 size={20} />, desc: "Tier 3 approver", category: "staff" },
  { id: "dean", label: "Dean", icon: <Star size={20} />, desc: "Full admin", category: "admin" },
  { id: "placement_officer", label: "Placement Officer", icon: <BarChart3 size={20} />, desc: "Full admin", category: "admin" },
  { id: "principal", label: "Principal", icon: <Crown size={20} />, desc: "Full admin", category: "admin" },
  { id: "company", label: "Company", icon: <Briefcase size={20} />, desc: "Post jobs", category: "external" },
];

// Removed FEATURES and STATS arrays to eliminate marketing aspect

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string>("tutor");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Carousel Animation States
  const [mounted, setMounted] = useState(false);

  // Filtered staff roles for carousel
  const carouselRoles = useMemo(() => ROLES.filter(r => r.id !== 'student' && r.id !== 'company'), []);

  // Hydration fix & Entry Animation
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleRoleSelect = (roleId: string) => {
    if (roleId !== selectedRole) {
      setEmail("");
      setPassword("");
      setError("");
    }
    setSelectedRole(roleId);
  };

  const router = useRouter();

  function getRedirectUrl(role: string): string {
    switch (role) {
      case "student":
        return "/dashboard/student";
      case "tutor":
      case "placement_coordinator":
      case "hod":
        return "/dashboard/staff";
      case "dean":
      case "placement_officer":
      case "principal":
        return "/dashboard/admin";
      case "company":
        return "/dashboard/company";
      default:
        return "/";
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !selectedRole) {
      setError("Please enter your email and password");
      return;
    }
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email,
        password,
        role: selectedRole,
      });

      if (result?.error) {
        setError("Invalid email or password for this role.");
        setIsLoading(false);
      } else if (result?.ok) {
        router.push(getRedirectUrl(selectedRole));
      }
    } catch (e: any) {
      setError("An unexpected error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const selectedRoleInfo = ROLES.find((r) => r.id === selectedRole);

  const scrollToLogin = () => {
    document.getElementById("login-section")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={styles.page}>
      {/* ── Abstract Background Elements ── */}
      <div className={styles.bgAbstracts} aria-hidden="true">
        <div className={styles.abstractCircle1} />
        <div className={styles.abstractCircle2} />
        <div className={styles.abstractCircle3} />
        <div className={styles.abstractBlob1} />
        <div className={styles.abstractBlob2} />
        {/* Floating grid dots */}
        <svg className={styles.gridDots} width="400" height="400" viewBox="0 0 400 400">
          {Array.from({ length: 100 }).map((_, i) => (
            <circle
              key={i}
              cx={(i % 10) * 40 + 20}
              cy={Math.floor(i / 10) * 40 + 20}
              r="1.5"
              fill="currentColor"
              opacity={0.15 + ((i * 7 + 3) % 15) / 100}
            />
          ))}
        </svg>
        {/* Animated abstract lines */}
        <svg className={styles.abstractLines} width="600" height="400" viewBox="0 0 600 400">
          <path d="M0,200 Q150,100 300,200 T600,200" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.1" className={styles.linePath1} />
          <path d="M0,250 Q150,150 300,250 T600,250" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.08" className={styles.linePath2} />
          <path d="M0,300 Q150,200 300,300 T600,300" fill="none" stroke="currentColor" strokeWidth="0.5" opacity="0.06" className={styles.linePath3} />
        </svg>
      </div>

      {/* ── Split View Layout ── */}
      <div className={styles.splitLayout}>

        {/* ── Hero / Landing Section ── */}
        <section className={`${styles.heroSection} ${mounted ? styles.heroVisible : ""}`}>
          {/* Navigation Bar */}
          <nav className={styles.navbar}>
            <div className={styles.navLogo}>
              <div className={styles.logoMark}>R</div>
              <span className={styles.logoText}>R-<span>Choice</span></span>
            </div>
          </nav>

        {/* Hero Content */}
        <div className={styles.heroContent}>
          <div className={styles.heroBadge}>
            <Zap size={14} /> Rathinam College Official Portal
          </div>
          <h1 className={styles.heroTitle}>
            Your Internship Journey,{" "}
            <span className={styles.heroGradientText}>Simplified.</span>
          </h1>
          <p className={styles.heroDesc}>
            One platform for approvals, bonafide certificates, job discovery, and placement tracking. 
            From application to certification — seamlessly managed.
          </p>

          {/* Removed Marketing Sections (Stats & Features) */}

          </div>
          
          {/* ── Footer within Hero for Split View ── */}
          <footer className={styles.footer}>
            <div>
              <strong>Rathinam College of Arts and Science</strong>
              <div className={styles.footerSub}>Internship & Placement Cell • Powered by Symbio</div>
            </div>
          </footer>
        </section>

        {/* ── Login Section ── */}
        <section className={styles.loginSection}>
          <div className={styles.loginContainer}>
          {/* Login Card */}
          <div className={styles.loginCard}>
            <div className={styles.loginHeader}>
              <h2 className={styles.loginTitle}>Welcome Back</h2>
              <p className={styles.loginSubtitle}>Sign in to access your portal</p>
            </div>

            {/* Primary CTAs Split */}
            <div className={styles.mainCtas}>
              <button 
                type="button"
                className={`${styles.mainCtaBtn} ${selectedRole === 'student' ? styles.activeCta : ''} ${styles.studentCta}`}
                onClick={() => handleRoleSelect('student')}
              >
                <div className={styles.ctaIcon}><GraduationCap size={20} /></div>
                <div className={styles.ctaText}>
                  <span>Student</span>
                  <small>Internee Portal</small>
                </div>
              </button>
              <button 
                type="button"
                className={`${styles.mainCtaBtn} ${selectedRole === 'company' ? styles.activeCta : ''} ${styles.companyCta}`}
                onClick={() => handleRoleSelect('company')}
              >
                <div className={styles.ctaIcon}><Building2 size={20} /></div>
                <div className={styles.ctaText}>
                  <span>Company</span>
                  <small>Partner Portal</small>
                </div>
              </button>
            </div>

            <div className={styles.divider}>
              <div className={styles.dividerLine} />
              <span>Staff & Admin Access</span>
              <div className={styles.dividerLine} />
            </div>

            {/* 3D Role Carousel */}
            <div className={styles.carousel3DContainer}>
              {carouselRoles.map((role, i, filteredRoles) => {
                const isStaffRole = filteredRoles.some((r) => r.id === selectedRole);
                const selectedIndex = isStaffRole ? filteredRoles.findIndex((r) => r.id === selectedRole) : Math.floor(filteredRoles.length / 2);
                
                const diff = i - selectedIndex;
                const absDiff = Math.abs(diff);

                // Let all roles render so E2E scripts can find them even if they are in the back
                const isHidden = absDiff > 2;

                const translateX = diff * 115;
                const translateZ = absDiff * -120;
                const rotateY = diff * -15;
                const scale = Math.max(0, 1 - absDiff * 0.15);
                const opacity = isHidden ? 0 : (isStaffRole ? (1 - absDiff * 0.5) : (0.5 - absDiff * 0.2));
                const zIndex = 10 - absDiff;

                return (
                  <button
                    key={role.id}
                    className={`${styles.carousel3DCard} ${selectedRole === role.id && isStaffRole ? styles.carouselActive : ""} ${styles[role.category]}`}
                    style={{
                      transform: mounted ? `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})` : `translateX(${translateX > 0 ? 300 : -300}px) translateZ(-400px) scale(0)`,
                      opacity: mounted ? opacity : 0,
                      zIndex,
                    }}
                    onClick={() => handleRoleSelect(role.id)}
                    type="button"
                    aria-pressed={selectedRole === role.id}
                  >
                    <div className={styles.carousel3DIcon}>
                      {role.icon}
                    </div>
                    <span className={styles.carousel3DName}>{role.label}</span>
                  </button>
                );
              })}
            </div>

            <div className={styles.loginRoleBanner}>
              <div className={`${styles.roleIcon} ${styles[selectedRoleInfo?.category || "student"]}`}>
                {selectedRoleInfo?.icon}
              </div>
              <div style={{ flex: 1 }}>
                <p className={styles.loginRoleTitle}>
                  Logging in as {selectedRoleInfo?.label}
                </p>
                <p className={styles.loginRoleHint}>
                  {selectedRole === "company" ? "Enter your company credentials" : "Enter your institutional credentials"}
                </p>
              </div>
              {selectedRole === "company" && (
                <a href="/register/company" className={styles.smallRegisterLink}>
                  Register →
                </a>
              )}
            </div>

            <form className={styles.loginForm} onSubmit={handleLogin}>
              <div className="input-group">
                <label htmlFor="email">Email Address</label>
                <div className={styles.inputWithIcon}>
                  <span className={styles.inputIcon}>
                    <Mail size={18} />
                  </span>
                  <input
                    id="email"
                    type="email"
                    className="input-field"
                    placeholder={selectedRole === "company" ? "company@example.com" : "you@rathinam.edu.in"}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="input-group">
                <label htmlFor="password">Password</label>
                <div className={styles.inputWithIcon}>
                  <span className={styles.inputIcon}>
                    <Lock size={18} />
                  </span>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="input-field"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    style={{ paddingRight: "44px" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className={styles.passwordToggle}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && <p className={styles.errorMsg}>{error}</p>}

              <button
                type="submit"
                className={`btn btn-primary ${styles.loginSubmit}`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className={styles.spinner} />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign In
                    <LogIn size={16} />
                  </>
                )}
              </button>
            </form>

            <p className={styles.loginFooter}>
              Forgot your password?{" "}
              <a href="mailto:admin@rathinam.edu.in">Contact Admin</a>
            </p>
          </div>
        </div>
      </section>
      </div>
    </div>
  );
}
