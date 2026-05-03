
import prisma from './src/common/db/prisma';

async function main() {
    const device = await prisma.biometricDevice.findFirst();
    if (device) {
        console.log(`Device Name: ${device.name}`);
        console.log(`Last Sync: ${device.lastSync}`);
        console.log(`Current Time: ${new Date()}`);
    } else {
        console.log('No device found.');
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
