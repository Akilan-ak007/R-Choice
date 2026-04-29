import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./src/lib/db";
import { internshipRequests, studentProfiles, users, authorityMappings } from "./src/lib/db/schema";
import { eq, desc } from "drizzle-orm";

async function run() {
    const reqs = await db.select().from(internshipRequests).orderBy(desc(internshipRequests.submittedAt)).limit(5);
    console.log("Recent OD Requests:", reqs.map(r => ({id: r.id, status: r.status, studentId: r.studentId, companyName: r.companyName})));
    
    if (reqs.length > 0) {
        const profile = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, reqs[0].studentId)).limit(1);
        console.log("Student Profile:", profile[0] || "None");
        
        const mappings = await db.select().from(authorityMappings).limit(10);
        console.log("Authority Mappings:", mappings.map(m => ({
          tutorId: m.tutorId, 
          department: m.department, 
          section: m.section, 
          year: m.year
        })));
        
        const tutorUser = await db.select().from(users).where(eq(users.id, mappings[0]?.tutorId)).limit(1);
        console.log("Tutor Email:", tutorUser[0]?.email);
    }
}
run();
