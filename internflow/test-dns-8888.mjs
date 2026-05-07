import dns from 'dns/promises';

dns.setServers(['8.8.8.8', '1.1.1.1']);

async function check() {
    const host = 'ep-holy-feather-akm4nu1m-pooler.c-3.us-west-2.aws.neon.tech';
    try {
        const addrs = await dns.resolve4(host);
        console.log(`✅ ${host} resolved to ${addrs.join(', ')}`);
    } catch (err) {
        console.log(`❌ ${host} failed: ${err.code} - ${err.message}`);
    }
}

check();
