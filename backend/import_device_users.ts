const biometricService = require('./src/modules/hr/biometric.service').default;
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('--- Starting Device User Import ---');

        // 1. Get the first device
        const device = await prisma.biometricDevice.findFirst();
        if (!device) {
            console.log('No biometric devices found in DB.');
            return;
        }

        console.log(`Fetching users from device: ${device.name} (${device.ipAddress})...`);
        const deviceUsers = await biometricService.getUsersFromDevice(device.id);
        console.log(`Found ${deviceUsers.length} users on device.`);

        if (deviceUsers.length === 0) {
            console.log('No users to import.');
            return;
        }

        // Ensure at least one department exists
        let defaultDept = await prisma.department.findFirst();
        if (!defaultDept) {
            console.log('Creating default department...');
            defaultDept = await prisma.department.create({
                data: {
                    nameAr: 'العامة',
                    nameEn: 'General',
                    description: 'Default department for imported users',
                    isActive: true
                }
            });
        }

        let createdCount = 0;
        let skippedCount = 0;

        for (const u of deviceUsers) {
            const bioId = String(u.employeeNo);

            // Check existing Employee
            const existingEmp = await prisma.employee.findUnique({
                where: { biometricId: bioId }
            });

            if (existingEmp) {
                console.log(`Skipping existing employee: ${u.name} (ID: ${bioId})`);
                skippedCount++;
                continue;
            }

            // Prepare User Data
            const email = `user${bioId}@institute.local`;
            const username = `u${bioId}`;
            const parts = u.name.trim().split(' ');
            const firstName = parts[0] || 'Unknown';
            const lastName = parts.slice(1).join(' ') || '-';
            const passwordHash = await bcrypt.hash('123456', 10);

            try {
                // Check if user exists (by email or username) to avoid unique constraint error
                let user = await prisma.user.findFirst({
                    where: {
                        OR: [
                            { email: email },
                            { username: username }
                        ]
                    }
                });

                if (!user) {
                    console.log(`Creating User account for: ${u.name}...`);
                    user = await prisma.user.create({
                        data: {
                            username: username,
                            email: email,
                            passwordHash: passwordHash,
                            firstName: firstName,
                            lastName: lastName,
                            isActive: true,
                            emailVerified: true
                        }
                    });
                } else {
                    console.log(`Linking to existing User: ${user.username}`);
                }

                // Create Employee linked to User
                console.log(`Creating Employee profile for: ${u.name}...`);
                await prisma.employee.create({
                    data: {
                        userId: user.id,
                        employeeCode: `EMP-${bioId}`,
                        biometricId: bioId,
                        departmentId: defaultDept.id,
                        jobTitleAr: 'موظف',
                        jobTitleEn: 'Employee',
                        salary: 0,
                        currency: 'SAR',
                        status: 'active',
                        joiningDate: new Date(),
                        // Required fields based on schema, mostly optional or defaults handled by DB
                    }
                });

                console.log(`SUCCESS: Created ${u.name} (Biometric ID: ${bioId})`);
                createdCount++;

            } catch (err: any) {
                console.error(`FAILED to import ${u.name}:`, err.message);
            }
        }

        console.log(`\nImport Complete.`);
        console.log(`Created: ${createdCount}`);
        console.log(`Skipped: ${skippedCount}`);

    } catch (e: any) {
        console.error('Critical Import Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
