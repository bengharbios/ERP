import prisma from './src/common/db/prisma';

async function checkTodayAttendance() {
    const today = new Date().toLocaleDateString('en-CA');
    console.log(`Checking attendance for: ${today}`);

    const attendance = await (prisma as any).staffAttendance.findMany({
        where: {
            date: new Date(`${today}T00:00:00.000Z`)
        },
        include: {
            employee: {
                include: { user: true }
            },
            events: {
                orderBy: { eventTime: 'asc' }
            }
        }
    });

    console.log(`Found ${attendance.length} records for today.`);
    attendance.forEach(a => {
        console.log(`Emp: ${a.employee.user.firstName} | ID: ${a.employee.biometricId} | Status: ${a.status}`);
        a.events.forEach(e => {
            console.log(`  - Event: ${e.eventType} at ${new Date(e.eventTime).toLocaleTimeString()}`);
        });
    });

    if (attendance.length === 0) {
        console.log('--- Looking for ANY recent records (last 10) ---');
        const recent = await (prisma as any).staffAttendance.findMany({
            orderBy: { date: 'desc' },
            take: 10,
            include: {
                employee: { include: { user: true } },
                events: true
            }
        });
        recent.forEach(a => {
            console.log(`Date: ${a.date.toISOString().split('T')[0]} | Emp: ${a.employee.user.firstName} | Events: ${a.events.length}`);
        });
    }
}

checkTodayAttendance().catch(console.error).finally(() => process.exit());
