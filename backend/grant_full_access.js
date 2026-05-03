const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function grantAllPermissions() {
    console.log('🔓 Granting All Permissions to Admin...');
    try {
        const adminEmail = 'admin@institute.com';
        const user = await prisma.user.findUnique({ where: { email: adminEmail } });

        if (!user) {
            console.log('❌ Admin user not found.');
            return;
        }

        // 1. Ensure ADMIN role exists
        const adminRole = await prisma.role.upsert({
            where: { name: 'ADMIN' },
            update: {},
            create: { name: 'ADMIN', description: 'Super Admin' }
        });

        // 2. Assign Role to User
        await prisma.userRole.upsert({
            where: { userId_roleId: { userId: user.id, roleId: adminRole.id } },
            update: {},
            create: { userId: user.id, roleId: adminRole.id }
        });

        // 3. Define all core permissions
        const permissionNames = [
            'hr.view', 'hr.manage',
            'biometric.view', 'biometric.manage',
            'attendance.view', 'attendance.manage',
            'users.view', 'users.manage'
        ];

        for (const pName of permissionNames) {
            const permission = await prisma.permission.upsert({
                where: { name: pName },
                update: {},
                create: { name: pName, description: `Permission for ${pName}` }
            });

            // Link permission to role
            await prisma.rolePermission.upsert({
                where: { roleId_permissionId: { roleId: adminRole.id, permissionId: permission.id } },
                update: {},
                create: { roleId: adminRole.id, permissionId: permission.id }
            });
        }

        console.log('✅ All permissions granted! Please Logout and Login again.');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

grantAllPermissions();
