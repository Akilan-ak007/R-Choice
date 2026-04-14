-- ============================================================================
-- R-CHOICE — Full Database Schema
-- Rathinam College Internship & Placement Management Platform
-- ============================================================================
--
-- Compatible with: PostgreSQL 14+
-- Generated from: Drizzle ORM schema (src/lib/db/schema.ts)
-- 
-- USAGE:
--   1. Create a new PostgreSQL database:
--      CREATE DATABASE rchoice;
--
--   2. Connect to the database:
--      \c rchoice
--
--   3. Run this file:
--      \i database/schema.sql
--
--   OR from command line:
--      psql -U postgres -d rchoice -f database/schema.sql
--
-- ============================================================================


-- ────────────────────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- For gen_random_uuid()


-- ────────────────────────────────────────────────────────────────────────────
-- ENUMS (Custom Types)
-- ────────────────────────────────────────────────────────────────────────────

-- User roles across the platform
CREATE TYPE "user_role" AS ENUM (
  'student',
  'tutor',
  'placement_coordinator',
  'hod',
  'dean',
  'placement_officer',
  'principal',
  'company',
  'alumni'
);

-- Internship request approval pipeline statuses
CREATE TYPE "request_status" AS ENUM (
  'draft',
  'pending_tutor',
  'pending_coordinator',
  'pending_hod',
  'pending_dean',
  'pending_po',
  'pending_principal',
  'approved',
  'rejected',
  'returned'
);

-- Internship application source
CREATE TYPE "application_type" AS ENUM (
  'portal',
  'external'
);

-- Company registration review status
CREATE TYPE "company_status" AS ENUM (
  'pending',
  'approved',
  'rejected',
  'info_requested'
);

-- Job posting lifecycle status
CREATE TYPE "job_status" AS ENUM (
  'draft',
  'pending_review',
  'approved',
  'rejected',
  'revision_needed',
  'closed'
);

-- Skill classification
CREATE TYPE "skill_type" AS ENUM (
  'hard',
  'soft',
  'language'
);

-- Student profile link categories
CREATE TYPE "link_category" AS ENUM (
  'social',
  'portfolio',
  'certification',
  'project',
  'other'
);

-- Approval chain action types
CREATE TYPE "approval_action" AS ENUM (
  'approved',
  'rejected',
  'returned'
);

-- Work report submission frequency
CREATE TYPE "report_frequency" AS ENUM (
  'weekly',
  'monthly'
);


-- ════════════════════════════════════════════════════════════════════════════
-- CORE TABLES
-- ════════════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────────
-- 1. USERS — All platform accounts (students, staff, admin, companies)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "users" (
  "id"                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "email"                 varchar(255) NOT NULL,
  "password_hash"         text NOT NULL,
  "role"                  "user_role" NOT NULL,
  "first_name"            varchar(100) NOT NULL,
  "last_name"             varchar(100) NOT NULL,
  "phone"                 varchar(15),
  "about"                 text,
  "avatar_url"            text,
  "is_active"             boolean DEFAULT true,
  "mfa_secret"            text,
  "mfa_enabled"           boolean DEFAULT false,
  "last_login_at"         timestamp with time zone,
  "failed_login_attempts" integer DEFAULT 0,
  "locked_until"          timestamp with time zone,
  "created_at"            timestamp with time zone DEFAULT now(),
  "updated_at"            timestamp with time zone DEFAULT now(),

  CONSTRAINT "users_email_unique" UNIQUE("email")
);


-- ════════════════════════════════════════════════════════════════════════════
-- STUDENT PROFILE TABLES
-- ════════════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────────
-- 2. STUDENT PROFILES — Extended student information
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "student_profiles" (
  "id"                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"                  uuid NOT NULL,
  "register_no"              varchar(20) NOT NULL,
  "department"               varchar(50) NOT NULL,
  "year"                     integer NOT NULL,
  "section"                  varchar(5),
  "cgpa"                     numeric(3, 2),
  "dob"                      date,
  "professional_summary"     text,
  "github_link"              text,
  "linkedin_link"            text,
  "portfolio_url"            text,
  "resume_url"               text,
  "profile_completion_score" integer DEFAULT 0,
  "is_profile_public"        boolean DEFAULT false,
  "profile_view_count"       integer DEFAULT 0,
  "created_at"               timestamp with time zone DEFAULT now(),
  "updated_at"               timestamp with time zone DEFAULT now(),

  CONSTRAINT "student_profiles_user_id_unique" UNIQUE("user_id"),
  CONSTRAINT "student_profiles_register_no_unique" UNIQUE("register_no")
);


