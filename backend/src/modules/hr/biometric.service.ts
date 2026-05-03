import prisma from '../../common/db/prisma';
import axios from 'axios';
import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

export class BiometricService {
    /**
     * Get all biometric devices
     */
    async getDevices() {
        try {
            return await (prisma as any).biometricDevice.findMany({
                orderBy: { createdAt: 'desc' }
            });
        } catch (error) {
            console.error('Error fetching devices:', error);
            return [];
        }
    }

    /**
     * Create a new biometric device
     */
    async createDevice(data: any) {
        return await (prisma as any).biometricDevice.create({
            data: {
                ...data,
                port: Number(data.port) || 80,
                isActive: true
            }
        });
    }

    /**
     * Update an existing biometric device
     */
    async updateDevice(id: string, data: any) {
        return await (prisma as any).biometricDevice.update({
            where: { id },
            data: {
                ...data,
                port: data.port ? Number(data.port) : undefined
            }
        });
    }

    /**
     * Delete a biometric device
     */
    async deleteDevice(id: string) {
        return await (prisma as any).biometricDevice.delete({
            where: { id }
        });
    }

    /**
     * Digest Authentication helper
     */
    private async requestWithDigest(url: string, method: string, auth: any, data?: any) {
        const { username, password } = auth;

        try {
            // 1. First request to get challenge
            const res = await axios({ method: method as any, url, timeout: 5000 });
            return { success: true, data: res.data };
        } catch (error: any) {
            if (error.response && error.response.status === 401) {
                const authenticateHeader = error.response.headers['www-authenticate'] || '';
                const realm = /realm="(.*?)"/.exec(authenticateHeader)?.[1] || 'IP Camera(D9007)';
                const nonce = /nonce="(.*?)"/.exec(authenticateHeader)?.[1] || '';
                const qop = /qop="(.*?)"/.exec(authenticateHeader)?.[1] || 'auth';

                const ha1 = crypto.createHash('md5').update(`${username}:${realm}:${password}`).digest('hex');
                const ha2 = crypto.createHash('md5').update(`${method}:${new URL(url).pathname}`).digest('hex');
                const nc = '00000001';
                const cnonce = crypto.randomBytes(8).toString('hex');
                const authResponse = crypto.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');

                const authHeader = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${new URL(url).pathname}${new URL(url).search}", response="${authResponse}", algorithm="MD5", qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;

                try {
                    const finalRes = await axios({
                        method: method as any,
                        url,
                        headers: {
                            'Authorization': authHeader,
                            'Content-Type': 'application/json'
                        },
                        data,
                        timeout: 5000
                    });
                    return { success: true, data: finalRes.data };
                } catch (finalError: any) {
                    return { success: false, error: finalError.response?.data?.statusString || finalError.message };
                }
            }
            return { success: false, error: error.message };
        }
    }

