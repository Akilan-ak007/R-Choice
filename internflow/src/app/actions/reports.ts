"use server";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { workReports } from "@/lib/db/schema";
import { revalidatePath } from "next/cache";

export async function submitWorkReport(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }
  const userId = session.user.id;
  const role = session.user.role;

  if (role !== "student") {
    return { error: "Only students can submit work reports." };
  }

  try {
    const scheduleId = formData.get("scheduleId") as string;
    const reportPeriod = formData.get("reportPeriod") as string;
    const tasksCompleted = formData.get("tasksCompleted") as string;
    const hoursSpentStr = formData.get("hoursSpent") as string;
    const learnings = formData.get("learnings") as string;

    if (!scheduleId || !reportPeriod || !tasksCompleted) {
      return { error: "Missing required fields." };
    }

    const hoursSpent = parseInt(hoursSpentStr, 10);
    if (isNaN(hoursSpent)) {
      return { error: "Hours spent must be a number." };
    }

    await db.insert(workReports).values({
      scheduleId,
      studentId: userId,
      reportPeriod,
      tasksCompleted,
      hoursSpent,
      learnings,
      submittedAt: new Date(),
    });

    revalidatePath("/reports");
    
    return { success: true };
  } catch (error: any) {
    console.error("Report submission error:", error);
    return { error: error.message || "Failed to submit work report." };
  }
}
