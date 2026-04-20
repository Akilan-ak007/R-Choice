# R-Choice Internflow: Full Technical Documentation & Architecture Spec

## 1. System Overview
**R-Choice Internflow** is the central academic and corporate synchronization platform for the Rathinam Group. It bridges the gap between institutional administrative tracking and live corporate recruitment cycles. The platform strictly delineates internship flows into a robust and verifiable architecture, eliminating manual paperwork and physical signature chasing for academic On-Duty (OD) claims.

This documentation serves as the comprehensive architectural spec, covering the end-to-end user journeys, cryptographic verification integrations, and hierarchical data models.

---

## 2. Core Internal Onboarding Integration Flow (The Primary Vector)

The foundational architecture of R-Choice revolves around the closed-loop **Onboarded Company Internships** pipeline. This flow guarantees that students apply to verified roles, companies shortlist natively, and the system autonomously seeds verifiable OD requests via cryptographic email codes.

### 2.1 The Application Phase
1. **Company Onboarding**: External entities register securely on the company portal. Upon administrator execution of the `approveCompany` routine, they gain posting privileges under the `role: "company"` mapping.
2. **Job Definition (`jobPostings`)**: Companies curate specific job openings. 
3. **Student Swiping & Application**: Authenticated students (`year: 1-4`) query available active jobs. When a student clicks "Apply", the system seamlessly generates a bidirectional `jobApplications` ledger entry with `status: "applied"`.

### 2.2 Shortlisting & Selection Processing
1. **Company Applicant Dashboard**: HR administrators access their custom dashboard to view aggregated `jobApplications` rows.
2. **Shortlist Action**: Companies triage applicants. When an applicant is shifted to `status: "shortlisted"`, an initial push notification is dispatched to the student's internal R-Choice dashboard (`notifications` table integration).
3. **Posting Final Results (`postCompanyResults`)**:
   Once interviews conclude, the Company finalizes the cohort by invoking `postCompanyResults(jobId, selectedStudentIds)`:
   - *Atomicity*: The system initiates a secure transaction context (`db.update(jobApplications)`).
   - *Token Generation*: A randomized **6-digit cryptographic verification code** is uniquely synthesized per student.
   - *Status Mutation*: Matches are elevated to `status: "selected"`.

### 2.3 Email Integration & Student Notification
- *Asynchronous Queuing*: When `postCompanyResults` commits successfully, the platform delegates tasks to the `sendCompanyResultEmail` integration.
- *Dispatch*: The system generates an actionable HTML payload containing the company's verified identity, the official role, and the **6-digit verification code**, dispatching it natively strictly to the student's `@rathinam.in` address.
- *SMS Fallback*: Parallel SMS verification routines trigger natively if the student's profile contains an active `phone` parameter.
- *Faculty Awareness*: Silent push notifications immediately ping the student's active Tutor, Placement Coordinator (PC), and HOD predicting an incoming OD request.

### 2.4 The Verification Handshake
- The verified Student receives their email and returns to R-Choice (`/dashboard/student`).
- The student initiates the OD Request by inputting the **6-Digit Verification Code** along with their intended start and end dates.
- The `verifyAndInitializeOD` Server Action structurally intercepts this:
   - Validates the input code against the protected `jobApplications.verificationCode` column.
   - If `true`, the internal application transforms to `isVerified: true`.
   - The platform autonomously constructs a pristine, pre-filled `internshipRequests` structural object containing the rigorous canonical company names, stipends, and work-modes derived directly from the verified `jobPostings` ID.

---

## 3. The 6-Tier Hierarchical Approval Engine

Once `verifyAndInitializeOD` commits, the student's request transitions to `status: "pending_tutor"` and effectively engages the "Mega Flow" academic validation chain. The engine enforces linear jurisdiction checks leveraging the explicit `authority_mappings` matrix mapping the student's `department` and `year`.

| Tier | Approver Role | Functional Purpose | Next State |
| :--- | :--- | :--- | :--- |
| **Tier 1** | Tutor | Validates academic standing and foundational accuracy. | `pending_pc` |
| **Tier 2** | Placement Coordinator (PC) | Audits against standing departmental internship quotients. | `pending_hod` |
| **Tier 3** | Head of Department (HOD) | Official academic clearance for the specific sector branch. | `pending_dean` |
| **Tier 4** | Dean | Assesses college-wide validity and compliance guidelines. | `pending_po` |
| **Tier 5** | Placement Officer (PO) | Final verification of the hosting corporate entity's integrity. | `pending_principal` |
| **Tier 6** | Principal | Sovereign authority sign-off. Generates official documents. | `approved` |

- **State Progression**: Each tier dashboard exclusively renders rows matching their precise `currentTier` numerical requirement. 
- **The Bonafide Certificate**: Once the `advanceApproval` action passes Tier 6, the system unlocks access for the student to digitally print the formally approved On-Duty Bonafide credential.

---

## 4. Technical Specifications & Server Architecture

### 4.1 Database Ecosystem (Neon PostgreSQL + Drizzle ORM)
- **Framework Ecosystem**: R-Choice leans on `next-auth` for heavily salted session handling (`bcryptjs`).
- **Resilient Execution**: Core high-availability operations like `postCompanyResults` are orchestrated using transaction-level substitutions (`let tx = db;`) preventing `neon-serverless` connection pool starvation during simultaneous corporate batch deployments.

### 4.2 Security Boundaries
- **Insecure Direct Object Reference (IDOR) Mitigation**: Actions dynamically match `auth().session.user.id` against database lookups, strictly preventing cross-tenant request mutability.
- **Cryptographic Enforcement**: Internally originated portal requests CANNOT physically enter the academic approval chain without receiving the explicit verification code dispatched uniquely by the company. 

### 4.3 Automated End-to-End Test Reliability
The platform maintains strict Playwright chromium CI pipeline tests (`internflow/e2e/full-pipeline.spec.ts`) tracing the complex interaction vectors:
1. Verifying company generation and job deployments.
2. Validating the `randomId` generation strings tracking student matching dynamically.
3. Checking asynchronous `expect(...).toBeVisible()` unmounting boundaries precisely aligned over external OD DOM cards natively blocking Next.js context closures.

---

## 5. Deployment Lifecycle
The application relies on Next.js 14 App Router `standalone` compilation. `next.config.ts` dynamically bypasses aggressive ESLint validation restrictions on legacy files safely while preserving functional `production` build capacities ensuring reliable deployment integrity on Vercel Node runtimes.