-- ────────────────────────────────────────────────────────────────────────────
-- 3. STUDENT SKILLS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "student_skills" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id"  uuid NOT NULL,
  "skill_name"  varchar(100) NOT NULL,
  "skill_type"  "skill_type" NOT NULL,
  "proficiency" varchar(50)
);


-- ────────────────────────────────────────────────────────────────────────────
-- 4. STUDENT CERTIFICATIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "student_certifications" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id"     uuid NOT NULL,
  "name"           varchar(200) NOT NULL,
  "issuing_org"    varchar(200) NOT NULL,
  "issue_date"     date,
  "credential_url" text
);


-- ────────────────────────────────────────────────────────────────────────────
-- 5. STUDENT PROJECTS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "student_projects" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id"   uuid NOT NULL,
  "title"        varchar(255) NOT NULL,
  "description"  text NOT NULL,
  "technologies" text[],
  "project_url"  text,
  "start_date"   date,
  "end_date"     date
);


-- ────────────────────────────────────────────────────────────────────────────
-- 6. STUDENT EDUCATION
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "student_education" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id"     uuid NOT NULL,
  "institution"    varchar(255) NOT NULL,
  "degree"         varchar(100) NOT NULL,
  "field_of_study" varchar(100),
  "start_year"     integer,
  "end_year"       integer,
  "score_type"     varchar(20),
  "score"          numeric(5, 2)
);


-- ────────────────────────────────────────────────────────────────────────────
-- 7. STUDENT LINKS (Linktree-style profile links)
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "student_links" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id"    uuid NOT NULL,
  "platform"      varchar(50),
  "title"         varchar(100) NOT NULL,
  "url"           text NOT NULL,
  "icon"          varchar(50),
  "category"      "link_category",
  "display_order" integer DEFAULT 0,
  "click_count"   integer DEFAULT 0,
  "is_active"     boolean DEFAULT true,
  "created_at"    timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 8. STUDENT JOB INTERESTS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "student_job_interests" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id"    uuid NOT NULL,
  "role_category" varchar(50) NOT NULL,
  "role_name"     varchar(100) NOT NULL
);


-- ────────────────────────────────────────────────────────────────────────────
-- 9. PLACEMENT READINESS SCORES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "placement_readiness" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id"       uuid NOT NULL,
  "total_score"      integer DEFAULT 0,
  "profile_score"    integer DEFAULT 0,
  "skills_score"     integer DEFAULT 0,
  "certs_score"      integer DEFAULT 0,
  "projects_score"   integer DEFAULT 0,
  "experience_score" integer DEFAULT 0,
  "reports_score"    integer DEFAULT 0,
  "links_score"      integer DEFAULT 0,
  "badge_level"      varchar(20) DEFAULT 'beginner',
  "last_calculated"  timestamp with time zone DEFAULT now(),

  CONSTRAINT "placement_readiness_student_id_unique" UNIQUE("student_id")
);


