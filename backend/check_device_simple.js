const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const crypto = require('crypto');

const prisma = new PrismaClient();

async function checkDeviceTime() {
    console.log('--- Biometric Diagnostic Start ---');
    const device = await prisma.biometricDevice.findFirst();

    if (!device) {
        console.log('No biometric device found in database');
        return;
    }

    const protocol = device.port === 443 || device.ipAddress.includes('https') ? 'https' : 'http';
    const cleanIp = device.ipAddress.replace('https://', '').replace('http://', '');
    const baseUrl = `${protocol}://${cleanIp}:${device.port}`;
    const timeUrl = `${baseUrl}/ISAPI/System/time`;

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
        const timeData = await req(timeUrl, 'GET');
        console.log('Device Internal Time:', JSON.stringify(timeData));

        const eventUrl = `${baseUrl}/ISAPI/AccessControl/AcsEvent?format=json`;
        const searchConfig = {
            AcsEventCond: {
                searchID: crypto.randomUUID(),
                searchResultPosition: 0,
                maxResults: 10,
                major: 5,
                minor: 0
            }
        };
        const events = await req(eventUrl, 'POST', searchConfig);
        console.log('--- Last 10 Raw Events on Device ---');
        const list = events?.AcsEvent?.InfoList || [];
        list.forEach((e) => console.log(`Emp: ${e.employeeNoString} | Time: ${e.time || e.eventTime} | Name: ${e.name || 'N/A'}`));

    } catch (err) {
        console.error('Diagnostic Failed:', err.message);
        if (err.response) console.error('Response:', err.response.data);
    }
}

checkDeviceTime().catch(console.error).finally(() => {
    prisma.$disconnect();
    process.exit();
});
