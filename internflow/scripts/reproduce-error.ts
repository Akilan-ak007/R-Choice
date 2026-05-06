
import dns from "node:dns";
import tls from "node:tls";

dns.setDefaultResultOrder("ipv4first");
tls.DEFAULT_MAX_VERSION = 'TLSv1.2';

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { companyRegistrations } from '../src/lib/db/schema';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

async function test() {
  try {
    console.log("Querying enum values...");
    const result = await db.execute(`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'company_status'
    `);
    console.log("Enum values:", result.rows);
  } catch (err) {
    console.error("Failed query error:", err);
  }
}

test();
