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
        
        // Delete mock applications for Deepak Company
        console.log("Deleting mock job applications...");
        const res = await client.query(`
            DELETE FROM job_applications;
        `);
        console.log(`Deleted ${res.rowCount} mock applications.`);
        
        const res2 = await client.query(`
            DELETE FROM job_application_round_progress;
        `);
        console.log(`Deleted ${res2.rowCount} round progress records.`);

        await client.end();
    } catch (err) {
        console.error("Database connection or query failed:", err);
    }
}

run();
