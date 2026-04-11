import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { Building, Globe, Mail } from "lucide-react";
import { eq } from "drizzle-orm";
import { format } from "date-fns";

export default async function CompaniesPage() {
  const companies = await db
    .select()
    .from(users)
    .where(eq(users.role, "company"));

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Company Directory</h1>
        <p>List of all corporate partners registered on R-Choice for hiring.</p>
      </div>

      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
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
                gap: "var(--space-3)"
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
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1.125rem" }}>{company.firstName} {company.lastName}</div>
                    <span className="badge" style={{ backgroundColor: "var(--primary-light)", color: "var(--primary-color)", marginTop: "4px" }}>
                      Authorized Partner
                    </span>
                  </div>
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginTop: "var(--space-2)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                    <Mail size={14} /> {company.email}
                  </div>
                  {company.phone && (
                    <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", color: "var(--text-secondary)", fontSize: "0.875rem" }}>
                      <Globe size={14} /> {company.phone}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
