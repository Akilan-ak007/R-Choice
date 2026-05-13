import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
console.log('Connected to database');

try {
  await client.query('ALTER TABLE student_profiles ALTER COLUMN department SET DATA TYPE varchar(200)');
  console.log('✓ department → varchar(200)');
  
  await client.query('ALTER TABLE student_profiles ALTER COLUMN section SET DATA TYPE varchar(20)');
  console.log('✓ section → varchar(20)');

  await client.query('ALTER TABLE student_profiles ALTER COLUMN program_type SET DATA TYPE varchar(20)');
  console.log('✓ program_type → varchar(20)');
  
  console.log('\nAll columns widened successfully!');
} catch (e) {
  console.error('ERROR:', e.message);
} finally {
  await client.end();
}
