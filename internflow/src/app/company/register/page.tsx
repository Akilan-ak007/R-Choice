"use client";

import { Suspense, useState, useEffect, type FormEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Building2,
  CheckCircle,
  AlertCircle,
  Loader2,
  Globe,
  Mail,
  Phone,
  User,
  FileText,
  Briefcase,
  MapPin,
  RefreshCcw,
} from "lucide-react";

const INDUSTRY_OPTIONS = [
  "Information Technology", "Software Development", "Data Science & AI",
  "Cybersecurity", "Cloud Computing", "Fintech", "EdTech", "HealthTech",
  "E-Commerce", "Manufacturing", "Consulting", "Banking & Finance",
  "Telecommunications", "Media & Entertainment", "Automotive",
  "Pharmaceutical", "Energy & Utilities", "Real Estate", "Logistics",
  "Agriculture & AgriTech", "Other",
];

const COMPANY_TYPES = [
  "Private Limited (Pvt Ltd)", "Public Limited (PLC)",
  "Limited Liability Partnership (LLP)", "Startup", "Partnership Firm",
  "Sole Proprietorship", "Government / PSU", "Non-Profit / NGO", "MNC",
];

const COMPANY_SIZES = [
  "1-10", "11-50", "51-200", "201-500", "501-1000", "1001-5000", "5000+",
];

const INTERNSHIP_TYPES = [
  "Full-Time Internship", "Part-Time Internship", "Summer Internship",
  "Winter Internship", "Virtual Internship", "Hybrid",
];

type CompanyPrefill = {
  id: string;
  companyLegalName: string;
  brandName: string | null;
  companyDescription: string | null;
  companyType: string | null;
  industrySector: string | null;
  yearEstablished: number | null;
  companySize: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pinCode: string | null;
  hrName: string | null;
  hrEmail: string | null;
  hrPhone: string | null;
  altPhone: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  cinLlpin: string | null;
  coi: string | null;
  ceoName: string | null;
  ceoDesignation: string | null;
  ceoEmail: string | null;
  ceoPhone: string | null;
  ceoLinkedin: string | null;
  ceoPortfolio: string | null;
  internshipType: string | null;
  domains: string[] | null;
  duration: string | null;
  stipendRange: string | null;
  hiringIntention: string | null;
  generalTcAccepted: boolean | null;
  status: string | null;
  reviewComment: string | null;
  reviewedAt: string | null;
};

export default function CompanyRegisterPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary, #0a0a0f)" }}>
          <div style={{ textAlign: "center", color: "var(--text-secondary, #888)" }}>
            <Loader2 size={40} style={{ animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
            <p>Loading registration form...</p>
          </div>
        </div>
      }
    >
      <CompanyRegisterForm />
    </Suspense>
  );
}

function CompanyRegisterForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [status, setStatus] = useState<"validating" | "valid" | "expired" | "error">("validating");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [step, setStep] = useState(1);
  const [prefill, setPrefill] = useState<CompanyPrefill | null>(null);
  const [wasResubmission, setWasResubmission] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    fetch(`/api/company/validate-token?token=${encodeURIComponent(token)}`)
      .then((response) => response.json())
      .then((data) => {
        if (!data.valid) {
          setStatus("expired");
          return;
        }

        setPrefill(data.company || null);
        setStatus("valid");
      })
      .catch(() => setStatus("error"));
  }, [token]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg("");

    const fd = new FormData(e.currentTarget);
    const body: Record<string, unknown> = {};
    fd.forEach((value, key) => {
      body[key] = value;
    });
    body.token = token;
    body.generalTcAccepted = fd.get("generalTcAccepted") === "on";

    try {
      const res = await fetch("/api/company/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (data.success) {
        setWasResubmission(!!data.updated);
        setSuccess(true);
      } else {
        setErrorMsg(data.error || "Registration failed. Please try again.");
      }
    } catch {
      setErrorMsg("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "validating") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary, #0a0a0f)" }}>
        <div style={{ textAlign: "center", color: "var(--text-secondary, #888)" }}>
          <Loader2 size={40} style={{ animation: "spin 1s linear infinite", marginBottom: "1rem" }} />
          <p>Validating your registration link...</p>
        </div>
      </div>
    );
  }

  if (status === "expired" || status === "error") {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary, #0a0a0f)", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: "440px", padding: "3rem 2rem", borderRadius: "16px", border: "1px solid var(--border-color, #222)", background: "var(--bg-secondary, #111)" }}>
          <AlertCircle size={48} color="#ef4444" style={{ marginBottom: "1rem" }} />
          <h2 style={{ marginBottom: "0.5rem", color: "var(--text-primary, #fff)" }}>
            {status === "expired" ? "Link Expired" : "Invalid Link"}
          </h2>
          <p style={{ color: "var(--text-secondary, #888)", marginBottom: "1.5rem" }}>
            {status === "expired"
              ? "This registration link has expired or the company was already approved. Please contact the MCR if you still need access."
              : "This registration link is invalid. Please check the URL or contact the MCR."}
          </p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary, #0a0a0f)", padding: "2rem" }}>
        <div style={{ textAlign: "center", maxWidth: "500px", padding: "3rem 2rem", borderRadius: "16px", border: "1px solid rgba(34,197,94,0.3)", background: "var(--bg-secondary, #111)" }}>
          <CheckCircle size={56} color="#22c55e" style={{ marginBottom: "1rem" }} />
          <h2 style={{ marginBottom: "0.5rem", color: "var(--text-primary, #fff)" }}>
            {wasResubmission ? "Registration Updated!" : "Registration Submitted!"}
          </h2>
          <p style={{ color: "var(--text-secondary, #888)", marginBottom: "1.5rem" }}>
            {wasResubmission
              ? "Your updated company registration has been resubmitted for MCR review."
              : "Your company registration has been submitted for review. You will receive credentials at the CEO email once approved."}
          </p>
          <button onClick={() => router.push("/")} className="button" style={{ padding: "10px 24px" }}>
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  const lifecycleCopy = getLifecycleCopy(prefill?.status);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary, #0a0a0f)", padding: "2rem 1rem" }}>
      <div style={{ maxWidth: "820px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", marginBottom: "0.75rem" }}>
            <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: "linear-gradient(135deg, #9b2e87, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: "1.25rem" }}>R</div>
            <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary, #fff)" }}>R-Choice</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 700, marginBottom: "0.5rem", color: "var(--text-primary, #fff)" }}>Company Registration</h1>
          <p style={{ color: "var(--text-secondary, #888)" }}>
            {lifecycleCopy.description}
          </p>
        </div>

        {prefill && (
          <div style={{ marginBottom: "1.5rem", padding: "16px 18px", background: lifecycleCopy.bg, border: `1px solid ${lifecycleCopy.border}`, borderRadius: "12px", color: lifecycleCopy.text }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700, marginBottom: "6px" }}>
              {lifecycleCopy.icon}
              <span>{lifecycleCopy.title}</span>
            </div>
            <p style={{ margin: 0, fontSize: "0.9rem", lineHeight: 1.55 }}>
              {lifecycleCopy.message}
            </p>
            {prefill.reviewComment && (
              <div style={{ marginTop: "12px", padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.04)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                  Review Note
                </div>
                <div style={{ fontSize: "0.9rem", lineHeight: 1.5 }}>{prefill.reviewComment}</div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem", marginBottom: "2rem" }}>
          {[1, 2, 3, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                background: step === s ? "linear-gradient(135deg, #9b2e87, #6366f1)" : s < step ? "rgba(34,197,94,0.2)" : "var(--bg-secondary, #1a1a2e)",
                color: step === s ? "#fff" : s < step ? "#22c55e" : "var(--text-secondary, #888)",
                fontWeight: 600,
                fontSize: "0.875rem",
                transition: "all 0.2s",
              }}
            >
              {s < step ? "OK" : s}
            </button>
          ))}
        </div>

        {errorMsg && (
          <div style={{ padding: "12px 16px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "8px", color: "#ef4444", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ background: "var(--bg-secondary, #111)", borderRadius: "16px", border: "1px solid var(--border-color, #222)", padding: "2rem", marginBottom: "1.5rem" }}>
            {step === 1 && (
              <>
                <SectionTitle icon={<Building2 size={18} />} title="Company Information" />
                <FormGrid>
                  <FormField label="Company Legal Name *" name="companyLegalName" required defaultValue={prefill?.companyLegalName} />
                  <FormField label="Brand / Trade Name" name="brandName" defaultValue={prefill?.brandName} />
                  <FormSelect label="Company Type *" name="companyType" options={COMPANY_TYPES} required defaultValue={prefill?.companyType} />
                  <FormSelect label="Industry Sector *" name="industrySector" options={INDUSTRY_OPTIONS} required defaultValue={prefill?.industrySector} />
                  <FormField label="Year Established" name="yearEstablished" type="number" defaultValue={prefill?.yearEstablished?.toString()} />
                  <FormSelect label="Company Size" name="companySize" options={COMPANY_SIZES} defaultValue={prefill?.companySize} />
                  <FormField label="Website *" name="website" type="url" icon={<Globe size={14} />} required defaultValue={prefill?.website} />
                  <FormField label="Official Email *" name="hrEmail" type="email" icon={<Mail size={14} />} required defaultValue={prefill?.hrEmail} />
                </FormGrid>
                <FormTextarea label="Company Description" name="companyDescription" placeholder="Briefly describe your company's mission and offerings..." defaultValue={prefill?.companyDescription} />
              </>
            )}

            {step === 2 && (
              <>
                <SectionTitle icon={<MapPin size={18} />} title="Address & Contact" />
                <FormGrid>
                  <FormField label="HR Contact Name *" name="hrName" icon={<User size={14} />} required defaultValue={prefill?.hrName} />
                  <FormField label="HR Phone *" name="hrPhone" type="tel" icon={<Phone size={14} />} required defaultValue={prefill?.hrPhone} />
                  <FormField label="Alternate Phone" name="altPhone" type="tel" icon={<Phone size={14} />} defaultValue={prefill?.altPhone} />
                </FormGrid>
                <FormTextarea label="Registered Address *" name="address" required defaultValue={prefill?.address} />
                <FormGrid>
                  <FormField label="City *" name="city" required defaultValue={prefill?.city} />
                  <FormField label="State *" name="state" required defaultValue={prefill?.state} />
                  <FormField label="PIN Code *" name="pinCode" required defaultValue={prefill?.pinCode} />
                </FormGrid>
              </>
            )}

            {step === 3 && (
              <>
                <SectionTitle icon={<User size={18} />} title="CEO / Founder Details" />
                <FormGrid>
                  <FormField label="CEO / Founder Name *" name="ceoName" required defaultValue={prefill?.ceoName} />
                  <FormField label="Designation *" name="ceoDesignation" required defaultValue={prefill?.ceoDesignation} />
                  <FormField label="CEO Email *" name="ceoEmail" type="email" icon={<Mail size={14} />} required defaultValue={prefill?.ceoEmail} />
                  <FormField label="CEO Phone" name="ceoPhone" type="tel" icon={<Phone size={14} />} defaultValue={prefill?.ceoPhone} />
                  <FormField label="LinkedIn Profile" name="ceoLinkedin" type="url" defaultValue={prefill?.ceoLinkedin} />
                  <FormField label="Portfolio URL" name="ceoPortfolio" type="url" defaultValue={prefill?.ceoPortfolio} />
                </FormGrid>

                <SectionTitle icon={<FileText size={18} />} title="Compliance Documents" />
                <FormGrid>
                  <FormField label="GST Number" name="gstNumber" placeholder="e.g. 22AAAAA0000A1Z5" defaultValue={prefill?.gstNumber} />
                  <FormField label="PAN Number" name="panNumber" placeholder="e.g. AAAAA0000A" defaultValue={prefill?.panNumber} />
                  <FormField label="CIN / LLPIN" name="cinLlpin" placeholder="Company Identification Number" defaultValue={prefill?.cinLlpin} />
                  <FormField label="COI (URL)" name="coi" placeholder="Certificate of Incorporation URL" type="url" defaultValue={prefill?.coi} />
                </FormGrid>
              </>
            )}

            {step === 4 && (
              <>
                <SectionTitle icon={<Briefcase size={18} />} title="Internship Preferences" />
                <FormGrid>
                  <FormSelect label="Preferred Internship Type" name="internshipType" options={INTERNSHIP_TYPES} defaultValue={prefill?.internshipType} />
                  <FormField label="Domains of Interest" name="domains" placeholder="e.g. Web Dev, Data Science, Marketing" defaultValue={prefill?.domains?.join(", ")} />
                  <FormField label="Typical Duration" name="duration" placeholder="e.g. 3 months, 6 months" defaultValue={prefill?.duration} />
                  <FormField label="Stipend Range" name="stipendRange" placeholder="e.g. Rs 10,000 - Rs 25,000 / month" defaultValue={prefill?.stipendRange} />
                  <FormField label="Hiring Intention" name="hiringIntention" placeholder="e.g. PPO available for top performers" defaultValue={prefill?.hiringIntention} />
                </FormGrid>

                <div style={{ marginTop: "1.5rem", padding: "1rem", background: "rgba(99,102,241,0.08)", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.2)" }}>
                  <label style={{ display: "flex", alignItems: "flex-start", gap: "10px", cursor: "pointer" }}>
                    <input type="checkbox" name="generalTcAccepted" required defaultChecked={!!prefill?.generalTcAccepted} style={{ marginTop: "3px" }} />
                    <span style={{ fontSize: "0.875rem", color: "var(--text-secondary, #888)" }}>
                      I confirm that all information provided is accurate. I agree to R-Choice&apos;s terms of partnership, including compliance with applicable labor and internship regulations. <span style={{ color: "#ef4444" }}>*</span>
                    </span>
                  </label>
                </div>
              </>
            )}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
            {step > 1 && (
              <button type="button" onClick={() => setStep(step - 1)} className="btn btn-outline" style={{ padding: "10px 24px" }}>
                Previous
              </button>
            )}
            <div style={{ marginLeft: "auto" }}>
              {step < 4 ? (
                <button type="button" onClick={() => setStep(step + 1)} className="button" style={{ padding: "10px 24px" }}>
                  Next
                </button>
              ) : (
                <button type="submit" className="button" disabled={submitting} style={{ padding: "10px 28px", display: "flex", alignItems: "center", gap: "8px" }}>
                  {submitting ? (
                    <>
                      <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> Submitting...
                    </>
                  ) : prefill ? (
                    <>
                      <RefreshCcw size={16} /> Update Registration
                    </>
                  ) : (
                    "Submit Registration"
                  )}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function getLifecycleCopy(status: string | null | undefined) {
  switch (status) {
    case "info_requested":
      return {
        title: "Action Needed",
        description: "Please update the requested details and resubmit your company registration.",
        message: "The MCR reviewed your application and requested more information before approval. Update the form below and resubmit it.",
        bg: "rgba(245, 158, 11, 0.12)",
        border: "rgba(245, 158, 11, 0.35)",
        text: "#fbbf24",
        icon: <AlertCircle size={18} />,
      };
    case "registration_submitted":
    case "under_review":
      return {
        title: "Draft Reopened",
        description: "Your saved registration details are loaded below. You can revise and resubmit them if needed.",
        message: "Your company already has a registration record linked to this invite. The form below is prefilled with the current submission.",
        bg: "rgba(59, 130, 246, 0.12)",
        border: "rgba(59, 130, 246, 0.35)",
        text: "#93c5fd",
        icon: <RefreshCcw size={18} />,
      };
    default:
      return {
        title: "New Registration",
        description: "Complete the form below to register your company as a hiring partner.",
        message: "Fill in the company profile once. If MCR requests changes later, this invite can be used again until approval is completed.",
        bg: "rgba(99, 102, 241, 0.12)",
        border: "rgba(99, 102, 241, 0.35)",
        text: "#c4b5fd",
        icon: <Building2 size={18} />,
      };
  }
}

function SectionTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "1rem", marginTop: "1.5rem", paddingBottom: "0.5rem", borderBottom: "1px solid var(--border-color, #222)" }}>
      {icon}
      <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary, #fff)" }}>{title}</h3>
    </div>
  );
}

function FormGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
      {children}
    </div>
  );
}

function FormField({
  label,
  name,
  type = "text",
  placeholder,
  icon,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  icon?: React.ReactNode;
  required?: boolean;
  defaultValue?: string | null;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary, #888)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        {icon && <span style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted, #555)" }}>{icon}</span>}
        <input
          type={type}
          name={name}
          placeholder={placeholder || label.replace(" *", "")}
          required={required}
          defaultValue={defaultValue || ""}
          style={{
            width: "100%",
            padding: icon ? "10px 12px 10px 32px" : "10px 12px",
            borderRadius: "8px",
            border: "1px solid var(--border-color, #333)",
            background: "var(--bg-primary, #0a0a0f)",
            color: "var(--text-primary, #fff)",
            fontSize: "0.875rem",
            outline: "none",
            transition: "border-color 0.2s",
            boxSizing: "border-box",
          }}
        />
      </div>
    </div>
  );
}

function FormSelect({
  label,
  name,
  options,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  options: string[];
  required?: boolean;
  defaultValue?: string | null;
}) {
  return (
    <div>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary, #888)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </label>
      <select
        name={name}
        required={required}
        defaultValue={defaultValue || ""}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border-color, #333)",
          background: "var(--bg-primary, #0a0a0f)",
          color: "var(--text-primary, #fff)",
          fontSize: "0.875rem",
          outline: "none",
          boxSizing: "border-box",
        }}
      >
        <option value="">Select...</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function FormTextarea({
  label,
  name,
  placeholder,
  required,
  defaultValue,
}: {
  label: string;
  name: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string | null;
}) {
  return (
    <div style={{ marginBottom: "1rem" }}>
      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary, #888)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {label}
      </label>
      <textarea
        name={name}
        placeholder={placeholder || label}
        required={required}
        rows={3}
        defaultValue={defaultValue || ""}
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: "8px",
          border: "1px solid var(--border-color, #333)",
          background: "var(--bg-primary, #0a0a0f)",
          color: "var(--text-primary, #fff)",
          fontSize: "0.875rem",
          outline: "none",
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
    </div>
  );
}
