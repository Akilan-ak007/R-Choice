"use client";

import { useState, useMemo } from "react";
import styles from "./profile.module.css";
import { Save, User, Book, Briefcase, Award, Plus, Trash2, Code, Languages, Globe, Zap, Target, Star, Link as LinkIcon, Code2, Terminal, GripVertical } from "lucide-react";
import { saveBasicProfile, saveEducation, saveSkills, saveProjects, saveCertifications, saveLinks } from "@/app/actions/profile";
import { toast } from "sonner";
import Image from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GitHubHeatmap } from "@/components/profile/GitHubHeatmap";
import { YEARS, type SchoolNode } from "@/lib/constants/hierarchy";

type LinkRow = {
  _id: string;
  platform?: string | null;
  title?: string | null;
  url?: string | null;
  isActive?: boolean | null;
};

type EducationRow = {
  institution?: string;
  degree?: string;
  fieldOfStudy?: string;
  startYear?: string | number;
  endYear?: string | number;
  score?: string | number;
  scoreType?: string;
};

type ProjectRow = {
  title?: string;
  description?: string;
  projectUrl?: string;
};

type CertRow = {
  name?: string;
  issuingOrg?: string;
  credentialUrl?: string;
};

type ProfileData = {
  registerNo?: string | null;
  department?: string | null;
  year?: string | number | null;
  section?: string | null;
  school?: string | null;
  course?: string | null;
  program?: string | null;
  programType?: string | null;
  batchStartYear?: string | number | null;
  batchEndYear?: string | number | null;
  cgpa?: string | number | null;
  professionalSummary?: string | null;
  dob?: string | null;
  githubLink?: string | null;
  linkedinLink?: string | null;
  portfolioUrl?: string | null;
  avatarUrl?: string | null;
  resumeUrl?: string | null;
  profileCompletionScore?: number | null;
  roles?: string[];
  education?: EducationRow[];
  skills?: Array<{ name: string; type: string; isTop?: boolean }>;
  projects?: ProjectRow[];
  certifications?: CertRow[];
  firstName?: string;
};

const linkPlatforms = ["GitHub", "LeetCode", "HackerRank", "LinkedIn", "Portfolio", "Other"];

const getLinkIcon = (platform: string) => {
  switch (platform) {
    case "GitHub": return <Globe size={18} />;
    case "LeetCode": return <Code2 size={18} />;
    case "HackerRank": return <Terminal size={18} />;
    default: return <LinkIcon size={18} />;
  }
};

const suggestedSkillsMap: Record<string, string[]> = {
  developer: ["React", "Node.js", "TypeScript", "SQL", "Git", "Python", "Problem Solving"],
  designer: ["Figma", "UI/UX", "Adobe XD", "Wireframing", "Prototyping", "Creativity"],
  data: ["Python", "SQL", "Data Analysis", "Machine Learning", "Tableau", "Statistics", "R"],
  manager: ["Leadership", "Agile", "Scrum", "Communication", "Time Management"],
  marketing: ["SEO", "Content Creation", "Social Media", "Google Analytics", "Communication"],
  cloud: ["AWS", "Azure", "Docker", "Kubernetes", "Linux", "DevOps"],
};

