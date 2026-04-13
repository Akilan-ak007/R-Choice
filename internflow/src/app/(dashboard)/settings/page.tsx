import { auth } from "@/lib/auth";
import { User, Bell, Shield, KeyRound, Smartphone } from "lucide-react";
import { db } from "@/lib/db";
import ChangePasswordForm from "./ChangePasswordForm";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = session.user;
  const userName = user?.name || "User";
  const userEmail = user?.email || "No email provided";
  const role = user?.role || "student";

  if (role === "principal") {
    const [u] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    
    async function updateProfile(formData: FormData) {
      "use server";
      const session = await auth();
      if (!session?.user?.id) return;
      await db.update(users).set({ 
        firstName: formData.get("firstName") as string,
        lastName: formData.get("lastName") as string,
        phone: formData.get("phone") as string,
        about: formData.get("about") as string
      }).where(eq(users.id, session.user.id));
      revalidatePath("/profile");
      revalidatePath("/settings");
    }

    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1>Update Profile</h1>
          <p>Modify your administrative account details here.</p>
        </div>
        <div className="card" style={{ maxWidth: "500px" }}>
          <form action={updateProfile} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>First Name</label>
              <input name="firstName" defaultValue={u.firstName} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>Last Name</label>
              <input name="lastName" defaultValue={u.lastName} required style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>Phone Number</label>
              <input name="phone" defaultValue={u.phone || ""} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>About You</label>
              <textarea name="about" defaultValue={u.about || ""} rows={4} placeholder="Write a short summary about yourself..." style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", resize: "vertical" }} />
            </div>
            <button type="submit" className="button" style={{ marginTop: "1rem" }}>Save Changes</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Account Settings</h1>
        <p>Manage your account preferences, security, and notifications.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-6)" }}>
        
        {/* Profile Details */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "rgba(155, 46, 135, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={20} color="var(--color-primary)" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Profile Information</h2>
          </div>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
            <div>
              <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "var(--space-2)" }}>Full Name</label>
              <input type="text" className="input" defaultValue={userName} disabled />
            </div>
            <div>
              <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "var(--space-2)" }}>Email Address</label>
              <input type="email" className="input" defaultValue={userEmail} disabled />
            </div>
            <div>
              <label style={{ display: "block", color: "var(--text-secondary)", fontSize: "0.875rem", marginBottom: "var(--space-2)" }}>Role</label>
              <input type="text" className="input" defaultValue={role.replace('_', ' ')} style={{ textTransform: "capitalize" }} disabled />
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "rgba(30, 155, 215, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Shield size={20} color="var(--color-info)" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Security & Authentication</h2>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <ChangePasswordForm />

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "var(--space-4)", borderBottom: "1px solid var(--border-color)" }}>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <Smartphone size={20} color="var(--text-secondary)" style={{ marginTop: "2px" }} />
                <div>
                  <div style={{ fontWeight: 500 }}>Two-Factor Authentication (2FA)</div>
                  <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Add an extra layer of security to your account.</div>
                </div>
              </div>
              <button className="btn btn-outline">Enable</button>
            </div>
          </div>
        </div>

        {/* Notification Preferences */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "rgba(244, 122, 42, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bell size={20} color="var(--color-warning)" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Notification Preferences</h2>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <label style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked style={{ marginTop: "4px" }} />
              <div>
                <div style={{ fontWeight: 500 }}>Email Notifications</div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Receive email updates about your application status and approvals.</div>
              </div>
            </label>
            
            <label style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", cursor: "pointer" }}>
              <input type="checkbox" defaultChecked style={{ marginTop: "4px" }} />
              <div>
                <div style={{ fontWeight: 500 }}>Marketing & Updates</div>
                <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>Receive news and updates about placement drives.</div>
              </div>
            </label>
          </div>
          
          <div style={{ marginTop: "var(--space-6)", display: "flex", justifyContent: "flex-end" }}>
            <button className="btn btn-primary">Save Preferences</button>
          </div>
        </div>

      </div>
    </div>
  );
}