    /**
     * Sync Employees from Device
     */
    async syncEmployees(deviceId: string) {
        const device = await (prisma as any).biometricDevice.findUnique({ where: { id: deviceId } });
        if (!device) throw new Error('Device not found');

        try {
            const protocol = device.port === 443 || device.ipAddress.includes('https') ? 'https' : 'http';
            const cleanIp = device.ipAddress.replace('https://', '').replace('http://', '');
            const url = `${protocol}://${cleanIp}:${device.port}/ISAPI/AccessControl/UserInfo/Search?format=json`;

            const searchConfig = {
                UserInfoSearchCond: {
                    searchID: crypto.randomUUID(),
                    searchResultPosition: 0,
                    maxResults: 1000
                }
            };

            const response = await this.requestWithDigest(url, 'POST', {
                username: device.username,
                password: device.password
            }, searchConfig);

            if (!response.success) {
                throw new Error(response.error);
            }

            const users = (response.data as any)?.UserInfoSearch?.UserInfo || [];
            let createdCount = 0;
            let skippedCount = 0;

            for (const u of users) {
                const employeeId = u.employeeNo;

                const existing = await (prisma as any).employee.findFirst({
                    where: { biometricId: String(employeeId) }
                });

                if (existing) {
                    skippedCount++;
                    continue;
                }

                const newUser = await (prisma as any).user.create({
                    data: {
                        username: `emp_${employeeId}`,
                        email: `emp${employeeId}@institute.com`,
                        passwordHash: await bcrypt.hash('123456', 10),
                        firstName: u.name || `موظف ${employeeId}`,
                        lastName: '',
                        phone: '',
                        isActive: true
                    }
                });

                await (prisma as any).employee.create({
                    data: {
                        userId: newUser.id,
                        employeeCode: `EMP-${employeeId}`,
                        biometricId: String(employeeId),
                        jobTitleAr: 'موظف',
                        jobTitleEn: 'Employee',
                        salary: 0,
                        housingAllowance: 0,
                        transportAllowance: 0,
                        otherAllowances: 0,
                        totalDeductions: 0,
                        salaryType: 'FIXED',
                        isCommissionPercentage: false,
                        status: 'active',
                        currency: 'AED'
                    }
                });

                createdCount++;
            }

            return { success: true, message: `تم إنشاء ${createdCount} موظف جديد وتخطي ${skippedCount} موجودين سابقاً` };
        } catch (error: any) {
            console.error('Sync Employees Error:', error);
            throw new Error(`فشلت مزامنة الموظفين: ${error.message}`);
        }
    }

