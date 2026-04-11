"use client";

import { useState } from "react";
import { loginAction } from "@/app/actions/auth";
import {
  GraduationCap,
  BookOpen,
  ClipboardList,
  Building2,
  Star,
  BarChart3,
  Crown,
  Briefcase,
  Users,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  LogIn,
  Loader2,
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
  {
    id: "student",
    label: "Student",
    icon: <GraduationCap size={20} />,
    desc: "Apply & track",
    category: "student",
  },
  {
    id: "tutor",
    label: "Tutor",
    icon: <BookOpen size={20} />,
    desc: "Tier 1 approver",
    category: "staff",
  },
  {
    id: "placement_coordinator",
    label: "Placement Coordinator",
    icon: <ClipboardList size={20} />,
    desc: "Tier 2 approver",
    category: "staff",
  },
  {
    id: "hod",
    label: "HOD",
    icon: <Building2 size={20} />,
    desc: "Tier 3 approver",
    category: "staff",
  },
  {
    id: "dean",
    label: "Dean",
    icon: <Star size={20} />,
    desc: "Full admin",
    category: "admin",
  },
  {
    id: "placement_officer",
    label: "Placement Officer",
    icon: <BarChart3 size={20} />,
    desc: "Full admin",
    category: "admin",
  },
  {
    id: "principal",
    label: "Principal",
    icon: <Crown size={20} />,
    desc: "Full admin",
    category: "admin",
  },
  {
    id: "company",
    label: "Company",
    icon: <Briefcase size={20} />,
    desc: "Post jobs",
    category: "external",
  },
];

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const internalRoles = ROLES.filter((r) => r.category !== "external");
  const externalRoles = ROLES.filter((r) => r.category === "external");

  const handleRoleSelect = (roleId: string) => {
    setSelectedRole(roleId);
    setError("");
  };

  const handleContinue = () => {
    if (!selectedRole) {
      setError("Please select your role to continue");
      return;
    }
    setStep(2);
    setError("");
  };

  const handleBack = () => {
    setStep(1);
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !selectedRole) {
      setError("Please enter your email and password");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", selectedRole);
      
      const result = await loginAction(formData);
      
      if (result?.error) {
        setError(result.error);
        setIsLoading(false);
      }
      // On success, loginAction calls signIn which handles the redirect
    } catch {
      setError("Invalid credentials. Please try again.");
      setIsLoading(false);
    }
  };

  const selectedRoleInfo = ROLES.find((r) => r.id === selectedRole);

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginContainer}>
        {/* Header */}
        <div className={styles.loginHeader}>
          <div className={styles.loginLogo}>
            <div className={styles.loginLogoIcon}>R</div>
            <div className={styles.loginLogoText}>
              R-<span>Choice</span>
            </div>
          </div>
          <p className={styles.loginSubtitle}>
            Rathinam College Internship &amp; Placement Portal
          </p>
        </div>

        {/* Card */}
        <div className={styles.loginCard}>
          {/* Step Indicator */}
          <div className={styles.loginStepIndicator}>
            <div className={`${styles.stepDot} ${step >= 1 ? styles.active : ""}`} />
            <div className={`${styles.stepDot} ${step >= 2 ? styles.active : ""}`} />
          </div>

          {step === 1 ? (
            <div className="animate-fade-in">
              <p className={styles.roleSectionTitle}>College Members</p>
              <div className={styles.roleGrid}>
                {internalRoles.map((role) => (
                  <button
                    key={role.id}
                    className={`${styles.roleCard} ${
                      selectedRole === role.id ? styles.selected : ""
                    }`}
                    onClick={() => handleRoleSelect(role.id)}
                    type="button"
                    aria-pressed={selectedRole === role.id}
                  >
                    <div className={`${styles.roleIcon} ${styles[role.category]}`}>
                      {role.icon}
                    </div>
                    <div className={styles.roleInfo}>
                      <span className={styles.roleName}>{role.label}</span>
                      <span className={styles.roleDesc}>{role.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              <p className={styles.roleSectionTitle}>External Partners</p>
              <div className={styles.roleGrid}>
                {externalRoles.map((role) => (
                  <button
                    key={role.id}
                    className={`${styles.roleCard} ${
                      selectedRole === role.id ? styles.selected : ""
                    }`}
                    onClick={() => handleRoleSelect(role.id)}
                    type="button"
                    aria-pressed={selectedRole === role.id}
                  >
                    <div className={`${styles.roleIcon} ${styles[role.category]}`}>
                      {role.icon}
                    </div>
                    <div className={styles.roleInfo}>
                      <span className={styles.roleName}>{role.label}</span>
                      <span className={styles.roleDesc}>{role.desc}</span>
                    </div>
                  </button>
                ))}
              </div>

              {error && (
                <p
                  style={{
                    color: "var(--color-danger)",
                    fontSize: "0.8125rem",
                    marginTop: "var(--space-3)",
                  }}
                >
                  {error}
                </p>
              )}

              <button
                className={`btn btn-primary ${styles.loginSubmit}`}
                onClick={handleContinue}
                type="button"
              >
                Continue as {selectedRoleInfo?.label || "..."}
                <ArrowRight size={16} />
              </button>

              <a href="/register/company" className={styles.companyRegisterLink}>
                New company? <strong>Register here →</strong>
              </a>
            </div>
          ) : (
            <div className="animate-fade-in">
              <button
                className="btn btn-ghost"
                onClick={handleBack}
                type="button"
                style={{ marginBottom: "var(--space-4)", padding: "var(--space-2)" }}
              >
                <ArrowLeft size={16} />
                Back
              </button>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-3)",
                  marginBottom: "var(--space-6)",
                }}
              >
                <div
                  className={`${styles.roleIcon} ${
                    styles[selectedRoleInfo?.category || "student"]
                  }`}
                >
                  {selectedRoleInfo?.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: "0.9375rem" }}>
                    Logging in as {selectedRoleInfo?.label}
                  </p>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    Enter your credentials
                  </p>
                </div>
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
                      placeholder="you@rathinam.edu.in"
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
                      style={{
                        position: "absolute",
                        right: "var(--space-3)",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "var(--text-muted)",
                        display: "flex",
                        padding: "var(--space-1)",
                      }}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {error && (
                  <p style={{ color: "var(--color-danger)", fontSize: "0.8125rem" }}>
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  className={`btn btn-primary ${styles.loginSubmit}`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
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
          )}
        </div>
      </div>

      <style>{`
        .animate-spin {
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
