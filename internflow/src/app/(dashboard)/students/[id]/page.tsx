import { db } from "@/lib/db";
import { 
  users, 
  studentProfiles, 
  studentSkills, 
  studentCertifications, 
  studentProjects, 
  studentEducation 
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, GraduationCap,
  User, Briefcase, Award, ExternalLink, Code, BookOpen
} from "lucide-react";
import { StudentHierarchyEditor } from "./StudentHierarchyEditor";
import { getCollegeHierarchy } from "@/app/actions/hierarchy";

const studentSectionStyle: React.CSSProperties = {
  background: "var(--bg-primary)",
  border: "1px solid var(--border-color)",
  borderRadius: "var(--radius-lg)",
  padding: "var(--space-5)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
};

const studentSectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "1.1rem",
  fontWeight: 600,
  color: "var(--text-primary)",
  borderBottom: "1px solid var(--border-color)",
  paddingBottom: "var(--space-3)",
};

const studentFieldRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "var(--space-3)",
};

const studentFieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const studentLabelStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--text-muted)",
};

const studentValueStyle: React.CSSProperties = {
  fontSize: "0.9375rem",
  color: "var(--text-primary)",
  fontWeight: 500,
};

function StudentField({ label, value, href }: { label: string; value?: string | number | null; href?: string }) {
  if (!value) return null;
  return (
    <div style={studentFieldStyle}>
      <span style={studentLabelStyle}>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ ...studentValueStyle, color: "var(--primary-color)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
          {String(value)} <ExternalLink size={12} />
        </a>
      ) : (
        <span style={studentValueStyle}>{String(value)}</span>
      )}
    </div>
  );
}

