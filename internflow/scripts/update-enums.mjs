import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
console.log('Connected to database');

try {
  const companyStatuses = [
    "invited",
    "registration_submitted",
    "under_review",
    "pending",
    "approved",
    "rejected",
    "info_requested",
    "suspended",
  ];
  
  for (const status of companyStatuses) {
    try {
      await client.query(`ALTER TYPE company_status ADD VALUE IF NOT EXISTS '${status}'`);
      console.log(`✓ Added company_status: ${status}`);
    } catch (e) {
      if (!e.message.includes('already exists')) {
        console.error(`Error adding company_status ${status}:`, e.message);
      }
    }
  }

  const jobStatuses = [
    "draft",
    "pending_review",
    "pending_mcr_approval",
    "approved",
    "rejected",
    "revision_needed",
    "closed",
  ];

  for (const status of jobStatuses) {
    try {
      await client.query(`ALTER TYPE job_status ADD VALUE IF NOT EXISTS '${status}'`);
      console.log(`✓ Added job_status: ${status}`);
    } catch (e) {
      if (!e.message.includes('already exists')) {
        console.error(`Error adding job_status ${status}:`, e.message);
      }
    }
  }

  console.log('\nEnum updates completed!');
} catch (e) {
  console.error('ERROR:', e.message);
} finally {
  await client.end();
}
