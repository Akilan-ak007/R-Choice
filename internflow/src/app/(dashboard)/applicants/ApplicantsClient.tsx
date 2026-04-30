"use client";

import React, { useState } from "react";
import { UserCircle, Briefcase, Calendar, CheckCircle2, ChevronRight, CheckSquare, Star, StarOff } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";
import { postCompanyResults, shortlistApplicant } from "@/app/actions/applications";
import { fetchFullStudentProfile } from "@/app/actions/profile";
import { X, ExternalLink, GraduationCap, Code, Award, Target, Download } from "lucide-react";
import { exportToCSV } from "@/lib/export-utils";

type ApplicantRow = {
  id: string;
  applicationId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  status: string | null;
  appliedAt: string | Date | null;
  jobId: string;
  jobTitle: string;
  resumeUrl: string | null;
};

type FullProfile = {
  user: { avatarUrl?: string | null; firstName: string; lastName: string; email: string; phone?: string | null };
  profile: { registerNo?: string | null; school?: string | null; program?: string | null; programType?: string | null; course?: string | null; department?: string | null; year?: number | null; section?: string | null; batchStartYear?: number | null; batchEndYear?: number | null; dob?: string | null; professionalSummary?: string | null; cgpa?: string | null; profileCompletionScore?: number | null; resumeUrl?: string | null; githubLink?: string | null; linkedinLink?: string | null; portfolioUrl?: string | null };
  education: Array<{ degree: string; fieldOfStudy?: string | null; institution: string; startYear?: number | null; endYear?: number | null; score?: string | null }>;
  projects: Array<{ title: string; projectUrl?: string | null; description?: string | null }>;
  skills: Array<{ skillName: string; skillType?: string | null; proficiency?: string | null }>;
  certs: Array<{ name: string; issuingOrg?: string | null; credentialUrl?: string | null }>;
  links: Array<{ platform?: string | null; url?: string | null; title?: string | null }>;
};