    /**
     * Sync Attendance
     */
    async syncAttendance(deviceId: string) {
        const device = await (prisma as any).biometricDevice.findUnique({ where: { id: deviceId } });
        if (!device) throw new Error('Device not found');

        try {
            const protocol = device.port === 443 || device.ipAddress.includes('https') ? 'https' : 'http';
            const cleanIp = device.ipAddress.replace('https://', '').replace('http://', '');

            // Look back 30 days and look forward 1 day to ensure we cover all timezones
            const startD = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            const endD = new Date(Date.now() + 24 * 60 * 60 * 1000); // Look ahead for any future records

            const toHikDate = (d: Date) => {
                const pad = (n: number) => n < 10 ? '0' + n : n;
                return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            };

            const url = `${protocol}://${cleanIp}:${device.port}/ISAPI/AccessControl/AcsEvent?format=json`;
            let searchPosition = 0;
            const maxPageResults = 1000;
            let syncCount = 0;
            let totalProcessed = 0;
            let hasMore = true;

            while (hasMore) {
                const searchConfig = {
                    AcsEventCond: {
                        searchID: crypto.randomUUID(),
                        searchResultPosition: searchPosition,
                        maxResults: maxPageResults,
                        major: 0, // All events
                        minor: 0, // All event subtypes
                        startTime: toHikDate(startD),
                        endTime: toHikDate(endD)
                    }
                };

                const response = await this.requestWithDigest(url, 'POST', {
                    username: device.username,
                    password: device.password
                }, searchConfig);

                if (!response.success) {
                    throw new Error(response.error);
                }

                const responseData = response.data as any;
                const events = (responseData?.AcsEvent?.InfoList || responseData?.InfoList || []) as any[];
                const totalMatches = responseData?.AcsEvent?.totalMatches || events.length;

                if (events.length === 0) break;

                const currentPage = Math.floor(searchPosition / maxPageResults) + 1;
                console.log(`[Biometric] Processing page ${currentPage}, found ${events.length} events (Total matches: ${totalMatches})`);

                const touchedAttendanceIds = new Set<string>();
                for (const event of events) {
                    totalProcessed++;
                    const empNo = event.employeeNoString || event.employeeNo;
                    const eventTimeStr = event.time || event.eventTime || event.dateTime;

                    if (!empNo || !eventTimeStr) continue;

                    const attTime = new Date(eventTimeStr);
                    // Force date to be the calendar day at midnight UTC to avoid timezone shifts
                    const datePart = eventTimeStr.split('T')[0];
                    const attDate = new Date(`${datePart}T00:00:00.000Z`);

                    let employee = await (prisma as any).employee.findFirst({
                        where: { biometricId: String(empNo) },
                        include: { user: true }
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
                            },
                            include: { user: true }
                        });
                    }

                    // --- NEW: Validation by Employment Status & Dates ---
                    // 1. Ignore if employee is explicitly inactive/deceased/resigned and we are past their lastWorkingDate
                    const selEventDay = new Date(attTime);
                    selEventDay.setHours(0, 0, 0, 0);

                    if (employee.joiningDate) {
                        const joinDate = new Date(employee.joiningDate);
                        joinDate.setHours(0, 0, 0, 0);
                        if (selEventDay < joinDate) {
                            console.log(`[Biometric] Skipping event for ${employee.employeeCode}: Before joining date ${joinDate.toISOString()}`);
                            continue;
                        }
                    }

                    if (employee.lastWorkingDate) {
                        const lastDate = new Date(employee.lastWorkingDate);
                        lastDate.setHours(0, 0, 0, 0);
                        if (selEventDay > lastDate) {
                            console.log(`[Biometric] Skipping event for ${employee.employeeCode}: After last working date ${lastDate.toISOString()}`);
                            continue;
                        }
                    }

                    // Strict block for specific statuses if the event is TODAY or LATER than status change
                    if (['resigned', 'terminated', 'deceased', 'inactive'].includes(employee.status)) {
                        const effectiveDate = employee.lastWorkingDate || employee.statusChangeDate || employee.updatedAt;
                        const effDate = new Date(effectiveDate);
                        effDate.setHours(0, 0, 0, 0);
                        if (selEventDay > effDate) {
                            console.log(`[Biometric] Skipping event for ${employee.employeeCode}: Status is ${employee.status}`);
                            continue;
                        }
                    }

                    // --- OVERNIGHT / REPAIR LOGIC (Enhanced) ---
                    const eventHour = attTime.getHours();
                    let targetDate = attDate;

                    if (eventHour < 5) {
                        const prevDay = new Date(attDate);
                        prevDay.setDate(prevDay.getDate() - 1);
                        const existingPrevDay = await (prisma as any).staffAttendance.findUnique({
                            where: { employeeId_date: { employeeId: (employee as any).id, date: prevDay } }
                        });
                        // If they worked yesterday, this early punch belongs to that shift
                        if (existingPrevDay) {
                            targetDate = prevDay;
                        }
                    }

                    // Global Check: Is this event already recorded anywhere?
                    const existingEvent = await (prisma as any).attendanceEvent.findFirst({
                        where: {
                            attendance: { employeeId: employee.id },
                            eventTime: {
                                gte: new Date(attTime.getTime() - 2000),
                                lte: new Date(attTime.getTime() + 2000)
                            }
                        },
                        include: { attendance: true }
                    });

                    if (existingEvent) {
                        // REPAIR: If it's in the wrong day, move it!
                        const actualDateStr = new Date(existingEvent.attendance.date).toISOString().split('T')[0];
                        const targetDateStr = targetDate.toISOString().split('T')[0];

                        if (actualDateStr !== targetDateStr) {
                            console.log(`[Biometric] REPAIR: Moving event for ${empNo} from ${actualDateStr} to ${targetDateStr}`);
                            let correctAtt = await (prisma as any).staffAttendance.findUnique({
                                where: { employeeId_date: { employeeId: employee.id, date: targetDate } }
                            });
                            if (!correctAtt) {
                                correctAtt = await (prisma as any).staffAttendance.create({
                                    data: { employeeId: employee.id, date: targetDate, status: 'present' }
                                });
                            }
                            await (prisma as any).attendanceEvent.update({
                                where: { id: existingEvent.id },
                                data: { attendanceId: correctAtt.id }
                            });
                            touchedAttendanceIds.add(existingEvent.attendanceId);
                            touchedAttendanceIds.add(correctAtt.id);
                        }
                        continue;
                    }

                    // Find or create the CORRECT record
                    let attendance = await (prisma as any).staffAttendance.findFirst({
                        where: { employeeId: (employee as any).id, date: targetDate },
                        include: { events: true }
                    });

                    if (!attendance) {
                        attendance = await (prisma as any).staffAttendance.create({
                            data: { employeeId: (employee as any).id, date: targetDate, status: 'present' },
                            include: { events: true }
                        });
                    }

                    await (prisma as any).attendanceEvent.create({
                        data: {
                            attendanceId: (attendance as any).id,
                            eventType: event.attendanceStatus || (event.minor === 1 ? 'checkIn' : event.minor === 2 ? 'checkOut' : 'checkIn'),
                            eventTime: attTime,
                            method: event.minor === 75 ? 'Face' : 'Fingerprint',
                            deviceInfo: device.name
                        }
                    });

                    touchedAttendanceIds.add(attendance.id);
                    syncCount++;
                }

                // Update summaries for all attendance records touched in this page
                for (const attendanceId of touchedAttendanceIds) {
                    await this.recalculateAttendanceSummary(attendanceId);
                }

                searchPosition += events.length;
                hasMore = searchPosition < totalMatches;
            }

