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

// Extract hostname and create a custom connection config
const parsedUrl = new URL(dbUrl);
const hostname = parsedUrl.hostname;

async function run() {
    try {
        console.log(`Resolving IP for ${hostname} using 8.8.8.8...`);
        const addrs = await dns.resolve4(hostname);
        const targetIp = addrs[0];
        console.log(`Resolved to ${targetIp}`);

        const client = new pg.Client({
            host: targetIp,
            port: parsedUrl.port || 5432,
            user: parsedUrl.username,
            password: parsedUrl.password,
            database: parsedUrl.pathname.slice(1),
            ssl: {
                rejectUnauthorized: false,
                servername: hostname // CRITICAL for SNI
            }
        });

        console.log("Connecting...");
        await client.connect();
        console.log("Connected to Neon DB successfully!");
        
        const res = await client.query('SELECT email, role FROM users');
        
        if (res.rows.length === 0) {
            console.log("No users found in the database. (Did you forget to seed?)");
        } else {
            console.table(res.rows);
            console.log("\nJSON Dump:");
            console.log(JSON.stringify(res.rows, null, 2));
        }
        await client.end();
    } catch (err) {
        console.error("Database connection or query failed:", err);
    }
}

run();
