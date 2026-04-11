"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { jobPostings, users } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function createJobPosting(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  
  const role = (session.user as any).role;
  if (role !== "company") {
    // Only companies (or maybe admins) can post jobs. Let's stick to companies for now.
    return { error: "Only companies can post jobs." };
  }

  const title = formData.get("title") as string;
  const description = formData.get("description") as string;
  const requirements = formData.get("requirements") as string;
  const location = formData.get("location") as string;
  const stipendInfo = formData.get("stipendInfo") as string;
  const deadlines = formData.get("deadline") as string;

  if (!title || !description || !location || !deadlines) {
    return { error: "Please fill out all required fields." };
  }

  try {
    // Determine the company name from the user profile
    const [user] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
    
    await db.insert(jobPostings).values({
      postedBy: session.user.id,
      postedByRole: "company",
      title,
      jobType: "Internship", // Need to supply required fields
      description,
      location,
      workMode: "Hybrid",
      duration: "3 Months",
      stipendSalary: stipendInfo || "Unpaid",
      openingsCount: 1,
      applicationDeadline: new Date(deadlines).toISOString().split("T")[0], // Pass date string 
      status: "approved", // Changed to match jobStatusEnum (draft, pending_review, approved, etc)
    });

    revalidatePath("/jobs");
    revalidatePath("/jobs/manage");
    
    return { success: true };
  } catch (error: any) {
    console.error("Job creation error:", error);
    return { error: "Failed to post job." };
  }
}

export async function fetchActiveJobs() {
  try {
    // Join with Users to get the company "firstName" (which we use as company name in the seed)
    const jobs = await db
      .select({
        id: jobPostings.id,
        title: jobPostings.title,
        description: jobPostings.description,
        location: jobPostings.location,
        stipendInfo: jobPostings.stipendSalary,
        deadline: jobPostings.applicationDeadline,
        companyName: users.firstName,
        companyId: jobPostings.postedBy
      })
      .from(jobPostings)
      .innerJoin(users, eq(jobPostings.postedBy, users.id))
      .where(eq(jobPostings.status, "approved"))
      .orderBy(desc(jobPostings.createdAt));
      
    return jobs;
  } catch (err) {
    console.error("Failed to fetch jobs:", err);
    return [];
  }
}

export async function fetchCompanyJobs(companyId: string) {
  try {
    const jobs = await db
      .select()
      .from(jobPostings)
      .where(eq(jobPostings.postedBy, companyId))
      .orderBy(desc(jobPostings.createdAt));
      
    return jobs;
  } catch (err) {
    console.error("Failed to fetch company jobs:", err);
    return [];
  }
}
