import { config } from "dotenv";
config({ path: ".env" });
import { db } from "./src/lib/db";
import { authorityMappings, studentProfiles } from "./src/lib/db/schema";

async function main() {
  const mappings = await db.select().from(authorityMappings);
  console.log("MAPPINGS:", JSON.stringify(mappings, null, 2));
  
  const profiles = await db.select().from(studentProfiles);
  console.log("PROFILES:", JSON.stringify(profiles, null, 2));
  process.exit(0);
}
main();
