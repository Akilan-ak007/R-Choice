import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { db } from "./src/lib/db";
import { companyRegistrations, users } from "./src/lib/db/schema";
import { eq } from "drizzle-orm";

async function run() {
    const [user] = await db.select().from(users).where(eq(users.email, "hr@techcorp.com"));
    const [comp] = await db.select().from(companyRegistrations).where(eq(companyRegistrations.userId, user.id));
    console.log("Company Name:", comp?.companyLegalName);
}
run();