            await (prisma as any).biometricDevice.update({
                where: { id: deviceId },
                data: { lastSync: new Date() }
            });

            return { success: true, message: `تمت المعالجة: ${totalProcessed} بصمة. المزامنة الجديدة: ${syncCount}`, synced: syncCount };
        } catch (error: any) {
            console.error('Sync Attendance Error:', error);
            throw new Error(`فشلت المزامنة: ${error.message}`);
        }
    }

    /**
     * Discover Devices (UDP)
     */
    async discoverDevices() {
        return new Promise((resolve) => {
            const dgram = require('dgram');
            const server = dgram.createSocket('udp4');
            const results: any[] = [];

            server.on('message', (msg: any) => {
                const str = msg.toString();
                if (str.includes('<ProbeMatch>')) {
                    const ip = /<IPv4Address>(.*?)<\/IPv4Address>/.exec(str)?.[1];
                    const model = /<Model>(.*?)<\/Model>/.exec(str)?.[1];
                    if (ip) results.push({ ipAddress: ip, model, name: model, port: 80, protocol: 'http' });
                }
            });

            const probe = `<?xml version="1.0" encoding="utf-8"?><Probe><Uuid>${crypto.randomUUID()}</Uuid></Probe>`;
            server.send(probe, 0, probe.length, 37020, '239.255.255.250');

            setTimeout(() => {
                server.close();
                resolve(results);
            }, 5000);
        });
    }

    /**
     * Recalculate summary for a specific attendance record
     */
    async recalculateAttendanceSummary(attendanceId: string) {
        const allDayEvents = await (prisma as any).attendanceEvent.findMany({
            where: { attendanceId },
            orderBy: { eventTime: 'asc' }
        });

        if (allDayEvents.length === 0) {
            await (prisma as any).staffAttendance.delete({ where: { id: attendanceId } });
            return;
        }

        // --- Fetch Shift & Settings ---
        const attendanceRecord = await (prisma as any).staffAttendance.findUnique({
            where: { id: attendanceId },
            include: { employee: { include: { shift: true } } }
        });

        const settings = await prisma.settings.findFirst({ where: { id: 'singleton' } });
        const employeeShift = attendanceRecord?.employee?.shift;
        const gracePeriod = settings?.hrLateGracePeriod || 15;
        const absenceThreshold = settings?.hrAbsenceThreshold || 60;

        // Helper: Parse string time HH:mm into Date on same day as attendance
        const getShiftDate = (timeStr: string, baseDate: Date) => {
            const [h, m] = timeStr.split(':').map(Number);
            const d = new Date(baseDate);
            d.setHours(h, m, 0, 0);
            return d;
        };

        const baseDate = attendanceRecord?.date || allDayEvents[0].eventTime;
        const s1Start = getShiftDate(employeeShift?.startTime || settings?.hrWorkStartTime || '09:00', baseDate);
        const s1End = getShiftDate(employeeShift?.endTime || settings?.hrWorkEndTime || '17:00', baseDate);

        // Handle midnight crossover if endTime < startTime
        if (s1End < s1Start) s1End.setDate(s1End.getDate() + 1);

        let s2Start = null;
        let s2End = null;
        if (employeeShift?.isSplit && employeeShift.startTime2 && employeeShift.endTime2) {
            s2Start = getShiftDate(employeeShift.startTime2, baseDate);
            s2End = getShiftDate(employeeShift.endTime2, baseDate);
            if (s2End < s2Start) s2End.setDate(s2End.getDate() + 1);
        }

        // --- Deduplicate & Clean Events ---
        // 1. Sort events by time
        const sortedEvents = [...allDayEvents].sort((a, b) => new Date(a.eventTime).getTime() - new Date(b.eventTime).getTime());

        // 2. Filter machine noise (Any punch within 30 seconds of the last one)
        const deduplicatedEvents: any[] = [];
        sortedEvents.forEach(e => {
            if (deduplicatedEvents.length === 0) {
                deduplicatedEvents.push(e);
            } else {
                const last = deduplicatedEvents[deduplicatedEvents.length - 1];
                const diff = (new Date(e.eventTime).getTime() - new Date(last.eventTime).getTime()) / 60000;
                if (diff < 0.5) { // 30 seconds
                    return;
                }
                deduplicatedEvents.push(e);
            }
        });

        // --- Calculate Work Intervals (Presense Blocks) ---
        const presenceBlocks: { start: number, end: number }[] = [];
        let currentIn: number | null = null;

        const isCheckIn = (type: string) => ['checkIn', 'check_in', 'CheckIn', '1', 'breakIn', 'break_in', 'BreakIn', '3'].includes(type);
        const isCheckOut = (type: string) => ['checkOut', 'check_out', 'CheckOut', '2', 'breakOut', 'break_out', 'BreakOut', '4'].includes(type);

        deduplicatedEvents.forEach((e: any) => {
            const time = new Date(e.eventTime).getTime();
            if (isCheckIn(e.eventType)) {
                if (currentIn === null) currentIn = time;
            } else if (isCheckOut(e.eventType)) {
                if (currentIn !== null) {
                    presenceBlocks.push({ start: currentIn, end: time });
                    currentIn = null;
                }
            }
        });

        // Close last block if still in
        if (currentIn !== null) {
            presenceBlocks.push({ start: currentIn, end: Math.min(Date.now(), (s2End || s1End).getTime()) });
        }

        // --- Intersect Presence with Shift Windows ---
        let totalWorkMins = 0;
        const intersect = (pStart: number, pEnd: number, wStart: number, wEnd: number) => {
            const start = Math.max(pStart, wStart);
            const end = Math.min(pEnd, wEnd);
            return Math.max(0, (end - start) / 60000);
        };

        presenceBlocks.forEach(p => {
            totalWorkMins += intersect(p.start, p.end, s1Start.getTime(), s1End.getTime());
            if (s2Start && s2End) {
                totalWorkMins += intersect(p.start, p.end, s2Start.getTime(), s2End.getTime());
            }
        });

        // Deduct Break
        const allowedBreakMins = employeeShift?.breakDuration || 0;

        // Calculate Actual Break Time (Gaps INSIDE session windows, excluding lateness)
        let actualBreakMins = 0;

        const calcSessionBreak = (windowStart: number, windowEnd: number) => {
            // Find presence blocks that overlap with this window
            const sessionBlocks = presenceBlocks.filter(p => intersect(p.start, p.end, windowStart, windowEnd) > 0);
            if (sessionBlocks.length < 2) return 0;

            // Sort to be sure
            sessionBlocks.sort((a, b) => a.start - b.start);

            let sessionBreak = 0;
            // Break is only gaps BETWEEN the person's blocks WITHIN this session
            for (let i = 0; i < sessionBlocks.length - 1; i++) {
                const gapStart = sessionBlocks[i].end;
                const gapEnd = sessionBlocks[i + 1].start;
                // Only count gap if it's within the session window
                sessionBreak += intersect(gapStart, gapEnd, windowStart, windowEnd);
            }
            return sessionBreak;
        };

        actualBreakMins += calcSessionBreak(s1Start.getTime(), s1End.getTime());
        if (s2Start && s2End) {
            actualBreakMins += calcSessionBreak(s2Start.getTime(), s2End.getTime());
        }

        totalWorkMins = Math.max(0, totalWorkMins - allowedBreakMins);

        // --- Status Logic (Shift-Centric) ---
        let totalDelay = 0;
        let isAnyAbsent = false;

        const findFirstInWindow = (windowStart: Date, windowEnd: Date) => {
            return allDayEvents.find((e: any) => {
                const t = new Date(e.eventTime);
                return isCheckIn(e.eventType) && t >= new Date(windowStart.getTime() - 3600000) && t <= windowEnd;
            });
        };

        const session1In = findFirstInWindow(s1Start, s1End);
        if (session1In) {
            const t = new Date(session1In.eventTime);
            const delay = (t.getTime() - s1Start.getTime()) / 60000;
            if (delay > absenceThreshold) isAnyAbsent = true;
            else if (delay > 0) totalDelay += delay;
        }

        if (s2Start && s2End) {
            const session2In = findFirstInWindow(s2Start, s2End);
            if (session2In) {
                const t = new Date(session2In.eventTime);
                const delay = (t.getTime() - s2Start.getTime()) / 60000;
                if (delay > absenceThreshold) isAnyAbsent = true;
                else if (delay > 0) totalDelay += delay;
            }
        }

        let finalStatus = 'present';
        if (isAnyAbsent) finalStatus = 'absent';
        else if (totalDelay > gracePeriod) finalStatus = 'late';

        // --- Summary & Cleaning ---
        const cleanedEvents: any[] = [];
        let lastTypeDir: 'in' | 'out' | null = null;
        let currentSequence: any[] = [];

        deduplicatedEvents.forEach((e: any) => {
            const dir = isCheckIn(e.eventType) ? 'in' : 'out';
            const lastE = currentSequence.length > 0 ? currentSequence[currentSequence.length - 1] : null;
            const diffFromLast = lastE ? (new Date(e.eventTime).getTime() - new Date(lastE.eventTime).getTime()) / 60000 : 0;

            if (lastTypeDir !== null && (dir !== lastTypeDir || diffFromLast > 60)) {
                const manual = currentSequence.find((x: any) => x.method === 'Manual Override');
                if (lastTypeDir === 'in') {
                    cleanedEvents.push(manual || currentSequence[0]);
                } else {
                    cleanedEvents.push(manual || currentSequence[currentSequence.length - 1]);
                }
                currentSequence = [];
            }
            currentSequence.push(e);
            lastTypeDir = dir;
        });

        if (currentSequence.length > 0) {
            const manual = currentSequence.find((x: any) => x.method === 'Manual Override');
            if (lastTypeDir === 'in') {
                cleanedEvents.push(manual || currentSequence[0]);
            } else {
                cleanedEvents.push(manual || currentSequence[currentSequence.length - 1]);
            }
        }

        const finalCleaned = cleanedEvents.filter((e) => {
            const d = new Date(e.eventTime);
            const t = d.getHours() * 60 + d.getMinutes();
            const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            if (timeStr === '12:00 AM') {
                const s1StartTimeMins = s1Start.getHours() * 60 + s1Start.getMinutes();
                if (Math.abs(t - s1StartTimeMins) > 120) return false;
            }
            return true;
        });

        const first = finalCleaned.length > 0 ? new Date(finalCleaned[0].eventTime) : null;
        const last = finalCleaned.length > 0 ? new Date(finalCleaned[finalCleaned.length - 1].eventTime) : null;
        const lastIsOut = finalCleaned.length > 0 && isCheckOut(finalCleaned[finalCleaned.length - 1].eventType);
        const shiftEnded = Date.now() > (s2End || s1End).getTime() + 1800000;
        const isFinalExit = lastIsOut || shiftEnded;

        const usedLabels = new Set<string>();
        const notesList = finalCleaned.map((e: any) => {
            const d = new Date(e.eventTime);
            const t = d.getTime();
            const timeStr = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            let label = isCheckIn(e.eventType) ? 'دخول' : 'خروج';

            if (employeeShift?.isSplit) {
                const distS1Start = Math.abs(t - s1Start.getTime());
                const distS1End = Math.abs(t - s1End.getTime());
                const distS2Start = s2Start ? Math.abs(t - s2Start.getTime()) : Infinity;
                const distS2End = s2End ? Math.abs(t - s2End.getTime()) : Infinity;

                if (isCheckIn(e.eventType)) {
                    if (distS1Start < 7200000 && !usedLabels.has('دخول 1')) { label = 'دخول 1'; usedLabels.add('دخول 1'); }
                    else if (distS2Start < 7200000 && !usedLabels.has('دخول 2')) { label = 'دخول 2'; usedLabels.add('دخول 2'); }
                    else label = 'عودة';
                } else {
                    if (distS2End < 7200000 && !usedLabels.has('خروج نهائي')) { label = 'خروج نهائي'; usedLabels.add('خروج نهائي'); }
                    else if (distS1End < 7200000 && !usedLabels.has('انصراف 1')) { label = 'انصراف 1'; usedLabels.add('انصراف 1'); }
                    else label = 'استراحة';
                }
            } else {
                if (isCheckIn(e.eventType)) {
                    label = (e === finalCleaned[0]) ? 'دخول' : 'عودة';
                } else {
                    label = (e === finalCleaned[finalCleaned.length - 1]) ? 'خروج' : 'استراحة';
                }
            }
            return `${label} (${timeStr})`;
        });

        if (actualBreakMins > allowedBreakMins + 5) {
            notesList.unshift(`[تنبيه: تجاوز الاستراحة بـ ${Math.floor(actualBreakMins - allowedBreakMins)} دقيقة]`);
        }

        const notes = notesList.join(' | ');

        await (prisma as any).staffAttendance.update({
            where: { id: attendanceId },
            data: {
                checkIn: first,
                checkOut: isFinalExit ? last : null,
                firstCheckIn: first,
                lastCheckOut: isFinalExit ? last : null,
                totalWorkMinutes: Math.floor(totalWorkMins),
                totalBreakMinutes: Math.floor(actualBreakMins),
                targetWorkHours: employeeShift?.totalHours || 0,
                targetBreakMinutes: employeeShift?.breakDuration || 0,
                lateMinutes: isAnyAbsent ? 0 : Math.floor(totalDelay),
                status: finalStatus,
                notes: notes
            }
        });
    }

    /**
     * Test Connection
     */
    async testConnection(deviceId: string) {
        const device = await (prisma as any).biometricDevice.findUnique({ where: { id: deviceId } });
        if (!device) throw new Error('Device not found');
        const url = `http://${device.ipAddress}:${device.port}/ISAPI/System/deviceInfo`;
        const result = await this.requestWithDigest(url, 'GET', { username: device.username, password: device.password });
        if (!result.success) throw new Error(result.error);
        return result;
    }

    /**
     * Sync data from ALL active devices
     */
    async syncAllDevices() {
        const devices = await (prisma as any).biometricDevice.findMany({
            where: { isActive: true }
        });

        let totalSynced = 0;
        const results = [];

        for (const device of devices) {
            try {
                const res = await this.syncAttendance(device.id);
                totalSynced += (res.synced || 0);
                results.push({ name: device.name, success: true, count: res.synced });
            } catch (error: any) {
                results.push({ name: device.name, success: false, error: error.message });
            }
        }

        // --- NEW: Force recalculate ALL of today's records ---
        try {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            const records = await (prisma as any).staffAttendance.findMany({
                where: {
                    date: {
                        gte: new Date(todayStr + 'T00:00:00Z'),
                        lte: new Date(todayStr + 'T23:59:59Z')
                    }
                }
            });
            for (const record of records) {
                await this.recalculateAttendanceSummary(record.id);
            }
        } catch (recalcError) {
            console.error('Recalculation error:', recalcError);
        }

        return {
            success: true,
            message: `تم سحب السجلات من ${devices.length} أجهزة. إجمالي السجلات الجديدة: ${totalSynced}`,
            totalSynced,
            results
        };
    }
}

export default new BiometricService();
