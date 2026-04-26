import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { sql } from "drizzle-orm";
import { Mail, Shield, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import DeleteUserButton from "./DeleteUserButton";

export default async function UsersPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await auth();
  const userRole = session?.user?.role || "";
  const searchParams = await props.searchParams;
  const queryParam = (searchParams.q || "").toLowerCase();
  const roleFilter = searchParams.role || "";

  async function deleteUser(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) return;
    if (!["principal", "dean", "placement_officer"].includes(session.user.role)) return;

    const targetUserId = formData.get("userId") as string;
    if (!targetUserId) return;

    try {
      // Null out any nullable FK references to this user across all tables
      await db.execute(sql`DELETE FROM job_postings WHERE posted_by = ${targetUserId} OR company_id = ${targetUserId}`);
      await db.execute(sql`UPDATE internship_requests SET last_reviewed_by = NULL WHERE last_reviewed_by = ${targetUserId}`);
      await db.execute(sql`UPDATE authority_mappings SET updated_by = NULL WHERE updated_by = ${targetUserId}`);
      await db.execute(sql`DELETE FROM student_profiles WHERE user_id = ${targetUserId}`);
      await db.execute(sql`DELETE FROM company_registrations WHERE user_id = ${targetUserId}`);
      await db.execute(sql`DELETE FROM audit_logs WHERE user_id = ${targetUserId}`);
      await db.execute(sql`DELETE FROM notifications WHERE user_id = ${targetUserId}`);
      await db.execute(sql`DELETE FROM users WHERE id = ${targetUserId}`);
    } catch {
      await db.execute(sql`DELETE FROM users WHERE id = ${targetUserId}`);
    }

    revalidatePath("/users");
  }

  // Fetch all users from the database natively via Drizzle
  let allUsers = await db.select().from(users).orderBy(users.createdAt);

  if (queryParam || roleFilter) {
    allUsers = allUsers.filter(u => {
      const matchRole = roleFilter ? u.role === roleFilter : true;
      const matchQ = queryParam ? (
        u.firstName.toLowerCase().includes(queryParam) ||
        u.lastName.toLowerCase().includes(queryParam) ||
        (u.email && u.email.toLowerCase().includes(queryParam))
      ) : true;
      return matchRole && matchQ;
    });
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1>User Management</h1>
          <p>Complete directory of all registered accounts on the platform.</p>
          {["principal", "dean", "placement_officer"].includes(userRole) && (
            <div style={{ marginTop: "1rem" }}>
              <Link href="/users/create" style={{ textDecoration: "none" }}>
                <button className="button" style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                  <Plus size={16} /> Add User
                </button>
              </Link>
            </div>
          )}
        </div>
        <form method="GET" style={{ display: "flex", gap: "var(--space-2)" }}>
          <select name="role" defaultValue={roleFilter} style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
            <option value="">All Roles</option>
            <option value="student">Student</option>
            <option value="tutor">Tutor</option>
            <option value="placement_coordinator">Placement Coordinator</option>
            <option value="hod">HOD</option>
            <option value="dean">Dean</option>
            <option value="placement_officer">Placement Officer</option>
            <option value="principal">Principal</option>
            <option value="company">Company</option>
          </select>
          <input 
            type="search" 
            name="q" 
            placeholder="Search users..." 
            defaultValue={queryParam}
            style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", background: "var(--bg-primary)" }}
          />
          <button type="submit" className="button">Filter</button>
        </form>
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
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500, width: "60px" }}>Actions</th>
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
                      <span className="badge" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-color)", outline: "1px solid var(--primary-color)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Shield size={14} style={{ flexShrink: 0 }} />
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
                    <td style={{ padding: "var(--space-4)", textAlign: "center" }}>
                      {["principal", "dean", "placement_officer"].includes(userRole) && user.id !== session?.user?.id && (
                        <DeleteUserButton userId={user.id} userName={`${user.firstName} ${user.lastName}`} deleteAction={deleteUser} />
                      )}
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
