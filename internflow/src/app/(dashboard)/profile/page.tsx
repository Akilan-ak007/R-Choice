import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { studentProfiles, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProfileBuilderClient from "./ProfileBuilderClient";
import DeanProfileClient from "./DeanProfileClient";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const role = session.user.role;
  const userId = session.user.id;

  if (role === "principal") {
    const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return (
      <div className="animate-fade-in">
        <div className="page-header">
          <h1>Principal Profile</h1>
          <p>Personal profile overview.</p>
        </div>
        <div className="card" style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-6)", fontSize: "1.05rem" }}>
          <div><strong style={{ display: "inline-block", width: "120px" }}>Name:</strong> {u.firstName} {u.lastName}</div>
          <div><strong style={{ display: "inline-block", width: "120px" }}>Email:</strong> {u.email}</div>
          <div><strong style={{ display: "inline-block", width: "120px" }}>Phone:</strong> {u.phone || <em style={{ color: "var(--text-secondary)" }}>Not set</em>}</div>
          <div><strong style={{ display: "inline-block", width: "120px" }}>Role:</strong> <span style={{ textTransform: "capitalize" }}>{u.role}</span></div>
          <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border-color)" }}>
            <strong style={{ display: "block", marginBottom: "8px" }}>About:</strong>
            {u.about ? (
              <div style={{ color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{u.about}</div>
            ) : (
              <div style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No about information provided. You can add one in Settings.</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Handle Dean Role
  if (role === "dean") {
    const [deanData] = await db
      .select({
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phone: users.phone
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    return (
      <div>
        <div className="page-header">
          <h1>Dean Profile Settings</h1>
          <p>Update your personal and administrative contact details.</p>
        </div>
        <DeanProfileClient initialData={deanData || {}} />
      </div>
    );
  }

  // Handle Student Role
  if (role === "student") {
    const [profile] = await db
      .select()
      .from(studentProfiles)
      .where(eq(studentProfiles.userId, userId))
      .limit(1);

    const initialData = profile || {
      id: "",
      userId,
      registerNo: "",
      department: "",
      year: 1,
      section: "A",
      cgpa: "0.0",
      professionalSummary: "",
      profileCompletionScore: 0,
    };

    return (
      <div>
        <div className="page-header">
          <h1>Your Professional Profile</h1>
          <p>Complete your profile to unlock job applications.</p>
        </div>
        <ProfileBuilderClient initialData={initialData} />
      </div>
    );
  }

  // Generic Profile fallback for all other roles (Tutor, Coordinator, HOD, PO, Company, etc)
  const [genericUser] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 style={{ textTransform: "capitalize" }}>{genericUser.role.replace(/_/g, " ")} Profile</h1>
        <p>Personal profile overview.</p>
      </div>
      <div className="card" style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "var(--space-3)", padding: "var(--space-6)", fontSize: "1.05rem" }}>
        <div><strong style={{ display: "inline-block", width: "120px" }}>Name:</strong> {genericUser.firstName} {genericUser.lastName}</div>
        <div><strong style={{ display: "inline-block", width: "120px" }}>Email:</strong> {genericUser.email}</div>
        <div><strong style={{ display: "inline-block", width: "120px" }}>Phone:</strong> {genericUser.phone || <em style={{ color: "var(--text-secondary)" }}>Not set</em>}</div>
        <div><strong style={{ display: "inline-block", width: "120px" }}>Role:</strong> <span style={{ textTransform: "capitalize" }}>{genericUser.role.replace(/_/g, " ")}</span></div>
        <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--border-color)" }}>
          <strong style={{ display: "block", marginBottom: "8px" }}>About:</strong>
          {genericUser.about ? (
            <div style={{ color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{genericUser.about}</div>
          ) : (
            <div style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>No about information provided. You can update this via Settings.</div>
          )}
        </div>
      </div>
    </div>
  );
}
