import prisma from './src/common/db/prisma';

async function debugSavedEvents() {
    console.log('--- Checking Last 20 Events Saved in Database ---');

    const events = await (prisma as any).attendanceEvent.findMany({
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
            attendance: {
                include: {
                    employee: { include: { user: true } }
                }
            }
        }
    });

    if (events.length === 0) {
        console.log('No events found in attendanceEvent table.');
        return;
    }

    events.forEach((e, i) => {
        console.log(`[${i + 1}] Emp: ${e.attendance.employee.user.firstName} | EventTime: ${e.eventTime.toISOString()} | SavedDate: ${e.attendance.date.toISOString().split('T')[0]} | CreatedAt: ${e.createdAt.toISOString()}`);
    });
}

debugSavedEvents().catch(console.error).finally(() => process.exit());
