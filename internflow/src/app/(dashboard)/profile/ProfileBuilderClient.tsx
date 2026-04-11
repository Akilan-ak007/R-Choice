"use client";

import { useState } from "react";
import styles from "./profile.module.css";
import { CheckCircle2, AlertCircle, Save, User, Book, Briefcase, Award } from "lucide-react";
import { saveBasicProfile } from "@/app/actions/profile";

export default function ProfileBuilderClient({ initialData }: { initialData: any }) {
  const [data, setData] = useState(initialData);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [message, setMessage] = useState({ text: "", type: "" });

  const score = data.profileCompletionScore || 0;
  const isComplete = score === 100;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ text: "", type: "" });

    try {
      if (activeTab === "basic") {
        const result = await saveBasicProfile({
          registerNo: data.registerNo,
          department: data.department,
          year: data.year,
          section: data.section || "A",
          cgpa: data.cgpa?.toString() || "",
          professionalSummary: data.professionalSummary || "",
        });

        if (result.error) {
          setMessage({ text: result.error, type: "error" });
        } else if (result.success) {
          setMessage({ text: "Profile updated successfully!", type: "success" });
          setData({ ...data, profileCompletionScore: result.score });
        }
      } else {
        setMessage({ text: "Not implemented yet", type: "error" });
      }
    } catch {
      setMessage({ text: "An unexpected error occurred.", type: "error" });
    }
    
    setIsSaving(false);
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: <User size={18} /> },
    { id: "education", label: "Education", icon: <Book size={18} /> },
    { id: "skills", label: "Skills", icon: <CheckCircle2 size={18} /> },
    { id: "projects", label: "Projects", icon: <Briefcase size={18} /> },
    { id: "certs", label: "Certifications", icon: <Award size={18} /> },
  ];

  return (
    <div className={styles.profileContainer}>
      {/* Sidebar Navigation */}
      <div className={styles.profileSidebar}>
        <div className={styles.completionWidget}>
          <div className={styles.progressCircle}>
            <svg viewBox="0 0 36 36" className={styles.circularChart}>
              <path
                className={styles.circleBg}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className={styles.circle}
                strokeDasharray={`${score}, 100`}
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className={styles.percentage}>{score}%</div>
          </div>
          <p className={styles.completionText}>Profile Status</p>
          {isComplete ? (
            <span className={styles.badgeSuccess}>Ready for Jobs</span>
          ) : (
            <span className={styles.badgeWarning}>Action Needed</span>
          )}
        </div>

        <nav className={styles.tabNav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.activeTab : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: "var(--space-6)" }}>
          <a 
            href="/api/profile/resume" 
            target="_blank" 
            className="btn btn-outline" 
            style={{ width: "100%", justifyContent: "center", display: "flex" }}
          >
            <Book size={18} style={{ marginRight: "8px" }} />
            Download ATS Resume
          </a>
        </div>
      </div>

      {/* Main Form Area */}
      <div className={styles.profileContent}>
        <div className="card">
          <form onSubmit={handleSave}>
            <div className={styles.formHeader}>
              <h2>{tabs.find((t) => t.id === activeTab)?.label}</h2>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
                {message.text && (
                  <span style={{ fontSize: "0.875rem", color: message.type === "error" ? "var(--color-danger)" : "var(--rathinam-green)" }}>
                    {message.text}
                  </span>
                )}
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                  <Save size={16} style={{ marginLeft: 8 }} />
                </button>
              </div>
            </div>

            {activeTab === "basic" && (
              <div className="animate-fade-in">
                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="input-group">
                    <label>Register Number *</label>
                    <input
                      className="input-field"
                      value={data.registerNo}
                      onChange={(e) => setData({ ...data, registerNo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Department *</label>
                    <input
                      className="input-field"
                      value={data.department}
                      onChange={(e) => setData({ ...data, department: e.target.value })}
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label>Current CGPA</label>
                    <input
                      className="input-field"
                      type="number"
                      step="0.01"
                      value={data.cgpa}
                      onChange={(e) => setData({ ...data, cgpa: e.target.value })}
                    />
                  </div>
                  <div className="input-group">
                    <label>Year of Study</label>
                    <select
                      className="input-field"
                      value={data.year}
                      onChange={(e) => setData({ ...data, year: Number(e.target.value) })}
                    >
                      <option value="1">1st Year</option>
                      <option value="2">2nd Year</option>
                      <option value="3">3rd Year</option>
                      <option value="4">4th Year</option>
                    </select>
                  </div>
                </div>

                <div className="input-group" style={{ marginTop: "var(--space-4)" }}>
                  <label>Professional Summary</label>
                  <textarea
                    className="input-field"
                    rows={5}
                    placeholder="Brief overview of your skills, interests, and career goals..."
                    value={data.professionalSummary || ""}
                    onChange={(e) => setData({ ...data, professionalSummary: e.target.value })}
                  />
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 4 }}>
                    This appears at the top of your resume and profile.
                  </p>
                </div>
              </div>
            )}

            {activeTab !== "basic" && (
              <div className="animate-fade-in" style={{ padding: "var(--space-8) 0", textAlign: "center" }}>
                <p style={{ color: "var(--text-secondary)" }}>
                  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} manager coming soon.
                </p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
