import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { studentProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import ProfileBuilderClient from "./ProfileBuilderClient";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id || (session.user as any).role !== "student") {
    redirect("/");
  }

  const userId = session.user.id as string;

  // Let's try to get their profile
  const [profile] = await db
    .select()
    .from(studentProfiles)
    .where(eq(studentProfiles.userId, userId))
    .limit(1);

  // For the demo, let's just create a shell if they don't have one
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
