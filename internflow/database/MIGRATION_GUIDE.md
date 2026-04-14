# Database Migration Guide

> Migrating R-Choice from Neon (cloud) to the college PostgreSQL server.

---

## Prerequisites

- **PostgreSQL 14+** installed on the college server
- `psql` command-line tool available
- Admin access to the PostgreSQL server

---

## Option 1: Fresh Setup (New Database)

Use this when setting up the database for the first time on the college server.

### Step 1 — Create the database

```bash
# Connect as postgres superuser
psql -U postgres

# Create database and user
CREATE DATABASE rchoice;
CREATE USER rchoice_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE rchoice TO rchoice_user;
\q
```

### Step 2 — Run the schema

```bash
psql -U rchoice_user -d rchoice -f database/schema.sql
```

### Step 3 — Verify

```bash
psql -U rchoice_user -d rchoice -c "\dt"
```

You should see all 28 tables listed.

### Step 4 — Update your app config

Update `.env.local` (or `.env.production`) with:

```env
DATABASE_URL=postgresql://rchoice_user:your_secure_password@localhost:5432/rchoice
```

### Step 5 — Seed test data (optional)

```bash
npx tsx src/lib/db/seed.ts
npx tsx src/lib/db/seed-students.ts
```

---

## Option 2: Data Migration (From Neon → College Server)

Use this when you have existing data on Neon and want to move everything.

### Step 1 — Export from Neon

```bash
# Get your Neon connection string from .env.local (DATABASE_URL)
pg_dump "postgresql://user:pass@your-neon-host/dbname?sslmode=require" > backup.sql
```

### Step 2 — Import to college server

```bash
# Create the database first (see Option 1, Step 1)
psql -U rchoice_user -d rchoice < backup.sql
```

### Step 3 — Verify data

```bash
psql -U rchoice_user -d rchoice -c "SELECT COUNT(*) FROM users;"
```

---

## Connection String Format

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

| Parameter | Example |
|---|---|
| **Neon (current)** | `postgresql://user:pass@ep-xxx.us-east.neon.tech/rchoice?sslmode=require` |
| **College Local** | `postgresql://rchoice_user:pass@localhost:5432/rchoice` |
| **College Network** | `postgresql://rchoice_user:pass@192.168.1.100:5432/rchoice` |

---

## Schema Files Reference

| File | Purpose |
|---|---|
| `database/schema.sql` | Full standalone schema — run this on any fresh PostgreSQL server |
| `drizzle/0000_cuddly_morg.sql` | Drizzle auto-generated migration (same schema, different format) |
| `src/lib/db/schema.ts` | Drizzle ORM TypeScript schema (source of truth) |

---

## Troubleshooting

### Permission denied

```bash
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO rchoice_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO rchoice_user;
GRANT USAGE ON SCHEMA public TO rchoice_user;
```

### pgcrypto extension missing

```bash
psql -U postgres -d rchoice -c 'CREATE EXTENSION IF NOT EXISTS "pgcrypto";'
```

### SSL issues with local server

Add `?sslmode=disable` to the connection string for local connections:

```env
DATABASE_URL=postgresql://rchoice_user:pass@localhost:5432/rchoice?sslmode=disable
```

---

## Security Checklist for Production

- [ ] Use a strong, unique password for the database user
- [ ] Restrict PostgreSQL to accept connections only from the app server IP
- [ ] Enable SSL for remote connections
- [ ] Set up automated backups (daily `pg_dump` cron job)
- [ ] Disable the `postgres` superuser for app access
- [ ] Review `pg_hba.conf` to restrict authentication methods
