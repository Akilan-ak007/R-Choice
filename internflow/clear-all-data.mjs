import pg from 'pg';
import fs from 'fs';
import dns from 'node:dns/promises';

dns.setServers(['8.8.8.8', '1.1.1.1']);

const envContent = fs.readFileSync('.env.local', 'utf8');
const match = envContent.match(/DATABASE_URL="([^"]+)"/);
const dbUrl = match ? match[1] : null;

if (!dbUrl) {
    console.error('DATABASE_URL not found in .env.local');
    process.exit(1);
}

const parsedUrl = new URL(dbUrl);
const hostname = parsedUrl.hostname;

async function run() {
    try {
        const addrs = await dns.resolve4(hostname);
        const targetIp = addrs[0];

        const client = new pg.Client({
            host: targetIp,
            port: parsedUrl.port || 5432,
            user: parsedUrl.username,
            password: parsedUrl.password,
            database: parsedUrl.pathname.slice(1),
            ssl: {
                rejectUnauthorized: false,
                servername: hostname
            }
        });

        await client.connect();
        
        console.log("Fetching all tables to wipe (excluding users and migrations)...");
        
        const res = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE' 
            AND table_name NOT IN ('users', '__drizzle_migrations');
        `);
        
        const tables = res.rows.map(r => '"' + r.table_name + '"');
        
        if (tables.length > 0) {
            console.log("Truncating tables:", tables.join(', '));
            const truncateQuery = `TRUNCATE ${tables.join(', ')} CASCADE;`;
            await client.query(truncateQuery);
            console.log("All non-user data has been completely wiped.");
        } else {
            console.log("No tables found to truncate.");
        }

        // Just in case, reset the locked status or failed logins for users
        await client.query(`
            UPDATE users SET failed_login_attempts = 0, locked_until = NULL;
        `);
        console.log("Reset user login locks/attempts.");

        await client.end();
    } catch (err) {
        console.error("Database connection or query failed:", err);
    }
}

run();
