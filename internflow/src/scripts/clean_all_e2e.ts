import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
import dns from "node:dns";
import tls from "node:tls";

dotenv.config({ path: ".env.local" });
dns.setDefaultResultOrder("ipv4first");
tls.DEFAULT_MAX_VERSION = "TLSv1.2";

const sql = neon(process.env.DATABASE_URL!);

async function run() {
  const seedEmails = [
    "student@rathinam.edu.in",
    "tutor@rathinam.edu.in",
    "pc@rathinam.edu.in",
    "hod@rathinam.edu.in",
    "dean@rathinam.edu.in",
    "po@rathinam.edu.in",
    "coe@rathinam.edu.in",
    "principal@rathinam.edu.in",
    "ph@rathinam.edu.in",
    "mcr@rathinam.edu.in",
    "hr@techcorp.com",
    "alumni@rathinam.edu.in",
  ];

  console.log("Starting full database cleanup...");

  const tablesToClear = [
    "survey_responses",
    "device_tokens",
    "calendar_events",
    "surveys",
    "approval_escalations",
    "selection_process_rounds",
    "company_staff",
    "company_registration_links",
    "drive_registrations",
    "placement_drives",
    "company_feedback",
    "audit_logs",
    "notifications",
    "profile_edit_log",
    "role_promotions",
    "job_applications",
    "job_terms_conditions",
    "work_reports",
    "work_report_schedules",
    "od_forms",
    "bonafide_certificates",
    "approval_logs",
    "external_internship_details",
    "internship_requests",
    "job_postings",
    "company_registrations",
    "company_invitations",
    "authority_mappings",
    "placement_readiness",
    "student_job_interests",
    "student_links",
    "student_education",
    "student_projects",
    "student_certifications",
    "student_skills",
    "student_profiles",
  ];

  for (const table of tablesToClear) {
    try {
      await sql.query(`DELETE FROM ${table}`);
      console.log(`Cleared ${table}`);
    } catch (error) {
      console.error(`Failed to clear ${table}:`, error instanceof Error ? error.message : String(error));
    }
  }

  try {
    const deletedUsers = await sql.query(
      `DELETE FROM users WHERE email NOT IN (${seedEmails.map((email) => `'${email}'`).join(", ")}) RETURNING email`
    );
    console.log(`Deleted ${deletedUsers.length} test users. Kept core login credentials.`);
  } catch (error) {
    console.error(
      "Failed to delete non-seed users:",
      error instanceof Error ? error.message : String(error)
    );
  }

  console.log("Database cleanup complete!");
}

run().then(() => process.exit(0)).catch(console.error);
