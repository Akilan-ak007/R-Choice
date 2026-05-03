import {
  pgTable,
  uuid,
  varchar,
  text,
  integer,
  boolean,
  timestamp,
  decimal,
  date,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

/* ── Enums ── */
export const userRoleEnum = pgEnum("user_role", [
  "student",
  "tutor",
  "placement_coordinator",
  "hod",
  "dean",
  "placement_officer",
  "principal",
  "company",
  "alumni",
  "coe",
  "mcr",
  "company_staff",
  "placement_head",
  "management_corporation",
]);

export const requestStatusEnum = pgEnum("request_status", [
  "draft",
  "pending_tutor",
  "pending_coordinator",
  "pending_hod",
  "pending_dean",
  "pending_po",
  "pending_coe",
  "pending_principal",
  "approved",
  "rejected",
  "returned",
]);

export const applicationTypeEnum = pgEnum("application_type", [
  "portal",
  "external",
]);

export const companyStatusEnum = pgEnum("company_status", [
  "invited",
  "registration_submitted",
  "under_review",
  "pending",
  "approved",
  "rejected",
  "info_requested",
  "suspended",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "draft",
  "pending_review",
  "pending_mcr_approval",
  "approved",
  "rejected",
  "revision_needed",
  "closed",
]);

export const skillTypeEnum = pgEnum("skill_type", [
  "hard",
  "soft",
  "language",
]);

export const linkCategoryEnum = pgEnum("link_category", [
  "social",
  "portfolio",
  "certification",
  "project",
  "other",
]);

export const approvalActionEnum = pgEnum("approval_action", [
  "approved",
  "rejected",
  "returned",
]);

export const reportFrequencyEnum = pgEnum("report_frequency", [
  "weekly",
  "monthly",
]);

export const resultPublicationStatusEnum = pgEnum("result_publication_status", [
  "selected",
  "rejected",
]);

export const odRaiseStatusEnum = pgEnum("od_raise_status", [
  "awaiting_po_raise",
  "od_raised",
  "cancelled",
]);

/* ── Users ── */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 15 }),
  about: text("about"),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").default(true),
  mfaSecret: text("mfa_secret"),
  mfaEnabled: boolean("mfa_enabled").default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
  companyId: uuid("company_id"),
  staffRole: varchar("staff_role", { length: 50 }),
  employeeId: varchar("employee_id", { length: 50 }),
  department: varchar("department", { length: 100 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/* ── Student Profiles ── */
export const studentProfiles = pgTable("student_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  registerNo: varchar("register_no", { length: 20 }).notNull().unique(),
  school: varchar("school", { length: 100 }),
  program: varchar("program", { length: 100 }),
  department: varchar("department", { length: 200 }).notNull(),
  year: integer("year").notNull(),
  batchStartYear: integer("batch_start_year"),
  batchEndYear: integer("batch_end_year"),
  course: varchar("course", { length: 100 }),
  programType: varchar("program_type", { length: 20 }),
  section: varchar("section", { length: 20 }),
  cgpa: decimal("cgpa", { precision: 3, scale: 2 }),
  dob: date("dob"),
  professionalSummary: text("professional_summary"),
  githubLink: text("github_link"),
  linkedinLink: text("linkedin_link"),
  portfolioUrl: text("portfolio_url"),
  resumeUrl: text("resume_url"),
  profileCompletionScore: integer("profile_completion_score").default(0),
  isProfilePublic: boolean("is_profile_public").default(false),
  profileViewCount: integer("profile_view_count").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/* ── Student Skills ── */
export const studentSkills = pgTable("student_skills", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  skillName: varchar("skill_name", { length: 100 }).notNull(),
  skillType: skillTypeEnum("skill_type").notNull(),
  proficiency: varchar("proficiency", { length: 50 }),
  isTop: boolean("is_top").default(false),
});

/* ── Student Certifications ── */
export const studentCertifications = pgTable("student_certifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  name: varchar("name", { length: 200 }).notNull(),
  issuingOrg: varchar("issuing_org", { length: 200 }).notNull(),
  issueDate: date("issue_date"),
  credentialUrl: text("credential_url"),
});

/* ── Student Projects ── */
export const studentProjects = pgTable("student_projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  technologies: text("technologies").array(),
  projectUrl: text("project_url"),
  startDate: date("start_date"),
  endDate: date("end_date"),
});

