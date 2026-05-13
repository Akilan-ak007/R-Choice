CREATE TYPE "public"."od_raise_status" AS ENUM('awaiting_po_raise', 'od_raised', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."result_publication_status" AS ENUM('selected', 'rejected');--> statement-breakpoint
ALTER TYPE "public"."company_status" ADD VALUE 'invited' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."company_status" ADD VALUE 'registration_submitted' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."company_status" ADD VALUE 'under_review' BEFORE 'pending';--> statement-breakpoint
ALTER TYPE "public"."company_status" ADD VALUE 'suspended';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'mcr' BEFORE 'placement_head';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'company_staff' BEFORE 'placement_head';--> statement-breakpoint
CREATE TABLE "approval_sla_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" varchar(50) NOT NULL,
	"sla_hours" integer DEFAULT 6 NOT NULL,
	"updated_by" uuid,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "approval_sla_settings_scope_unique" UNIQUE("scope")
);
--> statement-breakpoint
CREATE TABLE "company_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token" varchar(255) NOT NULL,
	"mcr_id" uuid NOT NULL,
	"company_email" varchar(255) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"is_used" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "company_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "job_application_round_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"application_id" uuid NOT NULL,
	"round_id" uuid NOT NULL,
	"status" varchar(30) DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"reviewed_by_user_id" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "job_result_publications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"job_id" uuid NOT NULL,
	"application_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"result_status" "result_publication_status" NOT NULL,
	"notes" text,
	"published_by_user_id" uuid NOT NULL,
	"published_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "job_result_publications_application_id_unique" UNIQUE("application_id")
);
--> statement-breakpoint
CREATE TABLE "od_raise_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"result_publication_id" uuid NOT NULL,
	"student_id" uuid NOT NULL,
	"job_id" uuid NOT NULL,
	"company_id" uuid NOT NULL,
	"raised_by_user_id" uuid,
	"internship_request_id" uuid,
	"status" "od_raise_status" DEFAULT 'awaiting_po_raise',
	"start_date" date,
	"end_date" date,
	"created_at" timestamp with time zone DEFAULT now(),
	"raised_at" timestamp with time zone,
	CONSTRAINT "od_raise_requests_result_publication_id_unique" UNIQUE("result_publication_id")
);
--> statement-breakpoint
CREATE TABLE "system_settings" (
	"key" varchar(255) PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "job_postings" ALTER COLUMN "domain" SET DATA TYPE varchar(150);--> statement-breakpoint
ALTER TABLE "student_profiles" ALTER COLUMN "department" SET DATA TYPE varchar(200);--> statement-breakpoint
ALTER TABLE "student_profiles" ALTER COLUMN "section" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "employee_id" SET DATA TYPE varchar(50);--> statement-breakpoint
ALTER TABLE "approval_escalations" ADD COLUMN "escalation_stage" integer DEFAULT 1;--> statement-breakpoint
ALTER TABLE "approval_escalations" ADD COLUMN "last_notified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "authority_mappings" ADD COLUMN "course" varchar(100);--> statement-breakpoint
ALTER TABLE "authority_mappings" ADD COLUMN "program_type" varchar(10);--> statement-breakpoint
ALTER TABLE "authority_mappings" ADD COLUMN "batch_start_year" integer;--> statement-breakpoint
ALTER TABLE "authority_mappings" ADD COLUMN "batch_end_year" integer;--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "coi_url" text;--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "authenticity_confirmed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "founder_details" jsonb;--> statement-breakpoint
ALTER TABLE "company_registrations" ADD COLUMN "internship_preferences" jsonb;--> statement-breakpoint
ALTER TABLE "internship_requests" ADD COLUMN "current_tier_entered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "internship_requests" ADD COLUMN "current_tier_sla_hours" integer DEFAULT 6;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "created_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "submitted_by_role" "user_role";--> statement-breakpoint
ALTER TABLE "job_postings" ADD COLUMN "is_paid" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "selection_process_rounds" ADD COLUMN "starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "selection_process_rounds" ADD COLUMN "ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "selection_process_rounds" ADD COLUMN "mode" varchar(50);--> statement-breakpoint
ALTER TABLE "selection_process_rounds" ADD COLUMN "meet_link" text;--> statement-breakpoint
ALTER TABLE "selection_process_rounds" ADD COLUMN "location" varchar(255);--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "program_type" varchar(20);--> statement-breakpoint
ALTER TABLE "student_skills" ADD COLUMN "is_top" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "company_id" uuid;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "staff_role" varchar(50);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "department" varchar(100);--> statement-breakpoint
ALTER TABLE "approval_sla_settings" ADD CONSTRAINT "approval_sla_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "company_invitations" ADD CONSTRAINT "company_invitations_mcr_id_users_id_fk" FOREIGN KEY ("mcr_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application_round_progress" ADD CONSTRAINT "job_application_round_progress_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application_round_progress" ADD CONSTRAINT "job_application_round_progress_round_id_selection_process_rounds_id_fk" FOREIGN KEY ("round_id") REFERENCES "public"."selection_process_rounds"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_application_round_progress" ADD CONSTRAINT "job_application_round_progress_reviewed_by_user_id_users_id_fk" FOREIGN KEY ("reviewed_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_result_publications" ADD CONSTRAINT "job_result_publications_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_result_publications" ADD CONSTRAINT "job_result_publications_application_id_job_applications_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."job_applications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_result_publications" ADD CONSTRAINT "job_result_publications_company_id_company_registrations_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_result_publications" ADD CONSTRAINT "job_result_publications_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_result_publications" ADD CONSTRAINT "job_result_publications_published_by_user_id_users_id_fk" FOREIGN KEY ("published_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "od_raise_requests" ADD CONSTRAINT "od_raise_requests_result_publication_id_job_result_publications_id_fk" FOREIGN KEY ("result_publication_id") REFERENCES "public"."job_result_publications"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "od_raise_requests" ADD CONSTRAINT "od_raise_requests_student_id_users_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "od_raise_requests" ADD CONSTRAINT "od_raise_requests_job_id_job_postings_id_fk" FOREIGN KEY ("job_id") REFERENCES "public"."job_postings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "od_raise_requests" ADD CONSTRAINT "od_raise_requests_company_id_company_registrations_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."company_registrations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "od_raise_requests" ADD CONSTRAINT "od_raise_requests_raised_by_user_id_users_id_fk" FOREIGN KEY ("raised_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "od_raise_requests" ADD CONSTRAINT "od_raise_requests_internship_request_id_internship_requests_id_fk" FOREIGN KEY ("internship_request_id") REFERENCES "public"."internship_requests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;