import prisma from './src/common/db/prisma';
import * as fs from 'fs';
import * as bcrypt from 'bcryptjs';

async function importFromJson() {
    console.log('🚀 Importing Attendance from scan_result_full.json...');

    if (!fs.existsSync('scan_result_full.json')) {
        console.log('❌ File not found!');
        return;
    }

    const events = JSON.parse(fs.readFileSync('scan_result_full.json', 'utf8'));
    const device = await (prisma as any).biometricDevice.findFirst();

    let importedCount = 0;

    for (const event of events) {
        const empNo = event.employeeNoString || event.employeeNo;
        const eventTimeStr = event.time || event.eventTime || event.dateTime;

        if (!empNo || !eventTimeStr) continue;

        // Extract pure date 
        const attTime = new Date(eventTimeStr);
        const datePart = eventTimeStr.split('T')[0];
        const attDate = new Date(`${datePart}T00:00:00.000Z`);

        // Get Employee
        let employee = await (prisma as any).employee.findFirst({
            where: { biometricId: String(empNo) }
        });

        if (!employee) {
            console.log(`Creating missing employee: ${empNo}`);
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

        // Get or Create Attendance Record for that Day
        let attendance = await (prisma as any).staffAttendance.findFirst({
            where: { employeeId: employee.id, date: attDate }
        });

        if (!attendance) {
            attendance = await (prisma as any).staffAttendance.create({
                data: { employeeId: employee.id, date: attDate, status: 'present' }
            });
        }

        // Check if event already exists
        const exists = await (prisma as any).attendanceEvent.findFirst({
            where: {
                attendanceId: attendance.id,
                eventTime: {
                    gte: new Date(attTime.getTime() - 2000),
                    lte: new Date(attTime.getTime() + 2000)
                }
            }
        });

        if (!exists) {
            await (prisma as any).attendanceEvent.create({
                data: {
                    attendanceId: attendance.id,
                    eventType: event.attendanceStatus || (event.minor === 1 ? 'checkIn' : event.minor === 2 ? 'checkOut' : 'checkIn'),
                    eventTime: attTime,
                    method: event.minor === 75 ? 'Face' : 'Fingerprint',
                    deviceInfo: device?.name || 'Manual Import'
                }
            });

            // Update Attendance Summary
            const allDayEvents = await (prisma as any).attendanceEvent.findMany({
                where: { attendanceId: attendance.id },
                orderBy: { eventTime: 'asc' }
            });

            const first = allDayEvents[0].eventTime;
            const last = allDayEvents[allDayEvents.length - 1].eventTime;
            const workMins = allDayEvents.length > 1 ? Math.floor((new Date(last).getTime() - new Date(first).getTime()) / 60000) : 0;

            await (prisma as any).staffAttendance.update({
                where: { id: attendance.id },
                data: {
                    checkIn: first,
                    checkOut: allDayEvents.length > 1 ? last : null,
                    firstCheckIn: first,
                    lastCheckOut: allDayEvents.length > 1 ? last : null,
                    totalWorkMinutes: workMins,
                    notes: `${allDayEvents.length} بصمات مستوردة`
                }
            });
            importedCount++;
        }
    }

    console.log(`✨ Successfully imported ${importedCount} new events!`);
}

importFromJson().catch(console.error).finally(() => process.exit());
