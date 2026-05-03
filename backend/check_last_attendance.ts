import prisma from './src/common/db/prisma';

async function main() {
    const lastAttendance = await prisma.staffAttendance.findFirst({
        orderBy: { createdAt: 'desc' },
        include: { employee: { include: { user: true } } }
    });

    if (lastAttendance && lastAttendance.employee && lastAttendance.employee.user) {
        console.log('--- Last Attendance Record ---');
        console.log(`Employee: ${lastAttendance.employee.user.firstName} ${lastAttendance.employee.user.lastName || ''} (BioID: ${lastAttendance.employee.biometricId})`);
        console.log(`Time: ${lastAttendance.checkIn}`);
        console.log(`Notes: ${lastAttendance.notes}`);
        console.log('------------------------------');
    } else {
        console.log('No attendance records found or missing user data.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
