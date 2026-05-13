import { notFound } from "next/navigation";
import { getPublicProfile } from "@/app/actions/vcard";
import { MapPin, Briefcase, GraduationCap, Link as LinkIcon, Code, ExternalLink, Award, FileText } from "lucide-react";
import { GitHubHeatmap } from "@/components/profile/GitHubHeatmap";
import Link from "next/link";
import Image from "next/image";

type PublicProfile = {
  isPublic?: boolean;
  avatarUrl?: string | null;
  firstName: string;
  lastName: string;
  year?: number | string;
  department?: string;
  professionalSummary?: string | null;
  links?: Array<{ platform?: string | null; url?: string | null; title?: string | null }>;
  projects?: Array<{ title: string; projectUrl?: string | null; description?: string | null }>;
  certifications?: Array<{ name: string; issuingOrg?: string | null; credentialUrl?: string | null }>;
  skills?: Array<{ skillType?: string | null; proficiency?: string | null; skillName: string }>;
};

export default async function VCardPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const profile = (await getPublicProfile(params.id)) as PublicProfile | null;

  if (!profile) return notFound();

  if (!profile.isPublic) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", padding: "var(--space-4)" }}>
        <div className="card" style={{ maxWidth: 400, textAlign: "center" }}>
          <Briefcase size={48} color="var(--color-primary)" style={{ margin: "0 auto var(--space-4)" }} />
          <h2>Profile Private</h2>
          <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-6)" }}>
            This student has not made their profile public.
          </p>
          <Link href="/" className="btn btn-primary" style={{ display: "inline-flex" }}>
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  // Find github username
  const githubLink = profile.links?.find((l) => l.platform?.toLowerCase() === "github" && l.url);
  let githubUser = null;
  if (githubLink?.url) {
    try {
      const url = new URL(githubLink.url);
      githubUser = url.pathname.split("/").filter(Boolean)[0] || "intern";
    } catch {
      githubUser = "intern";
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-secondary)", paddingBottom: "var(--space-12)" }}>
      {/* Banner */}
      <div style={{ height: "240px", background: "var(--gradient-primary)", position: "relative" }}>
        <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0naHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmcnIHdpZHRoPScxMDAlJyBoZWlnaHQ9JzEwMCUnPjxmaWx0ZXIgaWQ9J24nPjxmZVR1cmJ1bGVuY2UgdHlwZT0nZnJhY3RhbE5vaXNlJyBiYXNlRnJlcXVlbmN5PScwLjA1JyB5Y2hhbm5lbFNlbGVjdG9yPSdHJyBudW1PY3RhdmVzPSczJyBzdGl0Y2hUaWxlcz0nc3RpdGNoJy8+PC9maWx0ZXI+PHJlY3Qgd2lkdGg9JzEwMCUnIGhlaWdodD0nMTAwJScgZmlsdGVyPSd1cmwoI24pJyBvcGFjaXR5PScwLjA1Jy8+PC9zdmc+')", opacity: 0.1 }} />
      </div>

      <div style={{ maxWidth: "800px", margin: "-80px auto 0", padding: "0 var(--space-4)", position: "relative", zIndex: 10 }}>
        {/* Header Card */}
        <div className="card animate-fade-in" style={{ padding: "var(--space-6)", marginBottom: "var(--space-6)", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
          <div style={{ 
            width: 120, 
            height: 120, 
            borderRadius: "50%", 
            background: "var(--bg-card)", 
            padding: "4px",
            boxShadow: "0 8px 16px rgba(0,0,0,0.1)",
            marginBottom: "var(--space-4)"
          }}>
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt={profile.firstName} width={120} height={120} style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: "var(--gradient-accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "3rem", color: "white", fontWeight: "bold" }}>
                {profile.firstName[0]}{profile.lastName[0]}
              </div>
            )}
          </div>

          <h1 style={{ fontSize: "2rem", marginBottom: "var(--space-2)" }}>{profile.firstName} {profile.lastName}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", color: "var(--text-secondary)", marginBottom: "var(--space-4)", flexWrap: "wrap", justifyContent: "center" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><GraduationCap size={16} /> Year {profile.year}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Briefcase size={16} /> {profile.department}</span>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><MapPin size={16} /> Rathinam Techzone</span>
          </div>

          <p style={{ maxWidth: "600px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
            {profile.professionalSummary || "A passionate tech enthusiast seeking new opportunities to learn and grow."}
          </p>
        </div>

        <div className="grid grid-2" style={{ gap: "var(--space-6)" }}>
          {/* Main Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            
            {githubUser && (
              <div className="card stagger-1" style={{ 
                "--github-level-0": "var(--bg-secondary)",
                "--github-level-1": "rgba(46, 160, 67, 0.4)",
                "--github-level-2": "rgba(46, 160, 67, 0.6)",
                "--github-level-3": "rgba(46, 160, 67, 0.8)",
                "--github-level-4": "rgba(46, 160, 67, 1)",
              } as React.CSSProperties}>
                <GitHubHeatmap username={githubUser} />
              </div>
            )}

            {/* Projects */}
            {(profile.projects?.length ?? 0) > 0 && (
              <div className="card stagger-2">
                <h2 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
                  <Code size={20} color="var(--color-primary)" /> Top Projects
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  {profile.projects?.map((p, i: number) => (
                    <div key={i} style={{ borderLeft: "2px solid var(--border-color)", paddingLeft: "16px" }}>
                      <h3 style={{ margin: "0 0 4px 0", display: "flex", justifyContent: "space-between" }}>
                        {p.title}
                        {p.projectUrl && (
                          <a href={p.projectUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}><ExternalLink size={14} /></a>
                        )}
                      </h3>
                      <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{p.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Certifications */}
            {(profile.certifications?.length ?? 0) > 0 && (
              <div className="card stagger-3">
                <h2 style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-4)" }}>
                  <Award size={20} color="var(--color-warning)" /> Certifications
                </h2>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                  {profile.certifications?.map((c, i: number) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
                      <div style={{ width: 32, height: 32, background: "var(--bg-hover)", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-warning)" }}>
                        <FileText size={16} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: "0 0 2px 0" }}>{c.name}</h3>
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          <span>{c.issuingOrg}</span>
                          {c.credentialUrl && <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--color-primary)" }}>Verify</a>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
            
            {/* Links Block */}
            {(profile.links?.length ?? 0) > 0 && (
              <div className="card stagger-1" style={{ padding: "0" }}>
                {profile.links?.filter((link) => Boolean(link.url)).map((link, i: number) => (
                  <a 
                    key={i} 
                    href={link.url || undefined}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="vcard-link"
                    style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "12px", 
                      padding: "16px",
                      borderBottom: "1px solid var(--border-color)",
                      color: "inherit",
                      textDecoration: "none",
                      transition: "background var(--transition-fast)"
                    }}
                  >
                    <div style={{ width: 40, height: 40, background: "var(--bg-secondary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)" }}>
                      <LinkIcon size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ margin: 0, fontSize: "1rem" }}>{link.title}</h3>
                      <p style={{ margin: 0, fontSize: "0.75rem", color: "var(--text-muted)" }}>{link.platform || "External Link"}</p>
                    </div>
                    <ExternalLink size={16} color="var(--text-muted)" />
                  </a>
                ))}
              </div>
            )}

            {/* Skills */}
            {(profile.skills?.length ?? 0) > 0 && (
              <div className="card stagger-2">
                <h2 style={{ fontSize: "1rem", marginBottom: "var(--space-4)" }}>Core Skills</h2>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {profile.skills?.map((s, i: number) => (
                    <span 
                      key={i} 
                      style={{ 
                        padding: "6px 14px", 
                        background: s.skillType === "soft" ? "rgba(139, 92, 246, 0.1)" : "var(--bg-hover)", 
                        color: s.skillType === "soft" ? "#8b5cf6" : "inherit",
                        borderRadius: "100px", 
                        fontSize: "0.875rem",
                        border: s.proficiency === "expert" ? "1px solid var(--color-primary)" : "none"
                      }}
                    >
                      {s.skillName}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>

      </div>
    </main>
  );
}
