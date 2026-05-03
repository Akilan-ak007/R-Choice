import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyStaff, users } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { redirect } from "next/navigation";
import StaffManagerClient from "./StaffManagerClient";
import { UsersIcon, ShieldCheck, XCircle } from "lucide-react";
import { revokeCompanyStaff } from "@/app/actions/companyStaff";
import { getCompanyContextForUser } from "@/lib/company-context";

export default async function CompanyTeamPage() {
  const session = await auth();
  if (!session?.user) redirect("/");
  
  if (session.user.role !== "company") {
    // Staff attempting to access CEO page
    redirect("/dashboard/company");
  }

  const companyContext = await getCompanyContextForUser(session.user.id);
  if (!companyContext?.companyId) return <div>Company profile not bound properly. Cannot manage staff.</div>;

  const staffMembers = await db
    .select({
      id: users.id,
      firstName: users.firstName,
      lastName: users.lastName,
      employeeId: users.employeeId,
      staffRole: companyStaff.roleInCompany,
      department: users.department,
      email: users.email,
      phone: users.phone,
      isActive: users.isActive,
    })
    .from(companyStaff)
    .innerJoin(users, eq(companyStaff.userId, users.id))
    .where(and(eq(companyStaff.companyId, companyContext.companyId), eq(users.role, "company_staff")));

  return (
    <div className="animate-fade-in" style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      <div className="page-header">
        <h1 style={{ display: "flex", alignItems: "center", gap: 12 }}><ShieldCheck size={28} /> Company Master Controls</h1>
        <p>You are the CEO / Primary Authority. Here you can generate strictly bound staff accounts who can post jobs and review applicants on your company's behalf.</p>
      </div>

      <StaffManagerClient />

      <div className="card">
        <h3 style={{ padding: "var(--space-4) var(--space-6)", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", gap: 8 }}>
          <UsersIcon size={20} /> Active Staff Licenses
        </h3>
        {staffMembers.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center", color: "var(--text-muted)" }}>
            No staff onboarded yet. Create a staff account above.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Contact Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {staffMembers.map(staff => (
                  <tr key={staff.id}>
                    <td style={{ fontWeight: 500 }}>{staff.firstName} {staff.lastName}</td>
                    <td>{staff.employeeId || "—"}</td>
                    <td><span className="badge" style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6" }}>{staff.staffRole || "Staff"}</span></td>
                    <td>{staff.department || "—"}</td>
                    <td>{staff.email}</td>
                    <td>{staff.phone || "—"}</td>
                    <td>
                      {staff.isActive ? (
                        <span className="status-pill status-approved">Active</span>
                      ) : (
                        <span className="status-pill status-rejected">Revoked</span>
                      )}
                    </td>
                    <td>
                       {staff.isActive && (
                         <form action={revokeCompanyStaff.bind(null, staff.id) as any}>
                           <button type="submit" className="btn btn-ghost" style={{ padding: "4px 8px", color: "var(--color-danger)" }}>
                             <XCircle size={16} /> Revoke
                           </button>
                         </form>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
