import { db } from "@/lib/db";
import { studentProfiles, users } from "@/lib/db/schema";
import { sql, ilike, or, eq, and, type SQL } from "drizzle-orm";
import { Mail, Shield, Clock, Plus } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { buildManagedUsersCondition, getManagedUserRoles } from "@/lib/authority-scope";
import DeleteUserButton from "./DeleteUserButton";

export default async function UsersPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const session = await auth();
  const userRole = session?.user?.role || "";
  const searchParams = await props.searchParams;
  const queryParam = searchParams.q || "";
  const roleFilter = searchParams.role || "";
  
  const page = parseInt(searchParams.page || "1", 10);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;
  const canManageUsers = ["tutor", "placement_coordinator", "hod", "dean"].includes(userRole);

  async function deleteUser(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) return;
    if (!["tutor", "placement_coordinator", "hod", "dean"].includes(session.user.role)) return;

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

  const conditions: SQL[] = [];
  const manageableRoles = [...getManagedUserRoles(userRole)];
  if (canManageUsers) {
    if (roleFilter) {
      if (manageableRoles.includes(roleFilter as never)) {
        conditions.push(eq(users.role, roleFilter as typeof users.role.enumValues[number]));
      } else {
        conditions.push(sql`1=0`);
      }
    } else if (manageableRoles.length > 0) {
      conditions.push(sql`${users.role} IN (${sql.join(manageableRoles.map((role) => sql`${role}`), sql`, `)})`);
    }
  } else if (roleFilter) {
    conditions.push(eq(users.role, roleFilter as typeof users.role.enumValues[number]));
  }
  if (queryParam) {
    const search = or(
      ilike(users.firstName, `%${queryParam}%`),
      ilike(users.lastName, `%${queryParam}%`),
      ilike(users.email, `%${queryParam}%`)
    );
    if (search) conditions.push(search);
  }

  const managedUsersCondition = canManageUsers && session?.user?.id
    ? await buildManagedUsersCondition(session.user.id, userRole)
    : undefined;
  if (managedUsersCondition) {
    conditions.push(managedUsersCondition);
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const allUsers = await db.select({
    id: users.id,
    firstName: users.firstName,
    lastName: users.lastName,
    email: users.email,
    role: users.role,
    department: users.department,
    createdAt: users.createdAt,
  })
    .from(users)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(whereClause)
    .orderBy(users.createdAt)
    .limit(pageSize)
    .offset(offset);

  const countResult = await db
    .select({ count: sql`count(*)` })
    .from(users)
    .leftJoin(studentProfiles, eq(studentProfiles.userId, users.id))
    .where(whereClause);
  const totalCount = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1>User Management</h1>
          <p>{canManageUsers ? "Manage students and lower-order staff within your assigned scope." : "Complete directory of registered accounts on the platform."}</p>
          {canManageUsers && (
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
            {!canManageUsers && <option value="dean">Dean</option>}
            {!canManageUsers && <option value="placement_officer">Placement Officer</option>}
            {!canManageUsers && <option value="principal">Principal</option>}
            {!canManageUsers && <option value="company">Company</option>}
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
                      {canManageUsers && user.id !== session?.user?.id && (
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

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-4)" }}>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Showing {offset + 1} to {Math.min(offset + pageSize, totalCount)} of {totalCount} users
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {page > 1 && (
              <Link href={`/users?page=${page - 1}${queryParam ? `&q=${encodeURIComponent(queryParam)}` : ''}${roleFilter ? `&role=${encodeURIComponent(roleFilter)}` : ''}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                Previous
              </Link>
            )}
            <span style={{ padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", background: "var(--bg-primary)" }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`/users?page=${page + 1}${queryParam ? `&q=${encodeURIComponent(queryParam)}` : ''}${roleFilter ? `&role=${encodeURIComponent(roleFilter)}` : ''}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
