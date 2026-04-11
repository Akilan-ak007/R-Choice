import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

// Global singleton to avoid re-creating connection on every hot-reload
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzle<typeof schema>> | undefined;
};

if (!globalForDb.db) {
  const sql = neon(process.env.DATABASE_URL!);
  globalForDb.db = drizzle(sql, { schema });
}

export const db = globalForDb.db;