/* ── Student Education ── */
export const studentEducation = pgTable("student_education", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  institution: varchar("institution", { length: 255 }).notNull(),
  degree: varchar("degree", { length: 100 }).notNull(),
  fieldOfStudy: varchar("field_of_study", { length: 100 }),
  startYear: integer("start_year"),
  endYear: integer("end_year"),
  scoreType: varchar("score_type", { length: 20 }),
  score: decimal("score", { precision: 5, scale: 2 }),
});

/* ── Student Links (Linktree-style) ── */
export const studentLinks = pgTable("student_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  platform: varchar("platform", { length: 50 }),
  title: varchar("title", { length: 100 }).notNull(),
  url: text("url").notNull(),
  icon: varchar("icon", { length: 50 }),
  category: linkCategoryEnum("category"),
  displayOrder: integer("display_order").default(0),
  clickCount: integer("click_count").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Student Job Interests ── */
export const studentJobInterests = pgTable("student_job_interests", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull(),
  roleCategory: varchar("role_category", { length: 50 }).notNull(),
  roleName: varchar("role_name", { length: 100 }).notNull(),
});

/* ── Placement Readiness ── */
export const placementReadiness = pgTable("placement_readiness", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => studentProfiles.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  totalScore: integer("total_score").default(0),
  profileScore: integer("profile_score").default(0),
  skillsScore: integer("skills_score").default(0),
  certsScore: integer("certs_score").default(0),
  projectsScore: integer("projects_score").default(0),
  experienceScore: integer("experience_score").default(0),
  reportsScore: integer("reports_score").default(0),
  linksScore: integer("links_score").default(0),
  badgeLevel: varchar("badge_level", { length: 20 }).default("beginner"),
  lastCalculated: timestamp("last_calculated", { withTimezone: true }).defaultNow(),
});

