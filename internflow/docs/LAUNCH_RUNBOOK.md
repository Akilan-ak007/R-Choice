# InternFlow Launch Runbook

## 1. Pre-Launch Checklist

- Confirm `.env.local` or production secrets are populated from [.env.example](</D:/Projects/Web-Apps/Internship Website/internflow/.env.example>).
- Run `npm run env:verify`.
- Rotate any secrets that were previously shared or committed during development.
- Confirm `CRON_SECRET` is set and unique.
- Confirm `AUTH_SECRET` is long and unique.

If you need fresh secrets:

```bash
npm run secrets:generate
```

## 2. Database Deployment

Primary path:

```bash
npm run db:migrate
```

Why this path:

- it applies checked-in SQL from the `drizzle/` folder
- it does not depend on the hanging `drizzle-kit push` introspection path
- it records applied files in `internflow_sql_migrations`

Fallback only:

```bash
node .\scripts\ops\runtime-schema-sync.mjs
```

Use the fallback only if the database is missing launch-critical columns or tables and the normal migration path cannot be used in time.

## 3. Validation Before Release

Run:

```bash
npm run launch:check
npx tsc --noEmit
npm run lint
npm run build
npx playwright test e2e/auth.spec.ts --workers=1
npx playwright test e2e/applications.spec.ts --workers=1
npx playwright test e2e/full-pipeline.spec.ts --workers=1
```

Expected outcome:

- typecheck passes
- lint passes
- build passes
- auth, applications, and full-pipeline suites pass

## 4. Runtime Verification

- Confirm server logs capture failures from:
  - company registration
  - MCR review actions
  - OD approval transitions
  - company result publishing
- Confirm the escalation cron route is secured with `CRON_SECRET`.
- Confirm manual credential and notification handoff is part of the operating process, because the app no longer sends real email.

## 5. Rate Limiting Verification

Verify rate limiting is active for:

- login attempts
- proxy-protected dashboard access
- company registration submission
- company token validation
- MCR invite link generation
- avatar upload
- resume upload

Rate limiting is memory-based. For a single-instance or low-cost launch, that is acceptable. If you later move to multiple app instances, revisit distributed rate limiting.

## 6. Functional Launch Smoke

- MCR can generate company registration link
- company can submit registration
- MCR can request info and company can resubmit
- MCR can approve company
- company can create job
- MCR can approve job
- student can view and apply
- company can shortlist and manage rounds
- student calendar shows rounds
- company can publish final result
- Placement Officer can raise OD
- authority approval chain can proceed
- escalation dashboard shows SLA state correctly when delays occur

## 7. Rollback Notes

- If the app build is healthy but data workflow breaks, stop traffic and inspect recent DB migrations first.
- If the release issue is schema drift, compare `drizzle/` against `internflow_sql_migrations`.
- If telemetry or rate limiting causes errors, disable only the integration env values, not the app itself.

## 8. Ownership

- Product flow owner: Placement workflow / MCR team
- Infra owner: deployment + env + cron + DB migration operator
- QA signoff: Playwright + workflow smoke + dashboard review
