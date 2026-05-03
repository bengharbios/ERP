const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Running Admin Restoration Script...');
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    try {
        // 1. Create/Ensure Role exists
        const adminRole = await prisma.role.upsert({
            where: { name: 'Super Admin' },
            update: {},
            create: {
                name: 'Super Admin',
                description: 'System Administrator with full access',
                isSystemRole: true
            }
        });
        console.log(`✅ Super Admin Role ensured (ID: ${adminRole.id})`);

        // 2. Create/Ensure Admin User exists
        const adminUser = await prisma.user.upsert({
            where: { username: 'admin' },
            update: {
                passwordHash: hashedPassword,
                isActive: true
            },
            create: {
                username: 'admin',
                email: 'admin@institute.erp',
                passwordHash: hashedPassword,
                firstName: 'System',
                lastName: 'Admin',
                isActive: true
            }
        });
        console.log(`✅ Admin User ensured: ${adminUser.username} (ID: ${adminUser.id})`);

        // 3. Ensure linking
        const existingLink = await prisma.userRole.findFirst({
            where: {
                userId: adminUser.id,
                roleId: adminRole.id
            }
        });

        if (!existingLink) {
            await prisma.userRole.create({
                data: {
                    userId: adminUser.id,
                    roleId: adminRole.id
                }
            });
            console.log('✅ Admin User linked to Admin Role');
        } else {
            console.log('ℹ️ Admin User already has Admin Role');
        }

        console.log('\n🌟 RESTORATION COMPLETE');
        console.log(`Username: admin`);
        console.log(`Password: ${password}`);

    } catch (error) {
        console.error('❌ Error during restoration:', error);
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
