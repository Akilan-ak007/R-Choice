import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!);
  try {
    console.log("Updating ENUM values...");
    await sql`ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'pending_dean' AFTER 'pending_hod';`;
    await sql`ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'pending_po' AFTER 'pending_dean';`;
    await sql`ALTER TYPE request_status ADD VALUE IF NOT EXISTS 'pending_principal' AFTER 'pending_po';`;

    console.log("Updating job_applications table...");
    await sql`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS verification_code varchar(10);`;
    await sql`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;`;

    console.log("Migration applied successfully.");
  } catch (err) {
    console.error("Migration error:", err);
  }
}

migrate();
