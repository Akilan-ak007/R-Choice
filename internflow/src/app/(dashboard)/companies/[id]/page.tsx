import { db } from "@/lib/db";
import { users, companyRegistrations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Building, MapPin, Phone, Calendar,
  User, Shield, FileText, Briefcase, Award, ExternalLink,
} from "lucide-react";

const companySectionStyle: React.CSSProperties = {
  background: "var(--bg-primary)",
  border: "1px solid var(--border-color)",
  borderRadius: "var(--radius-lg)",
  padding: "var(--space-5)",
  display: "flex",
  flexDirection: "column",
  gap: "var(--space-4)",
};

const companySectionHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  fontSize: "1.1rem",
  fontWeight: 600,
  color: "var(--text-primary)",
  borderBottom: "1px solid var(--border-color)",
  paddingBottom: "var(--space-3)",
};

const companyFieldRowStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "var(--space-3)",
};

const companyFieldStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "4px",
};

const companyLabelStyle: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  color: "var(--text-muted)",
};

const companyValueStyle: React.CSSProperties = {
  fontSize: "0.9375rem",
  color: "var(--text-primary)",
  fontWeight: 500,
};

function CompanyField({ label, value, href }: { label: string; value?: string | number | null; href?: string }) {
  if (!value) return null;
  return (
    <div style={companyFieldStyle}>
      <span style={companyLabelStyle}>{label}</span>
      {href ? (
        <a href={href} target="_blank" rel="noopener noreferrer" style={{ ...companyValueStyle, color: "var(--primary-color)", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}>
          {String(value)} <ExternalLink size={12} />
        </a>
      ) : (
        <span style={companyValueStyle}>{String(value)}</span>
      )}
    </div>
  );
}

export default async function CompanyPortfolioPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const [regById] = await db
    .select()
    .from(companyRegistrations)
    .where(eq(companyRegistrations.id, params.id))
    .limit(1);

  const [regByUserId] = regById
    ? [undefined]
    : await db
        .select()
        .from(companyRegistrations)
        .where(eq(companyRegistrations.userId, params.id))
        .limit(1);

  const reg = regById || regByUserId;

  if (!reg) {
    redirect("/companies");
  }

  const [companyUser] = reg.userId
    ? await db
        .select()
        .from(users)
        .where(eq(users.id, reg.userId))
        .limit(1)
    : [];

  return (
    <div className="animate-fade-in" style={{ maxWidth: "960px", margin: "0 auto" }}>
      <div style={{ marginBottom: "var(--space-4)" }}>
        <Link href="/companies" className="btn btn-ghost" style={{ padding: "8px 0", display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", color: "var(--text-secondary)" }}>
          <ArrowLeft size={16} /> Back to Companies
        </Link>
      </div>

      {/* Hero Header */}
      <div style={{
        background: "linear-gradient(135deg, var(--primary-color), var(--rathinam-green))",
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
          <Building size={40} />
        </div>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: "1.75rem", fontWeight: 700 }}>
            {reg.companyLegalName || [companyUser?.firstName, companyUser?.lastName].filter(Boolean).join(" ") || "Company"}
          </h1>
          {reg?.brandName && (
            <p style={{ margin: "4px 0 0", opacity: 0.85, fontSize: "1rem" }}>
              Trading as: {reg.brandName}
            </p>
          )}
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap", marginTop: "var(--space-3)" }}>
            {reg?.companyType && (
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8125rem" }}>
                {reg.companyType}
              </span>
            )}
            {reg?.industrySector && (
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8125rem" }}>
                {reg.industrySector}
              </span>
            )}
            {reg?.companySize && (
              <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8125rem" }}>
                {reg.companySize} employees
              </span>
            )}
            {reg?.status && (
              <span style={{
                background: reg.status === "approved" ? "rgba(52,211,153,0.3)" : reg.status === "rejected" ? "rgba(239,68,68,0.3)" : "rgba(251,191,36,0.3)",
                padding: "4px 12px",
                borderRadius: "20px",
                fontSize: "0.8125rem",
                fontWeight: 600,
              }}>
                {reg.status.charAt(0).toUpperCase() + reg.status.slice(1)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>

        {/* Company Overview */}
        <div style={companySectionStyle}>
          <div style={companySectionHeaderStyle}>
            <Building size={18} color="var(--primary-color)" /> Company Overview
          </div>
          {reg?.companyDescription && (
            <p style={{ color: "var(--text-secondary)", lineHeight: 1.7, margin: 0 }}>
              {reg.companyDescription}
            </p>
          )}
          <div style={companyFieldRowStyle}>
            <CompanyField label="Year Established" value={reg?.yearEstablished} />
            <CompanyField label="Website" value={reg?.website} href={reg?.website || undefined} />
            <CompanyField label="Email" value={companyUser?.email || reg.hrEmail} href={(companyUser?.email || reg.hrEmail) ? `mailto:${companyUser?.email || reg.hrEmail}` : undefined} />
            <CompanyField label="Phone" value={companyUser?.phone || reg.hrPhone} href={companyUser?.phone ? `tel:${companyUser.phone}` : reg.hrPhone ? `tel:${reg.hrPhone}` : undefined} />
          </div>
        </div>

        {/* Location */}
        {reg && (
          <div style={companySectionStyle}>
            <div style={companySectionHeaderStyle}>
              <MapPin size={18} color="var(--primary-color)" /> Location
            </div>
            <div style={companyFieldRowStyle}>
              <CompanyField label="Address" value={reg.address} />
              <CompanyField label="City" value={reg.city} />
              <CompanyField label="State" value={reg.state} />
              <CompanyField label="PIN Code" value={reg.pinCode} />
            </div>
          </div>
        )}

        {/* HR Contact */}
        {reg && (
          <div style={companySectionStyle}>
            <div style={companySectionHeaderStyle}>
              <Phone size={18} color="var(--primary-color)" /> HR Contact
            </div>
            <div style={companyFieldRowStyle}>
              <CompanyField label="HR Name" value={reg.hrName} />
              <CompanyField label="HR Email" value={reg.hrEmail} href={`mailto:${reg.hrEmail}`} />
              <CompanyField label="HR Phone" value={reg.hrPhone} href={`tel:${reg.hrPhone}`} />
              <CompanyField label="Alternate Phone" value={reg.altPhone} />
            </div>
          </div>
        )}

        {/* CEO / Signatory */}
        {reg?.ceoName && (
          <div style={companySectionStyle}>
            <div style={companySectionHeaderStyle}>
              <User size={18} color="var(--primary-color)" /> CEO / Authorized Signatory
            </div>
            <div style={companyFieldRowStyle}>
              <CompanyField label="Name" value={reg.ceoName} />
              <CompanyField label="Designation" value={reg.ceoDesignation} />
              <CompanyField label="Email" value={reg.ceoEmail} href={reg.ceoEmail ? `mailto:${reg.ceoEmail}` : undefined} />
              <CompanyField label="Phone" value={reg.ceoPhone} />
              <CompanyField label="LinkedIn" value={reg.ceoLinkedin ? "View Profile" : null} href={reg.ceoLinkedin || undefined} />
              <CompanyField label="Portfolio" value={reg.ceoPortfolio ? "View Portfolio" : null} href={reg.ceoPortfolio || undefined} />
            </div>
          </div>
        )}

        {/* Internship Preferences */}
        {reg && (
          <div style={companySectionStyle}>
            <div style={companySectionHeaderStyle}>
              <Briefcase size={18} color="var(--primary-color)" /> Internship Preferences
            </div>
            <div style={companyFieldRowStyle}>
              <CompanyField label="Internship Type" value={reg.internshipType} />
              <CompanyField label="Duration" value={reg.duration} />
              <CompanyField label="Stipend Range" value={reg.stipendRange} />
              <CompanyField label="Hiring Intention" value={reg.hiringIntention} />
            </div>
            {reg.domains && reg.domains.length > 0 && (
              <div style={companyFieldStyle}>
                <span style={companyLabelStyle}>Domains</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {reg.domains.map((d, i) => (
                    <span key={i} style={{
                      background: "var(--primary-light)",
                      color: "var(--primary-color)",
                      padding: "4px 12px",
                      borderRadius: "20px",
                      fontSize: "0.8125rem",
                      fontWeight: 500,
                    }}>
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Legal & Compliance */}
        {reg && (reg.gstNumber || reg.panNumber || reg.cinLlpin) && (
          <div style={companySectionStyle}>
            <div style={companySectionHeaderStyle}>
              <Shield size={18} color="var(--primary-color)" /> Legal & Compliance
            </div>
            <div style={companyFieldRowStyle}>
              <CompanyField label="GST Number" value={reg.gstNumber} />
              <CompanyField label="PAN Number" value={reg.panNumber} />
              <CompanyField label="CIN / LLPIN" value={reg.cinLlpin} />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
              {reg.registrationCertUrl && (
                <a href={reg.registrationCertUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "0.8125rem" }}>
                  <FileText size={14} /> Registration Certificate
                </a>
              )}
              {reg.mouUrl && (
                <a href={reg.mouUrl} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "0.8125rem" }}>
                  <FileText size={14} /> MoU Document
                </a>
              )}
              {reg.coi && (
                <a href={reg.coi} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "0.8125rem" }}>
                  <Award size={14} /> Certificate of Incorporation
                </a>
              )}
              {reg.idProof && (
                <a href={reg.idProof} target="_blank" rel="noopener noreferrer" className="btn btn-outline" style={{ display: "inline-flex", alignItems: "center", gap: "6px", textDecoration: "none", fontSize: "0.8125rem" }}>
                  <Shield size={14} /> ID Proof
                </a>
              )}
            </div>
          </div>
        )}

        {/* Member Info */}
        <div style={{ padding: "var(--space-4)", borderRadius: "var(--radius-md)", background: "var(--bg-secondary)", textAlign: "center" }}>
          <p style={{ margin: 0, fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            <Calendar size={14} style={{ verticalAlign: "middle", marginRight: "6px" }} />
            {reg.createdAt ? `Registered on R-Choice: ${new Date(reg.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })}` : "Member of R-Choice"}
          </p>
        </div>
      </div>
    </div>
  );
}
