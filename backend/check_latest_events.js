const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function fetchLatestRecords() {
    console.log('--- Checking the END of Device Memory ---');
    const device = await prisma.biometricDevice.findFirst();
    if (!device) return;

    const protocol = device.port === 443 || device.ipAddress.includes('https') ? 'https' : 'http';
    const cleanIp = device.ipAddress.replace('https://', '').replace('http://', '');
    const baseUrl = `${protocol}://${cleanIp}:${device.port}`;
    const eventUrl = `${baseUrl}/ISAPI/AccessControl/AcsEvent?format=json`;

    async function req(url, method, body) {
        try {
            await axios({ method, url });
        } catch (e) {
            if (e.response && e.response.status === 401) {
                const challenge = e.response.headers['www-authenticate'];
                const realm = /realm="(.*?)"/.exec(challenge)?.[1];
                const nonce = /nonce="(.*?)"/.exec(challenge)?.[1];
                const qop = /qop="(.*?)"/.exec(challenge)?.[1];
                const nc = '00000001';
                const cnonce = crypto.randomBytes(8).toString('hex');
                const ha1 = crypto.createHash('md5').update(`${device.username}:${realm}:${device.password}`).digest('hex');
                const path = new URL(url).pathname;
                const ha2 = crypto.createHash('md5').update(`${method}:${path}`).digest('hex');
                const response = crypto.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');
                const auth = `Digest username="${device.username}", realm="${realm}", nonce="${nonce}", uri="${path}", response="${response}", algorithm="MD5", qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
                const final = await axios({ method, url, headers: { 'Authorization': auth }, data: body });
                return final.data;
            }
        }
    }

    try {
        // Step 1: Get total matches first
        const initSearch = await req(eventUrl, 'POST', {
            AcsEventCond: { searchID: crypto.randomUUID(), searchResultPosition: 0, maxResults: 1, major: 0, minor: 0 }
        });
        const total = initSearch?.AcsEvent?.totalMatches || 0;
        console.log(`Total events in device: ${total}`);

        if (total > 0) {
            // Step 2: Fetch the LAST 50 events by offsetting the search to the end
            const lastPos = Math.max(0, total - 50);
            console.log(`Fetching 50 events starting from position ${lastPos}...`);

            const events = await req(eventUrl, 'POST', {
                AcsEventCond: {
                    searchID: crypto.randomUUID(),
                    searchResultPosition: lastPos,
                    maxResults: 50,
                    major: 0,
                    minor: 0
                }
            });

            const list = events?.AcsEvent?.InfoList || [];
            console.log(`--- The ABSOLUTE NEWEST Records Found (${list.length}) ---`);
            list.forEach((e, i) => {
                console.log(`[${lastPos + i + 1}] Emp: ${e.employeeNoString} | Time: ${e.time || e.eventTime} | Name: ${e.name || 'N/A'}`);
            });
        }
    } catch (err) {
        console.error('Failed:', err.message);
    }
}

fetchLatestRecords().catch(console.error).finally(() => {
    prisma.$disconnect();
    process.exit();
});
