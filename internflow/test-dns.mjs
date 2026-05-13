import dns from 'dns/promises';

const hostnames = [
    'ep-holy-feather-akm4nu1m-pooler.c-3.us-west-2.aws.neon.tech',
    'ep-holy-feather-akm4nu1m.us-west-2.aws.neon.tech',
    'ep-holy-feather-akm4nu1m-pooler.us-west-2.aws.neon.tech',
    'ep-holy-feather-akm4nu1m.c-3.us-west-2.aws.neon.tech'
];

async function check() {
    for (const host of hostnames) {
        try {
            const addrs = await dns.resolve4(host);
            console.log(`✅ ${host} resolved to ${addrs.join(', ')}`);
        } catch (err) {
            console.log(`❌ ${host} failed: ${err.code}`);
        }
    }
}

check();
