/**
 * One-time script to fix CEO users missing company registrations.
 * 
 * Handles two cases:
 * 1. Company registration exists but users.companyId is not set → sets it
 * 2. Company user exists but no company registration at all → creates a minimal one
 *
 * Run with: npx tsx scripts/fix-company-links.ts
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/lib/db/schema";
import { eq, isNotNull, inArray } from "drizzle-orm";

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function fixCompanyLinks() {
  const { users, companyRegistrations } = schema;

  // ── Case 1: Fix registrations that have userId but user lacks companyId ──
  const regs = await db
    .select({ id: companyRegistrations.id, userId: companyRegistrations.userId, name: companyRegistrations.companyLegalName })
    .from(companyRegistrations)
    .where(isNotNull(companyRegistrations.userId));

  console.log(`Found ${regs.length} registration(s) with userId set`);

  let fixed = 0;
  for (const reg of regs) {
    if (!reg.userId) continue;
    const [user] = await db
      .select({ id: users.id, companyId: users.companyId, email: users.email })
      .from(users)
      .where(eq(users.id, reg.userId))
      .limit(1);
    if (user && !user.companyId) {
      await db.update(users).set({ companyId: reg.id }).where(eq(users.id, user.id));
      console.log(`✅ Linked: ${user.email} → companyId = ${reg.id} (${reg.name})`);
      fixed++;
    } else if (user?.companyId) {
      console.log(`⏭  Already linked: ${user.email}`);
    }
  }

  // ── Case 2: Company users with NO registration at all ──
  const companyUsers = await db
    .select({ id: users.id, email: users.email, firstName: users.firstName, lastName: users.lastName, companyId: users.companyId })
    .from(users)
    .where(eq(users.role, "company"));

  for (const user of companyUsers) {
    // Check if they have a linked registration via either path
    let hasReg = false;
    if (user.companyId) {
      const [r] = await db.select({ id: companyRegistrations.id }).from(companyRegistrations).where(eq(companyRegistrations.id, user.companyId)).limit(1);
      if (r) hasReg = true;
    }
    if (!hasReg) {
      const [r] = await db.select({ id: companyRegistrations.id }).from(companyRegistrations).where(eq(companyRegistrations.userId, user.id)).limit(1);
      if (r) hasReg = true;
    }

    if (!hasReg) {
      // Create a minimal company registration
      const companyName = user.lastName !== "(CEO)" ? `${user.firstName} ${user.lastName}` : user.firstName;
      const [newReg] = await db.insert(companyRegistrations).values({
        companyLegalName: `${companyName} Company`,
        companyType: "Private Limited",
        industrySector: "Technology",
        website: "https://example.com",
        address: "N/A",
        city: "N/A",
        state: "N/A",
        pinCode: "000000",
        hrName: user.firstName,
        hrEmail: user.email,
        hrPhone: "0000000000",
        status: "approved",
        userId: user.id,
      }).returning({ id: companyRegistrations.id });

      // Link user to the new registration
      await db.update(users).set({ companyId: newReg.id }).where(eq(users.id, user.id));
      console.log(`🆕 Created registration for ${user.email}: ${newReg.id}`);
      fixed++;
    }
  }

  console.log(`\nDone! Fixed ${fixed} user(s).`);
  process.exit(0);
}

fixCompanyLinks().catch((e) => {
  console.error("Error:", e);
  process.exit(1);
});
