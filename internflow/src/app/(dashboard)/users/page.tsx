import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { Mail, Shield, Clock } from "lucide-react";
import { format } from "date-fns";

export default async function UsersPage() {
  // Fetch all users from the database natively via Drizzle
  const allUsers = await db.select().from(users).orderBy(users.createdAt);

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>User Management</h1>
        <p>Complete directory of all registered accounts on the platform.</p>
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)" }}>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>User Name</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Role</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Email</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {allUsers.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
                    No users found across the platform.
                  </td>
                </tr>
              ) : (
                allUsers.map((user) => (
                  <tr key={user.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ fontWeight: 600 }}>{user.firstName} {user.lastName}</div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>ID: {user.id.substring(0, 8)}...</div>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <span className="badge" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-color)", outline: "1px solid var(--primary-color)" }}>
                        <Shield size={14} style={{ marginRight: "4px", display: "inline-block", verticalAlign: "bottom" }} />
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1).replace('_', ' ')}
                      </span>
                    </td>
                    <td style={{ padding: "var(--space-4)", color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Mail size={16} />
                        {user.email}
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-4)", color: "var(--text-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Clock size={16} />
                        {user.createdAt ? format(new Date(user.createdAt), "MMM d, yyyy") : "Unknown"}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
