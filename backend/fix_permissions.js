const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fixAdminPermissions() {
    console.log('🔐 Fixing Admin Permissions...');
    try {
        const adminEmail = 'admin@institute.com';
        const user = await prisma.user.findUnique({ where: { email: adminEmail } });

        if (!user) {
            console.log('❌ Admin user not found. Please run the create admin script first.');
            return;
        }

        // 1. Create ADMIN role if not exists
        const adminRole = await prisma.role.upsert({
            where: { name: 'ADMIN' },
            update: {},
            create: {
                name: 'ADMIN',
                description: 'Super Administrator'
            }
        });

        // 2. Assign role to user
        await prisma.userRole.upsert({
            where: {
                userId_roleId: {
                    userId: user.id,
                    roleId: adminRole.id
                }
            },
            update: {},
            create: {
                userId: user.id,
                roleId: adminRole.id
            }
        });

        console.log('✅ Admin role assigned successfully!');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixAdminPermissions();
