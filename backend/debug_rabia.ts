import prisma from './src/common/db/prisma';

async function debugRabia() {
    console.log('--- Debugging Attendance for Rabia ---');

    const rabia = await prisma.employee.findFirst({
        where: {
            user: {
                firstName: { contains: 'Rabia', mode: 'insensitive' }
            }
        },
        include: {
            user: true
        }
    });

    if (!rabia) {
        console.log('Employee Rabia not found');
        return;
    }

    console.log(`Found Employee: ${rabia.user.firstName} (ID: ${rabia.id})`);

    const attendance = await prisma.staffAttendance.findMany({
        where: { employeeId: rabia.id },
        include: {
            events: {
                orderBy: { eventTime: 'desc' }
            }
        },
        orderBy: { date: 'desc' },
        take: 5
    });

    console.log('--- Recent Attendance Records ---');
    attendance.forEach(a => {
        console.log(`Date: ${a.date.toISOString()} | Status: ${a.status}`);
        a.events.forEach(e => {
            console.log(`  - Event: ${e.eventType} | Time: ${e.eventTime.toISOString()} | Device: ${e.deviceInfo}`);
        });
    });
}

debugRabia().catch(console.error).finally(() => process.exit());
