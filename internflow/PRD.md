# Product Requirements Document (PRD): R-Choice Internflow

## 1. Executive Summary
**R-Choice Internflow** is a centralized, closed-circuit platform designed exclusively for the academic institution (Rathinam Group) to manage students' corporate internship applications and comprehensively enforce academic On-Duty (OD) authorization pipelines. The system replaces fragmented email communications and paper-bound authorization chains by interconnecting companies, students, and a 6-tier academic faculty hierarchy natively using a seamless software dashboard.

## 2. Problem Statement
Historically, managing student internships required manually validating company legitimacy, manually tracking student applications across different corporate domains, and requiring students to physically gather sequential signatures from Tutors up to the Principal to secure academic On-Duty attendance. This process is opaque, error-prone, fundamentally unscalable, and causes significant delays in securing corporate offers.

## 3. Product Workflows & Capabilities

### 3.1. Company & Job Postings
- **Registration**: Companies register formally on the R-Choice portal. Their details (Legal Name, Address, Validation links) are strictly stored.
- **Job Creation Pipeline**: Companies generate internal job postings with criteria (stipend, required skills, work mode, deadlines).
- **Security Check**: Postings are initially parked in a `pending_review` state and are systematically vetted by Placement Officers prior to distribution.

### 3.2. Student Profiles & Applications
- **Profiles**: Students maintain living profiles tracking their resumes, skills, external links (GitHub, LinkedIn), and department metrics.
- **Internship Portal**: A dynamic swipe-deck or grid interface allows active exploration of vetted company roles. 
- **Applications**: Application packets are instantaneously forwarded to the specific Company’s HR dashboard.

### 3.3. Dual Application Pathways
The platform supports tracking for two fundamentally tracked vectors:
1. **Portal-Originated Opportunities**: Jobs tracked from internal R-Choice job-boards. Companies "Shortlist" via the dashboard, instantly generating an automated token that initiates the academic pipeline.
2. **External/Self-Sourced Internships**: Opportunities secured privately by the student. Students manually inject external HR contacts, offer letter URLs, and parent consent forms to seed a formal OD request.

### 3.4. The 6-Tier Hierarchical Approval Architecture (The "Mega Flow")
When a student initiates an academic On-Duty request, it enters an immutable, tier-based progression loop enforcing exact jurisdictional authorizations (mapped via the strict `authority_mappings` table based on a student's Department and Year).
1. **Tier 1 (Tutor)**: Evaluates academic standing and initial request validation.
2. **Tier 2 (Placement Coordinator / PC)**: Assesses departmental placement guidelines and quotas.
3. **Tier 3 (Head of Department / HOD)**: Grants authoritative departmental clearance.
4. **Tier 4 (Dean)**: Confirms college-wide academic compatibility.
5. **Tier 5 (Placement Officer / PO)**: Assesses company validity and official tracking.
6. **Tier 6 (Principal)**: Final structural authorization. 
*End State*: Generates the fully authorized **Bonafide Certificate** ready for secure printing or digital delivery.

## 4. User Personas

| Persona | Primary Needs & Functionalities |
| :--- | :--- |
| **Student** (`year: 1-4`) | Apply for curated jobs, track real-time authorization status, submit offline/external OD claims, download approved Bonafide documents. |
| **Company HR** | Add/Remove job openings, view matched candidates, update candidate statuses linearly (Pending → Reviewed → Shortlisted → Selected). |
| **Staff Hierarchy** (6 Tiers) | View a specialized dashboard highlighting *only* requests pending at their specific clearance tier. Ability to officially "Approve" (advances to Tier+1) or "Reject" (halts the loop). |
| **System Administrator** | Complete control over platform analytics, authority matrix assignments, global user creation routines, and master data migrations. |

## 5. Technical Requirements & Architecture

### Core Stack
- **Frontend Framework**: Next.js App Router (`react`, `next`, Server Components).
- **Database & ORM**: Neon Database (Serverless PostgreSQL) configured safely for edge connectivity paired directly with `drizzle-orm`.
- **Authentication**: `next-auth` (Credentials Provider heavily secured with `bcryptjs` cryptography ensuring strictly offline verification models).
- **Styling**: Extensive modular CSS relying tightly on dynamic, aesthetic UI fundamentals, dynamic `.card` systems, embedded semantic `<Alerts>`, and fluid typography (`Inter`).
- **End-to-End Test Reliability**: Playwright headless Chromium flows validating the `"Mega Flow"` concurrently without transactional starvation context interruptions.

### Data Model Essentials
- `users`: Core authentication identity mapping.
- `authority_mappings`: Defines which specific Tutor/PC/HOD correlates to which exact departmental boundary.
- `jobPostings` & `jobApplications`: Bidirectional maps validating relationships inherently between the Company scope and Student scopes.
- `internshipRequests`: The core transactional ledger mutating between `Tier 1 -> Tier 6` dynamically.

## 6. Security & Performance Metrics
- **Performance**: Strict Next.js `standalone` production compilation with `next config` isolation. Server Actions utilize `let tx = db` direct executions rather than starving PostgreSQL transaction locks over long-running API chains.
- **Security Checkpoints**: 
  - Students physically cannot approve their own requests. 
  - Forms evaluate input fields vigorously preventing IDOR (Insecure Direct Object Reference) against unassigned student profiles.

## 7. Future Roadmaps
- Transition standard PDF generated certificates into cryptographically verifiable components.
- Implement robust email delivery systems (via server-side workers) natively connected into transition state-hooks rather than mock logs.
- Introduce dynamic analytic capabilities for Principal/Deans spanning multi-year historical placement trends dynamically aggregating PostgreSQL clusters.
