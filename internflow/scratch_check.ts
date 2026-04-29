import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./src/lib/db";
import { jobPostings, users } from "./src/lib/db/schema";
import { eq, desc } from "drizzle-orm";

async function run() {
    const jobs = await db.select({
      id: jobPostings.id,
      title: jobPostings.title,
      status: jobPostings.status,
    }).from(jobPostings).orderBy(desc(jobPostings.createdAt)).limit(10);
    
    console.log("All recent jobs:");
    jobs.forEach(j => console.log(`  ${j.title} => ${j.status}`));
    
    const approved = jobs.filter(j => j.status === "approved");
    console.log(`\nApproved: ${approved.length}`);
}
run();
