import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import {
  users,
  studentProfiles,
  studentSkills,
  studentProjects,
  studentCertifications,
  studentEducation,
  studentLinks,
  studentJobInterests,
  placementReadiness,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import {
  GraduationCap,
  Briefcase,
  Award,
  FolderGit2,
  Link2,
  Calendar,
  Star,
  ExternalLink,
  Code2,
  Globe,
  Download,
  ShieldCheck,
  BadgeCheck,
  BookOpen,
} from "lucide-react";

const AUTHORITY_ROLES = ["tutor", "placement_coordinator", "hod", "dean", "placement_officer", "principal"];

export default async function PortfolioPage(props: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { id: studentUserId } = await props.params;
  const viewerRole = session.user.role;
  const viewerId = session.user.id;

  // Access control: self, authorities, or companies only
  const isSelf = viewerId === studentUserId;
  const isAuthority = AUTHORITY_ROLES.includes(viewerRole);
  const isCompany = viewerRole === "company" || viewerRole === "company_staff";

  if (!isSelf && !isAuthority && !isCompany) {
    return (
      <div className="animate-fade-in" style={{ textAlign: "center", padding: "80px 20px" }}>
        <ShieldCheck size={48} color="var(--color-warning)" style={{ marginBottom: "16px" }} />
        <h2>Access Restricted</h2>
        <p style={{ color: "var(--text-secondary)" }}>
          Student portfolios are only visible to university authorities, partner companies, and the student themselves.
        </p>
      </div>
    );
  }

  // Fetch all student data
  const [user] = await db.select().from(users).where(eq(users.id, studentUserId)).limit(1);
  if (!user || user.role !== "student") return notFound();

  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, studentUserId)).limit(1);
  if (!profile) {
    return (
      <div className="animate-fade-in" style={{ textAlign: "center", padding: "80px 20px" }}>
        <BookOpen size={48} color="var(--text-secondary)" style={{ marginBottom: "16px" }} />
        <h2>Profile Not Yet Created</h2>
        <p style={{ color: "var(--text-secondary)" }}>This student has not completed their profile setup.</p>
      </div>
    );
  }

  const [skills, projects, certifications, education, links, interests, readiness] = await Promise.all([
    db.select().from(studentSkills).where(eq(studentSkills.studentId, profile.id)),
    db.select().from(studentProjects).where(eq(studentProjects.studentId, profile.id)),
    db.select().from(studentCertifications).where(eq(studentCertifications.studentId, profile.id)),
    db.select().from(studentEducation).where(eq(studentEducation.studentId, profile.id)),
    db.select().from(studentLinks).where(eq(studentLinks.studentId, profile.id)),
    db.select().from(studentJobInterests).where(eq(studentJobInterests.studentId, profile.id)),
    db.select().from(placementReadiness).where(eq(placementReadiness.studentId, profile.id)).limit(1),
  ]);

  const hardSkills = skills.filter(s => s.skillType === "hard");
  const softSkills = skills.filter(s => s.skillType === "soft");
  const langSkills = skills.filter(s => s.skillType === "language");

  const badgeLevel = readiness[0]?.badgeLevel || "beginner";
  const totalScore = readiness[0]?.totalScore || 0;

  const badgeColors: Record<string, string> = {
    beginner: "#94a3b8",
    intermediate: "#3b82f6",
    advanced: "#8b5cf6",
    expert: "#f59e0b",
    legend: "#10b981",
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* ── Hero Section ── */}
      <div style={{
        background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)",
        borderRadius: "var(--border-radius-lg)",
        padding: "40px 32px",
        color: "white",
        marginBottom: "var(--space-8)",
        position: "relative",
        overflow: "hidden",
      }}>
        {/* Decorative circles */}
        <div style={{ position: "absolute", top: "-40px", right: "-40px", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(255,255,255,0.08)" }} />
        <div style={{ position: "absolute", bottom: "-60px", left: "-30px", width: "150px", height: "150px", borderRadius: "50%", background: "rgba(255,255,255,0.05)" }} />

        <div style={{ display: "flex", alignItems: "center", gap: "24px", position: "relative", zIndex: 1, flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{
            width: "100px", height: "100px", borderRadius: "50%", border: "4px solid rgba(255,255,255,0.3)",
            background: user.avatarUrl ? `url(${user.avatarUrl}) center/cover` : "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2.5rem", fontWeight: "bold", color: "rgba(255,255,255,0.8)",
            flexShrink: 0,
          }}>
            {!user.avatarUrl && `${user.firstName[0]}${user.lastName[0]}`}
          </div>

          <div style={{ flex: 1, minWidth: "200px" }}>
            <h1 style={{ margin: 0, fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.03em" }}>
              {user.firstName} {user.lastName}
            </h1>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "8px", alignItems: "center" }}>
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.875rem", fontWeight: 600 }}>
                {profile.registerNo}
              </span>
              <span style={{ opacity: 0.9, fontSize: "0.9rem" }}>{profile.department}</span>
              <span style={{ opacity: 0.7, fontSize: "0.85rem" }}>Year {profile.year}{profile.section ? ` • Section ${profile.section}` : ""}</span>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginTop: "16px", alignItems: "center" }}>
              {profile.cgpa && (
                <div style={{ background: "rgba(255,255,255,0.15)", padding: "8px 16px", borderRadius: "8px", textAlign: "center" }}>
                  <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{profile.cgpa}</div>
                  <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>CGPA</div>
                </div>
              )}
              <div style={{ background: "rgba(255,255,255,0.15)", padding: "8px 16px", borderRadius: "8px", textAlign: "center" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 800 }}>{totalScore}</div>
                <div style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.1em", opacity: 0.8 }}>Readiness</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", background: badgeColors[badgeLevel] + "33", padding: "6px 14px", borderRadius: "20px" }}>
                <BadgeCheck size={16} />
                <span style={{ fontSize: "0.85rem", fontWeight: 600, textTransform: "capitalize" }}>{badgeLevel}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Professional Summary ── */}
      {profile.professionalSummary && (
        <div className="card" style={{ marginBottom: "var(--space-6)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Briefcase size={18} color="var(--color-primary)" /> About
          </h2>
          <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>{profile.professionalSummary}</p>
        </div>
      )}

      {/* ── Quick Links Row ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "var(--space-6)" }}>
        {profile.githubLink && (
          <a href={profile.githubLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none" }}>
            <Code2 size={16} /> GitHub
          </a>
        )}
        {profile.linkedinLink && (
          <a href={profile.linkedinLink} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none" }}>
            <Link2 size={16} /> LinkedIn
          </a>
        )}
        {profile.portfolioUrl && (
          <a href={profile.portfolioUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none" }}>
            <Globe size={16} /> Portfolio
          </a>
        )}
        {profile.resumeUrl && (
          <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn" style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 16px", fontSize: "0.85rem", textDecoration: "none", background: "var(--primary-color)", color: "white", border: "none" }}>
            <Download size={16} /> Download Resume
          </a>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-6)" }}>
        {/* ── Skills ── */}
        <div className="card" style={{ gridColumn: hardSkills.length + softSkills.length + langSkills.length > 8 ? "1 / -1" : undefined }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Star size={18} color="#f59e0b" /> Skills
          </h2>
          {hardSkills.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "8px", letterSpacing: "0.05em" }}>Technical</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {hardSkills.map(s => (
                  <span key={s.id} style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 500 }}>
                    {s.skillName}{s.proficiency ? ` • ${s.proficiency}` : ""}
                  </span>
                ))}
              </div>
            </div>
          )}
          {softSkills.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "8px", letterSpacing: "0.05em" }}>Soft Skills</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {softSkills.map(s => (
                  <span key={s.id} style={{ background: "rgba(16,185,129,0.1)", color: "#10b981", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 500 }}>
                    {s.skillName}
                  </span>
                ))}
              </div>
            </div>
          )}
          {langSkills.length > 0 && (
            <div>
              <p style={{ fontSize: "0.75rem", fontWeight: 600, textTransform: "uppercase", color: "var(--text-secondary)", marginBottom: "8px", letterSpacing: "0.05em" }}>Languages</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                {langSkills.map(s => (
                  <span key={s.id} style={{ background: "rgba(245,158,11,0.1)", color: "#f59e0b", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: 500 }}>
                    {s.skillName}
                  </span>
                ))}
              </div>
            </div>
          )}
          {skills.length === 0 && <p style={{ color: "var(--text-secondary)", fontSize: "0.875rem" }}>No skills added yet.</p>}
        </div>

        {/* ── Job Interests ── */}
        {interests.length > 0 && (
          <div className="card">
            <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Briefcase size={18} color="var(--color-info)" /> Interests
            </h2>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {interests.map(i => (
                <div key={i.id} style={{ background: "var(--bg-hover)", padding: "8px 14px", borderRadius: "8px", fontSize: "0.85rem" }}>
                  <span style={{ fontWeight: 600 }}>{i.roleName}</span>
                  <span style={{ color: "var(--text-secondary)", marginLeft: "6px", fontSize: "0.75rem" }}>{i.roleCategory}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── Projects ── */}
      {projects.length > 0 && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <FolderGit2 size={18} color="#8b5cf6" /> Projects
          </h2>
          <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
            {projects.map(p => (
              <div key={p.id} className="card" style={{ borderLeft: "3px solid #8b5cf6" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, margin: 0 }}>{p.title}</h3>
                  {p.projectUrl && (
                    <a href={p.projectUrl} target="_blank" rel="noopener noreferrer" style={{ color: "#8b5cf6", flexShrink: 0 }}>
                      <ExternalLink size={16} />
                    </a>
                  )}
                </div>
                <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginTop: "8px", lineHeight: 1.5 }}>{p.description}</p>
                {p.technologies && p.technologies.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginTop: "10px" }}>
                    {p.technologies.map((t, i) => (
                      <span key={i} style={{ background: "rgba(139,92,246,0.1)", color: "#8b5cf6", padding: "2px 8px", borderRadius: "4px", fontSize: "0.7rem", fontWeight: 500 }}>{t}</span>
                    ))}
                  </div>
                )}
                {(p.startDate || p.endDate) && (
                  <p style={{ color: "var(--text-secondary)", fontSize: "0.75rem", marginTop: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Calendar size={12} /> {p.startDate || "?"} — {p.endDate || "Present"}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Certifications ── */}
      {certifications.length > 0 && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Award size={18} color="#f59e0b" /> Certifications
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {certifications.map(c => (
              <div key={c.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 20px" }}>
                <div>
                  <p style={{ fontWeight: 600, margin: 0 }}>{c.name}</p>
                  <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                    {c.issuingOrg}{c.issueDate ? ` • ${c.issueDate}` : ""}
                  </p>
                </div>
                {c.credentialUrl && (
                  <a href={c.credentialUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ padding: "6px 12px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
                    <ExternalLink size={14} /> View
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Education ── */}
      {education.length > 0 && (
        <div style={{ marginTop: "var(--space-6)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <GraduationCap size={18} color="#0ea5e9" /> Education
          </h2>
          <div style={{ borderLeft: "2px solid var(--border-color)", paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {education.map(e => (
              <div key={e.id} style={{ position: "relative" }}>
                <div style={{ position: "absolute", left: "-27px", top: "4px", width: "12px", height: "12px", borderRadius: "50%", background: "#0ea5e9", border: "2px solid var(--bg-primary)" }} />
                <p style={{ fontWeight: 600, margin: 0 }}>{e.institution}</p>
                <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", margin: "4px 0 0 0" }}>
                  {e.degree}{e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ""}
                </p>
                <p style={{ fontSize: "0.8rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>
                  {e.startYear || "?"} — {e.endYear || "Present"}
                  {e.score ? ` • ${e.scoreType || "Score"}: ${e.score}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Links ── */}
      {links.length > 0 && (
        <div style={{ marginTop: "var(--space-6)", marginBottom: "var(--space-8)" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 700, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Link2 size={18} color="#ec4899" /> Links
          </h2>
          <div className="grid grid-3" style={{ gap: "var(--space-3)" }}>
            {links.filter(l => l.isActive).map(l => (
              <a key={l.id} href={l.url} target="_blank" rel="noopener noreferrer"
                className="card" style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "10px", padding: "14px 16px", cursor: "pointer", transition: "transform 0.15s", border: "1px solid var(--border-color)" }}
                onMouseEnter={(e) => e.currentTarget.style.transform = "translateY(-2px)"}
                onMouseLeave={(e) => e.currentTarget.style.transform = "translateY(0)"}
              >
                <ExternalLink size={16} color="var(--color-primary)" />
                <div>
                  <p style={{ fontWeight: 600, margin: 0, fontSize: "0.9rem" }}>{l.title}</p>
                  {l.platform && <p style={{ fontSize: "0.75rem", color: "var(--text-secondary)", margin: "2px 0 0 0" }}>{l.platform}</p>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