/* ── Authority Mapping ── */
export const authorityMappings = pgTable("authority_mappings", {
  id: uuid("id").defaultRandom().primaryKey(),
  school: varchar("school", { length: 100 }),
  section: varchar("section", { length: 50 }).notNull(),
  course: varchar("course", { length: 100 }),
  programType: varchar("program_type", { length: 10 }),
  department: varchar("department", { length: 50 }).notNull(),
  year: integer("year").notNull(),
  batchStartYear: integer("batch_start_year"),
  batchEndYear: integer("batch_end_year"),
  tutorId: uuid("tutor_id").references(() => users.id),
  placementCoordinatorId: uuid("placement_coordinator_id").references(() => users.id),
  hodId: uuid("hod_id").references(() => users.id),
  deanId: uuid("dean_id").references(() => users.id),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/* ── Internship Requests ── */
export const internshipRequests = pgTable("internship_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  applicationType: applicationTypeEnum("application_type").notNull(),
  companyName: varchar("company_name", { length: 200 }).notNull(),
  companyAddress: text("company_address"),
  role: varchar("role", { length: 200 }).notNull(),
  description: text("description"),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  stipend: varchar("stipend", { length: 100 }),
  workMode: varchar("work_mode", { length: 20 }),
  offerLetterUrl: text("offer_letter_url"),
  status: requestStatusEnum("status").default("draft"),
  currentTier: integer("current_tier").default(0),
  currentTierEnteredAt: timestamp("current_tier_entered_at", { withTimezone: true }),
  currentTierSlaHours: integer("current_tier_sla_hours").default(6),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  lastReviewedBy: uuid("last_reviewed_by").references(() => users.id),
  lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
  jobPostingId: uuid("job_posting_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/* ── External Internship Details ── */
export const externalInternshipDetails = pgTable("external_internship_details", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .references(() => internshipRequests.id, { onDelete: "cascade" })
    .notNull(),
  companyWebsite: text("company_website").notNull(),
  hrName: varchar("hr_name", { length: 100 }).notNull(),
  hrEmail: varchar("hr_email", { length: 255 }).notNull(),
  hrPhone: varchar("hr_phone", { length: 15 }).notNull(),
  companyIdProofUrl: text("company_id_proof_url").notNull(),
  parentConsentUrl: text("parent_consent_url").notNull(),
  workMode: varchar("work_mode", { length: 20 }).notNull(),
  discoverySource: varchar("discovery_source", { length: 50 }).notNull(),
});

/* ── Approval Logs ── */
export const approvalLogs = pgTable("approval_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .references(() => internshipRequests.id, { onDelete: "cascade" })
    .notNull(),
  approverId: uuid("approver_id")
    .references(() => users.id)
    .notNull(),
  approverRole: userRoleEnum("approver_role").notNull(),
  tier: integer("tier").notNull(),
  action: approvalActionEnum("action").notNull(),
  comment: text("comment"),
  actionHash: text("action_hash"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Bonafide Certificates ── */
export const bonafideCertificates = pgTable("bonafide_certificates", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .references(() => internshipRequests.id)
    .notNull(),
  certificateNumber: varchar("certificate_number", { length: 50 }).notNull().unique(),
  pdfUrl: text("pdf_url"),
  qrCode: text("qr_code"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
});

/* ── OD Forms ── */
export const odForms = pgTable("od_forms", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .references(() => internshipRequests.id)
    .notNull(),
  formNumber: varchar("form_number", { length: 50 }).notNull().unique(),
  pdfUrl: text("pdf_url"),
  qrCode: text("qr_code"),
  generatedAt: timestamp("generated_at", { withTimezone: true }).defaultNow(),
});

/* ── Work Report Schedules ── */
export const workReportSchedules = pgTable("work_report_schedules", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .references(() => internshipRequests.id)
    .notNull(),
  frequency: reportFrequencyEnum("frequency").notNull(),
  setByHodId: uuid("set_by_hod_id").references(() => users.id),
  nextDueDate: date("next_due_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Work Reports ── */
export const workReports = pgTable("work_reports", {
  id: uuid("id").defaultRandom().primaryKey(),
  scheduleId: uuid("schedule_id")
    .references(() => workReportSchedules.id)
    .notNull(),
  studentId: uuid("student_id")
    .references(() => users.id)
    .notNull(),
  reportPeriod: varchar("report_period", { length: 50 }).notNull(),
  tasksCompleted: text("tasks_completed").notNull(),
  hoursSpent: integer("hours_spent"),
  learnings: text("learnings"),
  rating: integer("rating"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewComment: text("review_comment"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
});

/* ── Company Invitations ── */
export const companyInvitations = pgTable("company_invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: varchar("token", { length: 255 }).notNull().unique(),
  mcrId: uuid("mcr_id").references(() => users.id).notNull(),
  companyEmail: varchar("company_email", { length: 255 }).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  isUsed: boolean("is_used").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Company Registrations ── */
export const companyRegistrations = pgTable("company_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyLegalName: varchar("company_legal_name", { length: 255 }).notNull(),
  brandName: varchar("brand_name", { length: 255 }),
  companyDescription: text("company_description"),
  companyType: varchar("company_type", { length: 50 }).notNull(),
  industrySector: varchar("industry_sector", { length: 100 }).notNull(),
  yearEstablished: integer("year_established"),
  companySize: varchar("company_size", { length: 20 }),
  website: text("website").notNull(),
  logoUrl: text("logo_url"),
  address: text("address").notNull(),
  city: varchar("city", { length: 100 }).notNull(),
  state: varchar("state", { length: 50 }).notNull(),
  pinCode: varchar("pin_code", { length: 10 }).notNull(),
  hrName: varchar("hr_name", { length: 100 }).notNull(),
  hrEmail: varchar("hr_email", { length: 255 }).notNull(),
  hrPhone: varchar("hr_phone", { length: 15 }).notNull(),
  altPhone: varchar("alt_phone", { length: 15 }),
  gstNumber: varchar("gst_number", { length: 20 }),
  panNumber: varchar("pan_number", { length: 15 }),
  cinLlpin: varchar("cin_llpin", { length: 25 }),
  coi: text("coi"),
  registrationCertUrl: text("registration_cert_url"),
  coiUrl: text("coi_url"),
  mouUrl: text("mou_url"),
  ceoName: varchar("ceo_name", { length: 100 }),
  ceoDesignation: varchar("ceo_designation", { length: 100 }),
  ceoEmail: varchar("ceo_email", { length: 255 }),
  ceoPhone: varchar("ceo_phone", { length: 15 }),
  ceoLinkedin: text("ceo_linkedin"),
  ceoPortfolio: text("ceo_portfolio"),
  idProof: text("id_proof"),
  internshipType: varchar("internship_type", { length: 50 }),
  domains: text("domains").array(),
  duration: varchar("duration", { length: 50 }),
  stipendRange: varchar("stipend_range", { length: 100 }),
  hiringIntention: varchar("hiring_intention", { length: 100 }),
  generalTcAccepted: boolean("general_tc_accepted").default(false),
  generalTcAcceptedAt: timestamp("general_tc_accepted_at", { withTimezone: true }),
  authenticityConfirmed: boolean("authenticity_confirmed").default(false),
  founderDetails: jsonb("founder_details"),
  internshipPreferences: jsonb("internship_preferences"),
  status: companyStatusEnum("status").default("pending"),
  reviewedBy: uuid("reviewed_by").references(() => users.id),
  reviewedByRole: varchar("reviewed_by_role", { length: 30 }),
  reviewComment: text("review_comment"),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  userId: uuid("user_id").references(() => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Job Postings ── */
export const jobPostings = pgTable("job_postings", {
  id: uuid("id").defaultRandom().primaryKey(),
  postedBy: uuid("posted_by")
    .references(() => users.id)
    .notNull(),
  postedByRole: userRoleEnum("posted_by_role").notNull(),
  createdByUserId: uuid("created_by_user_id").references(() => users.id),
  submittedByRole: userRoleEnum("submitted_by_role"),
  title: varchar("title", { length: 255 }).notNull(),
  domain: varchar("domain", { length: 150 }),
  jobType: varchar("job_type", { length: 50 }).notNull(),
  isPpoAvailable: boolean("is_ppo_available").default(false),
  isCampusHiring: boolean("is_campus_hiring").default(false),
  expectedJoiningDate: date("expected_joining_date"),
  interviewMode: varchar("interview_mode", { length: 50 }),
  selectionProcessSteps: jsonb("selection_process_steps"),
  description: text("description").notNull(),
  responsibilities: text("responsibilities"),
  learnings: text("learnings"),
  mandatorySkills: text("mandatory_skills").array(),
  preferredSkills: text("preferred_skills").array(),
  tools: text("tools").array(),
  requiredSkills: text("required_skills").array(),
  preferredQualifications: text("preferred_qualifications"),
  eligibilityDegree: text("eligibility_degree").array(),
  departmentEligibility: text("department_eligibility").array(),
  minCgpa: decimal("min_cgpa", { precision: 3, scale: 2 }),
  yearEligibility: integer("year_eligibility").array(),
  location: varchar("location", { length: 200 }).notNull(),
  workMode: varchar("work_mode", { length: 20 }).notNull(),
  duration: varchar("duration", { length: 100 }).notNull(),
  isPaid: boolean("is_paid").default(false),
  stipendSalary: varchar("stipend_salary", { length: 200 }).notNull(),
  openingsCount: integer("openings_count").notNull(),
  applicationDeadline: date("application_deadline").notNull(),
  startDate: date("start_date"),
  selectionProcess: text("selection_process"),
  perksBenefits: text("perks_benefits").array(),
  perks: text("perks").array(),
  faq: jsonb("faq"),
  contactPersons: jsonb("contact_persons"),
  jdPdfUrl: text("jd_pdf_url"),
  status: jobStatusEnum("status").default("draft"),
  verifiedBy: uuid("verified_by").references(() => users.id),
  verifiedByRole: varchar("verified_by_role", { length: 30 }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  selectionRounds: jsonb("selection_rounds"),
  companyId: uuid("company_id").references(() => companyRegistrations.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/* ── Job Terms & Conditions ── */
export const jobTermsConditions = pgTable("job_terms_conditions", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id")
    .references(() => jobPostings.id, { onDelete: "cascade" })
    .notNull(),
  ndaRequired: boolean("nda_required").default(false),
  ndaTemplateUrl: text("nda_template_url"),
  bondRequired: boolean("bond_required").default(false),
  bondDuration: varchar("bond_duration", { length: 100 }),
  bondTerms: text("bond_terms"),
  probationTerms: text("probation_terms"),
  codeOfConductUrl: text("code_of_conduct_url"),
  preJoiningReqs: text("pre_joining_reqs"),
  additionalTerms: text("additional_terms"),
});

/* ── Job Applications ── */
export const jobApplications = pgTable("job_applications", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id")
    .references(() => jobPostings.id)
    .notNull(),
  studentId: uuid("student_id")
    .references(() => users.id)
    .notNull(),
  status: varchar("status", { length: 30 }).default("applied"),
  verificationCode: varchar("verification_code", { length: 10 }),
  isVerified: boolean("is_verified").default(false),
  appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const jobApplicationRoundProgress = pgTable("job_application_round_progress", {
  id: uuid("id").defaultRandom().primaryKey(),
  applicationId: uuid("application_id")
    .references(() => jobApplications.id, { onDelete: "cascade" })
    .notNull(),
  roundId: uuid("round_id")
    .references(() => selectionProcessRounds.id, { onDelete: "cascade" })
    .notNull(),
  status: varchar("status", { length: 30 }).notNull().default("scheduled"),
  notes: text("notes"),
  reviewedByUserId: uuid("reviewed_by_user_id").references(() => users.id),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const jobResultPublications = pgTable("job_result_publications", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id")
    .references(() => jobPostings.id, { onDelete: "cascade" })
    .notNull(),
  applicationId: uuid("application_id")
    .references(() => jobApplications.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  companyId: uuid("company_id")
    .references(() => companyRegistrations.id, { onDelete: "cascade" })
    .notNull(),
  studentId: uuid("student_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  resultStatus: resultPublicationStatusEnum("result_status").notNull(),
  notes: text("notes"),
  publishedByUserId: uuid("published_by_user_id").references(() => users.id).notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }).defaultNow(),
});

export const odRaiseRequests = pgTable("od_raise_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  resultPublicationId: uuid("result_publication_id")
    .references(() => jobResultPublications.id, { onDelete: "cascade" })
    .notNull()
    .unique(),
  studentId: uuid("student_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  jobId: uuid("job_id")
    .references(() => jobPostings.id, { onDelete: "cascade" })
    .notNull(),
  companyId: uuid("company_id")
    .references(() => companyRegistrations.id, { onDelete: "cascade" })
    .notNull(),
  raisedByUserId: uuid("raised_by_user_id").references(() => users.id),
  internshipRequestId: uuid("internship_request_id").references(() => internshipRequests.id),
  status: odRaiseStatusEnum("status").default("awaiting_po_raise"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  raisedAt: timestamp("raised_at", { withTimezone: true }),
});

/* ── Role Promotions ── */
export const rolePromotions = pgTable("role_promotions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id)
    .notNull(),
  oldRole: varchar("old_role", { length: 30 }).notNull(),
  newRole: varchar("new_role", { length: 30 }).notNull(),
  promotedBy: uuid("promoted_by").references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Profile Edit Log ── */
export const profileEditLog = pgTable("profile_edit_log", {
  id: uuid("id").defaultRandom().primaryKey(),
  studentId: uuid("student_id")
    .references(() => studentProfiles.id)
    .notNull(),
  editedBy: uuid("edited_by")
    .references(() => users.id)
    .notNull(),
  editorRole: varchar("editor_role", { length: 30 }).notNull(),
  fieldChanged: varchar("field_changed", { length: 100 }).notNull(),
  oldValue: text("old_value"),
  newValue: text("new_value"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Notifications ── */
export const notifications = pgTable("notifications", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 200 }).notNull(),
  message: text("message").notNull(),
  isRead: boolean("is_read").default(false),
  linkUrl: text("link_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Audit Logs ── */
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").references(() => users.id),
  action: varchar("action", { length: 100 }).notNull(),
  entityType: varchar("entity_type", { length: 50 }),
  entityId: uuid("entity_id"),
  details: jsonb("details"),
  ipAddress: varchar("ip_address", { length: 45 }),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Company Feedback ── */
export const companyFeedback = pgTable("company_feedback", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id").references(() => internshipRequests.id),
  companyId: uuid("company_id").references(() => users.id),
  studentId: uuid("student_id").references(() => users.id),
  rating: integer("rating"),
  feedback: text("feedback"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Placement Drives ── */
export const placementDrives = pgTable("placement_drives", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => users.id),
  title: varchar("title", { length: 255 }).notNull(),
  driveDate: date("drive_date").notNull(),
  venue: varchar("venue", { length: 200 }),
  eligibility: jsonb("eligibility"),
  description: text("description"),
  createdBy: uuid("created_by").references(() => users.id),
  status: varchar("status", { length: 20 }).default("upcoming"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const driveRegistrations = pgTable("drive_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  driveId: uuid("drive_id").references(() => placementDrives.id),
  studentId: uuid("student_id").references(() => users.id),
  checkedIn: boolean("checked_in").default(false),
  checkinTime: timestamp("checkin_time", { withTimezone: true }),
  resultStatus: varchar("result_status", { length: 30 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Company Registration Links ── */
export const companyRegistrationLinks = pgTable("company_registration_links", {
  id: uuid("id").defaultRandom().primaryKey(),
  token: varchar("token", { length: 100 }).notNull().unique(),
  generatedBy: uuid("generated_by").references(() => users.id).notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  isUsed: boolean("is_used").default(false),
  usedByCompanyId: uuid("used_by_company_id").references(() => companyRegistrations.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Company Staff ── */
export const companyStaff = pgTable("company_staff", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyId: uuid("company_id").references(() => companyRegistrations.id, { onDelete: "cascade" }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull().unique(),
  roleInCompany: varchar("role_in_company", { length: 100 }).notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Selection Process Rounds ── */
export const selectionProcessRounds = pgTable("selection_process_rounds", {
  id: uuid("id").defaultRandom().primaryKey(),
  jobId: uuid("job_id").references(() => jobPostings.id, { onDelete: "cascade" }).notNull(),
  roundNumber: integer("round_number").notNull(),
  roundName: varchar("round_name", { length: 100 }).notNull(),
  roundType: varchar("round_type", { length: 50 }),
  description: text("description"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  mode: varchar("mode", { length: 50 }),
  meetLink: text("meet_link"),
  location: varchar("location", { length: 255 }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Approval Escalations ── */
export const approvalEscalations = pgTable("approval_escalations", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id").references(() => internshipRequests.id, { onDelete: "cascade" }).notNull(),
  escalatedFromTier: integer("escalated_from_tier").notNull(),
  escalatedToTier: integer("escalated_to_tier").notNull(),
  escalationStage: integer("escalation_stage").default(1),
  escalationReason: text("escalation_reason"),
  lastNotifiedAt: timestamp("last_notified_at", { withTimezone: true }),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

export const approvalSlaSettings = pgTable("approval_sla_settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  scope: varchar("scope", { length: 50 }).notNull().unique(),
  slaHours: integer("sla_hours").notNull().default(6),
  updatedBy: uuid("updated_by").references(() => users.id),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/* ── Relations ── */
export const usersRelations = relations(users, ({ one, many }) => ({
  studentProfile: one(studentProfiles, {
    fields: [users.id],
    references: [studentProfiles.userId],
  }),
  notifications: many(notifications),
  internshipRequests: many(internshipRequests),
}));

export const studentProfilesRelations = relations(studentProfiles, ({ one, many }) => ({
  user: one(users, { fields: [studentProfiles.userId], references: [users.id] }),
  skills: many(studentSkills),
  certifications: many(studentCertifications),
  projects: many(studentProjects),
  education: many(studentEducation),
  links: many(studentLinks),
  jobInterests: many(studentJobInterests),
  readiness: one(placementReadiness, {
    fields: [studentProfiles.id],
    references: [placementReadiness.studentId],
  }),
}));

/* ── Surveys ── */
export const surveys = pgTable("surveys", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  targetAudience: varchar("target_audience", { length: 50 }).notNull(),
  createdByRole: userRoleEnum("created_by_role").notNull(),
  createdById: uuid("created_by_id").references(() => users.id),
  formSchema: jsonb("form_schema").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

/* ── Calendar Events ── */
export const calendarEvents = pgTable("calendar_events", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventType: varchar("event_type", { length: 50 }).notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }),
  meetLink: text("meet_link"),
  relatedEntityId: uuid("related_entity_id"),
  relatedEntityType: varchar("related_entity_type", { length: 50 }),
  isAllDay: boolean("is_all_day").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
});

/* ── Device Tokens (FCM Push Notifications) ── */
export const deviceTokens = pgTable("device_tokens", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  token: text("token").notNull(),
  platform: varchar("platform", { length: 20 }).notNull(), // 'android', 'ios', 'web'
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  lastUsedAt: timestamp("last_used_at", { withTimezone: true }).defaultNow(),
});

export const surveyResponses = pgTable("survey_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  surveyId: uuid("survey_id").references(() => surveys.id).notNull(),
  respondentId: uuid("respondent_id").references(() => users.id).notNull(),
  responseData: jsonb("response_data").notNull(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }).defaultNow(),
});

/* ── System Settings ── */
export const systemSettings = pgTable("system_settings", {
  key: varchar("key", { length: 255 }).primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});
