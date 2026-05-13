# InternFlow

InternFlow is the internship and OD approval platform for Rathinam College. The current launch build supports:

- company onboarding through MCR-issued invite links
- company-owned internship postings with MCR approval
- student applications and round-by-round selection tracking
- company result publishing
- Placement Officer `Raise OD`
- timed OD approval escalation across authority tiers

## Stack

- `Next.js 16` App Router
- `React 19`
- `TypeScript 5`
- `Drizzle ORM`
- `Neon PostgreSQL`
- `Auth.js / NextAuth v5 beta`
- `Cloudinary`
- `Playwright`
- lightweight console logging plus audit logs

## Environment

Copy [.env.example](</D:/Projects/Web-Apps/Internship Website/internflow/.env.example>) to `.env.local` and fill in the values.

Important runtime variables:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_TRUST_HOST`
- `CRON_SECRET`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`

Recommended for production:

- `APP_ENV`
- `NEXT_PUBLIC_APP_ENV`

Validate env configuration with:

```bash
npm run env:verify
```

## Local Setup

```bash
npm install
npm run env:verify
npm run secrets:generate
npm run db:migrate
npm run db:seed
npm run dev
```

If you do not yet have secrets, generate them with:

```bash
npm run secrets:generate
```

## Database Workflow

The supported migration path for this repo is now:

```bash
npm run db:migrate
```

That script applies checked-in SQL files from [drizzle](</D:/Projects/Web-Apps/Internship Website/internflow/drizzle>) in order and records them in `internflow_sql_migrations`.

Notes:

- `npm run db:push` is still available for Drizzle Kit debugging.
- In this environment, `drizzle-kit push` and `drizzle-kit migrate` may stall against the remote Neon instance.
- Because of that, `db:migrate` is the reliable path for repeatable setup and deployment.
- [runtime-schema-sync.mjs](</D:/Projects/Web-Apps/Internship Website/internflow/scripts/ops/runtime-schema-sync.mjs>) remains a recovery tool, not the primary migration path.

## Free/Open-Source Mode

This project now runs without Sentry or Redis.

- rate limiting uses the built-in memory limiter in [rate-limit.ts](</D:/Projects/Web-Apps/Internship Website/internflow/src/lib/rate-limit.ts:1>)
- operational visibility uses platform logs plus audit/event logging in [observability.ts](</D:/Projects/Web-Apps/Internship Website/internflow/src/lib/observability.ts:1>)

Recommended minimum launch setup for a free deployment:

- `DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `AUTH_TRUST_HOST`
- `CRON_SECRET`
- Cloudinary keys
- manual/server-log handoff for email-based actions

Email-based actions now use manual/server-log handoff instead of a mail service. Company credentials and selection codes are printed to server logs for operational follow-up.

## Quality Gates

```bash
npx tsc --noEmit
npm run lint
npm run build
npm run launch:check
npx playwright test
```

Key E2E suites:

- [e2e/auth.spec.ts](</D:/Projects/Web-Apps/Internship Website/internflow/e2e/auth.spec.ts>)
- [e2e/applications.spec.ts](</D:/Projects/Web-Apps/Internship Website/internflow/e2e/applications.spec.ts>)
- [e2e/full-pipeline.spec.ts](</D:/Projects/Web-Apps/Internship Website/internflow/e2e/full-pipeline.spec.ts>)

## Launch Docs

- [DEPLOYMENT_GUIDE_COLLEGE.md](</D:/Projects/Web-Apps/Internship Website/internflow/docs/DEPLOYMENT_GUIDE_COLLEGE.md>)
- [LAUNCH_RUNBOOK.md](</D:/Projects/Web-Apps/Internship Website/internflow/docs/LAUNCH_RUNBOOK.md>)

## Security Note

If any real secrets were ever committed in local env files, rotate them before production launch. That includes database, Cloudinary, Firebase, SMTP, and auth secrets.
