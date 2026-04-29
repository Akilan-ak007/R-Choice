import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./src/lib/db";
import { users, studentProfiles, authorityMappings } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    const tutors = await db.select().from(users).where(eq(users.role, "tutor"));
    console.log("Tutors:", tutors.length);
    
    const students = await db.select().from(users).where(eq(users.role, "student")).limit(5);
    console.log("Students:", students.map(s => s.email));
    
    const mappings = await db.select().from(authorityMappings);
    console.log("Mappings:", mappings.length);
    
    const profs = await db.select().from(studentProfiles);
    console.log("Profiles:", profs.length);
}
run();
