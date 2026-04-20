/**
 * R-Choice — Database Seed Script
 * Creates test users for all roles with password "R-Choice@2025"
 * Run with: npx tsx src/lib/db/seed.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "../src/lib/db/schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

const TEST_PASSWORD = "R-Choice@2025";

const seedUsers = [
  { email: "student@rathinam.edu.in", firstName: "Arun", lastName: "Kumar", role: "student" as const },
  { email: "tutor@rathinam.edu.in", firstName: "Priya", lastName: "Sharma", role: "tutor" as const },
  { email: "pc@rathinam.edu.in", firstName: "Ravi", lastName: "Patel", role: "placement_coordinator" as const },
  { email: "hod@rathinam.edu.in", firstName: "Dr. Meena", lastName: "Nair", role: "hod" as const },
  { email: "dean@rathinam.edu.in", firstName: "Dr. Suresh", lastName: "Iyer", role: "dean" as const },
  { email: "po@rathinam.edu.in", firstName: "Lakshmi", lastName: "Raj", role: "placement_officer" as const },
  { email: "principal@rathinam.edu.in", firstName: "Dr. Venkat", lastName: "Raman", role: "principal" as const },
  { email: "hr@techcorp.com", firstName: "Deepak", lastName: "Menon", role: "company" as const },
];

async function seed() {
  console.log("🌱 Seeding R-Choice database...\n");

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

  // Create student profile for demo student
  const [studentUser] = await db
    .select()
    .from(schema.users)
    .where(eq(schema.users.email, "student@rathinam.edu.in"))
    .limit(1);

  if (studentUser) {
    const [profile] = await db
      .insert(schema.studentProfiles)
      .values({
        userId: studentUser.id,
        registerNo: "21BCT001",
        department: "Computer Science",
        year: 3,
        section: "A",
        cgpa: "8.5",
        professionalSummary: "Passionate full-stack developer with experience in React and Node.js. Looking for an internship to apply my skills in a fast-paced tech environment.",
        profileCompletionScore: 100,
      })
      .onConflictDoUpdate({
        target: schema.studentProfiles.registerNo,
        set: { cgpa: "8.5" }
      })
      .returning();

    // Add Resume Data (Education, Skills, Projects)
    await db.insert(schema.studentEducation).values([
      {
        studentId: profile.id,
        institution: "Rathinam College of Arts and Science",
        degree: "B.Sc. Computer Science",
        startYear: 2021,
        endYear: 2024,
        scoreType: "CGPA",
        score: "8.5",
      },
      {
        studentId: profile.id,
        institution: "St. John's Higher Secondary School",
        degree: "Higher Secondary",
        startYear: 2019,
        endYear: 2021,
        scoreType: "Percentage",
        score: "92",
      }
    ]).onConflictDoNothing();

    await db.insert(schema.studentSkills).values([
      { studentId: profile.id, skillName: "React", skillType: "hard", proficiency: "advanced" },
      { studentId: profile.id, skillName: "Node.js", skillType: "hard", proficiency: "intermediate" },
      { studentId: profile.id, skillName: "PostgreSQL", skillType: "hard", proficiency: "intermediate" },
      { studentId: profile.id, skillName: "Communication", skillType: "soft", proficiency: "advanced" },
    ]).onConflictDoNothing();

    await db.insert(schema.studentProjects).values([
      {
        studentId: profile.id,
        title: "InternFlow Platform",
        description: "Built a comprehensive internship management platform using Next.js and Drizzle ORM.",
        startDate: "2023-01-01",
        endDate: "2023-06-01",
      }
    ]).onConflictDoNothing();

    // Fetch the IDs of the staff members
    const staffMails = [
      "tutor@rathinam.edu.in",
      "pc@rathinam.edu.in",
      "hod@rathinam.edu.in",
      "dean@rathinam.edu.in"
    ];
    
    const allStaff = await Promise.all(staffMails.map(email => 
      db.select().from(schema.users).where(eq(schema.users.email, email)).limit(1)
    ));

    const [tutor, pc, hod, dean] = allStaff.map(s => s[0]);
    
    // Create Authority Mapping & Approved Internship Request
    if (tutor && pc && hod && dean) {
      await db.insert(schema.authorityMappings).values({
        department: "Computer Science",
        year: 3,
        section: "A",
        tutorId: tutor.id,
        placementCoordinatorId: pc.id,
        hodId: hod.id,
        deanId: dean.id,
      }).onConflictDoNothing();
      console.log("  ✅ Authority Mapping Created for Computer Science, Yr 3, Sec A");

      // Generate a mock internship request
      const [internship] = await db.insert(schema.internshipRequests).values({
        studentId: studentUser.id,
        applicationType: "external",
        companyName: "TechCorp Industries",
        role: "Frontend Developer Intern",
        startDate: "2024-01-01",
        endDate: "2024-06-01",
        stipend: "15000",
        workMode: "remote",
        status: "approved",
        currentTier: 4,
      }).returning();

      // Create a Work Report Schedule
      const [schedule] = await db.insert(schema.workReportSchedules).values({
        requestId: internship.id,
        frequency: "weekly",
        setByHodId: hod.id,
      }).returning();

      // Seed a past Work Report
      await db.insert(schema.workReports).values({
        scheduleId: schedule.id,
        studentId: studentUser.id,
        reportPeriod: "Week 1",
        tasksCompleted: "Onboarded to the platform, set up local environment.",
        hoursSpent: 40,
        learnings: "Learned the company's internal Git workflow.",
        reviewComment: "Great start!",
        submittedAt: new Date("2024-01-07"),
      });

      console.log("  ✅ Seeded Approved Internship & Work Report Data");
    }
  }

  console.log("\n✅ Seed completed!");
  console.log(`\n📋 Test credentials for all roles:`);
  console.log(`   Password: ${TEST_PASSWORD}`);
  console.log(`   Emails: student@rathinam.edu.in, tutor@rathinam.edu.in, dean@rathinam.edu.in, etc.`);
}

seed().catch(console.error);
