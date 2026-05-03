import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
console.log('Connected to database');

try {
  // Enums to update based on schema.ts
  const enumsToUpdate = {
    user_role: [
      "student", "tutor", "placement_coordinator", "hod", "dean", 
      "placement_officer", "principal", "company", "alumni", "coe", 
      "mcr", "company_staff", "placement_head", "management_corporation"
    ],
    request_status: [
      "draft", "pending_tutor", "pending_coordinator", "pending_hod", 
      "pending_dean", "pending_po", "pending_coe", "pending_principal", 
      "approved", "rejected", "returned"
    ],
    application_type: ["portal", "external"],
    company_status: [
      "invited", "registration_submitted", "under_review", "pending", 
      "approved", "rejected", "info_requested", "suspended"
    ],
    job_status: [
      "draft", "pending_review", "pending_mcr_approval", "approved", 
      "rejected", "revision_needed", "closed"
    ],
    skill_type: ["hard", "soft", "language"],
    link_category: ["social", "portfolio", "certification", "project", "other"],
    approval_action: ["approved", "rejected", "returned"],
    report_frequency: ["weekly", "monthly"],
    result_publication_status: ["selected", "rejected"],
    od_raise_status: ["awaiting_po_raise", "od_raised", "cancelled"]
  };

  for (const [enumName, values] of Object.entries(enumsToUpdate)) {
    console.log(`\nChecking enum: ${enumName}`);
    for (const val of values) {
      try {
        await client.query(`ALTER TYPE ${enumName} ADD VALUE IF NOT EXISTS '${val}'`);
        console.log(`  ✓ Added/Verified: ${val}`);
      } catch (e) {
        if (!e.message.includes('already exists')) {
          console.error(`  x Error adding ${val}:`, e.message);
        }
      }
    }
  }

  console.log('\nAll enum updates completed!');
} catch (e) {
  console.error('ERROR:', e.message);
} finally {
  await client.end();
}
