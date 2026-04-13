import { config } from "dotenv";
config({ path: ".env.local" });
import { db } from "./index";
import { users } from "./schema";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding E2E test accounts...");

  const hash = await bcrypt.hash("password123", 10);

  const testAccounts = [
    { email: "e2e_student@rathinam.in", role: "student", firstName: "Test", lastName: "Student" },
    { email: "e2e_tutor@rathinam.in", role: "tutor", firstName: "Test", lastName: "Tutor" },
    { email: "e2e_company@rathinam.in", role: "company", firstName: "Test", lastName: "Company" },
    { email: "e2e_admin@rathinam.in", role: "admin", firstName: "Test", lastName: "Admin" },
  ];

  for (const acc of testAccounts) {
    // Upsert equivalent by ignoring if exists
    try {
      await db.insert(users).values({
        email: acc.email,
        role: acc.role as any,
        firstName: acc.firstName,
        lastName: acc.lastName,
        passwordHash: hash,
        isActive: true,
      });
      console.log(`Created ${acc.role}`);
    } catch(e) {
      console.log(`${acc.role} already exists, skipping.`);
    }
  }

  console.log("Seeding complete!");
  process.exit(0);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
