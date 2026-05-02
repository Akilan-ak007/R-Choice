/**
 * R-Choice — Database Seed Script
 * Creates test users for all 12 roles with password "R-Choice@2025"
 * Run with: npm run db:seed
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import bcrypt from "bcryptjs";
import * as schema from "../src/lib/db/schema";
import * as dotenv from "dotenv";
import dns from "node:dns";
import tls from "node:tls";

dotenv.config({ path: ".env.local" });
dns.setDefaultResultOrder("ipv4first");
tls.DEFAULT_MAX_VERSION = 'TLSv1.2';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

async function warmupConnection() {
  let retries = 5;
  while (retries > 0) {
    try {
      await sql`SELECT 1`;
      console.log("Database connected!");
      return;
    } catch {
      console.log(`Database cold start, retrying in 3 seconds... (${retries} attempts left)`);
      retries--;
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }
  throw new Error("Failed to connect to database after multiple retries.");
}

const TEST_PASSWORD = "R-Choice@2025";

const seedUsers = [
  { email: "student@rathinam.edu.in", firstName: "Arun", lastName: "Kumar", role: "student" as const },
  { email: "tutor@rathinam.edu.in", firstName: "Priya", lastName: "Sharma", role: "tutor" as const },
  { email: "pc@rathinam.edu.in", firstName: "Ravi", lastName: "Patel", role: "placement_coordinator" as const },
  { email: "hod@rathinam.edu.in", firstName: "Dr. Meena", lastName: "Nair", role: "hod" as const },
  { email: "dean@rathinam.edu.in", firstName: "Dr. Suresh", lastName: "Iyer", role: "dean" as const },
  { email: "po@rathinam.edu.in", firstName: "Lakshmi", lastName: "Raj", role: "placement_officer" as const },
  { email: "coe@rathinam.edu.in", firstName: "Dr. Anand", lastName: "Krishnan", role: "coe" as const },
  { email: "principal@rathinam.edu.in", firstName: "Dr. Venkat", lastName: "Raman", role: "principal" as const },
  { email: "ph@rathinam.edu.in", firstName: "Sridhar", lastName: "Balaji", role: "placement_head" as const },
  { email: "mcr@rathinam.edu.in", firstName: "Rajesh", lastName: "Govindaraj", role: "management_corporation" as const },
  { email: "hr@techcorp.com", firstName: "Deepak", lastName: "Menon", role: "company" as const },
  { email: "alumni@rathinam.edu.in", firstName: "Karthik", lastName: "Sundaram", role: "alumni" as const },
];

async function seed() {
  console.log("🌱 Seeding R-Choice database...\n");

  await warmupConnection();

  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 12);

  for (const user of seedUsers) {
    try {
      await db
        .insert(schema.users)
        .values({
          email: user.email,
          passwordHash,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          isActive: true,
        })
        .onConflictDoNothing();

      console.log(`  ✅ ${user.role.padEnd(24)} → ${user.email}`);
    } catch {
      console.log(`  ⚠️  ${user.role.padEnd(24)} → already exists or error`);
    }
  }

  console.log("\n✅ Seed completed!");
  console.log(`\n📋 Test credentials for all roles:`);
  console.log(`   Password: ${TEST_PASSWORD}`);
  console.log(`   Emails: student@rathinam.edu.in, tutor@rathinam.edu.in, dean@rathinam.edu.in, etc.`);
}

seed().catch(console.error);
