import prisma from './src/common/db/prisma';
import axios from 'axios';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

async function forceSyncLatest() {
    console.log('🚀 Starting Force Sync from Device Event Memory...');
    const device = await (prisma as any).biometricDevice.findFirst();
    if (!device) {
        console.log('❌ No device found');
        return;
    }

    const protocol = device.port === 43 || device.ipAddress.includes('https') ? 'https' : 'http';
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
                const final = await axios({
                    method: method as any,
                    url,
                    headers: { 'Authorization': authHeader },
                    data: body
                });
                return final.data;
            }
            throw e;
        }
    }

    try {
        // Get total count
        const initSearch = await req(url, 'POST', {
            AcsEventCond: { searchID: crypto.randomUUID(), searchResultPosition: 0, maxResults: 1, major: 0, minor: 0 }
        });
        const total = initSearch?.AcsEvent?.totalMatches || 0;
        console.log(`📊 Total events in device: ${total}`);

        const fetchCount = 1000;
        const startPos = Math.max(0, total - fetchCount);
        console.log(`📡 Fetching last ${fetchCount} events starting from position ${startPos}...`);

        const response = await req(url, 'POST', {
            AcsEventCond: {
                searchID: crypto.randomUUID(),
                searchResultPosition: startPos,
                maxResults: fetchCount,
                major: 0,
                minor: 0
            }
        });

        const events = response?.AcsEvent?.InfoList || [];
        console.log(`✅ Retrieved ${events.length} events. Processing and saving...`);

        let newRecords = 0;
        for (const event of events) {
            const empNo = event.employeeNoString || event.employeeNo;
            const eventTimeStr = event.time || event.eventTime || event.dateTime;
            if (!empNo || !eventTimeStr) continue;

            const attTime = new Date(eventTimeStr);
            const datePart = eventTimeStr.split('T')[0];
            const attDate = new Date(`${datePart}T00:00:00.000Z`);

            // Find or create employee
            let employee = await (prisma as any).employee.findFirst({
                where: { biometricId: String(empNo) }
            });

            if (!employee) {
                const newUser = await (prisma as any).user.create({
                    data: {
                        username: `emp_${empNo}`,
                        email: `emp${empNo}@institute.com`,
                        passwordHash: await bcrypt.hash('123456', 10),
                        firstName: event.name || `موظف ${empNo}`,
                        lastName: '',
                        phone: '',
                        isActive: true
                    }
                });
                employee = await (prisma as any).employee.create({
                    data: {
                        userId: newUser.id,
                        employeeCode: `EMP-${empNo}`,
                        biometricId: String(empNo),
                        status: 'active',
                        jobTitleAr: 'موظف',
                        salary: 0,
                        salaryType: 'FIXED',
                        currency: 'AED'
                    }
                });
            }

            // Get or create attendance record
            let attendance = await (prisma as any).staffAttendance.findFirst({
                where: { employeeId: employee.id, date: attDate }
            });

            if (!attendance) {
                attendance = await (prisma as any).staffAttendance.create({
                    data: { employeeId: employee.id, date: attDate, status: 'present' }
                });
            }

            // Check if event already exists
            const existingEvent = await (prisma as any).attendanceEvent.findFirst({
                where: {
                    attendanceId: attendance.id,
                    eventTime: {
                        gte: new Date(attTime.getTime() - 2000),
                        lte: new Date(attTime.getTime() + 2000)
                    }
                }
            });

            if (!existingEvent) {
                await (prisma as any).attendanceEvent.create({
                    data: {
                        attendanceId: attendance.id,
                        eventType: event.attendanceStatus || (event.minor === 1 ? 'checkIn' : event.minor === 2 ? 'checkOut' : 'checkIn'),
                        eventTime: attTime,
                        method: event.minor === 75 ? 'Face' : 'Fingerprint',
                        deviceInfo: device.name
                    }
                });

                // Update summary
                const allEvents = await (prisma as any).attendanceEvent.findMany({
                    where: { attendanceId: attendance.id },
                    orderBy: { eventTime: 'asc' }
                });

                const first = allEvents[0].eventTime;
                const last = allEvents[allEvents.length - 1].eventTime;
                const workMins = allEvents.length > 1 ? Math.floor((new Date(last).getTime() - new Date(first).getTime()) / 60000) : 0;

                await (prisma as any).staffAttendance.update({
                    where: { id: attendance.id },
                    data: {
                        checkIn: first,
                        checkOut: allEvents.length > 1 ? last : null,
                        firstCheckIn: first,
                        lastCheckOut: allEvents.length > 1 ? last : null,
                        totalWorkMinutes: workMins,
                        notes: `${allEvents.length} بصمات تم سحبها يدوياً`
                    }
                });
                newRecords++;
            }
        }

        console.log(`✨ Success! Processed ${events.length} events, saved ${newRecords} new records.`);
    } catch (err: any) {
        console.error('❌ Sync Failed:', err.message);
    }
}

forceSyncLatest().catch(console.error).finally(() => process.exit());
