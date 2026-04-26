import { db } from "@/lib/db";
import { users, companyRegistrations } from "@/lib/db/schema";
import { Building, Mail, Phone, Calendar } from "lucide-react";
import { eq, sql, and, or, ilike, type SQL } from "drizzle-orm";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import DeleteCompanyButton from "./DeleteCompanyButton";

export default async function CompaniesPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const queryParam = searchParams.q || "";
  const session = await auth();
  const isAdmin = session?.user?.role && ["dean", "placement_officer", "principal"].includes(session.user.role);

  const page = parseInt(searchParams.page || "1", 10);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [eq(users.role, "company")];
  
  if (queryParam) {
    const search = or(
      ilike(users.firstName, `%${queryParam}%`),
      ilike(users.lastName, `%${queryParam}%`),
      ilike(users.email, `%${queryParam}%`)
    );
    if (search) conditions.push(search);
  }

  const whereClause = and(...conditions);

  const companies = await db
    .select()
    .from(users)
    .where(whereClause)
    .orderBy(users.createdAt)
    .limit(pageSize)
    .offset(offset);

  const countResult = await db.select({ count: sql`count(*)` }).from(users).where(whereClause);
  const totalCount = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(totalCount / pageSize);

  async function deleteCompany(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) return;
    if (!["placement_officer", "principal"].includes(session.user.role)) return;

    const companyId = formData.get("companyId") as string;
    if (!companyId) return;

    try {
      // Null out any nullable FK references to this user across all tables
      await db.execute(sql`DELETE FROM job_postings WHERE posted_by = ${companyId} OR company_id = ${companyId}`);
      await db.execute(sql`UPDATE internship_requests SET last_reviewed_by = NULL WHERE last_reviewed_by = ${companyId}`);
      await db.execute(sql`UPDATE authority_mappings SET updated_by = NULL WHERE updated_by = ${companyId}`);
      await db.execute(sql`DELETE FROM company_registrations WHERE user_id = ${companyId}`);
      await db.execute(sql`DELETE FROM audit_logs WHERE user_id = ${companyId}`);
      await db.execute(sql`DELETE FROM notifications WHERE user_id = ${companyId}`);
      await db.execute(sql`DELETE FROM users WHERE id = ${companyId}`);
    } catch {
      // If multi-statement fails, try individual deletes
      await db.delete(companyRegistrations).where(eq(companyRegistrations.userId, companyId));
      // Use Drizzle's raw execute for cascading delete
      await db.execute(sql`DELETE FROM users WHERE id = ${companyId}`);
    }

    revalidatePath("/companies");
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1>Company Directory</h1>
          <p>List of all corporate partners registered on R-Choice for hiring.</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
          <form method="GET" style={{ display: "flex", gap: "var(--space-2)" }}>
            <input 
              type="search" 
              name="q" 
              placeholder="Search companies..." 
              defaultValue={queryParam}
              style={{ padding: "8px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", background: "var(--bg-primary)" }}
            />
            <button type="submit" className="button">Search</button>
          </form>
          {isAdmin && (
            <Link href="/companies/review" style={{ textDecoration: "none" }}>
              <button className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                Review Registrations
              </button>
            </Link>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
          {companies.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
              No companies have registered yet.
            </div>
          ) : (
            companies.map((company) => (
              <div key={company.id} style={{ 
                border: "1px solid var(--border-color)", 
                borderRadius: "var(--radius-lg)", 
                padding: "var(--space-4)",
                display: "flex",
                flexDirection: "column",
                gap: "var(--space-3)",
                position: "relative",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                  <div style={{ 
                    width: "48px", 
                    height: "48px", 
                    borderRadius: "12px", 
                    backgroundColor: "var(--surface)", 
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}>
                    <Building size={24} color="var(--primary-color)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>{company.firstName} {company.lastName}</div>
                    <span className="badge" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-color)", marginTop: "4px" }}>
                      Authorized Partner
                    </span>
                  </div>

                  {/* Delete button for PO/Principal */}
                  {isAdmin && (
                    <DeleteCompanyButton
                      companyId={company.id}
                      companyName={`${company.firstName} ${company.lastName}`}
                      deleteAction={deleteCompany}
                    />
                  )}
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    <Mail size={14} /> <a href={`mailto:${company.email}`} style={{ color: "inherit" }}>{company.email}</a>
                  </div>
                  {company.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      <Phone size={14} /> <a href={`tel:${company.phone}`} style={{ color: "inherit" }}>{company.phone}</a>
                    </div>
                  )}
                  {company.createdAt && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-muted)", fontSize: "0.8125rem" }}>
                      <Calendar size={14} /> Member since {format(new Date(company.createdAt), "MMM yyyy")}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-4)" }}>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>
            Showing {offset + 1} to {Math.min(offset + pageSize, totalCount)} of {totalCount} companies
          </div>
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            {page > 1 && (
              <Link href={`/companies?page=${page - 1}${queryParam ? `&q=${encodeURIComponent(queryParam)}` : ''}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                Previous
              </Link>
            )}
            <span style={{ padding: "8px 12px", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", background: "var(--bg-primary)" }}>
              Page {page} of {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`/companies?page=${page + 1}${queryParam ? `&q=${encodeURIComponent(queryParam)}` : ''}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
