import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { ShieldAlert } from "lucide-react";

export default async function CreateUserPage() {
  const session = await auth();
  if (session?.user?.role !== "principal") {
    redirect("/");
  }

  async function createUserAction(formData: FormData) {
    "use server";
    
    // Auth Validation Over-check
    const session = await auth();
    if (session?.user?.role !== "principal") {
      throw new Error("Unauthorized");
    }

    const email = formData.get("email") as string;
    const firstName = formData.get("firstName") as string;
    const lastName = formData.get("lastName") as string;
    const password = formData.get("password") as string;
    const role = formData.get("role") as string;

    const validRoles = ["student", "tutor", "placement_coordinator", "hod", "dean", "placement_officer", "principal", "company", "alumni"] as const;
    type UserRole = typeof validRoles[number];

    if (!email || !firstName || !lastName || !password || !role) {
      throw new Error("All parameters are required.");
    }

    if (!validRoles.includes(role as UserRole)) {
      throw new Error("Invalid role selected.");
    }

    const passwordHash = await bcrypt.hash(password, 12);

    try {
      await db.insert(users).values({
        email,
        passwordHash,
        firstName,
        lastName,
        role: role as UserRole,
        isActive: true,
      });
    } catch(err) {
      // In case of conflict like duplicate emails
      console.error(err);
      // To keep things simple in V1 we just redirect upon completion 
      // or error since this relies simply on standard HTTP Post
    }

    redirect("/users");
  }

  return (
    <div className="animate-fade-in" style={{ display: "flex", justifyContent: "center", paddingTop: "var(--space-8)" }}>
      <div className="card" style={{ width: "100%", maxWidth: "600px", padding: "var(--space-8)" }}>
        <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
          <ShieldAlert size={48} color="var(--primary-color)" style={{ margin: "0 auto", marginBottom: "var(--space-4)" }} />
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700 }}>Deploy Administrator privileges</h1>
          <p style={{ color: "var(--text-secondary)", marginTop: "var(--space-2)" }}>Instantiate a secure internal user login for the platform ecosystem.</p>
        </div>

        <form action={createUserAction} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
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
            <select name="role" required style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }}>
              <option value="student">Student</option>
              <option value="tutor">Tutor</option>
              <option value="placement_coordinator">Placement Coordinator</option>
              <option value="hod">HOD (Head of Department)</option>
              <option value="dean">Dean</option>
              <option value="placement_officer">Placement Officer</option>
              <option value="company">Corporate Entity (Company)</option>
              <option value="principal">Principal</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "0.875rem", fontWeight: 500 }}>System Password</label>
            <input type="password" name="password" required placeholder="Enter secure initialization password..." style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
          </div>

          <button type="submit" className="button" style={{ marginTop: "var(--space-4)", width: "100%", justifyContent: "center", height: "45px", fontSize: "1rem" }}>
            Deploy Account Node
          </button>
        </form>
      </div>
    </div>
  );
}