function SortableLinkRow({
  link,
  index,
  onUpdate,
  onDelete,
}: {
  link: LinkRow;
  index: number;
  onUpdate: (index: number, field: "platform" | "title" | "url", value: string) => void;
  onDelete: (index: number) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-3"
      data-dragging={isDragging || undefined}
    >
      <div className="input-group" style={{ position: "relative" }}>
        <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            {...attributes}
            {...listeners}
            style={{
              cursor: "grab",
              color: "var(--text-muted)",
              display: "inline-flex",
              padding: "2px",
              borderRadius: "4px",
              transition: "color var(--transition-fast)",
            }}
            title="Drag to reorder"
          >
            <GripVertical size={14} />
          </span>
          Platform
        </label>
        <select
          className="input-field"
          value={link.platform || "Other"}
          onChange={(e) => onUpdate(index, "platform", e.target.value)}
        >
          {linkPlatforms.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>
      <div className="input-group">
        <label>Title / Identifier</label>
        <input
          className="input-field"
          placeholder="e.g. My Profile"
          value={link.title || ""}
          onChange={(e) => onUpdate(index, "title", e.target.value)}
          required
        />
      </div>
      <div className="input-group" style={{ display: "flex", flexDirection: "row", gap: "8px", alignItems: "center" }}>
        <div style={{ flex: 1 }}>
          <label>URL</label>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {getLinkIcon(link.platform || "Other")}
            <input
              className="input-field"
              placeholder="https://"
              value={link.url || ""}
              onChange={(e) => onUpdate(index, "url", e.target.value)}
              required
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => onDelete(index)}
          style={{
            color: "var(--color-danger)",
            paddingBottom: "12px",
            background: "none",
            border: "none",
            cursor: "pointer",
            transition: "transform var(--transition-fast)",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.15)")}
          onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        >
          <Trash2 size={20} />
        </button>
      </div>
    </div>
  );
}

export default function ProfileBuilderClient({ initialData, initialLinks = [], collegeHierarchy }: { initialData: ProfileData; initialLinks?: Array<Omit<LinkRow, "_id">>; collegeHierarchy: SchoolNode[] }) {
  const [data, setData] = useState<ProfileData>(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [message, setMessage] = useState({ text: "", type: "" });

  // Basic Info isolated
  const [roles, setRoles] = useState<string[]>(initialData.roles || []);
  const [newRole, setNewRole] = useState("");

  const [education, setEducation] = useState<EducationRow[]>(initialData.education?.length ? initialData.education : []);
  
  // Skills mapped with isTop boolean
  const [skills, setSkills] = useState<{name: string, type: string, isTop?: boolean}[]>(initialData.skills || []);
  const [newSkill, setNewSkill] = useState("");
  const [skillType, setSkillType] = useState("hard");

  // Isolated languages array
  const [newLanguage, setNewLanguage] = useState("");

  // Links state
  const [links, setLinks] = useState<LinkRow[]>(
    (initialLinks || []).map((l, i: number) => ({ ...l, _id: `link-${i}` }))
  );

  // DnD sensors for links
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setLinks((items) => {
        const oldIndex = items.findIndex((i) => i._id === active.id);
        const newIndex = items.findIndex((i) => i._id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast.info("Link order updated — remember to save!");
    }
  };

  const handleLinkUpdate = (index: number, field: "platform" | "title" | "url", value: string) => {
    const n = [...links];
    n[index][field] = value;
    setLinks(n);
  };

  const handleLinkDelete = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
    toast("Link removed", { description: "Click Save to confirm." });
  };

  // GitHub heatmap from links
  const githubLink = useMemo(() => links.find((l) => l.platform?.toLowerCase() === "github" && l.url), [links]);
  const githubUser = useMemo(() => {
    if (!githubLink?.url) return null;
    try {
      const url = new URL(githubLink.url);
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[0] || null;
    } catch {
      return null;
    }
  }, [githubLink]);

  // Role recommendations algorithm
  const suggestedRoles = ["Frontend Developer", "Backend Developer", "Full Stack Engineer", "UI/UX Designer", "Data Scientist", "DevOps Engineer", "Machine Learning Engineer", "Product Manager"];

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

  const [projects, setProjects] = useState<ProjectRow[]>(initialData.projects || []);
  const [certs, setCerts] = useState<CertRow[]>(initialData.certifications || []);

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
          registerNo: data.registerNo || "",
          department: data.department || "",
          year: data.year ? Number(data.year) : 1,
          section: data.section || "A",
          school: data.school || "",
          course: data.course || "",
          program: data.program || "",
          programType: data.programType || undefined,
          batchStartYear: data.batchStartYear ? Number(data.batchStartYear) : undefined,
          batchEndYear: data.batchEndYear ? Number(data.batchEndYear) : undefined,
          cgpa: data.cgpa?.toString() || "",
          professionalSummary: data.professionalSummary || "",
          roles: roles,
          dob: data.dob || "",
          githubLink: data.githubLink || "",
          linkedinLink: data.linkedinLink || "",
          portfolioUrl: data.portfolioUrl || "",
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
      } else if (activeTab === "links") {
        const filtered = links
          .filter((l) => l.url && l.title)
          .map((l) => ({
            platform: l.platform || "Other",
            title: l.title || "",
            url: l.url || "",
          }));
        const result = await saveLinks(filtered);
        if (result.error) toast.error(result.error);
        else toast.success("Links saved successfully!");
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
    { id: "links", label: "My Links", icon: <LinkIcon size={18} /> },
  ];

  return (
    <div className={styles.profileContainer}>
      <div className={styles.profileSidebar}>
        {/* Avatar Upload Section */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "var(--space-6)" }}>
          <div style={{
            position: "relative", width: "120px", height: "120px", borderRadius: "50%", background: "var(--bg-elevated)", border: "2px solid var(--border-color)", overflow: "hidden", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", justifyContent: "center"
          }}>
            {data.avatarUrl ? (
              <Image src={data.avatarUrl} alt="Profile Picture" width={120} height={120} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ fontSize: "3rem", fontWeight: "bold", color: "var(--color-primary)" }}>
                {data.firstName ? data.firstName.charAt(0).toUpperCase() : "U"}
              </div>
            )}
          </div>
          <label className="btn btn-outline" style={{ fontSize: "0.8125rem", padding: "6px 12px", cursor: "pointer", borderRadius: "100px" }}>
            <input
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (!file.type.startsWith("image/")) { toast.error("File must be an image"); return; }
                if (file.size > 5 * 1024 * 1024) { toast.error("File must be under 5MB"); return; }
                toast.loading("Uploading profile picture...", { id: "avatar-upload" });
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/api/upload/avatar", { method: "POST", body: fd });
                const result = await res.json();
                if (res.ok) {
                  toast.success("Profile picture updated!", { id: "avatar-upload" });
                  setData({ ...data, avatarUrl: result.url });
                  window.location.reload(); // Reload to update sidebar header avatar globally
                } else {
                  toast.error(result.error || "Upload failed", { id: "avatar-upload" });
                }
                e.target.value = "";
              }}
            />
            {data.avatarUrl ? "Change Photo" : "Upload Photo"}
          </label>
        </div>

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
        <div style={{ marginTop: "var(--space-6)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          <label
            className="btn btn-outline"
            style={{ width: "100%", justifyContent: "center", display: "flex", cursor: "pointer", position: "relative" }}
          >
            <input
              type="file"
              accept=".pdf"
              style={{ display: "none" }}
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.type !== "application/pdf") { toast.error("Only PDF files are accepted"); return; }
                if (file.size > 10 * 1024 * 1024) { toast.error("File must be under 10MB"); return; }
                toast.loading("Uploading resume...", { id: "resume-upload" });
                const fd = new FormData();
                fd.append("file", file);
                const res = await fetch("/api/upload/resume", { method: "POST", body: fd });
                const result = await res.json();
                if (res.ok) {
                  toast.success("Resume uploaded!", { id: "resume-upload" });
                  setData({ ...data, resumeUrl: result.url });
                } else {
                  toast.error(result.error || "Upload failed", { id: "resume-upload" });
                }
                e.target.value = "";
              }}
            />
            <Book size={18} style={{ marginRight: "8px" }} /> {data.resumeUrl ? "Replace Resume" : "Upload Resume (PDF)"}
          </label>
          {data.resumeUrl && (
            <a href={data.resumeUrl} target="_blank" rel="noreferrer" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", display: "flex", textDecoration: "none" }}>
              <Book size={18} style={{ marginRight: "8px" }} /> View My Resume
            </a>
          )}
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
                    <input className="input-field" value={data.registerNo || ""} onChange={(e) => setData({ ...data, registerNo: e.target.value })} required />
                  </div>
                  <div className="input-group">
                    <label>School *</label>
                    <select 
                      className="input-field" 
                      value={data.school || ""} 
                      onChange={(e) => setData({ ...data, school: e.target.value, section: "", course: "", program: "", department: "" })} 
                      required
                    >
                      <option value="" disabled>Select School...</option>
                      {collegeHierarchy.map((s: any) => (
                        <option key={s.school} value={s.school}>{s.school}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Section *</label>
                    <select 
                      className="input-field" 
                      value={data.section || ""} 
                      onChange={(e) => setData({ ...data, section: e.target.value, course: "", program: "", department: "" })} 
                      required
                      disabled={!data.school}
                    >
                      <option value="" disabled>Select Section...</option>
                      {collegeHierarchy.find((s: any) => s.school === data.school)?.sections.map((sec: any) => (
                        <option key={sec.section} value={sec.section}>{sec.section}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Course *</label>
                    <select 
                      className="input-field" 
                      value={data.course || ""} 
                      onChange={(e) => setData({ ...data, course: e.target.value, program: "", department: "" })} 
                      required
                      disabled={!data.section}
                    >
                      <option value="" disabled>Select Course...</option>
                      {/* Extract unique courses for the section */
                        Array.from(new Set(
                          collegeHierarchy.find((s: any) => s.school === data.school)?.sections.find((sec: any) => sec.section === data.section)?.courses.map((c: any) => c.course) || []
                        )).map(c => (
                        <option key={c as string} value={c as string}>{c as string}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Program (UG/PG) *</label>
                    <select 
                      className="input-field" 
                      value={data.program || ""} 
                      onChange={(e) => setData({ ...data, program: e.target.value, department: "", year: 1 })} 
                      required
                      disabled={!data.course}
                    >
                      <option value="" disabled>Select Program...</option>
                      {/* Filter courses by selected course name, then get unique program types */
                        Array.from(new Set(
                          collegeHierarchy.find((s: any) => s.school === data.school)?.sections.find((sec: any) => sec.section === data.section)?.courses.filter((c: any) => c.course === data.course).map((c: any) => c.programType) || []
                        )).map(p => (
                        <option key={p as string} value={p as string}>{p === "UG" ? "Undergraduate (UG)" : "Postgraduate (PG)"}</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Department / Specialization *</label>
                    <select 
                      className="input-field" 
                      value={data.department || ""} 
                      onChange={(e) => setData({ ...data, department: e.target.value })} 
                      required
                      disabled={!data.program}
                    >
                      <option value="" disabled>Select Department...</option>
                      {
                        collegeHierarchy.find((s: any) => s.school === data.school)?.sections.find((sec: any) => sec.section === data.section)?.courses.find((c: any) => c.course === data.course && c.programType === data.program)?.departments.map((d: any) => (
                          <option key={d.name} value={d.name}>{d.name}</option>
                        )) || []
                      }
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Year of Study</label>
                    <select className="input-field" value={data.year || ""} onChange={(e) => setData({ ...data, year: Number(e.target.value) })}>
                      {(data.program === "PG" ? [1, 2] : data.program === "UG" ? [1, 2, 3] : YEARS).map((y) => (
                        <option key={y} value={y}>{y}{y === 1 ? 'st' : y === 2 ? 'nd' : y === 3 ? 'rd' : 'th'} Year</option>
                      ))}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Batch Start Year</label>
                    <input className="input-field" type="number" placeholder="2020" value={data.batchStartYear || ""} onChange={(e) => setData({ ...data, batchStartYear: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Batch End Year</label>
                    <input className="input-field" type="number" placeholder="2024" value={data.batchEndYear || ""} onChange={(e) => setData({ ...data, batchEndYear: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Current CGPA</label>
                    <input className="input-field" type="number" step="0.01" value={data.cgpa || ""} onChange={(e) => setData({ ...data, cgpa: e.target.value })} />
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: "var(--space-4)" }}>
                  <label>Professional Summary</label>
                  <textarea className="input-field" rows={4} value={data.professionalSummary || ""} onChange={(e) => setData({ ...data, professionalSummary: e.target.value })} />
                </div>

                <h3 style={{ marginTop: "var(--space-6)", marginBottom: "var(--space-3)", fontSize: "1rem", fontWeight: 600, borderTop: "1px solid var(--border-color)", paddingTop: "var(--space-4)" }}>Personal & Links</h3>
                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="input-group">
                    <label>Date of Birth</label>
                    <input className="input-field" type="date" value={data.dob || ""} onChange={(e) => setData({ ...data, dob: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>GitHub Profile URL</label>
                    <input className="input-field" placeholder="https://github.com/username" value={data.githubLink || ""} onChange={(e) => setData({ ...data, githubLink: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>LinkedIn Profile URL</label>
                    <input className="input-field" placeholder="https://linkedin.com/in/username" value={data.linkedinLink || ""} onChange={(e) => setData({ ...data, linkedinLink: e.target.value })} />
                  </div>
                  <div className="input-group">
                    <label>Portfolio Website URL</label>
                    <input className="input-field" placeholder="https://your-portfolio.com" value={data.portfolioUrl || ""} onChange={(e) => setData({ ...data, portfolioUrl: e.target.value })} />
                  </div>
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
                        <select className="input-field" value={edu.degree || ""} onChange={(e) => { const n = [...education]; n[idx].degree = e.target.value; setEducation(n); }} required>
                          <option value="" disabled>Select Level...</option>
                          <option value="Schooling">Schooling (10th / 12th Std)</option>
                          <option value="Diploma">Diploma</option>
                          <option value="UG">Undergraduate (UG)</option>
                          <option value="PG">Postgraduate (PG)</option>
                        </select>
                      </div>
                      <div className="input-group">
                        <label>Institution Name *</label>
                        <input className="input-field" placeholder="e.g. Rathinam College" value={edu.institution || ""} onChange={(e) => { const n = [...education]; n[idx].institution = e.target.value; setEducation(n); }} required />
                      </div>
                      <div className="input-group">
                        <label>Field of Study / Department</label>
                        <input className="input-field" placeholder="e.g. Computer Science" value={edu.fieldOfStudy || ""} onChange={(e) => { const n = [...education]; n[idx].fieldOfStudy = e.target.value; setEducation(n); }} />
                      </div>
                      <div className="input-group">
                        <label>Start Year</label>
                        <input className="input-field" type="number" placeholder="2020" value={edu.startYear || ""} onChange={(e) => { const n = [...education]; n[idx].startYear = e.target.value; setEducation(n); }} />
                      </div>
                      <div className="input-group">
                        <label>End Year</label>
                        <input className="input-field" type="number" placeholder="2024" value={edu.endYear || ""} onChange={(e) => { const n = [...education]; n[idx].endYear = e.target.value; setEducation(n); }} />
                      </div>
                      <div className="input-group">
                        <label>Score (%) / CGPA</label>
                        <input className="input-field" placeholder="8.5" value={edu.score || ""} onChange={(e) => { const n = [...education]; n[idx].score = e.target.value; setEducation(n); }} />
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
                        <input className="input-field" value={proj.title || ""} onChange={(e) => { const n = [...projects]; n[idx].title = e.target.value; setProjects(n); }} required />
                      </div>
                      <div className="input-group">
                        <label>Project URL (GitHub/Live)</label>
                        <input className="input-field" value={proj.projectUrl || ""} onChange={(e) => { const n = [...projects]; n[idx].projectUrl = e.target.value; setProjects(n); }} />
                      </div>
                      <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Description</label>
                        <textarea className="input-field" rows={3} value={proj.description || ""} onChange={(e) => { const n = [...projects]; n[idx].description = e.target.value; setProjects(n); }} required />
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
                        <input className="input-field" value={cert.name || ""} onChange={(e) => { const n = [...certs]; n[idx].name = e.target.value; setCerts(n); }} required />
                      </div>
                      <div className="input-group">
                        <label>Issuing Organization</label>
                        <input className="input-field" value={cert.issuingOrg || ""} onChange={(e) => { const n = [...certs]; n[idx].issuingOrg = e.target.value; setCerts(n); }} required />
                      </div>
                      <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Credential URL</label>
                        <input className="input-field" value={cert.credentialUrl || ""} onChange={(e) => { const n = [...certs]; n[idx].credentialUrl = e.target.value; setCerts(n); }} />
                      </div>
                    </div>
                  </div>
                ))}
                <button type="button" className="btn btn-outline" style={{ width: "100%", justifyContent: "center", display: "flex" }} onClick={() => setCerts([...certs, { name: "", issuingOrg: "", credentialUrl: "" }])}>
                  <Award size={18} style={{ marginRight: 8 }} /> Add Certification
                </button>
              </div>
            )}

            {/* Links Tab */}
            {activeTab === "links" && (
              <div className="animate-fade-in">
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={links.map((l) => l._id)} strategy={verticalListSortingStrategy}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                      {links.map((link, idx) => (
                        <SortableLinkRow
                          key={link._id}
                          link={link}
                          index={idx}
                          onUpdate={handleLinkUpdate}
                          onDelete={handleLinkDelete}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>

                <div style={{ display: "flex", gap: "var(--space-4)", marginTop: "var(--space-6)" }}>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      setLinks([...links, { platform: "GitHub", title: "", url: "", _id: `link-${Date.now()}` }])
                    }
                  >
                    <Plus size={18} /> Add Link
                  </button>
                </div>

                {githubUser && (
                  <div style={{ 
                    marginTop: "var(--space-6)",
                    "--github-level-0": "var(--bg-secondary)",
                    "--github-level-1": "rgba(46, 160, 67, 0.4)",
                    "--github-level-2": "rgba(46, 160, 67, 0.6)",
                    "--github-level-3": "rgba(46, 160, 67, 0.8)",
                    "--github-level-4": "rgba(46, 160, 67, 1)",
                  } as React.CSSProperties}>
                    <GitHubHeatmap username={githubUser} />
                  </div>
                )}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
