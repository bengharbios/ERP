import prisma from './src/common/db/prisma';
import axios from 'axios';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';

async function scanForFeb18() {
    console.log('🔍 Scanning Device specifically for Feb 17 & 18, 2026...');
    const device = await (prisma as any).biometricDevice.findFirst();
    if (!device) return;

    const protocol = device.port === 443 || device.ipAddress.includes('https') ? 'https' : 'http';
    const cleanIp = device.ipAddress.replace('https://', '').replace('http://', '');
    const baseUrl = `${protocol}://${cleanIp}:${device.port}`;
    const url = `${baseUrl}/ISAPI/AccessControl/AcsEvent?format=json`;

    async function req(url: string, method: string, body?: any) {
        try {
            await axios({ method, url });
        } catch (e: any) {
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
                const authHeader = `Digest username="${device.username}", realm="${realm}", nonce="${nonce}", uri="${path}", response="${response}", algorithm="MD5", qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
                const final = await axios({ method, url, headers: { 'Authorization': authHeader }, data: body });
                return final.data;
            }
        }
    }

    try {
        // Search filter for Feb 17 to Feb 19
        const searchConfig = {
            AcsEventCond: {
                searchID: crypto.randomUUID(),
                searchResultPosition: 0,
                maxResults: 100,
                major: 0,
                minor: 0,
                startTime: "2026-02-17T00:00:00",
                endTime: "2026-02-19T23:59:59"
            }
        };

        console.log('📡 Sending specific date-range search request to device...');
        const response = await req(url, 'POST', searchConfig);

        const total = response?.AcsEvent?.totalMatches || 0;
        const events = (response?.AcsEvent?.InfoList || []) as any[];

        console.log(`📊 Found ${total} matches for these dates.`);

        if (events.length > 0) {
            console.log(`--- Writing ${events.length} matches to scan_result.json ---`);
            fs.writeFileSync('scan_result.json', JSON.stringify(events, null, 2));
            events.forEach((e: any, i: number) => {
                const empNo = e.employeeNoString || e.employeeNo;
                const time = e.time || e.eventTime;
                console.log(`[${i + 1}] Emp: ${empNo} | Time: ${time} | Name: ${e.name}`);
            });
        } else {
            console.log('❌ No events found in the device for Feb 17/18 using date filter.');
            console.log('Trying one more search without time filter but high offset...');

            // Try fetching absolute latest again but just print them
            const totalEvents = 12952; // roughly
            const lastEvents = await req(url, 'POST', {
                AcsEventCond: { searchID: crypto.randomUUID(), searchResultPosition: totalEvents - 20, maxResults: 20 }
            });
            console.log('--- Absolute Latest 20 from Memory ---');
            (lastEvents?.AcsEvent?.InfoList || []).forEach((e: any) => console.log(`Time: ${e.time || e.eventTime} | Emp: ${e.employeeNoString}`));
        }
    } catch (err: any) {
        console.error('Scan Failed:', err.message);
    }
}

scanForFeb18().catch(console.error).finally(() => process.exit());
