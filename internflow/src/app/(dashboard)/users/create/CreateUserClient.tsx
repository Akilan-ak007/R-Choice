"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldAlert, Loader2 } from "lucide-react";
import { createUserAction } from "@/app/actions/admin";

export function CreateUserClient({ currentRole }: { currentRole: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allowedRoles =
    currentRole === "tutor" || currentRole === "placement_coordinator"
      ? [{ value: "student", label: "Student" }]
      : currentRole === "hod"
        ? [
            { value: "student", label: "Student" },
            { value: "tutor", label: "Tutor" },
            { value: "placement_coordinator", label: "Placement Coordinator" },
          ]
        : currentRole === "dean"
          ? [
              { value: "student", label: "Student" },
              { value: "tutor", label: "Tutor" },
              { value: "placement_coordinator", label: "Placement Coordinator" },
              { value: "hod", label: "HOD (Head of Department)" },
            ]
          : [];

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createUserAction(formData);

    if (result.error) {
      setError(result.error);
      setLoading(false);
    } else {
      router.push("/users?role=student");
    }
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", paddingTop: "var(--space-8)" }}>
      <div className="card" style={{ width: "100%", maxWidth: "600px", padding: "var(--space-8)" }}>
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <ShieldAlert size={48} color="var(--color-primary)" style={{ margin: "0 auto", marginBottom: "var(--space-4)" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Create User Account</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>Create a new user inside your allowed management scope.</p>
        </div>

        {allowedRoles.length === 0 && (
          <div style={{ 
            color: "var(--color-danger)", 
            padding: "16px", 
            marginBottom: "var(--space-4)",
            background: "rgba(239, 68, 68, 0.1)", 
            borderRadius: "var(--radius-md)", 
            fontSize: "0.875rem",
            border: "1px solid rgba(239, 68, 68, 0.2)"
          }}>
            You do not have permission to create users from this page.
          </div>
        )}

        {error && (
          <div style={{ 
            color: "var(--color-danger)", 
            padding: "16px", 
            marginBottom: "var(--space-4)",
            background: "rgba(239, 68, 68, 0.1)", 
            borderRadius: "var(--radius-md)", 
            fontSize: "0.875rem",
            border: "1px solid rgba(239, 68, 68, 0.2)"
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>First Name</label>
              <input name="firstName" required placeholder="John" style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>Last Name</label>
              <input name="lastName" required placeholder="Doe" style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>Email Address</label>
            <input type="email" name="email" required placeholder="admin@rathinam.edu.in" style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>Global Role</label>
            <select name="role" required disabled={allowedRoles.length === 0} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
              {allowedRoles.map((role) => (
                <option key={role.value} value={role.value}>{role.label}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>System Password</label>
            <input type="password" name="password" required placeholder="Enter secure initialization password..." style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>Required length: 8 characters minimum.</p>
          </div>

          <button type="submit" className="button" disabled={loading || allowedRoles.length === 0} style={{ marginTop: "var(--space-4)", width: "100%", justifyContent: "center", height: "45px", fontSize: "1rem", display: "flex", alignItems: "center", gap: "8px" }}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : "Create Account"}
          </button>
        </form>
      </div>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
