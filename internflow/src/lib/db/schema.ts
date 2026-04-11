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
]);

export const requestStatusEnum = pgEnum("request_status", [
  "draft",
  "pending_tutor",
  "pending_coordinator",
  "pending_hod",
  "pending_admin",
  "approved",
  "rejected",
  "returned",
]);

export const applicationTypeEnum = pgEnum("application_type", [
  "portal",
  "external",
]);

export const companyStatusEnum = pgEnum("company_status", [
  "pending",
  "approved",
  "rejected",
  "info_requested",
]);

export const jobStatusEnum = pgEnum("job_status", [
  "draft",
  "pending_review",
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

/* ── Users ── */
export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: userRoleEnum("role").notNull(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 15 }),
  avatarUrl: text("avatar_url"),
  isActive: boolean("is_active").default(true),
  mfaSecret: text("mfa_secret"),
  mfaEnabled: boolean("mfa_enabled").default(false),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
  failedLoginAttempts: integer("failed_login_attempts").default(0),
  lockedUntil: timestamp("locked_until", { withTimezone: true }),
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
  department: varchar("department", { length: 50 }).notNull(),
  year: integer("year").notNull(),
  section: varchar("section", { length: 5 }),
  cgpa: decimal("cgpa", { precision: 3, scale: 2 }),
  dob: date("dob"),
  professionalSummary: text("professional_summary"),
  githubLink: text("github_link"),
  linkedinLink: text("linkedin_link"),
  portfolioUrl: text("portfolio_url"),
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
  department: varchar("department", { length: 50 }).notNull(),
  section: varchar("section", { length: 5 }).notNull(),
  year: integer("year").notNull(),
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
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
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

/* ── Company Registrations ── */
export const companyRegistrations = pgTable("company_registrations", {
  id: uuid("id").defaultRandom().primaryKey(),
  companyLegalName: varchar("company_legal_name", { length: 255 }).notNull(),
  brandName: varchar("brand_name", { length: 255 }),
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
  registrationCertUrl: text("registration_cert_url"),
  mouUrl: text("mou_url"),
  generalTcAccepted: boolean("general_tc_accepted").default(false),
  generalTcAcceptedAt: timestamp("general_tc_accepted_at", { withTimezone: true }),
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
  title: varchar("title", { length: 255 }).notNull(),
  jobType: varchar("job_type", { length: 50 }).notNull(),
  description: text("description").notNull(),
  requiredSkills: text("required_skills").array(),
  preferredQualifications: text("preferred_qualifications"),
  departmentEligibility: text("department_eligibility").array(),
  minCgpa: decimal("min_cgpa", { precision: 3, scale: 2 }),
  yearEligibility: integer("year_eligibility").array(),
  location: varchar("location", { length: 200 }).notNull(),
  workMode: varchar("work_mode", { length: 20 }).notNull(),
  duration: varchar("duration", { length: 100 }).notNull(),
  stipendSalary: varchar("stipend_salary", { length: 200 }).notNull(),
  openingsCount: integer("openings_count").notNull(),
  applicationDeadline: date("application_deadline").notNull(),
  startDate: date("start_date"),
  selectionProcess: text("selection_process"),
  perksBenefits: text("perks_benefits").array(),
  jdPdfUrl: text("jd_pdf_url"),
  status: jobStatusEnum("status").default("draft"),
  verifiedBy: uuid("verified_by").references(() => users.id),
  verifiedByRole: varchar("verified_by_role", { length: 30 }),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
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
  appliedAt: timestamp("applied_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
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