export default async function StudentPortfolioPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) redirect("/");
  const canRepairStudentScope = [
    "tutor",
    "placement_coordinator",
    "hod",
    "dean",
    "placement_officer",
    "principal",
    "mcr",
    "management_corporation",
  ].includes(session.user.role || "");

  // Fetch student user
  const [studentUser] = await db
    .select()
    .from(users)
    .where(eq(users.id, params.id))
    .limit(1);

  if (!studentUser || studentUser.role !== "student") {
    redirect("/students");
  }

  // Fetch student profile data
  const [profile] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, params.id))
    .limit(1);

  // Fetch related records if profile exists
  let skills: typeof studentSkills.$inferSelect[] = [];
  let certifications: typeof studentCertifications.$inferSelect[] = [];
  let projects: typeof studentProjects.$inferSelect[] = [];
  let education: typeof studentEducation.$inferSelect[] = [];

  if (profile) {
    skills = await db.select().from(studentSkills).where(eq(studentSkills.studentId, profile.id));
    certifications = await db.select().from(studentCertifications).where(eq(studentCertifications.studentId, profile.id));
    projects = await db.select().from(studentProjects).where(eq(studentProjects.studentId, profile.id));
    education = await db.select().from(studentEducation).where(eq(studentEducation.studentId, profile.id));
  }
  const collegeHierarchy = canRepairStudentScope ? await getCollegeHierarchy() : [];

  return (
    <div className="animate-fade-in" style={{ maxWidth: "960px", margin: "0 auto", paddingBottom: "var(--space-8)" }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <Link href="/students" className="btn btn-ghost" style={{ padding: "8px 0", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "var(--text-secondary)" }}>
          <ArrowLeft size={16} /> Back to Directory
        </Link>
      </div>

      {/* Hero Header */}
      <div style={{
        background: "linear-gradient(135deg, var(--rathinam-blue), var(--rathinam-red))",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-6) var(--space-5)",
        color: "white",
        marginBottom: "var(--space-5)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-5)",
        flexWrap: "wrap",
      }}>
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "16px",
          background: "rgba(255,255,255,0.2)",
          backdropFilter: "blur(10px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {studentUser.avatarUrl ? (
            <Image src={studentUser.avatarUrl} alt={studentUser.firstName} width={80} height={80} style={{ width: "100%", height: "100%", borderRadius: "16px", objectFit: "cover" }} />
          ) : (
            <GraduationCap size={40} />
          )}
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>
            {studentUser.firstName} {studentUser.lastName}
          </h1>
          {profile?.department && (
            <p style={{ margin: "4px 0 0", opacity: 0.85, fontSize: "1rem" }}>
              {profile.department} {profile.year ? `• Year ${profile.year}` : ""} {profile.section ? `• Section ${profile.section}` : ""}
            </p>
          )}
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginTop: "var(--space-3)" }}>
            {profile?.registerNo && (
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8125rem" }}>
                {profile.registerNo}
              </span>
            )}
            {profile?.cgpa && (
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8125rem", fontWeight: 600 }}>
                CGPA: {profile.cgpa}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

        {/* Academic Overview */}
        <div style={studentSectionStyle}>
          <div style={studentSectionHeaderStyle}>
            <GraduationCap size={18} color="var(--primary-color)" /> Academic Overview
          </div>
          {profile?.professionalSummary && (
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
              {profile.professionalSummary}
            </p>
          )}
          <div style={studentFieldRowStyle}>
            <StudentField label="School" value={profile?.school} />
            <StudentField label="Program" value={profile?.program} />
            <StudentField label="Course" value={profile?.course} />
            <StudentField label="Batch" value={profile?.batchStartYear && profile?.batchEndYear ? `${profile.batchStartYear} - ${profile.batchEndYear}` : null} />
          </div>
        </div>

        {canRepairStudentScope && (
          <div style={studentSectionStyle}>
            <div style={studentSectionHeaderStyle}>
              <BookOpen size={18} color="var(--primary-color)" /> Repair Student Scope
            </div>
            <StudentHierarchyEditor
              studentId={params.id}
              initialValues={{
                registerNo: profile?.registerNo || "",
                school: profile?.school || "",
                section: profile?.section || "",
                course: profile?.course || "",
                programType: profile?.programType || "",
                department: profile?.department || "",
                year: profile?.year || 1,
                batchStartYear: profile?.batchStartYear || null,
                batchEndYear: profile?.batchEndYear || null,
              }}
              collegeHierarchy={collegeHierarchy}
            />
          </div>
        )}

        {/* Contact Info */}
        <div style={studentSectionStyle}>
          <div style={studentSectionHeaderStyle}>
            <User size={18} color="var(--primary-color)" /> Contact Information
          </div>
          <div style={studentFieldRowStyle}>
            <StudentField label="Email" value={studentUser.email} href={`mailto:${studentUser.email}`} />
            <StudentField label="Phone" value={studentUser.phone} href={studentUser.phone ? `tel:${studentUser.phone}` : undefined} />
            <StudentField label="LinkedIn" value={profile?.linkedinLink ? "View Profile" : null} href={profile?.linkedinLink || undefined} />
            <StudentField label="GitHub" value={profile?.githubLink ? "View GitHub" : null} href={profile?.githubLink || undefined} />
            <StudentField label="Portfolio" value={profile?.portfolioUrl ? "View Portfolio" : null} href={profile?.portfolioUrl || undefined} />
            <StudentField label="Resume" value={profile?.resumeUrl ? "Download Resume" : null} href={profile?.resumeUrl || undefined} />
          </div>
        </div>

        {/* Skills */}
        {skills.length > 0 && (
          <div style={studentSectionStyle}>
            <div style={studentSectionHeaderStyle}>
              <Code size={18} color="var(--primary-color)" /> Skills
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {skills.map((skill, index) => (
                <span key={index} style={{
                  background: skill.isTop ? "var(--primary-color)" : "var(--primary-light)",
                  color: skill.isTop ? "white" : "var(--primary-color)",
                  padding: "4px 12px",
                  borderRadius: "20px",
                  fontSize: "0.8125rem",
                  fontWeight: 500,
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  {skill.isTop && <Award size={12} />}
                  {skill.skillName} {skill.proficiency && <span style={{ opacity: 0.7, fontSize: "0.75rem" }}>({skill.proficiency})</span>}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Education History */}
        {education.length > 0 && (
          <div style={studentSectionStyle}>
            <div style={studentSectionHeaderStyle}>
              <BookOpen size={18} color="var(--primary-color)" /> Education History
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {education.map((edu, index) => (
                <div key={index} style={{ padding: "var(--space-3)", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)" }}>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "1rem", color: "var(--text-primary)" }}>{edu.institution}</h3>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "var(--text-secondary)" }}>
                      {edu.degree} {edu.fieldOfStudy && `in ${edu.fieldOfStudy}`}
                    </p>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)", fontWeight: 500 }}>
                      {edu.startYear} - {edu.endYear || 'Present'}
                    </span>
                  </div>
                  {edu.score && (
                    <p style={{ margin: "4px 0 0", fontSize: "0.875rem", color: "var(--text-primary)", fontWeight: 500 }}>
                      {edu.scoreType || 'Score'}: {edu.score}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Projects */}
        {projects.length > 0 && (
          <div style={studentSectionStyle}>
            <div style={studentSectionHeaderStyle}>
              <Briefcase size={18} color="var(--primary-color)" /> Projects
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
              {projects.map((project, index) => (
                <div key={index} style={{ padding: "var(--space-4)", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border-color)", display: "flex", flexDirection: "column" }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "1rem", color: "var(--text-primary)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    {project.title}
                    {project.projectUrl && (
                      <a href={project.projectUrl} target="_blank" rel="noopener noreferrer" style={{ color: "var(--primary-color)" }}>
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </h3>
                  <p style={{ margin: "0 0 12px 0", fontSize: "0.875rem", color: "var(--text-secondary)", flex: 1 }}>
                    {project.description}
                  </p>
                  {project.technologies && project.technologies.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {project.technologies.map((tech, i) => (
                        <span key={i} style={{ background: "var(--bg-primary)", border: "1px solid var(--border-color)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Certifications */}
        {certifications.length > 0 && (
          <div style={studentSectionStyle}>
            <div style={studentSectionHeaderStyle}>
              <Award size={18} color="var(--primary-color)" /> Certifications
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "var(--space-3)" }}>
              {certifications.map((cert, index) => (
                <div key={index} style={{ padding: "var(--space-3)", background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                  <div style={{ width: "32px", height: "32px", background: "var(--primary-light)", color: "var(--primary-color)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Award size={16} />
                  </div>
                  <div>
                    <h4 style={{ margin: "0 0 2px 0", fontSize: "0.9375rem", color: "var(--text-primary)" }}>{cert.name}</h4>
                    <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-secondary)" }}>{cert.issuingOrg}</p>
                    {cert.issueDate && <p style={{ margin: "2px 0 0", fontSize: "0.75rem", color: "var(--text-muted)" }}>Issued: {cert.issueDate}</p>}
                    {cert.credentialUrl && (
                      <a href={cert.credentialUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "0.75rem", color: "var(--primary-color)", textDecoration: "none", marginTop: "4px", fontWeight: 500 }}>
                        View Credential <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
