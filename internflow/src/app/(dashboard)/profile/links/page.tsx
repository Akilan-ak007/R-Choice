import { db } from "@/lib/db";
import { studentLinks, studentProfiles } from "@/lib/db/schema";
import { Link as LinkIcon, ExternalLink, Plus } from "lucide-react";
import { eq, desc, type InferSelectModel } from "drizzle-orm";
import { auth } from "@/lib/auth";
import Link from "next/link";

type StudentLink = InferSelectModel<typeof studentLinks>;

export default async function ProfileLinksPage() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) return <div>Unauthorized</div>;

  // Get student profile ID
  const profile = await db
    .select({ id: studentProfiles.id })
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, userId))
    .limit(1);

  let links: StudentLink[] = [];
  if (profile.length > 0) {
    links = await db
      .select()
      .from(studentLinks)
      .where(eq(studentLinks.studentId, profile[0].id))
      .orderBy(desc(studentLinks.createdAt));
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Links</h1>
          <p>Manage your portfolios, GitHub repositories, and social links for recruiters.</p>
        </div>
        <button className="btn btn-primary">
          <Plus size={18} /> Add New Link
        </button>
      </div>

      <div className="card">
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
          {links.length === 0 ? (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
              You haven't added any custom links yet. 
              Adding links to your GitHub or Portfolio significantly boosts placement chances!
            </div>
          ) : (
            links.map((link) => (
              <a 
                key={link.id}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "var(--space-4)", 
                  padding: "var(--space-4)",
                  border: "1px solid var(--border-color)",
                  borderRadius: "var(--radius-lg)",
                  transition: "all var(--transition-fast)",
                  textDecoration: "none",
                  color: "inherit"
                }}
                className="hover:shadow-md"
              >
                <div style={{ 
                  width: "48px", 
                  height: "48px", 
                  borderRadius: "12px", 
                  backgroundColor: "rgba(155, 46, 135, 0.1)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  <LinkIcon size={24} color="var(--primary-color)" />
                </div>
                <div style={{ flexGrow: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: "1.125rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {link.title}
                  </div>
                  <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "4px" }}>
                    Visit {link.platform || 'Link'} <ExternalLink size={12} />
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
