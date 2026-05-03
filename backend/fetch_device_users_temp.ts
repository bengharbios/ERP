
import { BiometricService } from './src/modules/hr/biometric.service';
import prisma from './src/common/db/prisma';

async function main() {
    try {
        const device = await prisma.biometricDevice.findFirst();
        if (!device) {
            console.log('No devices found in DB.');
            return;
        }

        console.log(`Fetching users from device: ${device.name} (${device.ipAddress})...`);
        const users = await BiometricService.prototype.getUsersFromDevice.call({
            requestWithDigest: (BiometricService as any).prototype.requestWithDigest,
            // Mocking or instantiating service properly might be needed if direct access is tricky
        }, device.id);

        // Actually simpler to use the exported instance
        // But the file export default new BiometricService();
        // So we should import use that.
    } catch (e) {
        console.error(e);
    }
}
// Reworking script to be simpler
