<p align="center">
  <img src="docs/screenshots/login.png" alt="R-Choice Portal" width="100%" />
</p>

<h1 align="center">🎓 R-Choice</h1>

<p align="center">
  <strong>Internship & Placement Management Platform</strong><br/>
  <em>Rathinam College of Arts and Science</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.2-black?style=for-the-badge&logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Drizzle-ORM-C5F74F?style=for-the-badge&logo=drizzle" alt="Drizzle" />
  <img src="https://img.shields.io/badge/PostgreSQL-Neon-4169E1?style=for-the-badge&logo=postgresql" alt="PostgreSQL" />
</p>

<p align="center">
  <img src="https://img.shields.io/badge/status-production_ready-brightgreen?style=flat-square" alt="Status" />
  <img src="https://img.shields.io/badge/build-passing-brightgreen?style=flat-square" alt="Build" />
  <img src="https://img.shields.io/badge/license-private-red?style=flat-square" alt="License" />
</p>

---

## 🌟 Overview

**R-Choice** is a full-stack internship and placement management platform that unifies students, faculty approvers, administrators, and company partners into a single, role-aware system. It replaces fragmented spreadsheets, email chains, and manual approval workflows with a streamlined digital pipeline.

> *From profile building to placement certification — seamlessly managed.*

### ✨ Key Highlights

- 🏗️ **8-Role Architecture** — Student, Tutor, Coordinator, HOD, Dean, PO, Principal, Company
- 🔄 **6-Tier Approval Pipeline** — Automated routing through institutional hierarchy
- 📊 **Real-Time Dashboards** — Role-specific analytics with animated visualizations
- 🏢 **Company Portal** — Self-service registration, job posting, and applicant review
- 🔐 **Enterprise Security** — Rate limiting, CSRF protection, audit logging, IDOR prevention
- 📱 **Responsive Design** — Glassmorphism UI with dark mode support

---

## 🎯 The Problem

Internship and placement operations at educational institutions typically suffer from:

| Pain Point | Traditional Approach | R-Choice Solution |
|---|---|---|
| **Approval Routing** | Manual email chains | Automated 6-tier pipeline |
| **Application Tracking** | Spreadsheets | Real-time status dashboard |
| **Company Management** | Ad-hoc coordination | Self-service portal |
| **Compliance** | Paper trails | Digital audit logs |
| **Visibility** | Disconnected data | Unified analytics |

---

## 🏛️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        FRONTEND                              │
│   Next.js 16 App Router  •  React 19  •  CSS Modules        │
│   Framer Motion  •  Lucide Icons  •  Recharts                │
├─────────────────────────────────────────────────────────────┤
│                     SERVER ACTIONS                            │
│   Auth  •  Jobs  •  Approvals  •  Profile  •  Notifications  │
├─────────────────────────────────────────────────────────────┤
│                      DATA LAYER                              │
│   Drizzle ORM  •  Neon PostgreSQL  •  NextAuth v5            │
├─────────────────────────────────────────────────────────────┤
│                    INTEGRATIONS                              │
│   Cloudinary (Media)  •  Nodemailer (SMTP)  •  Playwright    │
└─────────────────────────────────────────────────────────────┘
```

---

## 👥 Role Matrix

| Role | Access Level | Dashboard | Key Capabilities |
|---|---|---|---|
| 🎓 **Student** | Self-service | Student | Profile builder, job browser, application tracker, OD requests |
| 📖 **Tutor** | Tier 1 Approver | Staff | Review & approve student internship requests |
| 📋 **Placement Coordinator** | Tier 2 Approver | Staff | Coordinate placement activities, manage approvals |
| 🏛️ **HOD** | Tier 3 Approver | Staff | Department-level oversight and approvals |
| ⭐ **Dean** | Admin | Admin | Institutional approvals, analytics, user management |
| 📊 **Placement Officer** | Admin | Admin | Job approvals, company reviews, placement analytics |
| 👑 **Principal** | Admin | Admin | Final authority, full system visibility |
| 💼 **Company** | External | Company | Registration, job posting, applicant management |

---

## 🔄 Approval Pipeline

```
Student submits OD Request
        │
        ▼
   ┌─────────┐    ┌──────────────┐    ┌─────┐
   │  Tutor  │───▶│  Coordinator │───▶│ HOD │
   │ Tier 1  │    │    Tier 2     │    │T. 3 │
   └─────────┘    └──────────────┘    └──┬──┘
                                         │
        ┌────────────────────────────────┘
        ▼
   ┌─────────┐    ┌─────────────────┐    ┌───────────┐
   │  Dean   │───▶│Placement Officer│───▶│ Principal │
   │ Tier 4  │    │     Tier 5      │    │  Tier 6   │
   └─────────┘    └─────────────────┘    └─────┬─────┘
                                               │
                                               ▼
                                         ✅ APPROVED
