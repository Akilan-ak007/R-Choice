"use client";

import { useState, useMemo } from "react";
import styles from "./profile.module.css";
import { CheckCircle2, Save, User, Book, Briefcase, Award, Plus, Trash2, Code, Languages, Globe, Zap, Target, Star } from "lucide-react";
import { saveBasicProfile, saveEducation, saveSkills, saveProjects, saveCertifications } from "@/app/actions/profile";
import { toast } from "sonner";

export default function ProfileBuilderClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [message, setMessage] = useState({ text: "", type: "" });

  // Basic Info isolated
  const [roles, setRoles] = useState<string[]>(initialData.roles || []);
  const [newRole, setNewRole] = useState("");

  const [education, setEducation] = useState<any[]>(initialData.education?.length ? initialData.education : []);
  
  // Skills mapped with isTop boolean
  const [skills, setSkills] = useState<{name: string, type: string, isTop?: boolean}[]>(initialData.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [skillType, setSkillType] = useState("hard");

  // Isolated languages array
  const [newLanguage, setNewLanguage] = useState("");

  // Role recommendations algorithm
  const suggestedRoles = ["Frontend Developer", "Backend Developer", "Full Stack Engineer", "UI/UX Designer", "Data Scientist", "DevOps Engineer", "Machine Learning Engineer", "Product Manager"];

  const suggestedSkillsMap: Record<string, string[]> = {
    "developer": ["React", "Node.js", "TypeScript", "SQL", "Git", "Python", "Problem Solving"],
    "designer": ["Figma", "UI/UX", "Adobe XD", "Wireframing", "Prototyping", "Creativity"],
    "data": ["Python", "SQL", "Data Analysis", "Machine Learning", "Tableau", "Statistics", "R"],
    "manager": ["Leadership", "Agile", "Scrum", "Communication", "Time Management"],
    "marketing": ["SEO", "Content Creation", "Social Media", "Google Analytics", "Communication"],
    "cloud": ["AWS", "Azure", "Docker", "Kubernetes", "Linux", "DevOps"],
  };

  const recommendedSkills = useMemo(() => {
    let recs: string[] = ["Communication", "Teamwork", "Problem Solving", "Adaptability"]; 
    roles.forEach(role => {
      const lower = role.toLowerCase();
      Object.keys(suggestedSkillsMap).forEach(key => {
        if (lower.includes(key)) recs = [...recs, ...suggestedSkillsMap[key]];
      });
    });
    return Array.from(new Set(recs)).filter(r => !skills.some(s => s.name.toLowerCase() === r.toLowerCase())).slice(0, 8);
  }, [roles, skills]);

  const [projects, setProjects] = useState<any[]>(initialData.projects || []);
  const [certs, setCerts] = useState<any[]>(initialData.certifications || []);

  const score = data.profileCompletionScore || 0;
  const isComplete = score === 100;

  const toggleTopSkill = (idx: number, isHardSkill: boolean) => {
    const updatedSkills = [...skills];
    const targetType = isHardSkill ? "hard" : "soft";
    // Count current tops in that category
    const currentTops = updatedSkills.filter(s => s.type === targetType && s.isTop).length;
    
    if (!updatedSkills[idx].isTop && currentTops >= 5) {
      setMessage({text: "You can only rank maximum 5 skills as Top in this category.", type: "error"});
      return;
    }
    
    updatedSkills[idx].isTop = !updatedSkills[idx].isTop;
    setSkills(updatedSkills);
    setMessage({text: "", type: ""});
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: "", type: "" });

    try {
      if (activeTab === "basic" || activeTab === "roles") {
        const result = await saveBasicProfile({
          registerNo: data.registerNo,
          department: data.department,
          year: data.year,
          section: data.section || "A",
          cgpa: data.cgpa?.toString() || "",
          professionalSummary: data.professionalSummary || "",
          roles: roles
        });
        if (result.error) toast.error(result.error);
        else { toast.success("Profile updated successfully!"); setData({ ...data, profileCompletionScore: result.score }); }
      } else if (activeTab === "education") {
        const result = await saveEducation(education);
        if (result.error) toast.error(result.error);
        else toast.success("Education updated successfully!");
      } else if (activeTab === "skills" || activeTab === "languages") {
        const result = await saveSkills(skills);
        if (result.error) toast.error(result.error);
        else toast.success("Skills updated successfully!");
      } else if (activeTab === "projects") {
        const result = await saveProjects(projects);
        if (result.error) toast.error(result.error);
        else toast.success("Projects updated successfully!");
      } else if (activeTab === "certs") {
        const result = await saveCertifications(certs);
        if (result.error) toast.error(result.error);
        else toast.success("Certifications updated successfully!");
      }
    } catch {
      toast.error("An unexpected error occurred.");
    }
    setIsSaving(false);
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: <User size={18} /> },
    { id: "roles", label: "My Roles", icon: <Target size={18} /> },
    { id: "education", label: "Education", icon: <Book size={18} /> },
    { id: "skills", label: "Skills", icon: <Code size={18} /> },
    { id: "languages", label: "Languages", icon: <Languages size={18} /> },
    { id: "projects", label: "Projects", icon: <Briefcase size={18} /> },
    { id: "certs", label: "Certifications", icon: <Award size={18} /> },
  ];

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileSidebar}>
        <nav className={styles.tabNav}>
          {tabs.map((tab) => (
            <button
              key={tab.id} type="button"
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ""}`}
              onClick={() => { setActiveTab(tab.id); setMessage({text: "", type: ""}); }}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: "var(--space-6)" }}>
          <a href="/api/profile/resume" target="_blank" className="btn btn-outline" style={{ width: "100%", justifyContent: "center", display: "flex" }}>
            <Book size={18} style={{ marginRight: "8px" }} /> ATS Resume
          </a>
        </div>
      </div>

      <div className={styles.profileContent}>
        <div className="card">
          <form onSubmit={handleSave}>
            <div className={styles.formHeader}>
              <h2>{tabs.find((t) => t.id === activeTab)?.label}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                {message.text && (
                  <span style={{ fontSize: "0.875rem", color: message.type === "error" ? "var(--color-danger)" : "var(--color-success)" }}>
                    {message.text}
                  </span>
                )}
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                  <Save size={16} style={{ marginLeft: 8 }} />
                </button>
              </div>
            </div>

            {/* Basic Info Tab */}
            {activeTab === "basic" && (
              <div className="animate-fade-in">
                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="input-group">
                    <label>Register Number *</label>
                    <input className="input-field" value={data.registerNo} onChange={(e) => setData({ ...data, registerNo: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label>Department *</label>
                    <input className="input-field" value={data.department} onChange={(e) => setData({ ...data, department: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label>Current CGPA</label>
                    <input className="input-field" type="number" step="0.01" value={data.cgpa} onChange={(e) => setData({ ...data, cgpa: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Year of Study</label>
                    <select className="input-field" value={data.year} onChange={(e) => setData({ ...data, year: Number(e.target.value) })}>
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: "var(--space-4)" }}>
                  <label>Professional Summary</label>
                  <textarea className="input-field" rows={4} value={data.professionalSummary || ""} onChange={(e) => setData({ ...data, professionalSummary: e.target.value })} />
                </div>
              </div>
            )}

            {/* Roles Tab */}
            {activeTab === "roles" && (
              <div className="animate-fade-in">
                <div style={{ padding: "var(--space-4)", background: "var(--bg-elevated)", borderRadius: "var(--border-radius-md)", marginBottom: "var(--space-6)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-3)", color: "var(--color-primary)" }}>
                    <Zap size={18} />
                    <h4 style={{ margin: 0, fontSize: "0.875rem" }}>Recommended Paths for You</h4>
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {suggestedRoles.map(role => (
                      <button type="button" key={role} onClick={() => { if(roles.length < 5 && !roles.includes(role)) setRoles([...roles, role]); }} style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", background: "var(--bg-card)", border: `1px solid ${roles.includes(role) ? 'var(--color-primary)' : 'var(--border-color)'}`, cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}>
                        <Plus size={12} /> {role}
                      </button>
                    ))}
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: 0 }}>Select your target industries to enable our algorithmic job matching engine.</p>
                </div>
                
                <div className="input-group" style={{ marginTop: "var(--space-4)" }}>
                  <label>Your Saved Roles (Max 5)</label>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "8px" }}>
                    {roles.length === 0 && <p style={{color: "var(--text-muted)", fontSize: "0.875rem"}}>No roles selected yet.</p>}
                    {roles.map(r => (
                      <span key={r} style={{ background: "var(--bg-hover)", padding: "4px 12px", borderRadius: "100px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "4px", border: "1px solid var(--color-primary)" }}>
                        {r} <Trash2 size={14} style={{ cursor: "pointer", color: "var(--color-danger)" }} onClick={() => setRoles(roles.filter(x => x !== r))} />
                      </span>
                    ))}
                  </div>
                  {roles.length < 5 && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input className="input-field" value={newRole} onChange={(e) => setNewRole(e.target.value)} placeholder="Type a custom role... E.g., Product Manager" />
                      <button type="button" className="btn btn-secondary" onClick={() => { if (newRole) { setRoles([...roles, newRole]); setNewRole(""); } }}>Add Role</button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Education Tab */}
            {activeTab === "education" && (
              <div className="animate-fade-in grid grid-1" style={{ gap: "var(--space-6)" }}>
                {education.map((edu, idx) => (
                  <div key={idx} style={{ padding: "var(--space-4)", border: "1px solid var(--border-color)", borderRadius: "var(--border-radius-md)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
                      <h3 style={{ color: "var(--color-primary)" }}>{edu.degree ? `${edu.degree} Details` : `New Education Entry`}</h3>
                      <button type="button" onClick={() => setEducation(education.filter((_, i) => i !== idx))} style={{ color: "var(--color-danger)" }}><Trash2 size={18} /></button>
                    </div>
                    <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                      <div className="input-group">
                        <label>Level of Education *</label>
                        <select className="input-field" value={edu.degree} onChange={(e) => { const n = [...education]; n[idx].degree = e.target.value; setEducation(n); }} required>
                          <option value="" disabled>Select Level...</option>
                          <option value="Schooling">Schooling (10th / 12th Std)</option>
                          <option value="Diploma">Diploma</option>
                          <option value="UG">Undergraduate (UG)</option>
                          <option value="PG">Postgraduate (PG)</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Institution Name *</label>
                        <input className="input-field" placeholder="e.g. Rathinam College" value={edu.institution} onChange={(e) => { const n = [...education]; n[idx].institution = e.target.value; setEducation(n); }} required />
                      </div>
                      <div className="input-group">
                        <label>Field of Study / Department</label>
                        <input className="input-field" placeholder="e.g. Computer Science" value={edu.fieldOfStudy} onChange={(e) => { const n = [...education]; n[idx].fieldOfStudy = e.target.value; setEducation(n); }} />
                      </div>
                      <div className="input-group">
                        <label>Start Year</label>
                        <input className="input-field" type="number" placeholder="2020" value={edu.startYear} onChange={(e) => { const n = [...education]; n[idx].startYear = e.target.value; setEducation(n); }} />
                      </div>
                      <div className="input-group">
                        <label>End Year</label>
                        <input className="input-field" type="number" placeholder="2024" value={edu.endYear} onChange={(e) => { const n = [...education]; n[idx].endYear = e.target.value; setEducation(n); }} />
                      </div>
                      <div className="input-group">
                        <label>Score (%) / CGPA</label>
                        <input className="input-field" placeholder="8.5" value={edu.score} onChange={(e) => { const n = [...education]; n[idx].score = e.target.value; setEducation(n); }} />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-outline" style={{ width: "100%", justifyContent: "center", display: "flex" }} onClick={() => setEducation([...education, { degree: "", institution: "", fieldOfStudy: "", startYear: "", endYear: "", score: "" }])}>
                  <Plus size={18} style={{ marginRight: 8 }} /> Add Education manually
                </button>
              </div>
            )}

            {/* Skills Tab */}
            {activeTab === "skills" && (
              <div className="animate-fade-in">
                {recommendedSkills.length > 0 && (
                  <div style={{ padding: "var(--space-4)", background: "var(--bg-elevated)", borderRadius: "var(--border-radius-md)", marginBottom: "var(--space-6)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--space-3)", color: "var(--color-primary)" }}>
                      <Zap size={18} />
                      <h4 style={{ margin: 0, fontSize: "0.875rem" }}>Recommended Tech Skills</h4>
                    </div>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      {recommendedSkills.map((rec) => (
                        <button key={rec} type="button" onClick={() => setSkills([...skills, { name: rec, type: "hard", isTop: false }])} style={{ padding: "4px 12px", borderRadius: "100px", fontSize: "0.75rem", background: "var(--bg-card)", border: "1px solid var(--border-color)", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px", transition: "all 0.2s" }} onMouseOver={(e) => e.currentTarget.style.borderColor = "var(--color-primary)"} onMouseOut={(e) => e.currentTarget.style.borderColor = "var(--border-color)"}>
                          <Plus size={12} /> {rec}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                <datalist id="popularSkills">
                  <option value="React" />
                  <option value="Node.js" />
                  <option value="TypeScript" />
                  <option value="Python" />
                  <option value="Java" />
                  <option value="C++" />
                  <option value="SQL" />
                  <option value="MongoDB" />
                  <option value="Docker" />
                  <option value="AWS" />
                  <option value="Figma" />
                  <option value="Communication" />
                  <option value="Leadership" />
                  <option value="Problem Solving" />
                  <option value="Teamwork" />
                </datalist>

                <div className="input-group" style={{ marginBottom: "var(--space-4)" }}>
                  <label>Add New Skill Manually</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input className="input-field" style={{ flex: 2 }} list="popularSkills" value={newSkill} onChange={(e) => setNewSkill(e.target.value)} placeholder="Type a skill..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newSkill) { setSkills([...skills, { name: newSkill, type: skillType, isTop: false }]); setNewSkill(""); } } }} />
                    <select className="input-field" style={{ flex: 1 }} value={skillType} onChange={(e) => setSkillType(e.target.value)}>
                      <option value="hard">Hard / Tech Skill</option>
                      <option value="soft">Soft Skill</option>
                    </select>
                    <button type="button" className="btn btn-secondary" onClick={() => { if (newSkill) { setSkills([...skills, { name: newSkill, type: skillType, isTop: false }]); setNewSkill(""); } }}>Add</button>
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: "var(--space-6)" }}>
                  {/* Tech Skills Column */}
                  <div>
                    <h3 style={{ marginBottom: "var(--space-2)", fontSize: "1rem", color: "var(--text-secondary)" }}>Hard / Tech Skills</h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>Click the Star <Star size={12} fill="var(--color-warning)" color="var(--color-warning)" style={{ display: "inline-block", verticalAlign: "middle" }} /> to rank your Top 5 skills.</p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      {skills.map((s, i) => s.type === "hard" && (
                        <span key={i} style={{ background: s.isTop ? "var(--bg-hover)" : "var(--bg-secondary)", border: s.isTop ? "1px solid var(--color-primary)" : "1px solid var(--border-color)", padding: "4px 10px", borderRadius: "8px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Star size={14} fill={s.isTop ? "var(--color-warning)" : "none"} color={s.isTop ? "var(--color-warning)" : "var(--text-muted)"} style={{cursor: "pointer"}} onClick={() => toggleTopSkill(i, true)} />
                          {s.name}
                          <Trash2 size={14} style={{ cursor: "pointer", color: "var(--color-danger)" }} onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} />
                        </span>
                      ))}
                      {skills.filter(s => s.type === "hard").length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>None added.</p>}
                    </div>
                  </div>

                  {/* Soft Skills Column */}
                  <div>
                    <h3 style={{ marginBottom: "var(--space-2)", fontSize: "1rem", color: "var(--text-secondary)" }}>Soft Skills</h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "var(--space-3)" }}>Click the Star <Star size={12} fill="var(--color-warning)" color="var(--color-warning)" style={{ display: "inline-block", verticalAlign: "middle" }} /> to rank your Top 5 soft skills.</p>
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      {skills.map((s, i) => s.type === "soft" && (
                        <span key={i} style={{ background: s.isTop ? "var(--bg-hover)" : "var(--bg-secondary)", border: s.isTop ? "1px solid var(--color-primary)" : "1px solid var(--border-color)", padding: "4px 10px", borderRadius: "8px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "8px" }}>
                          <Star size={14} fill={s.isTop ? "var(--color-warning)" : "none"} color={s.isTop ? "var(--color-warning)" : "var(--text-muted)"} style={{cursor: "pointer"}} onClick={() => toggleTopSkill(i, false)} />
                          {s.name}
                          <Trash2 size={14} style={{ cursor: "pointer", color: "var(--color-danger)" }} onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} />
                        </span>
                      ))}
                      {skills.filter(s => s.type === "soft").length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>None added.</p>}
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
                   <button type="button" onClick={() => setSkills(skills.filter(s => s.type === "language"))} style={{ fontSize: "0.75rem", color: "var(--color-danger)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear All Skills</button>
                </div>
              </div>
            )}

            {/* Languages Tab */}
            {activeTab === "languages" && (
              <div className="animate-fade-in">
                <div className="input-group" style={{ marginBottom: "var(--space-4)" }}>
                  <label>Add Spoken Language</label>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <input className="input-field" style={{ flex: 1 }} value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} placeholder="Type a language (e.g. English, Tamil, French)..." onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); if (newLanguage) { setSkills([...skills, { name: newLanguage, type: "language", isTop: false }]); setNewLanguage(""); } } }} />
                    <button type="button" className="btn btn-secondary" onClick={() => { if (newLanguage) { setSkills([...skills, { name: newLanguage, type: "language", isTop: false }]); setNewLanguage(""); } }}>Add Language</button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                  {skills.map((s, i) => s.type === "language" && (
                    <span key={i} style={{ background: "rgba(0,188,212,0.15)", padding: "6px 12px", borderRadius: "100px", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: "6px", color: "var(--color-accent)" }}>
                      <Languages size={14}/> {s.name}
                      <Trash2 size={14} style={{ cursor: "pointer", color: "var(--color-danger)" }} onClick={() => setSkills(skills.filter((_, idx) => idx !== i))} />
                    </span>
                  ))}
                  {skills.filter(s => s.type === "language").length === 0 && <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>No languages added yet.</p>}
                </div>
                
                <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
                   <button type="button" onClick={() => setSkills(skills.filter(s => s.type !== "language"))} style={{ fontSize: "0.75rem", color: "var(--color-danger)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>Clear All Languages</button>
                </div>
              </div>
            )}

            {/* Projects Tab */}
            {activeTab === "projects" && (
              <div className="animate-fade-in">
                {projects.map((proj, idx) => (
                  <div key={idx} style={{ padding: "var(--space-4)", border: "1px solid var(--border-color)", borderRadius: "var(--border-radius-md)", marginBottom: "var(--space-4)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
                      <h3 style={{ color: "var(--color-primary)" }}>Project {idx + 1}</h3>
                      <button type="button" onClick={() => setProjects(projects.filter((_, i) => i !== idx))} style={{ color: "var(--color-danger)" }}><Trash2 size={18} /></button>
                    </div>
                    <div className="grid grid-2" style={{ gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                      <div className="input-group">
                        <label>Title</label>
                        <input className="input-field" value={proj.title} onChange={(e) => { const n = [...projects]; n[idx].title = e.target.value; setProjects(n); }} required />
                      </div>
                      <div className="input-group">
                        <label>Project URL (GitHub/Live)</label>
                        <input className="input-field" value={proj.projectUrl} onChange={(e) => { const n = [...projects]; n[idx].projectUrl = e.target.value; setProjects(n); }} />
                      </div>
                      <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Description</label>
                        <textarea className="input-field" rows={3} value={proj.description} onChange={(e) => { const n = [...projects]; n[idx].description = e.target.value; setProjects(n); }} required />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-outline" style={{ width: "100%", justifyContent: "center", display: "flex" }} onClick={() => setProjects([...projects, { title: "", projectUrl: "", description: "" }])}>
                  <Plus size={18} style={{ marginRight: 8 }} /> Add Project
                </button>
              </div>
            )}

            {/* Certifications Tab */}
            {activeTab === "certs" && (
              <div className="animate-fade-in">
                {certs.map((cert, idx) => (
                  <div key={idx} style={{ padding: "var(--space-4)", border: "1px solid var(--border-color)", borderRadius: "var(--border-radius-md)", marginBottom: "var(--space-4)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
                      <h3 style={{ color: "var(--color-primary)" }}>Certification {idx + 1}</h3>
                      <button type="button" onClick={() => setCerts(certs.filter((_, i) => i !== idx))} style={{ color: "var(--color-danger)" }}><Trash2 size={18} /></button>
                    </div>
                    <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                      <div className="input-group">
                        <label>Name</label>
                        <input className="input-field" value={cert.name} onChange={(e) => { const n = [...certs]; n[idx].name = e.target.value; setCerts(n); }} required />
                      </div>
                      <div className="input-group">
                        <label>Issuing Organization</label>
                        <input className="input-field" value={cert.issuingOrg} onChange={(e) => { const n = [...certs]; n[idx].issuingOrg = e.target.value; setCerts(n); }} required />
                      </div>
                      <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Credential URL</label>
                        <input className="input-field" value={cert.credentialUrl} onChange={(e) => { const n = [...certs]; n[idx].credentialUrl = e.target.value; setCerts(n); }} />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-outline" style={{ width: "100%", justifyContent: "center", display: "flex" }} onClick={() => setCerts([...certs, { name: "", issuingOrg: "", credentialUrl: "" }])}>
                  <Award size={18} style={{ marginRight: 8 }} /> Add Certification
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