-- ════════════════════════════════════════════════════════════════════════════
-- INSTITUTIONAL WORKFLOW TABLES
-- ════════════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────────
-- 10. AUTHORITY MAPPINGS — Maps departments to approval authorities
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "authority_mappings" (
  "id"                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "department"               varchar(50) NOT NULL,
  "section"                  varchar(5) NOT NULL,
  "year"                     integer NOT NULL,
  "tutor_id"                 uuid,
  "placement_coordinator_id" uuid,
  "hod_id"                   uuid,
  "dean_id"                  uuid,
  "updated_by"               uuid,
  "updated_at"               timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 11. INTERNSHIP REQUESTS — OD/Internship approval pipeline
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "internship_requests" (
  "id"               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id"       uuid NOT NULL,
  "application_type" "application_type" NOT NULL,
  "company_name"     varchar(200) NOT NULL,
  "company_address"  text,
  "role"             varchar(200) NOT NULL,
  "description"      text,
  "start_date"       date NOT NULL,
  "end_date"         date NOT NULL,
  "stipend"          varchar(100),
  "work_mode"        varchar(20),
  "offer_letter_url" text,
  "status"           "request_status" DEFAULT 'draft',
  "current_tier"     integer DEFAULT 0,
  "submitted_at"     timestamp with time zone,
  "approved_at"      timestamp with time zone,
  "last_reviewed_by" uuid,
  "last_reviewed_at" timestamp with time zone,
  "job_posting_id"   uuid,
  "created_at"       timestamp with time zone DEFAULT now(),
  "updated_at"       timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 12. EXTERNAL INTERNSHIP DETAILS — Extra fields for external applications
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "external_internship_details" (
  "id"                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "request_id"            uuid NOT NULL,
  "company_website"       text NOT NULL,
  "hr_name"               varchar(100) NOT NULL,
  "hr_email"              varchar(255) NOT NULL,
  "hr_phone"              varchar(15) NOT NULL,
  "company_id_proof_url"  text NOT NULL,
  "parent_consent_url"    text NOT NULL,
  "work_mode"             varchar(20) NOT NULL,
  "discovery_source"      varchar(50) NOT NULL
);


-- ────────────────────────────────────────────────────────────────────────────
-- 13. APPROVAL LOGS — Audit trail for each tier action
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "approval_logs" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "request_id"    uuid NOT NULL,
  "approver_id"   uuid NOT NULL,
  "approver_role" "user_role" NOT NULL,
  "tier"          integer NOT NULL,
  "action"        "approval_action" NOT NULL,
  "comment"       text,
  "action_hash"   text,
  "created_at"    timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 14. BONAFIDE CERTIFICATES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "bonafide_certificates" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "request_id"         uuid NOT NULL,
  "certificate_number" varchar(50) NOT NULL,
  "pdf_url"            text,
  "qr_code"            text,
  "generated_at"       timestamp with time zone DEFAULT now(),

  CONSTRAINT "bonafide_certificates_certificate_number_unique" UNIQUE("certificate_number")
);


-- ────────────────────────────────────────────────────────────────────────────
-- 15. OD FORMS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "od_forms" (
  "id"           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "request_id"   uuid NOT NULL,
  "form_number"  varchar(50) NOT NULL,
  "pdf_url"      text,
  "qr_code"      text,
  "generated_at" timestamp with time zone DEFAULT now(),

  CONSTRAINT "od_forms_form_number_unique" UNIQUE("form_number")
);


-- ────────────────────────────────────────────────────────────────────────────
-- 16. WORK REPORT SCHEDULES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "work_report_schedules" (
  "id"             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "request_id"     uuid NOT NULL,
  "frequency"      "report_frequency" NOT NULL,
  "set_by_hod_id"  uuid,
  "next_due_date"  date,
  "created_at"     timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 17. WORK REPORTS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "work_reports" (
  "id"              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "schedule_id"     uuid NOT NULL,
  "student_id"      uuid NOT NULL,
  "report_period"   varchar(50) NOT NULL,
  "tasks_completed" text NOT NULL,
  "hours_spent"     integer,
  "learnings"       text,
  "rating"          integer,
  "reviewed_by"     uuid,
  "review_comment"  text,
  "submitted_at"    timestamp with time zone DEFAULT now(),
  "reviewed_at"     timestamp with time zone
);


-- ════════════════════════════════════════════════════════════════════════════
-- COMPANY & JOB TABLES
-- ════════════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────────
-- 18. COMPANY REGISTRATIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "company_registrations" (
  "id"                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_legal_name"    varchar(255) NOT NULL,
  "brand_name"            varchar(255),
  "company_type"          varchar(50) NOT NULL,
  "industry_sector"       varchar(100) NOT NULL,
  "year_established"      integer,
  "company_size"          varchar(20),
  "website"               text NOT NULL,
  "logo_url"              text,
  "address"               text NOT NULL,
  "city"                  varchar(100) NOT NULL,
  "state"                 varchar(50) NOT NULL,
  "pin_code"              varchar(10) NOT NULL,
  "hr_name"               varchar(100) NOT NULL,
  "hr_email"              varchar(255) NOT NULL,
  "hr_phone"              varchar(15) NOT NULL,
  "alt_phone"             varchar(15),
  "gst_number"            varchar(20),
  "pan_number"            varchar(15),
  "cin_llpin"             varchar(25),
  "registration_cert_url" text,
  "mou_url"               text,
  "general_tc_accepted"    boolean DEFAULT false,
  "general_tc_accepted_at" timestamp with time zone,
  "status"                "company_status" DEFAULT 'pending',
  "reviewed_by"           uuid,
  "reviewed_by_role"      varchar(30),
  "review_comment"        text,
  "reviewed_at"           timestamp with time zone,
  "user_id"               uuid,
  "created_at"            timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 19. JOB POSTINGS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "job_postings" (
  "id"                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "posted_by"                uuid NOT NULL,
  "posted_by_role"           "user_role" NOT NULL,
  "title"                    varchar(255) NOT NULL,
  "job_type"                 varchar(50) NOT NULL,
  "description"              text NOT NULL,
  "required_skills"          text[],
  "preferred_qualifications" text,
  "department_eligibility"   text[],
  "min_cgpa"                 numeric(3, 2),
  "year_eligibility"         integer[],
  "location"                 varchar(200) NOT NULL,
  "work_mode"                varchar(20) NOT NULL,
  "duration"                 varchar(100) NOT NULL,
  "stipend_salary"           varchar(200) NOT NULL,
  "openings_count"           integer NOT NULL,
  "application_deadline"     date NOT NULL,
  "start_date"               date,
  "selection_process"        text,
  "perks_benefits"           text[],
  "jd_pdf_url"               text,
  "status"                   "job_status" DEFAULT 'draft',
  "verified_by"              uuid,
  "verified_by_role"         varchar(30),
  "verified_at"              timestamp with time zone,
  "company_id"               uuid,
  "created_at"               timestamp with time zone DEFAULT now(),
  "updated_at"               timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 20. JOB TERMS & CONDITIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "job_terms_conditions" (
  "id"                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id"             uuid NOT NULL,
  "nda_required"       boolean DEFAULT false,
  "nda_template_url"   text,
  "bond_required"      boolean DEFAULT false,
  "bond_duration"      varchar(100),
  "bond_terms"         text,
  "probation_terms"    text,
  "code_of_conduct_url" text,
  "pre_joining_reqs"   text,
  "additional_terms"   text
);


-- ────────────────────────────────────────────────────────────────────────────
-- 21. JOB APPLICATIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "job_applications" (
  "id"                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "job_id"            uuid NOT NULL,
  "student_id"        uuid NOT NULL,
  "status"            varchar(30) DEFAULT 'applied',
  "verification_code" varchar(10),
  "is_verified"       boolean DEFAULT false,
  "applied_at"        timestamp with time zone DEFAULT now(),
  "updated_at"        timestamp with time zone DEFAULT now()
);


-- ════════════════════════════════════════════════════════════════════════════
-- SYSTEM TABLES
-- ════════════════════════════════════════════════════════════════════════════


-- ────────────────────────────────────────────────────────────────────────────
-- 22. NOTIFICATIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "notifications" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    uuid NOT NULL,
  "type"       varchar(50) NOT NULL,
  "title"      varchar(200) NOT NULL,
  "message"    text NOT NULL,
  "is_read"    boolean DEFAULT false,
  "link_url"   text,
  "created_at" timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 23. AUDIT LOGS — Admin action tracking with IP & user agent
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "audit_logs" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     uuid,
  "action"      varchar(100) NOT NULL,
  "entity_type" varchar(50),
  "entity_id"   uuid,
  "details"     jsonb,
  "ip_address"  varchar(45),
  "user_agent"  text,
  "created_at"  timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 24. ROLE PROMOTIONS — Track role changes
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "role_promotions" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     uuid NOT NULL,
  "old_role"    varchar(30) NOT NULL,
  "new_role"    varchar(30) NOT NULL,
  "promoted_by" uuid,
  "reason"      text,
  "created_at"  timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 25. PROFILE EDIT LOG — Track who edited student profiles
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "profile_edit_log" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "student_id"    uuid NOT NULL,
  "edited_by"     uuid NOT NULL,
  "editor_role"   varchar(30) NOT NULL,
  "field_changed" varchar(100) NOT NULL,
  "old_value"     text,
  "new_value"     text,
  "created_at"    timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 26. COMPANY FEEDBACK
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "company_feedback" (
  "id"         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "request_id" uuid,
  "company_id" uuid,
  "student_id" uuid,
  "rating"     integer,
  "feedback"   text,
  "created_at" timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 27. PLACEMENT DRIVES
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "placement_drives" (
  "id"          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "company_id"  uuid,
  "title"       varchar(255) NOT NULL,
  "drive_date"  date NOT NULL,
  "venue"       varchar(200),
  "eligibility" jsonb,
  "description" text,
  "created_by"  uuid,
  "status"      varchar(20) DEFAULT 'upcoming',
  "created_at"  timestamp with time zone DEFAULT now()
);


-- ────────────────────────────────────────────────────────────────────────────
-- 28. DRIVE REGISTRATIONS
-- ────────────────────────────────────────────────────────────────────────────

CREATE TABLE "drive_registrations" (
  "id"            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "drive_id"      uuid,
  "student_id"    uuid,
  "checked_in"    boolean DEFAULT false,
  "checkin_time"  timestamp with time zone,
  "result_status" varchar(30),
  "created_at"    timestamp with time zone DEFAULT now()
);


-- ════════════════════════════════════════════════════════════════════════════
-- FOREIGN KEY CONSTRAINTS
-- ════════════════════════════════════════════════════════════════════════════

-- Student Profiles
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Student Sub-tables (all cascade on profile delete)
ALTER TABLE "student_skills" ADD CONSTRAINT "student_skills_student_id_student_profiles_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "student_certifications" ADD CONSTRAINT "student_certifications_student_id_student_profiles_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "student_projects" ADD CONSTRAINT "student_projects_student_id_student_profiles_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "student_education" ADD CONSTRAINT "student_education_student_id_student_profiles_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "student_links" ADD CONSTRAINT "student_links_student_id_student_profiles_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "student_job_interests" ADD CONSTRAINT "student_job_interests_student_id_student_profiles_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE;

ALTER TABLE "placement_readiness" ADD CONSTRAINT "placement_readiness_student_id_student_profiles_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id") ON DELETE CASCADE;

-- Authority Mappings
ALTER TABLE "authority_mappings" ADD CONSTRAINT "authority_mappings_tutor_id_users_id_fk"
  FOREIGN KEY ("tutor_id") REFERENCES "users"("id");
ALTER TABLE "authority_mappings" ADD CONSTRAINT "authority_mappings_placement_coordinator_id_users_id_fk"
  FOREIGN KEY ("placement_coordinator_id") REFERENCES "users"("id");
ALTER TABLE "authority_mappings" ADD CONSTRAINT "authority_mappings_hod_id_users_id_fk"
  FOREIGN KEY ("hod_id") REFERENCES "users"("id");
ALTER TABLE "authority_mappings" ADD CONSTRAINT "authority_mappings_dean_id_users_id_fk"
  FOREIGN KEY ("dean_id") REFERENCES "users"("id");
ALTER TABLE "authority_mappings" ADD CONSTRAINT "authority_mappings_updated_by_users_id_fk"
  FOREIGN KEY ("updated_by") REFERENCES "users"("id");

-- Internship Requests
ALTER TABLE "internship_requests" ADD CONSTRAINT "internship_requests_student_id_users_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE;
ALTER TABLE "internship_requests" ADD CONSTRAINT "internship_requests_last_reviewed_by_users_id_fk"
  FOREIGN KEY ("last_reviewed_by") REFERENCES "users"("id");

-- External Internship Details
ALTER TABLE "external_internship_details" ADD CONSTRAINT "external_internship_details_request_id_fk"
  FOREIGN KEY ("request_id") REFERENCES "internship_requests"("id") ON DELETE CASCADE;

-- Approval Logs
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_request_id_internship_requests_id_fk"
  FOREIGN KEY ("request_id") REFERENCES "internship_requests"("id") ON DELETE CASCADE;
ALTER TABLE "approval_logs" ADD CONSTRAINT "approval_logs_approver_id_users_id_fk"
  FOREIGN KEY ("approver_id") REFERENCES "users"("id");

-- Bonafide Certificates
ALTER TABLE "bonafide_certificates" ADD CONSTRAINT "bonafide_certificates_request_id_fk"
  FOREIGN KEY ("request_id") REFERENCES "internship_requests"("id");

-- OD Forms
ALTER TABLE "od_forms" ADD CONSTRAINT "od_forms_request_id_fk"
  FOREIGN KEY ("request_id") REFERENCES "internship_requests"("id");

-- Work Reports
ALTER TABLE "work_report_schedules" ADD CONSTRAINT "work_report_schedules_request_id_fk"
  FOREIGN KEY ("request_id") REFERENCES "internship_requests"("id");
ALTER TABLE "work_report_schedules" ADD CONSTRAINT "work_report_schedules_set_by_hod_id_fk"
  FOREIGN KEY ("set_by_hod_id") REFERENCES "users"("id");
ALTER TABLE "work_reports" ADD CONSTRAINT "work_reports_schedule_id_fk"
  FOREIGN KEY ("schedule_id") REFERENCES "work_report_schedules"("id");
ALTER TABLE "work_reports" ADD CONSTRAINT "work_reports_student_id_users_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "users"("id");
ALTER TABLE "work_reports" ADD CONSTRAINT "work_reports_reviewed_by_users_id_fk"
  FOREIGN KEY ("reviewed_by") REFERENCES "users"("id");

-- Company Registrations
ALTER TABLE "company_registrations" ADD CONSTRAINT "company_registrations_reviewed_by_users_id_fk"
  FOREIGN KEY ("reviewed_by") REFERENCES "users"("id");
ALTER TABLE "company_registrations" ADD CONSTRAINT "company_registrations_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id");

-- Job Postings
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_posted_by_users_id_fk"
  FOREIGN KEY ("posted_by") REFERENCES "users"("id");
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_verified_by_users_id_fk"
  FOREIGN KEY ("verified_by") REFERENCES "users"("id");
ALTER TABLE "job_postings" ADD CONSTRAINT "job_postings_company_id_company_registrations_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "company_registrations"("id");

-- Job Terms & Conditions
ALTER TABLE "job_terms_conditions" ADD CONSTRAINT "job_terms_conditions_job_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "job_postings"("id") ON DELETE CASCADE;

-- Job Applications
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_fk"
  FOREIGN KEY ("job_id") REFERENCES "job_postings"("id");
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_student_id_users_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "users"("id");

-- Notifications
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE;

-- Audit Logs
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id");

-- Role Promotions
ALTER TABLE "role_promotions" ADD CONSTRAINT "role_promotions_user_id_users_id_fk"
  FOREIGN KEY ("user_id") REFERENCES "users"("id");
ALTER TABLE "role_promotions" ADD CONSTRAINT "role_promotions_promoted_by_users_id_fk"
  FOREIGN KEY ("promoted_by") REFERENCES "users"("id");

-- Profile Edit Log
ALTER TABLE "profile_edit_log" ADD CONSTRAINT "profile_edit_log_student_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "student_profiles"("id");
ALTER TABLE "profile_edit_log" ADD CONSTRAINT "profile_edit_log_edited_by_users_id_fk"
  FOREIGN KEY ("edited_by") REFERENCES "users"("id");

-- Company Feedback
ALTER TABLE "company_feedback" ADD CONSTRAINT "company_feedback_request_id_fk"
  FOREIGN KEY ("request_id") REFERENCES "internship_requests"("id");
ALTER TABLE "company_feedback" ADD CONSTRAINT "company_feedback_company_id_users_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "users"("id");
ALTER TABLE "company_feedback" ADD CONSTRAINT "company_feedback_student_id_users_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "users"("id");

-- Placement Drives
ALTER TABLE "placement_drives" ADD CONSTRAINT "placement_drives_company_id_users_id_fk"
  FOREIGN KEY ("company_id") REFERENCES "users"("id");
ALTER TABLE "placement_drives" ADD CONSTRAINT "placement_drives_created_by_users_id_fk"
  FOREIGN KEY ("created_by") REFERENCES "users"("id");

-- Drive Registrations
ALTER TABLE "drive_registrations" ADD CONSTRAINT "drive_registrations_drive_id_fk"
  FOREIGN KEY ("drive_id") REFERENCES "placement_drives"("id");
ALTER TABLE "drive_registrations" ADD CONSTRAINT "drive_registrations_student_id_users_id_fk"
  FOREIGN KEY ("student_id") REFERENCES "users"("id");


-- ════════════════════════════════════════════════════════════════════════════
-- INDEXES (Performance optimization for production)
-- ════════════════════════════════════════════════════════════════════════════

-- Users
CREATE INDEX "idx_users_email"    ON "users"("email");
CREATE INDEX "idx_users_role"     ON "users"("role");
CREATE INDEX "idx_users_active"   ON "users"("is_active");

-- Student Profiles
CREATE INDEX "idx_student_profiles_user_id"    ON "student_profiles"("user_id");
CREATE INDEX "idx_student_profiles_department" ON "student_profiles"("department");
CREATE INDEX "idx_student_profiles_register"   ON "student_profiles"("register_no");

-- Internship Requests
CREATE INDEX "idx_internship_requests_student" ON "internship_requests"("student_id");
CREATE INDEX "idx_internship_requests_status"  ON "internship_requests"("status");
CREATE INDEX "idx_internship_requests_tier"    ON "internship_requests"("current_tier");

-- Job Postings
CREATE INDEX "idx_job_postings_status"    ON "job_postings"("status");
CREATE INDEX "idx_job_postings_posted_by" ON "job_postings"("posted_by");
CREATE INDEX "idx_job_postings_deadline"  ON "job_postings"("application_deadline");

-- Job Applications
CREATE INDEX "idx_job_applications_job"     ON "job_applications"("job_id");
CREATE INDEX "idx_job_applications_student" ON "job_applications"("student_id");
CREATE INDEX "idx_job_applications_status"  ON "job_applications"("status");

-- Notifications
CREATE INDEX "idx_notifications_user"    ON "notifications"("user_id");
CREATE INDEX "idx_notifications_unread"  ON "notifications"("user_id", "is_read") WHERE "is_read" = false;

-- Audit Logs
CREATE INDEX "idx_audit_logs_user"       ON "audit_logs"("user_id");
CREATE INDEX "idx_audit_logs_created"    ON "audit_logs"("created_at");
CREATE INDEX "idx_audit_logs_entity"     ON "audit_logs"("entity_type", "entity_id");

-- Approval Logs
CREATE INDEX "idx_approval_logs_request" ON "approval_logs"("request_id");

-- Company Registrations
CREATE INDEX "idx_company_registrations_status" ON "company_registrations"("status");
CREATE INDEX "idx_company_registrations_user"   ON "company_registrations"("user_id");


-- ════════════════════════════════════════════════════════════════════════════
-- SCHEMA COMPLETE
-- ════════════════════════════════════════════════════════════════════════════
--
-- Total: 28 tables, 9 enums, 20+ indexes
--
-- Next steps:
--   1. Run seed scripts to populate test data:
--      npx tsx src/lib/db/seed.ts
--      npx tsx src/lib/db/seed-students.ts
--
--   2. Update DATABASE_URL in .env.local to point to this database
--
--   3. When migrating from Neon → college server:
--      - Export data: pg_dump -U postgres rchoice > backup.sql
--      - Import data: psql -U postgres -d rchoice < backup.sql
--
-- ════════════════════════════════════════════════════════════════════════════
