import fs from "node:fs/promises";
import path from "node:path";
import dns from "node:dns";
import tls from "node:tls";

import * as dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

dotenv.config({ path: ".env.local" });
dotenv.config();
dns.setDefaultResultOrder("ipv4first");
tls.DEFAULT_MAX_VERSION = "TLSv1.2";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not configured.");
}

const sql = neon(process.env.DATABASE_URL);
const migrationsDir = path.resolve("drizzle");
const migrationTable = "internflow_sql_migrations";

async function ensureMigrationTable() {
  await runQuery(`
    CREATE TABLE IF NOT EXISTS ${migrationTable} (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      file_name varchar(255) NOT NULL UNIQUE,
      checksum text NOT NULL,
      applied_at timestamptz NOT NULL DEFAULT now()
    );
  `);
}

function checksumFor(text) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash.toString(16);
}

function splitStatements(sqlText) {
  return sqlText
    .split("--> statement-breakpoint")
    .map((statement) => statement.trim())
    .filter(Boolean);
}

async function runQuery(statement, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await sql.query(statement);
    } catch (error) {
      lastError = error;
      if (attempt === attempts) {
        throw error;
      }
      const backoffMs = attempt * 750;
      console.warn(`Retrying database query after transient failure (attempt ${attempt}/${attempts})...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  throw lastError;
}

async function getAppliedMigrations() {
  const rows = await runQuery(`SELECT file_name, checksum FROM ${migrationTable} ORDER BY file_name ASC;`);
  return new Map(rows.map((row) => [row.file_name, row.checksum]));
}

async function tableExists(tableName) {
  const rows = await runQuery(`
    SELECT to_regclass('public.${tableName}') AS table_name;
  `);
  return Boolean(rows[0]?.table_name);
}

async function baselineExistingDatabase(files) {
  const alreadyApplied = await getAppliedMigrations();
  if (alreadyApplied.size > 0) {
    return alreadyApplied;
  }

  const hasWorkflowTables = await tableExists("selection_process_rounds");
  const hasLaunchWorkflowTables =
    (await tableExists("job_result_publications")) &&
    (await tableExists("approval_sla_settings")) &&
    (await tableExists("od_raise_requests")) &&
    (await tableExists("job_application_round_progress"));

  if (!hasWorkflowTables && !hasLaunchWorkflowTables) {
    return alreadyApplied;
  }

  const baselineFiles = files.filter((fileName) => {
    if (hasLaunchWorkflowTables) {
      return true;
    }
    return !fileName.startsWith("0004_");
  });

  for (const fileName of baselineFiles) {
    const filePath = path.join(migrationsDir, fileName);
    const fileContents = await fs.readFile(filePath, "utf8");
    const checksum = checksumFor(fileContents);
    const escapedName = fileName.replace(/'/g, "''");
    const escapedChecksum = checksum.replace(/'/g, "''");

    await runQuery(`
      INSERT INTO ${migrationTable} (file_name, checksum)
      VALUES ('${escapedName}', '${escapedChecksum}')
      ON CONFLICT (file_name) DO NOTHING;
    `);
  }

  console.log(`Baselined ${baselineFiles.length} existing migration file(s) for the current database.`);
  return getAppliedMigrations();
}

async function applyMigration(fileName, fileContents, checksum) {
  const statements = splitStatements(fileContents);
  if (statements.length === 0) {
    return;
  }

  await runQuery("BEGIN");
  try {
    for (const statement of statements) {
      await runQuery(statement);
    }

    const escapedName = fileName.replace(/'/g, "''");
    const escapedChecksum = checksum.replace(/'/g, "''");
    await runQuery(`
      INSERT INTO ${migrationTable} (file_name, checksum)
      VALUES ('${escapedName}', '${escapedChecksum}')
      ON CONFLICT (file_name) DO NOTHING;
    `);
    await runQuery("COMMIT");
  } catch (error) {
    await runQuery("ROLLBACK");
    throw error;
  }
}

async function main() {
  await ensureMigrationTable();
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const files = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".sql"))
    .map((entry) => entry.name)
    .sort((left, right) => left.localeCompare(right));
  const applied = await baselineExistingDatabase(files);

  let appliedCount = 0;

  for (const fileName of files) {
    const filePath = path.join(migrationsDir, fileName);
    const fileContents = await fs.readFile(filePath, "utf8");
    const checksum = checksumFor(fileContents);
    const existingChecksum = applied.get(fileName);

    if (existingChecksum) {
      if (existingChecksum !== checksum) {
        throw new Error(`Migration checksum mismatch for ${fileName}. The database has a different copy recorded.`);
      }
      continue;
    }

    await applyMigration(fileName, fileContents, checksum);
    appliedCount += 1;
    console.log(`Applied ${fileName}`);
  }

  if (appliedCount === 0) {
    console.log("No pending SQL migrations.");
    return;
  }

  console.log(`Applied ${appliedCount} migration file(s).`);
}

await main();
