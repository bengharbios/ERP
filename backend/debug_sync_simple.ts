
import { PrismaClient } from '@prisma/client';
import service from './src/modules/hr/biometric.service';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- DB Connection Check ---');
        const device = await prisma.biometricDevice.findFirst();
        if (!device) {
            console.log('No biometric device found in DB.');
            return;
        }
        console.log(`Device: ${device.name} (${device.ipAddress})`);

        console.log('--- Fetching Users from Device ---');
        const deviceUsers = await service.getUsersFromDevice(device.id);
        console.log(`Found ${deviceUsers.length} users on device.`);
        deviceUsers.forEach(u => {
            console.log(`- ID: ${u.employeeNo} | Name: ${u.name} | Type: ${u.userType}`);
        });

        console.log('--- Fetching Employees from DB ---');
        const employees = await prisma.employee.findMany({
            include: { user: true }
        });
        console.log(`Found ${employees.length} employees in DB.`);
        employees.forEach(e => {
            console.log(`- BioID: ${e.biometricId} | Name: ${e.user?.firstName} | UserID: ${e.userId}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
