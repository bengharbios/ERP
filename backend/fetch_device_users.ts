
import biometricService from './src/modules/hr/biometric.service';
import prisma from './src/common/db/prisma';

async function main() {
    try {
        const device = await prisma.biometricDevice.findFirst();
        if (!device) {
            console.log('No devices found in DB.');
            return;
        }

        console.log(`Fetching users from device: ${device.name} (${device.ipAddress})...`);
        const users = await biometricService.getUsersFromDevice(device.id);

        const fs = require('fs');
        const output = users.map((u: any) => `ID: ${u.employeeNo}, Name: ${u.name}, Type: ${u.userType}`).join('\n');
        fs.writeFileSync('users_list.txt', output);
        console.log('Users written to users_list.txt');

    } catch (e) {
        console.error('Error fetching users:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