export default function ApplicantsClient({ initialApplicants, currentPage = 1, totalPages = 1 }: { initialApplicants: ApplicantRow[], currentPage?: number, totalPages?: number }) {
  const [applicants, setApplicants] = useState<ApplicantRow[]>(initialApplicants);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isPosting, setIsPosting] = useState(false);
  const [viewingProfile, setViewingProfile] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<FullProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);

  const fetchProfile = async (studentId: string) => {
    setViewingProfile(studentId);
    setIsLoadingProfile(true);
    try {
      const res = await fetchFullStudentProfile(studentId);
      if (res.success && res.data) {
        setProfileData(res.data);
      } else {
        toast.error("Failed to load full profile.");
        setViewingProfile(null);
      }
    } catch {
      toast.error("Error loading profile");
      setViewingProfile(null);
    }
    setIsLoadingProfile(false);
  };


  const toggleSelect = (applicationId: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(applicationId)) newSet.delete(applicationId);
    else newSet.add(applicationId);
    setSelectedIds(newSet);
  };

  const handleShortlist = async (applicationId: string) => {
    try {
      const res = await shortlistApplicant(applicationId);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(res.newStatus === "shortlisted" ? "Candidate shortlisted!" : "Shortlist removed.");
        setApplicants(prev => prev.map(a => a.applicationId === applicationId ? { ...a, status: res.newStatus ?? null } : a));
      }
    } catch {
      toast.error("Failed to update shortlist.");
    }
  };

  const handlePostResults = async () => {
    if (selectedIds.size === 0) {
      toast.error("Select at least one candidate to shortlist.");
      return;
    }

    setIsPosting(true);
    toast.loading("Sending Verification Emails to shortlisted candidates...", { id: "posting-results" });
    
    // Group selected applicationIds by Job ID, resolving student IDs
    const groupedByJob: Record<string, string[]> = {};
    Array.from(selectedIds).forEach(appId => {
      const app = applicants.find(a => a.applicationId === appId);
      if (app) {
        if (!groupedByJob[app.jobId]) groupedByJob[app.jobId] = [];
        groupedByJob[app.jobId].push(app.id); // pass studentId to server action
      }
    });

    try {
      let overallSuccess = true;
      for (const [jobId, studentIds] of Object.entries(groupedByJob)) {
        const res = await postCompanyResults(jobId, studentIds);
        if (res.error) {
          overallSuccess = false;
          toast.error(`Error for job ${jobId}: ${res.error}`, { id: "posting-results" });
        }
      }

      if (overallSuccess) {
        toast.success(`Verification Emails sent to ${selectedIds.size} candidates!`, { id: "posting-results" });
        // Update local state directly — match by applicationId
        setApplicants(prev => prev.map(a => selectedIds.has(a.applicationId) ? { ...a, status: "selected" } : a));
        setSelectedIds(new Set());
      }
    } catch {
      toast.error("An unexpected error occurred.", { id: "posting-results" });
    }
    setIsPosting(false);
  };

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div style={{ flex: "1 1 300px" }}>
          <h1 style={{ margin: "0 0 8px 0" }}>Applicants Repository</h1>
          <p style={{ margin: 0, color: "var(--text-secondary)" }}>Review student applications, view their resumes, and post final shortlisting results directly to the college.</p>
        </div>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          {applicants.length > 0 && (
            <button
              onClick={() => exportToCSV("applicants.csv", applicants.map(a => ({ ID: a.id, Name: `${a.firstName} ${a.lastName}`, Email: a.email, Role: a.jobTitle, Status: a.status })))}
              className="btn btn-outline"
              style={{ display: "flex", gap: "8px", alignItems: "center" }}
            >
              <Download size={18} /> Export List
            </button>
          )}
          {selectedIds.size > 0 && (
            <button onClick={handlePostResults} disabled={isPosting} className="btn btn-primary" style={{ display: "flex", gap: "8px", alignItems: "center" }}>
              {isPosting ? <span className="spinner"></span> : <CheckCircle2 size={18} />}
              Post Results ({selectedIds.size})
            </button>
          )}
        </div>
      </div>

      <div className="card">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-color)", background: "var(--bg-elevated)" }}>
                <th style={{ padding: "var(--space-4)", width: "50px" }}><CheckSquare size={18} color="var(--text-secondary)" /></th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Candidate Profile</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Applied For</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Status</th>
                <th style={{ padding: "var(--space-4)", color: "var(--text-secondary)", fontWeight: 500 }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {applicants.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: "center", padding: "var(--space-8)", color: "var(--text-secondary)" }}>
                    No applications received yet.
                  </td>
                </tr>
              ) : (
                applicants.map((app) => (
                  <tr key={app.applicationId} style={{ borderBottom: "1px solid var(--border-color)", transition: "background-color 0.2s", backgroundColor: selectedIds.has(app.applicationId) ? "rgba(99,102,241,0.06)" : app.status === "shortlisted" ? "rgba(245,158,11,0.04)" : "transparent" }}>
                    <td style={{ padding: "var(--space-4)" }}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.has(app.applicationId)} 
                        onChange={() => toggleSelect(app.applicationId)}
                        disabled={app.status === "selected"}
                        style={{ cursor: app.status === "selected" ? "not-allowed" : "pointer" }}
                      />
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)" }}>
                          {app.avatarUrl ? <Image src={app.avatarUrl} alt="Avatar" width={40} height={40} style={{width: "100%", height: "100%", objectFit:"cover"}} /> : <UserCircle size={24} color="var(--text-secondary)" />}
                        </div>
                        <div>
                          <Link href={`/portfolio/${app.id}`} style={{ fontWeight: 600, color: "var(--primary-color)", textDecoration: "none" }}>
                            {app.firstName} {app.lastName}
                          </Link>
                          <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)" }}>{app.email}</div>
                          {app.resumeUrl && (
                            <a href={app.resumeUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.75rem", color: "var(--primary-color)", marginTop: "4px", display: "inline-block", textDecoration: "none" }}>
                              View Resume PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ fontWeight: 500, display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                        <Briefcase size={16} /> {app.jobTitle}
                      </div>
                      <div style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Calendar size={14} /> {app.appliedAt ? format(new Date(app.appliedAt), "MMM d, yyyy") : "N/A"}
                      </div>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <span className={`status-pill status-${app.status === 'selected' ? 'approved' : app.status === 'shortlisted' ? 'pending' : 'draft'}`}>
                        {app.status === 'selected' ? '✓ Selected' : app.status === 'shortlisted' ? '★ Shortlisted' : 'Applied'}
                      </span>
                    </td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        {app.status !== "selected" && (
                          <button
                            className="btn btn-outline"
                            style={{ padding: "4px 10px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", color: app.status === "shortlisted" ? "#f59e0b" : undefined, borderColor: app.status === "shortlisted" ? "#f59e0b" : undefined }}
                            onClick={() => handleShortlist(app.applicationId)}
                          >
                            {app.status === "shortlisted" ? <StarOff size={14} /> : <Star size={14} />}
                            {app.status === "shortlisted" ? "Undo" : "Shortlist"}
                          </button>
                        )}
                        <button
                          className="btn btn-outline"
                          style={{ padding: "4px 8px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}
                          onClick={() => fetchProfile(app.id)}
                        >
                          Profile <ChevronRight size={14} />
                        </button>
                        <Link href={`/portfolio/${app.id}`} className="btn btn-outline" style={{ padding: "4px 8px", fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px", textDecoration: "none" }}>
                          Portfolio <ChevronRight size={14} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginTop: "24px" }}>
          <a
             href={`?page=${currentPage - 1}`}
             className="btn btn-outline"
             style={{ opacity: currentPage <= 1 ? 0.5 : 1, pointerEvents: currentPage <= 1 ? "none" : "auto", display: "inline-block", textDecoration: "none" }}
          >
            Previous
          </a>
          <span style={{ display: "flex", alignItems: "center", fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
             Page {currentPage} of {totalPages}
          </span>
          <a
             href={`?page=${currentPage + 1}`}
             className="btn btn-outline"
             style={{ opacity: currentPage >= totalPages ? 0.5 : 1, pointerEvents: currentPage >= totalPages ? "none" : "auto", display: "inline-block", textDecoration: "none" }}
          >
            Next
          </a>
        </div>
      )}

      {/* Full Profile Modal */}
      {viewingProfile && (
        <div style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }} onClick={() => setViewingProfile(null)}>
          <div className="card" onClick={e => e.stopPropagation()} style={{ width: "90%", maxWidth: "800px", maxHeight: "90vh", overflowY: "auto", position: "relative", padding: "0" }}>
            <button onClick={() => setViewingProfile(null)} style={{ position: "sticky", top: "16px", left: "calc(100% - 40px)", zIndex: 10, background: "var(--bg-elevated)", border: "none", borderRadius: "50%", padding: "8px", cursor: "pointer", boxShadow: "var(--shadow-sm)" }}>
              <X size={20} color="var(--text-primary)" />
            </button>
            
            {isLoadingProfile ? (
              <div style={{ padding: "100px", textAlign: "center" }}><span className="spinner"></span><p style={{ marginTop: "16px", color: "var(--text-secondary)" }}>Loading full profile...</p></div>
            ) : profileData ? (
              <div>
                {/* Header */}
                <div style={{ background: "linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%)", padding: "28px 32px", color: "white" }}>
                  <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
                    <div style={{ width: "80px", height: "80px", borderRadius: "50%", overflow: "hidden", border: "3px solid rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {profileData.user.avatarUrl ? <Image src={profileData.user.avatarUrl} alt="Avatar" width={80} height={80} style={{width: "100%", height: "100%", objectFit:"cover"}} /> : <UserCircle size={48} color="rgba(255,255,255,0.8)" />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h2 style={{ fontSize: "1.5rem", margin: 0, fontWeight: 700 }}>{profileData.user.firstName} {profileData.user.lastName}</h2>
                      {profileData.profile.registerNo && <p style={{ fontSize: "0.85rem", opacity: 0.9, margin: "4px 0 0 0" }}>Reg: {profileData.profile.registerNo}</p>}
                      <p style={{ fontSize: "0.9rem", opacity: 0.85, margin: "2px 0 0 0" }}>
                        {profileData.profile.department}{profileData.profile.section ? ` • Sec ${profileData.profile.section}` : ""}{profileData.profile.year ? ` • Year ${profileData.profile.year}` : ""}
                      </p>
                      <div style={{ display: "flex", gap: "16px", marginTop: "8px", flexWrap: "wrap", fontSize: "0.85rem", opacity: 0.9 }}>
                        <span>📧 {profileData.user.email}</span>
                        {profileData.user.phone && <span>📱 {profileData.user.phone}</span>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats Bar */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "1px", background: "var(--border-color)", borderBottom: "1px solid var(--border-color)" }}>
                  {[
                    { label: "CGPA", value: profileData.profile.cgpa || "N/A", color: "var(--primary-color)" },
                    { label: "Profile Score", value: `${profileData.profile.profileCompletionScore || 0}/100`, color: "#10b981" },
                    { label: "Program", value: profileData.profile.programType || profileData.profile.program || "—", color: "#8b5cf6" },
                    { label: "Batch", value: profileData.profile.batchStartYear && profileData.profile.batchEndYear ? `${profileData.profile.batchStartYear}-${profileData.profile.batchEndYear}` : "—", color: "#f59e0b" },
                  ].map((stat, i) => (
                    <div key={i} style={{ background: "var(--bg-primary)", padding: "14px 16px", textAlign: "center" }}>
                      <div style={{ fontSize: "1.1rem", fontWeight: 700, color: stat.color }}>{stat.value}</div>
                      <div style={{ fontSize: "0.65rem", textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginTop: "2px" }}>{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Quick Links */}
                {(profileData.profile.resumeUrl || profileData.profile.githubLink || profileData.profile.linkedinLink || profileData.profile.portfolioUrl) && (
                  <div style={{ display: "flex", gap: "8px", padding: "12px 32px", flexWrap: "wrap", borderBottom: "1px solid var(--border-color)" }}>
                    {profileData.profile.resumeUrl && <a href={profileData.profile.resumeUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", padding: "4px 12px", borderRadius: "20px", background: "rgba(99,102,241,0.1)", color: "#6366f1", textDecoration: "none", fontWeight: 500, display: "flex", alignItems: "center", gap: "4px" }}><Download size={12} /> Resume</a>}
                    {profileData.profile.githubLink && <a href={profileData.profile.githubLink} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", padding: "4px 12px", borderRadius: "20px", background: "var(--bg-hover)", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>GitHub</a>}
                    {profileData.profile.linkedinLink && <a href={profileData.profile.linkedinLink} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", padding: "4px 12px", borderRadius: "20px", background: "var(--bg-hover)", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>LinkedIn</a>}
                    {profileData.profile.portfolioUrl && <a href={profileData.profile.portfolioUrl} target="_blank" rel="noreferrer" style={{ fontSize: "0.8rem", padding: "4px 12px", borderRadius: "20px", background: "var(--bg-hover)", color: "var(--text-primary)", textDecoration: "none", fontWeight: 500 }}>Portfolio</a>}
                  </div>
                )}

                <div className="profile-grid" style={{ padding: "24px 32px 32px" }}>
                  {/* Left Column */}
                  <div>
                    {profileData.profile.professionalSummary && (
                      <div style={{ marginBottom: "28px" }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "12px" }}><Briefcase size={18} /> About</h3>
                        <p style={{ lineHeight: 1.6, color: "var(--text-secondary)", fontSize: "0.9rem" }}>{profileData.profile.professionalSummary}</p>
                      </div>
                    )}

                    {profileData.education.length > 0 && (
                      <div style={{ marginBottom: "28px" }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "12px" }}><GraduationCap size={18} /> Education</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {profileData.education.map((edu, i: number) => (
                            <div key={i} style={{ background: "var(--bg-elevated)", padding: "14px", borderRadius: "8px" }}>
                              <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem" }}>{edu.degree} {edu.fieldOfStudy ? `in ${edu.fieldOfStudy}` : ""}</h4>
                              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem" }}>{edu.institution}</p>
                              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px", fontSize: "0.8rem", color: "var(--text-secondary)" }}>
                                <span>{edu.startYear} - {edu.endYear || "Present"}</span>
                                {edu.score && <span style={{ fontWeight: 600, color: "var(--primary-color)" }}>Score: {edu.score}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {profileData.projects.length > 0 && (
                      <div style={{ marginBottom: "28px" }}>
                        <h3 style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "1.1rem", borderBottom: "1px solid var(--border-color)", paddingBottom: "8px", marginBottom: "12px" }}><Code size={18} /> Projects</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                          {profileData.projects.map((proj, i: number) => (
                            <div key={i} style={{ background: "var(--bg-elevated)", padding: "14px", borderRadius: "8px", borderLeft: "3px solid var(--primary-color)" }}>
                              <h4 style={{ margin: "0 0 6px 0", fontSize: "0.95rem", display: "flex", justifyContent: "space-between" }}>
                                {proj.title}
                                {proj.projectUrl && <a href={proj.projectUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary-color)" }}><ExternalLink size={14} /></a>}
                              </h4>
                              <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "0.85rem", lineHeight: 1.5 }}>{proj.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div>
                    {profileData.skills.length > 0 && (
                      <div style={{ marginBottom: "24px" }}>
                        <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}><Target size={14} /> Skills</h4>
                        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                          {profileData.skills.map((skill, i: number) => (
                            <span key={i} style={{ background: skill.skillType === "hard" ? "rgba(99,102,241,0.1)" : skill.skillType === "language" ? "rgba(245,158,11,0.1)" : "rgba(16,185,129,0.1)", color: skill.skillType === "hard" ? "#6366f1" : skill.skillType === "language" ? "#f59e0b" : "#10b981", padding: "4px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: 500 }}>
                              {skill.skillName}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {profileData.certs.length > 0 && (
                      <div style={{ marginBottom: "24px" }}>
                        <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: "6px" }}><Award size={14} /> Certifications</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          {profileData.certs.map((cert, i: number) => (
                            <div key={i} style={{ fontSize: "0.85rem" }}>
                              <div style={{ fontWeight: 500 }}>{cert.name}</div>
                              <div style={{ color: "var(--text-secondary)", fontSize: "0.75rem", display: "flex", justifyContent: "space-between" }}>
                                <span>{cert.issuingOrg}</span>
                                {cert.credentialUrl && <a href={cert.credentialUrl} target="_blank" rel="noreferrer" style={{ color: "var(--primary-color)" }}>Verify</a>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {profileData.links.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", margin: "0 0 12px 0" }}>Links</h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {profileData.links.filter((link) => Boolean(link.url)).map((link, i: number) => (
                            <a key={i} href={link.url || undefined} target="_blank" rel="noreferrer" style={{ fontSize: "0.85rem", color: "var(--primary-color)", display: "flex", gap: "6px", alignItems: "center", textDecoration: "none" }}>
                              <ExternalLink size={12} /> {link.title || link.platform}
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      <style>{`
        .profile-grid {
          display: grid;
          grid-template-columns: 2fr 1fr;
          gap: 32px;
        }
        @media (max-width: 768px) {
          .profile-grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }
        }
      `}</style>
    </div>
  );
}
