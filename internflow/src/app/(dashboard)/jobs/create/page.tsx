"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Loader2, Briefcase, Plus, X, HelpCircle, Users, Wrench, ListChecks, Phone } from "lucide-react";
import Link from "next/link";
import { createJobPosting } from "@/app/actions/jobs";

type TagInputProps = {
  label: string;
  tags: string[];
  input: string;
  setInput: (value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  placeholder: string;
};

type SelectionRoundDraft = {
  roundName: string;
  roundType: string;
  startsAt: string;
  endsAt: string;
  mode: string;
  meetLink: string;
  location: string;
  description: string;
};

function TagInput({ label, tags, input, setInput, onAdd, onRemove, placeholder }: TagInputProps) {
  return (
    <div className="input-group" style={{ gridColumn: "1 / -1" }}>
      <label>{label}</label>
      <div style={{ display: "flex", gap: "8px" }}>
        <input
          className="input-field"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onAdd();
            }
          }}
          placeholder={placeholder}
          style={{ flex: 1 }}
        />
        <button type="button" onClick={onAdd} className="btn btn-outline" style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
          <Plus size={14} /> Add
        </button>
      </div>
      {tags.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "8px" }}>
          {tags.map((tag, i) => (
            <span
              key={`${label}-${tag}-${i}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "var(--primary-light)",
                color: "var(--primary-color)",
                padding: "4px 10px",
                borderRadius: "16px",
                fontSize: "0.8125rem",
                fontWeight: 500,
              }}
            >
              {tag}
              <button
                type="button"
                onClick={() => onRemove(i)}
                style={{
                  background: "none",
                  border: "none",
                  color: "inherit",
                  cursor: "pointer",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default function CreateJobPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Tag-based inputs
  const [mandatorySkills, setMandatorySkills] = useState<string[]>([]);
  const [preferredSkills, setPreferredSkills] = useState<string[]>([]);
  const [tools, setTools] = useState<string[]>([]);
  const [perks, setPerks] = useState<string[]>([]);
  const [faqs, setFaqs] = useState<{ question: string; answer: string }[]>([]);
  const [contacts, setContacts] = useState<{ name: string; role: string; email: string; phone: string }[]>([]);
  const [selectionRounds, setSelectionRounds] = useState<SelectionRoundDraft[]>([]);

  // Tag input helpers
  const [skillInput, setSkillInput] = useState("");
  const [prefSkillInput, setPrefSkillInput] = useState("");
  const [toolInput, setToolInput] = useState("");
  const [perkInput, setPerkInput] = useState("");

  function addTag(list: string[], setter: (v: string[]) => void, value: string, inputSetter: (v: string) => void) {
    const trimmed = value.trim();
    if (trimmed && !list.includes(trimmed)) {
      setter([...list, trimmed]);
    }
    inputSetter("");
  }

  function removeTag(list: string[], setter: (v: string[]) => void, index: number) {
    setter(list.filter((_, i) => i !== index));
  }

  function updateRound(index: number, field: keyof SelectionRoundDraft, value: string) {
    setSelectionRounds((prev) => prev.map((round, roundIndex) => (
      roundIndex === index ? { ...round, [field]: value } : round
    )));
  }

  function addRound() {
    setSelectionRounds((prev) => [
      ...prev,
      {
        roundName: "",
        roundType: "custom",
        startsAt: "",
        endsAt: "",
        mode: "Online",
        meetLink: "",
        location: "",
        description: "",
      },
    ]);
  }

  function removeRound(index: number) {
    setSelectionRounds((prev) => prev.filter((_, roundIndex) => roundIndex !== index));
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    
    // Append array/JSON fields
    mandatorySkills.forEach(s => formData.append("mandatorySkills", s));
    preferredSkills.forEach(s => formData.append("preferredSkills", s));
    tools.forEach(s => formData.append("tools", s));
    perks.forEach(s => formData.append("perks", s));
    const normalizedRounds = selectionRounds
      .map((round) => ({
        ...round,
        roundName: round.roundName.trim(),
        roundType: round.roundType || "custom",
        mode: round.mode || "Online",
      }))
      .filter((round) => round.roundName);
    normalizedRounds.forEach((round) => formData.append("selectionSteps", round.roundName));
    formData.set("selectionRoundsJson", JSON.stringify(normalizedRounds));
    formData.set("faq", JSON.stringify(faqs));
    formData.set("contactPersons", JSON.stringify(contacts));

    const result = await createJobPosting(formData);

    if (result.error) {
      setError(result.error);
      setIsLoading(false);
    } else {
      router.push("/jobs/manage");
      router.refresh();
    }
  };

  const sectionStyle: React.CSSProperties = {
    background: "var(--bg-primary)",
    border: "1px solid var(--border-color)",
    borderRadius: "var(--radius-lg)",
    padding: "var(--space-5)",
    display: "flex",
    flexDirection: "column",
    gap: "var(--space-4)",
  };

  const sectionHeaderStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    fontSize: "1.05rem",
    fontWeight: 600,
    color: "var(--text-primary)",
    borderBottom: "1px solid var(--border-color)",
    paddingBottom: "var(--space-3)",
    margin: 0,
  };

  return (
    <div className="animate-fade-in" style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <Link href="/jobs/manage" className="btn btn-ghost" style={{ padding: "8px 0", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "var(--text-secondary)" }}>
          <ArrowLeft size={16} /> Back to My Postings
        </Link>
      </div>

      <div className="page-header" style={{ display: "flex", gap: "12px", alignItems: "center" }}>
        <div style={{ padding: "12px", background: "var(--bg-hover)", borderRadius: "var(--border-radius-md)" }}>
          <Briefcase size={24} color="var(--primary-color)" />
        </div>
        <div>
          <h1>Create New Job Posting</h1>
          <p>Publish an internship opportunity to the Rathinam talent pool.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
        
        {/* ── Section 1: Basic Info ── */}
        <div style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>
            <Briefcase size={18} color="var(--primary-color)" /> Basic Job Information
          </h3>
          <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
            <div className="input-group" style={{ gridColumn: "1 / -1" }}>
              <label>Job Title / Role *</label>
              <input name="title" className="input-field" required placeholder="e.g. Software Engineering Intern" />
            </div>
            
            <div className="input-group">
              <label>Job Type *</label>
              <select name="jobType" className="input-field" required>
                <option value="internship">Internship</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
              </select>
            </div>

            <div className="input-group">
              <label>Domain / Function</label>
              <input name="domain" className="input-field" placeholder="e.g. Web Development, Marketing" />
            </div>
            
            <div className="input-group">
              <label>Work Mode *</label>
              <select name="workMode" className="input-field" required>
                <option value="Hybrid">Hybrid</option>
                <option value="Remote">Remote</option>
                <option value="On-site">On-site</option>
              </select>
            </div>

            <div className="input-group">
              <label>Location *</label>
              <input name="location" className="input-field" required placeholder="e.g. Bangalore, Chennai" />
            </div>
            
            <div className="input-group">
              <label>Duration *</label>
              <input name="duration" className="input-field" required placeholder="e.g. 3 Months, 6 Months" defaultValue="3 Months" />
            </div>

            <div className="input-group">
              <label>Stipend / Salary Info *</label>
              <input name="stipendInfo" className="input-field" required placeholder="e.g. ₹20,000/month or 5 LPA" />
            </div>
          </div>

          <div className="grid grid-2" style={{ gap: "var(--space-4)", background: "var(--bg-secondary)", padding: "16px", borderRadius: "8px" }}>
            <div className="input-group" style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row" }}>
              <input type="checkbox" name="isPpoAvailable" id="isPpoAvailable" value="true" style={{ width: "20px", height: "20px" }} />
              <label htmlFor="isPpoAvailable" style={{ margin: 0 }}>PPO Available (Pre-Placement Offer)?</label>
            </div>
            <div className="input-group" style={{ display: "flex", alignItems: "center", gap: "8px", flexDirection: "row" }}>
              <input type="checkbox" name="isCampusHiring" id="isCampusHiring" value="true" style={{ width: "20px", height: "20px" }} />
              <label htmlFor="isCampusHiring" style={{ margin: 0 }}>Campus Hiring?</label>
            </div>
          </div>
        </div>

        {/* ── Section 2: Description & Responsibilities ── */}
        <div style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>
            <ListChecks size={18} color="var(--primary-color)" /> Role Details
          </h3>
          <div className="input-group">
            <label>Job Description *</label>
            <textarea 
              name="description" className="input-field" required 
              placeholder="Describe the role, responsibilities, and learning outcomes..."
              style={{ minHeight: "120px", resize: "vertical" }}
            />
          </div>
          <div className="input-group">
            <label>Key Responsibilities</label>
            <textarea 
              name="responsibilities" className="input-field"
              placeholder="List key day-to-day responsibilities..."
              style={{ minHeight: "80px", resize: "vertical" }}
            />
          </div>
          <div className="input-group">
            <label>What You&apos;ll Learn</label>
            <textarea 
              name="learnings" className="input-field"
              placeholder="What students will learn during this internship..."
              style={{ minHeight: "80px", resize: "vertical" }}
            />
          </div>
        </div>

        {/* ── Section 3: Skills & Tools ── */}
        <div style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>
            <Wrench size={18} color="var(--primary-color)" /> Skills & Tools
          </h3>
          <TagInput label="Mandatory Skills" tags={mandatorySkills} input={skillInput} setInput={setSkillInput}
            onAdd={() => addTag(mandatorySkills, setMandatorySkills, skillInput, setSkillInput)}
            onRemove={(i) => removeTag(mandatorySkills, setMandatorySkills, i)}
            placeholder="e.g. React, Python — press Enter to add"
          />
          <TagInput label="Preferred Skills" tags={preferredSkills} input={prefSkillInput} setInput={setPrefSkillInput}
            onAdd={() => addTag(preferredSkills, setPreferredSkills, prefSkillInput, setPrefSkillInput)}
            onRemove={(i) => removeTag(preferredSkills, setPreferredSkills, i)}
            placeholder="e.g. TypeScript, Docker — press Enter to add"
          />
          <TagInput label="Tools & Technologies" tags={tools} input={toolInput} setInput={setToolInput}
            onAdd={() => addTag(tools, setTools, toolInput, setToolInput)}
            onRemove={(i) => removeTag(tools, setTools, i)}
            placeholder="e.g. VS Code, Figma, Jira — press Enter to add"
          />
        </div>

        {/* ── Section 4: Eligibility & Vacancies ── */}
        <div style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>
            <Users size={18} color="var(--primary-color)" /> Eligibility & Vacancies
          </h3>
          <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
            <div className="input-group">
              <label>Number of Vacancies *</label>
              <input type="number" min="1" name="openingsCount" className="input-field" required defaultValue="1" />
            </div>
            <div className="input-group">
              <label>Application Deadline *</label>
              <input type="date" name="deadline" className="input-field" required />
            </div>
            <div className="input-group">
              <label>Expected Start Date</label>
              <input type="date" name="startDate" className="input-field" />
            </div>
            <div className="input-group">
              <label>Expected Joining Date</label>
              <input type="date" name="expectedJoiningDate" className="input-field" />
            </div>
            <div className="input-group">
              <label>Minimum CGPA</label>
              <input type="number" step="0.01" min="0" max="10" name="minCgpa" className="input-field" placeholder="e.g. 7.0" />
            </div>
            <div className="input-group">
              <label>Interview Mode</label>
              <select name="interviewMode" className="input-field">
                <option value="">Select</option>
                <option value="Online">Online</option>
                <option value="Offline">Offline (On-campus)</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>
          <div className="input-group">
            <label>Preferred Qualifications</label>
            <textarea name="preferredQualifications" className="input-field" placeholder="e.g. Final year B.Tech students with project experience..." style={{ minHeight: "60px", resize: "vertical" }} />
          </div>
        </div>

        {/* ── Section 5: Selection Process ── */}
        <div style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>
            <ListChecks size={18} color="var(--primary-color)" /> Selection Process
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {selectionRounds.length === 0 ? (
              <div style={{ padding: "14px 16px", borderRadius: "10px", background: "var(--bg-secondary)", color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                Rounds are optional. Add round details only if this job needs a structured selection workflow.
              </div>
            ) : null}
            {selectionRounds.map((round, index) => (
              <div key={`round-${index}`} style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "12px", position: "relative" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ fontWeight: 700, fontSize: "0.95rem" }}>Round {index + 1}</div>
                  {selectionRounds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeRound(index)}
                      style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                    >
                      <X size={14} /> Remove
                    </button>
                  )}
                </div>

                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="input-group">
                    <label>Round Name *</label>
                    <input
                      className="input-field"
                      value={round.roundName}
                      onChange={(e) => updateRound(index, "roundName", e.target.value)}
                      placeholder="e.g. Online Test"
                    />
                  </div>
                  <div className="input-group">
                    <label>Round Type</label>
                    <select
                      className="input-field"
                      value={round.roundType}
                      onChange={(e) => updateRound(index, "roundType", e.target.value)}
                    >
                      <option value="custom">Custom</option>
                      <option value="aptitude_test">Aptitude Test</option>
                      <option value="coding_test">Coding Test</option>
                      <option value="technical_interview">Technical Interview</option>
                      <option value="hr_interview">HR Interview</option>
                      <option value="group_discussion">Group Discussion</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Start Date & Time</label>
                    <input
                      type="datetime-local"
                      className="input-field"
                      value={round.startsAt}
                      onChange={(e) => updateRound(index, "startsAt", e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>End Date & Time</label>
                    <input
                      type="datetime-local"
                      className="input-field"
                      value={round.endsAt}
                      onChange={(e) => updateRound(index, "endsAt", e.target.value)}
                    />
                  </div>
                  <div className="input-group">
                    <label>Mode</label>
                    <select
                      className="input-field"
                      value={round.mode}
                      onChange={(e) => updateRound(index, "mode", e.target.value)}
                    >
                      <option value="Online">Online</option>
                      <option value="Offline">Offline</option>
                      <option value="Hybrid">Hybrid</option>
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Location / Venue</label>
                    <input
                      className="input-field"
                      value={round.location}
                      onChange={(e) => updateRound(index, "location", e.target.value)}
                      placeholder="e.g. Main Campus, Block A"
                    />
                  </div>
                  <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Meeting Link</label>
                    <input
                      className="input-field"
                      value={round.meetLink}
                      onChange={(e) => updateRound(index, "meetLink", e.target.value)}
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                  <div className="input-group" style={{ gridColumn: "1 / -1" }}>
                    <label>Round Notes</label>
                    <textarea
                      className="input-field"
                      value={round.description}
                      onChange={(e) => updateRound(index, "description", e.target.value)}
                      placeholder="Any instructions or expectations for this round..."
                      style={{ minHeight: "70px", resize: "vertical" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addRound}
            className="btn btn-outline"
            style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={14} /> Add Round
          </button>
          <div className="input-group">
            <label>Additional Selection Details</label>
            <textarea name="selectionProcess" className="input-field" placeholder="Any extra details about the selection process..." style={{ minHeight: "60px", resize: "vertical" }} />
          </div>
          <TagInput label="Perks & Benefits" tags={perks} input={perkInput} setInput={setPerkInput}
            onAdd={() => addTag(perks, setPerks, perkInput, setPerkInput)}
            onRemove={(i) => removeTag(perks, setPerks, i)}
            placeholder="e.g. Certificate, Letter of Recommendation, Flexible Hours"
          />
        </div>

        {/* ── Section 6: FAQ ── */}
        <div style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>
            <HelpCircle size={18} color="var(--primary-color)" /> FAQ (Optional)
          </h3>
          {faqs.map((faq, i) => (
            <div key={i} style={{ display: "flex", gap: "var(--space-3)", alignItems: "flex-start", background: "var(--bg-secondary)", padding: "12px", borderRadius: "8px" }}>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "8px" }}>
                <input className="input-field" value={faq.question} onChange={e => {
                  const updated = [...faqs]; updated[i].question = e.target.value; setFaqs(updated);
                }} placeholder="Question" />
                <textarea className="input-field" value={faq.answer} onChange={e => {
                  const updated = [...faqs]; updated[i].answer = e.target.value; setFaqs(updated);
                }} placeholder="Answer" style={{ minHeight: "50px", resize: "vertical" }} />
              </div>
              <button type="button" onClick={() => setFaqs(faqs.filter((_, j) => j !== i))} style={{ background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer", padding: "4px" }}>
                <X size={16} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} className="btn btn-outline" style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={14} /> Add FAQ
          </button>
        </div>

        {/* ── Section 7: Contact Persons ── */}
        <div style={sectionStyle}>
          <h3 style={sectionHeaderStyle}>
            <Phone size={18} color="var(--primary-color)" /> Contact Persons (Optional)
          </h3>
          {contacts.map((c, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", background: "var(--bg-secondary)", padding: "12px", borderRadius: "8px", position: "relative" }}>
              <input className="input-field" value={c.name} onChange={e => {
                const u = [...contacts]; u[i].name = e.target.value; setContacts(u);
              }} placeholder="Name" />
              <input className="input-field" value={c.role} onChange={e => {
                const u = [...contacts]; u[i].role = e.target.value; setContacts(u);
              }} placeholder="Role / Designation" />
              <input className="input-field" value={c.email} onChange={e => {
                const u = [...contacts]; u[i].email = e.target.value; setContacts(u);
              }} placeholder="Email" />
              <input className="input-field" value={c.phone} onChange={e => {
                const u = [...contacts]; u[i].phone = e.target.value; setContacts(u);
              }} placeholder="Phone" />
              <button type="button" onClick={() => setContacts(contacts.filter((_, j) => j !== i))} style={{
                position: "absolute", top: "8px", right: "8px", background: "none", border: "none", color: "var(--color-danger)", cursor: "pointer"
              }}>
                <X size={16} />
              </button>
            </div>
          ))}
          <button type="button" onClick={() => setContacts([...contacts, { name: "", role: "", email: "", phone: "" }])} className="btn btn-outline" style={{ alignSelf: "flex-start", display: "flex", alignItems: "center", gap: "6px" }}>
            <Plus size={14} /> Add Contact Person
          </button>
        </div>

        {error && <div style={{ color: "var(--color-danger)", fontSize: "0.875rem", padding: "12px", background: "rgba(239, 68, 68, 0.1)", borderRadius: "8px" }}>{error}</div>}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)", paddingBottom: "var(--space-6)" }}>
          <Link href="/jobs/manage" className="btn btn-outline" style={{ textDecoration: "none" }}>Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={isLoading} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {isLoading ? "Publishing..." : "Publish Job Posting"}
          </button>
        </div>
      </form>

      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
