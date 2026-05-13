import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";
import dns from "node:dns";
import tls from "node:tls";

dotenv.config({ path: ".env.local" });
dns.setDefaultResultOrder("ipv4first");
tls.DEFAULT_MAX_VERSION = "TLSv1.2";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = neon(process.env.DATABASE_URL);

const statements = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto";`,
  `DO $$ BEGIN
     CREATE TYPE result_publication_status AS ENUM ('selected', 'rejected');
   EXCEPTION WHEN duplicate_object THEN NULL;
   END $$;`,
  `DO $$ BEGIN
     CREATE TYPE od_raise_status AS ENUM ('awaiting_po_raise', 'od_raised', 'cancelled');
   EXCEPTION WHEN duplicate_object THEN NULL;
   END $$;`,
  `ALTER TABLE internship_requests
     ADD COLUMN IF NOT EXISTS current_tier_entered_at timestamptz,
     ADD COLUMN IF NOT EXISTS current_tier_sla_hours integer DEFAULT 6;`,
  `ALTER TABLE selection_process_rounds
     ADD COLUMN IF NOT EXISTS description text,
     ADD COLUMN IF NOT EXISTS starts_at timestamptz,
     ADD COLUMN IF NOT EXISTS ends_at timestamptz,
     ADD COLUMN IF NOT EXISTS mode varchar(50),
     ADD COLUMN IF NOT EXISTS meet_link text,
     ADD COLUMN IF NOT EXISTS location varchar(255);`,
  `ALTER TABLE job_postings
     ADD COLUMN IF NOT EXISTS created_by_user_id uuid REFERENCES users(id),
     ADD COLUMN IF NOT EXISTS submitted_by_role user_role,
     ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES company_registrations(id),
     ADD COLUMN IF NOT EXISTS verified_by uuid REFERENCES users(id),
     ADD COLUMN IF NOT EXISTS verified_by_role user_role,
     ADD COLUMN IF NOT EXISTS verified_at timestamptz;`,
  `CREATE TABLE IF NOT EXISTS approval_sla_settings (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     scope varchar(50) NOT NULL UNIQUE,
     sla_hours integer NOT NULL DEFAULT 6,
     updated_by uuid REFERENCES users(id),
     updated_at timestamptz DEFAULT now()
   );`,
  `CREATE TABLE IF NOT EXISTS approval_escalations (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     request_id uuid NOT NULL REFERENCES internship_requests(id) ON DELETE CASCADE,
     escalated_from_tier integer NOT NULL,
     escalated_to_tier integer NOT NULL,
     escalation_stage integer DEFAULT 1,
     escalation_reason text,
     last_notified_at timestamptz,
     resolved_at timestamptz,
     created_at timestamptz DEFAULT now()
   );`,
  `ALTER TABLE approval_escalations
     ADD COLUMN IF NOT EXISTS escalated_from_tier integer,
     ADD COLUMN IF NOT EXISTS escalated_to_tier integer,
     ADD COLUMN IF NOT EXISTS escalation_stage integer DEFAULT 1,
     ADD COLUMN IF NOT EXISTS escalation_reason text,
     ADD COLUMN IF NOT EXISTS last_notified_at timestamptz,
     ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
     ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();`,
  `CREATE TABLE IF NOT EXISTS job_result_publications (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
     application_id uuid NOT NULL UNIQUE REFERENCES job_applications(id) ON DELETE CASCADE,
     company_id uuid NOT NULL REFERENCES company_registrations(id) ON DELETE CASCADE,
     student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     result_status result_publication_status NOT NULL,
     notes text,
     published_by_user_id uuid NOT NULL REFERENCES users(id),
     published_at timestamptz DEFAULT now()
   );`,
  `CREATE TABLE IF NOT EXISTS od_raise_requests (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     result_publication_id uuid NOT NULL UNIQUE REFERENCES job_result_publications(id) ON DELETE CASCADE,
     student_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
     job_id uuid NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
     company_id uuid NOT NULL REFERENCES company_registrations(id) ON DELETE CASCADE,
     raised_by_user_id uuid REFERENCES users(id),
     internship_request_id uuid REFERENCES internship_requests(id),
     status od_raise_status DEFAULT 'awaiting_po_raise',
     start_date date,
     end_date date,
     created_at timestamptz DEFAULT now(),
     raised_at timestamptz
   );`,
  `CREATE TABLE IF NOT EXISTS job_application_round_progress (
     id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
     application_id uuid NOT NULL REFERENCES job_applications(id) ON DELETE CASCADE,
     round_id uuid NOT NULL REFERENCES selection_process_rounds(id) ON DELETE CASCADE,
     status varchar(30) NOT NULL DEFAULT 'scheduled',
     notes text,
     reviewed_by_user_id uuid REFERENCES users(id),
     reviewed_at timestamptz,
     created_at timestamptz DEFAULT now()
   );`,
  `INSERT INTO approval_sla_settings (scope, sla_hours)
     VALUES ('default_od', 6)
     ON CONFLICT (scope) DO NOTHING;`,
];

for (const statement of statements) {
  await sql.query(statement);
}

console.log("Runtime schema sync completed.");
