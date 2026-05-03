import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { companyRegistrations } from "@/lib/db/schema";
import { redirect } from "next/navigation";
import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Building, CheckCircle, XCircle, Clock, Globe, Mail, Phone, RotateCcw, FileText, Users } from "lucide-react";
import { reviewCompanyRegistration } from "@/app/actions/mcr";
import { getMailDeliveryMode } from "@/lib/mail";

export default async function CompanyReviewPage() {
  const session = await auth();
  const role = session?.user?.role;
  
  if (!role || !["management_corporation", "mcr"].includes(role)) {
    redirect("/");
  }

  const registrations = await db.select().from(companyRegistrations).orderBy(companyRegistrations.createdAt);
  const mailDeliveryMode = getMailDeliveryMode();

  async function reviewCompany(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) return;
    if (!["management_corporation", "mcr"].includes(session.user.role)) return;

    const id = formData.get("id") as string;
    const action = formData.get("action") as string;
    const comment = formData.get("comment") as string;
    await reviewCompanyRegistration(
      id,
      action as "approve" | "reject" | "reconsider" | "info_requested",
      comment
    );

    revalidatePath("/companies/review");
  }

  const pending = registrations.filter(r => {
    const status = r.status || "pending";
    return ["pending", "registration_submitted", "under_review", "info_requested"].includes(status);
  });
  const reviewed = registrations.filter(r => r.status === "approved" || r.status === "rejected");

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1>Company Registration Review</h1>
        <p>Review and approve, reject, or request more info for company registration applications.</p>
      </div>

      {mailDeliveryMode !== "smtp" && (
        <div className="card" style={{ marginBottom: "var(--space-5)", padding: "var(--space-4)", background: "rgba(245, 158, 11, 0.08)", border: "1px solid rgba(245, 158, 11, 0.2)" }}>
          <div style={{ fontWeight: 700, marginBottom: "6px", color: "#b45309" }}>Manual Credential Handoff Mode</div>
          <div style={{ color: "var(--text-secondary)", fontSize: "0.9rem", lineHeight: 1.6 }}>
            SMTP delivery is disabled right now. When you approve a company, the temporary login credentials will be stored in your dashboard notifications for manual sharing.
          </div>
        </div>
      )}

      {pending.length === 0 && reviewed.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "var(--space-12)", color: "var(--text-secondary)" }}>
          <Building size={48} style={{ margin: "0 auto var(--space-4)", opacity: 0.3 }} />
          <p>No company registrations found.</p>
        </div>
      )}

      {pending.length > 0 && (
        <>
          <h2 style={{ marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={20} color="var(--status-pending)" /> Pending Review ({pending.length})
          </h2>
          <div style={{ display: "grid", gap: "var(--space-4)", marginBottom: "var(--space-8)" }}>
            {pending.map(reg => (
              <div key={reg.id} className="card" style={{ padding: "var(--space-6)" }}>
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "var(--space-4)", marginBottom: "var(--space-4)" }}>
                  <div>
                    <h3 style={{ fontSize: "1.25rem", marginBottom: "var(--space-2)" }}>{reg.companyLegalName}</h3>
                    {reg.brandName && <div style={{ color: "var(--text-secondary)", marginBottom: "var(--space-1)" }}>Brand: {reg.brandName}</div>}
                  </div>
                  <span className={`status-pill ${reg.status === "info_requested" ? "status-pending" : "status-pending"}`}>
                    {reg.status === "info_requested" ? "Info Requested" : reg.status === "under_review" ? "Under Review" : "Pending"}
                  </span>
                </div>

                {/* Full company details grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                  <DetailCell icon={<FileText size={14} />} label="Industry Sector" value={reg.industrySector} />
                  <DetailCell icon={<Globe size={14} />} label="Website" value={reg.website} isLink />
                  <DetailCell icon={<Mail size={14} />} label="HR Email" value={reg.hrEmail} />
                  <DetailCell icon={<Phone size={14} />} label="HR Phone" value={reg.hrPhone} />
                  <DetailCell icon={<Users size={14} />} label="HR Contact" value={reg.hrName} />

                </div>
                <div style={{ marginBottom: "var(--space-4)" }}>
                  <Link href={`/companies/${reg.id}`} className="btn btn-outline" style={{ textDecoration: "none" }}>
                    View Details
                  </Link>
                </div>

                {/* Previous review comment if info was requested */}
                {reg.reviewComment && reg.status === "info_requested" && (
                  <div style={{ padding: "var(--space-3)", background: "rgba(245,158,11,0.08)", borderRadius: "8px", marginBottom: "var(--space-4)", fontSize: "0.875rem" }}>
                    <strong style={{ color: "#f59e0b" }}>Previous Note:</strong> {reg.reviewComment}
                  </div>
                )}

                {/* Action form with comment box */}
                <form action={reviewCompany} style={{ marginTop: "var(--space-2)" }}>
                  <input type="hidden" name="id" value={reg.id} />
                  <div style={{ marginBottom: "var(--space-3)" }}>
                    <label style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}>
                      Review Comment (required for reject/reconsider)
                    </label>
                    <textarea
                      name="comment"
                      placeholder="Add your review notes, reason for rejection, or what additional info is needed..."
                      className="input-field"
                      rows={2}
                      style={{ width: "100%", resize: "vertical" }}
                    />
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-3)" }}>
                    <button type="submit" name="action" value="approve" className="btn" style={{ background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px", border: "1px solid rgba(34,197,94,0.2)" }}>
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button type="submit" name="action" value="reject" className="btn" style={{ background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px", border: "1px solid rgba(239,68,68,0.2)" }}>
                      <XCircle size={16} /> Reject
                    </button>
                    <button type="submit" name="action" value="reconsider" className="btn" style={{ background: "rgba(245, 158, 11, 0.1)", color: "#f59e0b", padding: "8px 16px", display: "flex", alignItems: "center", gap: "6px", border: "1px solid rgba(245,158,11,0.2)" }}>
                      <RotateCcw size={16} /> Request More Info
                    </button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        </>
      )}

      {reviewed.length > 0 && (
        <>
          <h2 style={{ marginBottom: "var(--space-4)" }}>Previously Reviewed ({reviewed.length})</h2>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            {reviewed.map(reg => (
              <div key={reg.id} className="card" style={{ padding: "var(--space-4)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "var(--space-3)" }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "1rem" }}>{reg.companyLegalName}</div>
                    <div style={{ fontSize: "0.8125rem", color: "var(--text-secondary)", display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "4px" }}>
                      <span>{reg.industrySector}</span>
                      <span>·</span>
                      <span>{reg.city}, {reg.state}</span>
                      <span>·</span>
                      <span>{reg.hrEmail}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)" }}>
                    <Link href={`/companies/${reg.id}`} className="btn btn-outline" style={{ textDecoration: "none", padding: "6px 10px", fontSize: "0.75rem" }}>
                      View Details
                    </Link>
                    <span className={`status-pill ${reg.status === "approved" ? "status-approved" : "status-rejected"}`}>{reg.status}</span>
                    {/* Reconsider button for reviewed items */}
                    <form action={reviewCompany} style={{ display: "inline" }}>
                      <input type="hidden" name="id" value={reg.id} />
                      <input type="hidden" name="action" value="reconsider" />
                      <input type="hidden" name="comment" value="Moved back for re-review" />
                      <button type="submit" className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: "0.75rem", display: "flex", alignItems: "center", gap: "4px" }} title="Move back to pending review">
                        <RotateCcw size={14} /> Reconsider
                      </button>
                    </form>
                  </div>
                </div>
                {reg.reviewComment && (
                  <div style={{ marginTop: "var(--space-2)", padding: "var(--space-2) var(--space-3)", background: "var(--bg-secondary)", borderRadius: "6px", fontSize: "0.8125rem", color: "var(--text-secondary)" }}>
                    <strong>Review Note:</strong> {reg.reviewComment}
                  </div>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function DetailCell({ icon, label, value, isLink }: { icon: React.ReactNode; label: string; value: string; isLink?: boolean }) {
  return (
    <div style={{ padding: "var(--space-2) var(--space-3)", background: "var(--bg-secondary)", borderRadius: "8px" }}>
      <div style={{ fontSize: "0.6875rem", color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "4px", marginBottom: "2px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
        {icon} {label}
      </div>
      {isLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.8125rem", fontWeight: 500, color: "var(--color-primary)", wordBreak: "break-all" }}>
          {value}
        </a>
      ) : (
        <div style={{ fontSize: "0.8125rem", fontWeight: 500, wordBreak: "break-word" }}>{value}</div>
      )}
    </div>
  );
}
