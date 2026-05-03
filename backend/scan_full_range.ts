import prisma from './src/common/db/prisma';
import axios from 'axios';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';

async function scanAllFeb() {
    console.log('🔍 Scanning Device and FETCHING ALL matches for Feb 17 & 18, 2026...');
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
        let allMatches: any[] = [];
        let position = 0;
        let hasMore = true;
        const maxResults = 50;

        while (hasMore) {
            const searchConfig = {
                AcsEventCond: {
                    searchID: crypto.randomUUID(),
                    searchResultPosition: position,
                    maxResults: maxResults,
                    major: 0,
                    minor: 0,
                    startTime: "2026-02-17T00:00:00",
                    endTime: "2026-02-19T23:59:59"
                }
            };

            const response = await req(url, 'POST', searchConfig);
            const total = response?.AcsEvent?.totalMatches || 0;
            const events = (response?.AcsEvent?.InfoList || []) as any[];

            if (events.length === 0) break;

            allMatches = allMatches.concat(events);
            console.log(`Fetched ${events.length} events (Total so far: ${allMatches.length} / ${total})`);

            position += events.length;
            hasMore = allMatches.length < total;
        }

        console.log(`✨ DONE! Total matches fetched: ${allMatches.length}`);
        fs.writeFileSync('scan_result_full.json', JSON.stringify(allMatches, null, 2));

        // Print the last 20 from the results (likely the newest ones if sorted asc)
        console.log('--- Printing LATEST 20 matches from results ---');
        allMatches.slice(-20).forEach((e, i) => {
            const empNo = e.employeeNoString || e.employeeNo;
            console.log(`[${allMatches.length - 19 + i}] Emp: ${empNo} | Time: ${e.time || e.eventTime} | Name: ${e.name}`);
        });

    } catch (err: any) {
        console.error('Scan Failed:', err.message);
    }
}

scanAllFeb().catch(console.error).finally(() => process.exit());
