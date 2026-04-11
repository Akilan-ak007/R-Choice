import Link from 'next/link';

export default function RegisterCompanyPage() {
  return (
    <div style={{ display: "flex", minHeight: "100dvh", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
      <div className="card" style={{ textAlign: "center", padding: "var(--space-8)", maxWidth: "500px", width: "90%" }}>
        <div style={{ fontSize: "3rem", marginBottom: "var(--space-4)" }}>🏢</div>
        <h2 style={{ marginBottom: "var(--space-2)" }}>Company Registration</h2>
        <p style={{ color: "var(--text-secondary)", marginBottom: "var(--space-6)" }}>
          The external company onboarding pipeline is currently being developed. 
          Once live, HR partners will be able to submit their verification documents here.
        </p>
        <Link href="/" className="btn btn-primary" style={{ display: "inline-flex" }}>
          Return to Login
        </Link>
      </div>
    </div>
  );
}
