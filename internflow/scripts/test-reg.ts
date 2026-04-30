import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
const sql = neon(process.env.DATABASE_URL!);

async function run() {
  try {
    const res = await sql`INSERT INTO company_registrations (
      company_legal_name, company_type, industry_sector, website, address, city, state, pin_code, hr_name, hr_email, hr_phone
    ) VALUES (
      'Test Company', 'Type', 'Sector', 'http', 'Add', 'City', 'State', '123', 'HR', 'hr@test', '123'
    ) RETURNING *;`;
    console.log("Success", res.length);
    await sql`DELETE FROM company_registrations WHERE id = ${res[0].id}`;
  } catch (e) {
    console.error("DB Error:", e);
  }
  process.exit(0);
}
run();