```

Each tier auto-routes to the next authority. Rejections include feedback and return to the student.

---

## 🛠️ Tech Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Framework** | Next.js 16 (App Router) | Full-stack React framework |
| **UI Library** | React 19 | Component architecture |
| **Language** | TypeScript 5 | Type-safe development |
| **Styling** | CSS Modules | Scoped, maintainable styles |
| **Animation** | Framer Motion | Micro-interactions & transitions |
| **Icons** | Lucide React | Consistent iconography |
| **Charts** | Recharts | Data visualizations |
| **Auth** | NextAuth v5 (Beta) | Credential-based authentication |
| **Database** | PostgreSQL (Neon) | Serverless relational database |
| **ORM** | Drizzle ORM | Type-safe database queries |
| **File Storage** | Cloudinary | Resume & media uploads |
| **Email** | Nodemailer | SMTP-based notifications |
| **PDF** | jsPDF + html2canvas | Certificate & report generation |
| **Testing** | Playwright | End-to-end browser tests |

---

## 📁 Project Structure

```
internflow/
├── src/
│   ├── app/
│   │   ├── (dashboard)/          # Role-based dashboard pages
│   │   │   ├── dashboard/        # Student, Staff, Admin, Company dashboards
│   │   │   ├── jobs/             # Job board, posting, management
│   │   │   ├── applications/     # OD request forms & tracking
│   │   │   ├── approvals/        # Staff approval queues
│   │   │   ├── companies/        # Company directory & reviews
│   │   │   ├── students/         # Student directory
│   │   │   ├── profile/          # Profile builder & vCard
│   │   │   ├── reports/          # Work report management
│   │   │   ├── settings/         # User & system settings
│   │   │   └── users/            # User management (admin)
│   │   ├── actions/              # Server actions
│   │   │   ├── auth.ts           # Registration, login
│   │   │   ├── jobs.ts           # CRUD, approvals
│   │   │   ├── approvals.ts      # OD pipeline
│   │   │   ├── profile.ts        # Profile management
│   │   │   ├── admin.ts          # User & system admin
│   │   │   └── notifications.ts  # Notification system
│   │   ├── api/                  # API routes (uploads)
│   │   └── v/[id]/               # Public vCard pages
│   ├── components/
│   │   ├── dashboard/            # Dashboard-specific components
│   │   │   ├── admin/            # Admin widgets (audit log, charts)
│   │   │   ├── jobs/             # Job cards, swipe deck
│   │   │   └── DashboardShell.tsx # Main layout shell
│   │   └── ui/                   # Reusable UI primitives
│   └── lib/
│       ├── auth.ts               # NextAuth configuration
│       ├── db/
│       │   ├── schema.ts         # Drizzle schema definitions
│       │   ├── queries/          # Reusable query functions
│       │   ├── seed.ts           # Dev seed data
│       │   └── seed-students.ts  # Batch student seeding
│       ├── cloudinary.ts         # Media upload config
│       ├── mail.ts               # SMTP helpers
│       └── validation.ts         # Input sanitization
├── e2e/                          # Playwright E2E tests
├── drizzle/                      # Database migrations
├── public/                       # Static assets
└── docs/                         # Documentation & screenshots
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ 
- **PostgreSQL** database (we recommend [Neon](https://neon.tech))

### 1. Clone & Install

```bash
git clone https://github.com/iamharishrohith/R-Choice.git
cd R-Choice/internflow
npm install
```

### 2. Environment Setup

Create `.env.local` in the project root:

```env
# Database
DATABASE_URL=postgresql://user:pass@host/dbname

# Auth
AUTH_SECRET=your-random-secret-key
AUTH_TRUST_HOST=true

# Cloudinary (for media uploads)
CLOUDINARY_CLOUD_NAME=your-cloud
CLOUDINARY_API_KEY=your-key
CLOUDINARY_API_SECRET=your-secret

# SMTP (for email notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@rathinam.edu.in
```

### 3. Database Setup

```bash
# Push schema to database
npx drizzle-kit push

# Seed test accounts
npx tsx src/lib/db/seed.ts

# Seed student batch (optional)
npx tsx src/lib/db/seed-students.ts
```

### 4. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you're ready to go! 🎉

---

## 🔑 Test Accounts

All seeded accounts use the shared password:

```
R-Choice@2025
```

| Role | Email | Dashboard |
|---|---|---|
| 🎓 Student | `student@rathinam.edu.in` | `/dashboard/student` |
| 📖 Tutor | `tutor@rathinam.edu.in` | `/dashboard/staff` |
| 📋 Coordinator | `pc@rathinam.edu.in` | `/dashboard/staff` |
| 🏛️ HOD | `hod@rathinam.edu.in` | `/dashboard/staff` |
| ⭐ Dean | `dean@rathinam.edu.in` | `/dashboard/admin` |
| 📊 PO | `po@rathinam.edu.in` | `/dashboard/admin` |
| 👑 Principal | `principal@rathinam.edu.in` | `/dashboard/admin` |
| 💼 Company | `hr@techcorp.com` | `/dashboard/company` |

---

## ✅ Validation

```bash
# Type checking
npx tsc --noEmit

# Linting
npm run lint

# Production build
npm run build

# E2E Tests
npx playwright test
```

### Test Suites

```bash
npx playwright test e2e/auth.spec.ts           # Authentication flows
npx playwright test e2e/applications.spec.ts    # Student application pipeline
npx playwright test e2e/full-pipeline.spec.ts   # End-to-end approval chain
```

---

## 🔐 Security

| Feature | Implementation |
|---|---|
| **Authentication** | NextAuth v5 with credential provider + role validation |
| **Authorization** | Server-side role checks on every action |
| **Input Sanitization** | Custom validation library with XSS prevention |
| **CSRF Protection** | Built-in NextAuth CSRF tokens |
| **Rate Limiting** | Login attempt tracking with lockout |
| **Audit Logging** | All admin actions logged with IP, timestamp, user |
| **Security Headers** | CSP, HSTS, X-Frame-Options via `next.config.ts` |
| **IDOR Prevention** | Ownership verification on all mutations |

---

## 🗺️ Roadmap

- [ ] Migrate middleware to `proxy` convention (Next.js 16)
- [ ] Replace remaining `any` types with strict interfaces
- [ ] Add CI/CD pipeline with GitHub Actions
- [ ] Implement real-time notifications via WebSocket
- [ ] Mobile app build with Capacitor
- [ ] Advanced analytics with cohort tracking
- [ ] PDF certificate generation for completed internships

---

## 🤝 Contributing

1. Validate changes with `npx tsc --noEmit` and `npm run build`
2. Run relevant Playwright tests for affected workflows
3. Follow existing CSS Module and Server Action patterns
4. Use Lucide icons — no emoji in UI components

---

## 📜 License

This project is proprietary software built for **Rathinam College of Arts and Science**.  
All rights reserved.

---

<p align="center">
  <strong>Built with ❤️ for Rathinam College</strong><br/>
  <em>Internship & Placement Cell • Powered by Symbio</em>
</p>
