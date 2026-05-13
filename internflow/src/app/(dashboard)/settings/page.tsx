import { auth } from "@/lib/auth";
import Link from "next/link";
import { User, Bell, Shield, Smartphone } from "lucide-react";
import { db } from "@/lib/db";
import ChangePasswordForm from "./ChangePasswordForm";
import { approvalSlaSettings, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;
  const user = session.user;
  const role = user?.role || "student";

  // Fetch full user data from DB for all roles
  const [u] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
  if (!u) return null;
  const canManageOdSla = role === "management_corporation" || role === "mcr";
  const canViewOdSla = canManageOdSla || role === "placement_officer" || role === "placement_head";

  const [odSlaSetting] = canViewOdSla
    ? await db
        .select()
        .from(approvalSlaSettings)
        .where(eq(approvalSlaSettings.scope, "default_od"))
        .limit(1)
    : [];

  const activeOdSlaHours = odSlaSetting?.slaHours ?? 6;
  const activeOdSlaUpdatedAt = odSlaSetting?.updatedAt
    ? new Date(odSlaSetting.updatedAt).toLocaleString("en-IN")
    : "Default launch policy";

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

  async function updateOdSla(formData: FormData) {
    "use server";

    const session = await auth();
    if (!session?.user?.id || session.user.role !== "management_corporation") {
      return;
    }

    const rawHours = Number(formData.get("slaHours"));
    const slaHours = Number.isFinite(rawHours) ? Math.floor(rawHours) : NaN;

    if (!Number.isFinite(slaHours) || slaHours < 1 || slaHours > 168) {
      return;
    }

    const [existing] = await db
      .select({ id: approvalSlaSettings.id })
      .from(approvalSlaSettings)
      .where(eq(approvalSlaSettings.scope, "default_od"))
      .limit(1);

    if (existing) {
      await db
        .update(approvalSlaSettings)
        .set({
          slaHours,
          updatedBy: session.user.id,
          updatedAt: new Date(),
        })
        .where(eq(approvalSlaSettings.id, existing.id));
    } else {
      await db.insert(approvalSlaSettings).values({
        scope: "default_od",
        slaHours,
        updatedBy: session.user.id,
      });
    }

    revalidatePath("/settings");
    revalidatePath("/approvals");
    revalidatePath("/approvals/results");
    revalidatePath("/dashboard/admin");
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Account Settings</h1>
        <p>Manage your account preferences, security, and notifications.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "var(--space-6)", maxWidth: "700px" }}>
        
        {/* Profile Edit Form — all roles */}
        <div className="card">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
            <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "rgba(155, 46, 135, 0.1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <User size={20} color="var(--color-primary)" />
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 600 }}>Edit Profile Information</h2>
          </div>
          
          <form action={updateProfile} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>First Name</label>
                <input name="firstName" defaultValue={u.firstName} required style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", width: "100%", boxSizing: "border-box" }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>Last Name</label>
                <input name="lastName" defaultValue={u.lastName} required style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", width: "100%", boxSizing: "border-box" }} />
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>Email Address</label>
              <input type="email" defaultValue={u.email} disabled style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-secondary)", cursor: "not-allowed", width: "100%", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>Role</label>
              <input type="text" defaultValue={role.replace(/_/g, " ")} disabled style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-secondary)", color: "var(--text-secondary)", textTransform: "capitalize", cursor: "not-allowed", width: "100%", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>Phone Number</label>
              <input name="phone" defaultValue={u.phone || ""} placeholder="Enter your phone number" style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", width: "100%", boxSizing: "border-box" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <label style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>About You</label>
              <textarea name="about" defaultValue={u.about || ""} rows={4} placeholder="Write a short summary about yourself..." style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", resize: "vertical", width: "100%", boxSizing: "border-box" }} />
            </div>

            <button type="submit" className="btn btn-primary" style={{ marginTop: "var(--space-2)", width: "100%", justifyContent: "center" }}>Save Changes</button>
          </form>
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

        {canViewOdSla && (
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-6)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "rgba(25, 135, 84, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bell size={20} color="#198754" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "4px" }}>OD Approval SLA</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                  Control how long each approval tier gets before reminders and upward escalation begin.
                </p>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
              <div style={{ padding: "16px", borderRadius: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Active SLA</div>
                <div style={{ fontSize: "1.8rem", fontWeight: 700 }}>{activeOdSlaHours}h</div>
              </div>
              <div style={{ padding: "16px", borderRadius: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Reminder Pattern</div>
                <div style={{ fontWeight: 600 }}>6h, 12h, then every SLA window upward</div>
              </div>
              <div style={{ padding: "16px", borderRadius: "12px", background: "var(--bg-secondary)", border: "1px solid var(--border-color)" }}>
                <div style={{ fontSize: "0.85rem", color: "var(--text-secondary)", marginBottom: "6px" }}>Last Updated</div>
                <div style={{ fontWeight: 600 }}>{activeOdSlaUpdatedAt}</div>
              </div>
            </div>

            <div style={{ padding: "14px 16px", borderRadius: "10px", background: "rgba(25, 135, 84, 0.08)", border: "1px solid rgba(25, 135, 84, 0.18)", marginBottom: "var(--space-5)" }}>
              <div style={{ fontWeight: 600, marginBottom: "6px" }}>Escalation behavior</div>
              <div style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                The current approver is reminded when their SLA expires. If the request is still pending after the next SLA window, the next authority is notified too, and escalation continues upward until the request is resolved.
              </div>
            </div>

            {canManageOdSla ? (
              <form action={updateOdSla} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <label htmlFor="slaHours" style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
                    Default hours per OD approval tier
                  </label>
                  <input
                    id="slaHours"
                    name="slaHours"
                    type="number"
                    min={1}
                    max={168}
                    step={1}
                    defaultValue={activeOdSlaHours}
                    style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--border-color)", background: "var(--bg-primary)", color: "var(--text-primary)", width: "100%", boxSizing: "border-box", maxWidth: "220px" }}
                  />
                  <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Recommended for launch: 6 hours. Allowed range: 1 to 168 hours.
                  </span>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-start" }}>
                  <button type="submit" className="btn btn-primary">
                    Save OD SLA
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ color: "var(--text-secondary)", lineHeight: 1.6 }}>
                Management Corporation can update this SLA. Your dashboard and escalation queue will automatically follow the active timing policy.
              </div>
            )}
          </div>
        )}

        {["dean", "hod", "placement_officer", "principal", "mcr", "management_corporation"].includes(role) && (
          <div className="card">
            <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginBottom: "var(--space-5)" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "rgba(220, 38, 38, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Shield size={20} color="#dc2626" />
              </div>
              <div>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 600, marginBottom: "4px" }}>Hierarchy Audit</h2>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.95rem" }}>
                  Detect invalid student scope, broken staff mappings, and duplicate hierarchy rows.
                </p>
              </div>
            </div>

            <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <Link href="/settings/hierarchy-audit" className="btn btn-primary" style={{ textDecoration: "none" }}>
                Open Audit Page
              </Link>
              <Link href="/settings/hierarchy" className="btn btn-outline" style={{ textDecoration: "none" }}>
                Open Hierarchy Settings
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
