const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function fetchAllRecords() {
    console.log('--- Comprehensive Biometric Event Fetch ---');
    const device = await prisma.biometricDevice.findFirst();

    if (!device) {
        console.log('No biometric device found in database');
        return;
    }

    const protocol = device.port === 443 || device.ipAddress.includes('https') ? 'https' : 'http';
    const cleanIp = device.ipAddress.replace('https://', '').replace('http://', '');
    const baseUrl = `${protocol}://${cleanIp}:${device.port}`;
    const eventUrl = `${baseUrl}/ISAPI/AccessControl/AcsEvent?format=json`;

    console.log(`Connecting to: ${device.name} at ${baseUrl}...`);

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

                const final = await axios({
                    method,
                    url,
                    headers: { 'Authorization': auth },
                    data: body
                });
                return final.data;
            }
            throw e;
        }
    }

    try {
        // Fetch the ABSOLUTE LATEST 500 events, no date filters
        const searchConfig = {
            AcsEventCond: {
                searchID: crypto.randomUUID(),
                searchResultPosition: 0,
                maxResults: 500, // Fetch up to 500 records
                major: 0, // 0 means all major types
                minor: 0, // 0 means all minor types
                // Not providing startTime/endTime to get everything starting from newest
            }
        };

        console.log('Fetching latest 500 events from device memory...');
        const events = await req(eventUrl, 'POST', searchConfig);

        const totalMatches = events?.AcsEvent?.totalMatches || 0;
        const list = events?.AcsEvent?.InfoList || [];

        console.log(`Total events in memory: ${totalMatches}`);
        console.log(`Retrieved: ${list.length} latest events`);
        console.log('--- Printing latest 50 for inspection ---');

        list.slice(0, 50).forEach((e, i) => {
            console.log(`[${i + 1}] Emp: ${e.employeeNoString} | Time: ${e.time || e.eventTime} | Name: ${e.name || 'N/A'} | Major: ${e.major} | Minor: ${e.minor}`);
        });

    } catch (err) {
        console.error('Diagnostic Failed:', err.message);
    }
}

fetchAllRecords().catch(console.error).finally(() => {
    prisma.$disconnect();
    process.exit();
});
