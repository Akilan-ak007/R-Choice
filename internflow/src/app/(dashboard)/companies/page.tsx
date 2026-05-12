import { db } from "@/lib/db";
import { users, companyRegistrations } from "@/lib/db/schema";
import { Building, Mail, Phone, Calendar } from "lucide-react";
import { eq, sql, and, or, ilike, type SQL } from "drizzle-orm";
import { format } from "date-fns";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import DeleteCompanyButton from "./DeleteCompanyButton";

function getCompanyBadgeSeed(value: string) {
  return Array.from(value).reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function getCompanyBadgeStyle(value: string) {
  const palettes = [
    { background: "linear-gradient(135deg, #2563eb, #1d4ed8)", color: "#ffffff" },
    { background: "linear-gradient(135deg, #f97316, #ea580c)", color: "#ffffff" },
    { background: "linear-gradient(135deg, #059669, #047857)", color: "#ffffff" },
    { background: "linear-gradient(135deg, #7c3aed, #6d28d9)", color: "#ffffff" },
    { background: "linear-gradient(135deg, #db2777, #be185d)", color: "#ffffff" },
  ];
  return palettes[getCompanyBadgeSeed(value) % palettes.length];
}

export default async function CompaniesPage(props: { searchParams: Promise<{ [key: string]: string | undefined }> }) {
  const searchParams = await props.searchParams;
  const queryParam = searchParams.q || "";
  const session = await auth();
  const canManageCompanies = session?.user?.role && ["placement_officer", "placement_head", "management_corporation", "mcr"].includes(session.user.role);

  const page = parseInt(searchParams.page || "1", 10);
  const pageSize = 20;
  const offset = (page - 1) * pageSize;

  const conditions: SQL[] = [];
  
  if (queryParam) {
    const search = or(
      ilike(companyRegistrations.companyLegalName, `%${queryParam}%`),
      ilike(companyRegistrations.brandName, `%${queryParam}%`),
      ilike(users.email, `%${queryParam}%`)
    );
    if (search) conditions.push(search);
  }

  const whereClause = and(...conditions);

  const companies = await db
    .select({
      id: companyRegistrations.id,
      status: companyRegistrations.status,
      companyLegalName: companyRegistrations.companyLegalName,
      brandName: companyRegistrations.brandName,
      companyType: companyRegistrations.companyType,
      createdAt: companyRegistrations.createdAt,
      ownerUserId: companyRegistrations.userId,
      email: users.email,
      phone: users.phone,
    })
    .from(companyRegistrations)
    .leftJoin(users, eq(companyRegistrations.userId, users.id))
    .where(whereClause)
    .orderBy(companyRegistrations.createdAt)
    .limit(pageSize)
    .offset(offset);

  const countResult = await db
    .select({ count: sql`count(*)` })
    .from(companyRegistrations)
    .leftJoin(users, eq(companyRegistrations.userId, users.id))
    .where(whereClause);
  const totalCount = Number(countResult[0]?.count || 0);
  const totalPages = Math.ceil(totalCount / pageSize);

  async function deleteCompany(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) return;
    if (!["placement_officer", "placement_head", "management_corporation", "mcr"].includes(session.user.role)) return;

    const companyId = formData.get("companyId") as string;
    if (!companyId) return;

    try {
      // Null out any nullable FK references to this user across all tables
      const companyRecord = await db
        .select({ ownerUserId: companyRegistrations.userId })
        .from(companyRegistrations)
        .where(eq(companyRegistrations.id, companyId))
        .limit(1);
      const ownerUserId = companyRecord[0]?.ownerUserId;

      await db.execute(sql`DELETE FROM job_postings WHERE company_id = ${companyId}`);
      if (ownerUserId) {
        await db.execute(sql`UPDATE internship_requests SET last_reviewed_by = NULL WHERE last_reviewed_by = ${ownerUserId}`);
        await db.execute(sql`UPDATE authority_mappings SET updated_by = NULL WHERE updated_by = ${ownerUserId}`);
        await db.execute(sql`DELETE FROM audit_logs WHERE user_id = ${ownerUserId}`);
        await db.execute(sql`DELETE FROM notifications WHERE user_id = ${ownerUserId}`);
      }
      await db.execute(sql`DELETE FROM company_registrations WHERE id = ${companyId}`);
      if (ownerUserId) {
        await db.execute(sql`DELETE FROM users WHERE id = ${ownerUserId}`);
      }
    } catch {
      await db.delete(companyRegistrations).where(eq(companyRegistrations.id, companyId));
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
          {canManageCompanies && (
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
              (() => {
                const companyStatus = company.status ?? "under_review";
                return (
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
                    border: "1px solid rgba(255,255,255,0.08)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    fontWeight: 800,
                    fontSize: "1rem",
                    ...getCompanyBadgeStyle(company.companyLegalName || company.brandName || "C"),
                  }}>
                    {(company.brandName || company.companyLegalName || "C").trim().charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>{company.companyLegalName}</div>
                    {company.brandName && (
                      <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", marginTop: "2px" }}>
                        {company.brandName}
                      </div>
                    )}
                    <span className="badge" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-color)", marginTop: "4px" }}>
                      {companyStatus === "approved" ? "Approved Partner" : companyStatus.replace(/_/g, " ")}
                    </span>
                  </div>

                  {/* Delete button */}
                  {canManageCompanies && (
                    <DeleteCompanyButton
                      companyId={company.id}
                      companyName={company.companyLegalName}
                      deleteAction={deleteCompany}
                    />
                  )}
                </div>
                
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                  {company.companyType && (
                    <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>
                      {company.companyType}
                    </div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    <Mail size={14} /> <a href={`mailto:${company.email || ""}`} style={{ color: "inherit" }}>{company.email || "No email on file"}</a>
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

                <Link href={`/companies/${company.id}`} style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "var(--space-3)",
                  padding: "10px 16px",
                  background: "var(--primary-color)",
                  color: "white",
                  border: "none",
                  borderRadius: "var(--radius-md)",
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  textDecoration: "none",
                  cursor: "pointer",
                  transition: "opacity 0.2s ease",
                }}>
                  <Building size={14} /> View Full Details
                </Link>
              </div>
                );
              })()
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
