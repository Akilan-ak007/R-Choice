import { db } from "@/lib/db";
import { companyInvitations } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import RegistrationForm from "./RegistrationForm";

export default async function RegisterCompanyPage(props: { params: Promise<{ token: string }> }) {
  const { token } = await props.params;

  // Validate Token existence before showing form
  const [invitation] = await db.select().from(companyInvitations).where(eq(companyInvitations.token, token)).limit(1);

  if (!invitation) return <ErrorView message="Invalid Invitation Link. This link does not exist." />;
  if (invitation.isUsed) return <ErrorView message="This invitation link has already been consumed." />;
  if (new Date(invitation.expiresAt) < new Date()) return <ErrorView message="This invitation has expired. Please contact MCR for a new link." />;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-main)", display: "flex", flexDirection: "column" }}>
      <nav style={{ padding: "1.5rem 2rem", borderBottom: "1px solid var(--border-color)", background: "var(--bg-card)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: "1.25rem" }}>
          R-Choice <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>| Official Onboarding</span>
        </div>
      </nav>

      <div style={{ flex: 1, maxWidth: 800, margin: "0 auto", width: "100%", padding: "3rem 1rem" }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>Company Registration</h1>
          <p style={{ color: "var(--text-secondary)" }}>
            Welcome, <strong>{invitation.companyEmail}</strong>. Please complete your registration profile.
          </p>
        </div>

        <div style={{ background: "var(--bg-card)", border: "1px solid var(--border-color)", borderRadius: 12, padding: "2rem" }}>
          <RegistrationForm token={token} />
        </div>
      </div>
    </main>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-main)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ background: "var(--bg-card)", border: "1px solid var(--color-danger)", borderRadius: 12, padding: "3rem", textAlign: "center", maxWidth: 500 }}>
        <h2 style={{ color: "var(--color-danger)", marginBottom: 16 }}>Access Denied</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: 24 }}>{message}</p>
        <a href="/" style={{ color: "var(--color-primary)", textDecoration: "none", fontWeight: 600 }}>← Return Home</a>
      </div>
    </main>
  );
}
