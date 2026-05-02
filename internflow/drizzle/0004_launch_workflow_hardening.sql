CREATE EXTENSION IF NOT EXISTS "pgcrypto";
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "result_publication_status" AS ENUM ('selected', 'rejected');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
DO $$ BEGIN
	CREATE TYPE "od_raise_status" AS ENUM ('awaiting_po_raise', 'od_raised', 'cancelled');
EXCEPTION
	WHEN duplicate_object THEN NULL;
END $$;
--> statement-breakpoint
ALTER TABLE "internship_requests"
	ADD COLUMN IF NOT EXISTS "current_tier_entered_at" timestamp with time zone,
	ADD COLUMN IF NOT EXISTS "current_tier_sla_hours" integer DEFAULT 6;
--> statement-breakpoint
ALTER TABLE "selection_process_rounds"
	ADD COLUMN IF NOT EXISTS "starts_at" timestamp with time zone,
	ADD COLUMN IF NOT EXISTS "ends_at" timestamp with time zone,
	ADD COLUMN IF NOT EXISTS "mode" varchar(50),
	ADD COLUMN IF NOT EXISTS "meet_link" text,
	ADD COLUMN IF NOT EXISTS "location" varchar(255);
--> statement-breakpoint
ALTER TABLE "job_postings"
	ADD COLUMN IF NOT EXISTS "created_by_user_id" uuid REFERENCES "users"("id"),
	ADD COLUMN IF NOT EXISTS "submitted_by_role" "user_role",
	ADD COLUMN IF NOT EXISTS "company_id" uuid REFERENCES "company_registrations"("id"),
	ADD COLUMN IF NOT EXISTS "verified_by" uuid REFERENCES "users"("id"),
	ADD COLUMN IF NOT EXISTS "verified_by_role" varchar(30),
	ADD COLUMN IF NOT EXISTS "verified_at" timestamp with time zone;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "approval_sla_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" varchar(50) NOT NULL,
	"sla_hours" integer DEFAULT 6 NOT NULL,
	"updated_by" uuid REFERENCES "users"("id"),
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "approval_sla_settings_scope_unique" UNIQUE("scope")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_result_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL REFERENCES "job_postings"("id") ON DELETE cascade,
	"application_id" uuid NOT NULL UNIQUE REFERENCES "job_applications"("id") ON DELETE cascade,
	"company_id" uuid NOT NULL REFERENCES "company_registrations"("id") ON DELETE cascade,
	"student_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"result_status" "result_publication_status" NOT NULL,
	"notes" text,
	"published_by_user_id" uuid NOT NULL REFERENCES "users"("id"),
	"published_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "od_raise_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"result_publication_id" uuid NOT NULL UNIQUE REFERENCES "job_result_publications"("id") ON DELETE cascade,
	"student_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
	"job_id" uuid NOT NULL REFERENCES "job_postings"("id") ON DELETE cascade,
	"company_id" uuid NOT NULL REFERENCES "company_registrations"("id") ON DELETE cascade,
	"raised_by_user_id" uuid REFERENCES "users"("id"),
	"internship_request_id" uuid REFERENCES "internship_requests"("id"),
	"status" "od_raise_status" DEFAULT 'awaiting_po_raise',
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"raised_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "job_application_round_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL REFERENCES "job_applications"("id") ON DELETE cascade,
	"round_id" uuid NOT NULL REFERENCES "selection_process_rounds"("id") ON DELETE cascade,
	"status" varchar(30) DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"reviewed_by_user_id" uuid REFERENCES "users"("id"),
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "approval_escalations"
	ADD COLUMN IF NOT EXISTS "escalation_stage" integer DEFAULT 1,
	ADD COLUMN IF NOT EXISTS "last_notified_at" timestamp with time zone;
--> statement-breakpoint
INSERT INTO "approval_sla_settings" ("scope", "sla_hours")
VALUES ('default_od', 6)
ON CONFLICT ("scope") DO NOTHING;
