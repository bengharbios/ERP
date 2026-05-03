
import service from './src/modules/hr/biometric.service';
import prisma from './src/common/db/prisma';

async function main() {
    console.log('--- Checking Device Connection & Users ---');
    const device = await prisma.biometricDevice.findFirst();
    if (!device) {
        console.error('No biometric device found in DB.');
        return;
    }

    console.log(`Device: ${device.name} (${device.ipAddress})`);

    try {
        const deviceUsers = await service.getUsersFromDevice(device.id);
        console.log(`Found ${deviceUsers.length} users on device.`);
        console.table(deviceUsers.map(u => ({
            ID: u.employeeNo,
            Name: u.name,
            Type: u.userType
        })));

        console.log('\n--- Checking DB Employees ---');
        const employees = await prisma.employee.findMany({
            select: {
                id: true,
                biometricId: true,
                user: { select: { firstName: true, lastName: true, username: true } }
            }
        });

        console.log(`Found ${employees.length} employees in DB.`);
        console.table(employees.map(e => ({
            BioID: e.biometricId,
            Name: `${e.user?.firstName} ${e.user?.lastName}`,
            Username: e.user?.username
        })));

        console.log('\n--- Mapping Status ---');
        const dbBioIds = new Set(employees.map(e => e.biometricId));

        const missingInDb = deviceUsers.filter(u => !dbBioIds.has(String(u.employeeNo)));
        const mapped = deviceUsers.filter(u => dbBioIds.has(String(u.employeeNo)));

        console.log(`Mapped Users: ${mapped.length}`);
        if (missingInDb.length > 0) {
            console.log(`Warning: ${missingInDb.length} users on device are NOT linked to any Employee just by ID.`);
            console.log('Missing/Unlinked Users:', missingInDb.map(u => `${u.name} (ID: ${u.employeeNo})`).join(', '));
        } else {
            console.log('All device users are linked to an Employee record.');
        }

    } catch (error) {
        console.error('Error:', error);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
