import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./src/lib/db";
import { jobPostings, users, notifications } from "./src/lib/db/schema";
import { inArray } from "drizzle-orm";

async function testNotifications() {
    try {
        const notifyRoles = ["placement_officer"] as const;
        const targetAdmins = await db.select().from(users).where(inArray(users.role, notifyRoles));
        console.log("Target Admins:", targetAdmins);

        if (targetAdmins.length > 0) {
            await db.insert(notifications).values(
                targetAdmins.map(admin => ({
                    userId: admin.id,
                    type: "system",
                    title: "New Job Approved",
                    message: "Job test is now active.",
                    linkUrl: "/jobs",
                }))
            ).returning();
            console.log("Inserted notification!");
        }
    } catch (e) {
        console.error("DB Error:", e);
    }
}
testNotifications();
