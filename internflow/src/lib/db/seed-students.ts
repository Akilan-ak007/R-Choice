/**
 * R-Choice — Student Batch Seed Script
 * Creates login accounts + student profiles for all BCS 2024 students.
 * Password = Register Number (e.g. RCAS2024BCS001)
 * Run with: npx tsx src/lib/db/seed-students.ts
 */
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "./schema";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL not set in .env.local");
  process.exit(1);
}

const sql = neon(DATABASE_URL);
const db = drizzle(sql, { schema });

// ── BCS 2024 Student Data (from official register) ──
const students = [
  { regNo: "RCAS2024BCS001", name: "AJITH KUMAR T", email: "ajithkumart.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS005", name: "HARSHINI R", email: "harshinir.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS006", name: "DEEPIKA K", email: "deepika.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS007", name: "KISHORE M", email: "kishorem.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS008", name: "ARISEIK J", email: "ahiseikj.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS009", name: "MOHAMED YASAR H", email: "hmohamedyasar.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS010", name: "BHUVANSHANKAR", email: "bhuvanshankar.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS011", name: "RADHA KRISHNAN S", email: "radhakrishnans.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS012", name: "SAFWAN A", email: "safwana.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS013", name: "ISMAIL AHAMED", email: "ismailahamed.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS014", name: "HARIPRIYA R", email: "haripriyar.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS015", name: "MOHAMED NIYAZ A", email: "mohamedniyaz.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS016", name: "MOHAMMED ARSATH K", email: "mohammedarsathk.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS017", name: "MOHAMED ASHIK SHERIF", email: "mohamedashiksherif.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS018", name: "DINESH R", email: "dineshr.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS019", name: "MURIGA SUTHAN U", email: "murigasuthanu.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS020", name: "AKILAN K", email: "akilank.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS021", name: "SUDHAKAR K", email: "sudhmark.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS022", name: "MANIKANDAN J", email: "manikandanj.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS023", name: "LOKESHWAR S", email: "lokeshwars.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS024", name: "PRITHVI RAJ R", email: "prithvirajr.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS025", name: "MINISHWAR M", email: "minishwarm.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS027", name: "NAVEEN KUMAR A", email: "naveenkumara.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS028", name: "MANRESH S", email: "manreshs.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS029", name: "MAHRAN M", email: "mahranm.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS030", name: "DEEPAK D", email: "deepakd.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS031", name: "NILA V S", email: "nilavs.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS033", name: "RISHIKTHA P", email: "rishikthap.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS034", name: "SUJITH V", email: "sujithv.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS035", name: "FAATIK R", email: "faatikr.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS036", name: "KAVIARASI S", email: "kaviarasis.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS037", name: "VINOTH KUMAR M", email: "vinothkumarm.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS038", name: "YUVA YOGESH S", email: "yuvayogeshs.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS039", name: "SABARISH M", email: "sabarishm.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS040", name: "KEERTHIKA D", email: "keerthikad.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS041", name: "RANJITHKUMAR M", email: "ranjithkumarm.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS042", name: "SWADI R", email: "swadir.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS043", name: "MOHAMMED IDREES R", email: "mohammedidreesr.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS044", name: "FATHIMA SHERIN S", email: "fathimasherins.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS045", name: "MATHI VANAN S", email: "mathivanans.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS046", name: "MOHAMMED FAYAS P M", email: "mohammedfayaspm.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS047", name: "ARUL KANNAN S", email: "arulkannans.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS048", name: "ROHAN RANGASAMY G", email: "rohanrangasamyg.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS049", name: "SACHIN SRI G", email: "sachinsrig.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS050", name: "ABDUL RAHAMANS N", email: "abdulrahamansn.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS051", name: "MUHAMMED AADHIL N", email: "mohammedaadhiln.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS052", name: "KAMESHWARAN M", email: "kameshwaranm.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS053", name: "KAMALESH M", email: "kamaleshm.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS054", name: "MOHAMED YAHYA R", email: "mohamedyahyar.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS055", name: "SUTHARSHAN P G", email: "sutharshanpg.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS056", name: "DHAYANITHI J", email: "dhayanithij.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS057", name: "SHARVESH B B", email: "sharveshbb.bcs24@rathinam.in" },
  { regNo: "RCAS2024BCS058", name: "MOHAMED OSMAN ALI ADAM", email: "mohamedosmanalidam.bcs24@rathinam.in" },
];

function splitName(fullName: string): { firstName: string; lastName: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: "" };
  const lastName = parts.pop()!;
  return { firstName: parts.join(" "), lastName };
}

async function seedStudents() {
  console.log("🎓 Seeding BCS 2024 Student Batch...\n");
  console.log(`   Total students: ${students.length}`);
  console.log(`   Password format: Register Number (e.g. RCAS2024BCS001)\n`);

  let created = 0;
  let skipped = 0;
  let errors = 0;

  for (const student of students) {
    try {
      const { firstName, lastName } = splitName(student.name);
      // Password = Register Number
      const passwordHash = await bcrypt.hash(student.regNo, 12);

      // 1. Upsert user account
      const [user] = await db
        .insert(schema.users)
        .values({
          email: student.email,
          passwordHash,
          role: "student",
          firstName,
          lastName,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: schema.users.email,
          set: {
            passwordHash,
            firstName,
            lastName,
            isActive: true,
          },
        })
        .returning();

      // 2. Upsert student profile
      await db
        .insert(schema.studentProfiles)
        .values({
          userId: user.id,
          registerNo: student.regNo,
          department: "Computer Science",
          year: 2,
          section: "A",
          profileCompletionScore: 20,
        })
        .onConflictDoUpdate({
          target: schema.studentProfiles.registerNo,
          set: {
            userId: user.id,
            department: "Computer Science",
            year: 2,
          },
        });

      console.log(`  ✅ ${student.regNo}  ${student.name.padEnd(28)}  → ${student.email}`);
      created++;
    } catch (err: any) {
      console.log(`  ❌ ${student.regNo}  ${student.name.padEnd(28)}  → ERROR: ${err.message?.slice(0, 80)}`);
      errors++;
    }
  }

  console.log("\n" + "─".repeat(60));
  console.log(`✅ Created/Updated: ${created}`);
  console.log(`⚠️  Skipped: ${skipped}`);
  console.log(`❌ Errors: ${errors}`);
  console.log("─".repeat(60));
  console.log("\n📋 Login credentials:");
  console.log("   Email: <student_email from table>");
  console.log("   Password: <register_number>  (e.g. RCAS2024BCS001)");
  console.log("   Role: Student\n");
}

seedStudents().catch(console.error);
