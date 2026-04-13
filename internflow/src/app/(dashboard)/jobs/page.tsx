import { auth } from "@/lib/auth";
import { fetchActiveJobs } from "@/app/actions/jobs";
import { redirect } from "next/navigation";
import JobBoardClient from "./JobBoardClient";
import { db } from "@/lib/db";
import { studentJobInterests, studentProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function JobBoardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const role = session.user.role;
  const isStudent = role === "student";

  const jobs = await fetchActiveJobs();

  let interests: any[] = [];
  if (isStudent) {
    const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, session.user.id)).limit(1);
    if (profile) {
      interests = await db.select().from(studentJobInterests).where(eq(studentJobInterests.studentId, profile.id));
    }
  }

  return (
    <div className="animate-fade-in">
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <h1>Opportunities</h1>
        <p>Browse and apply for verified internships from our corporate partners.</p>
      </div>

      <JobBoardClient jobs={jobs} interests={interests} isStudent={isStudent} />

      <style>{`
        .job-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          background: var(--bg-hover);
          color: var(--text-secondary);
          border-radius: var(--border-radius-full);
          font-size: 0.75rem;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
}
