const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const admin = await prisma.user.findFirst({
            where: { username: 'admin' },
            include: { userRoles: { include: { role: true } } }
        });

        if (!admin) {
            console.log('❌ Admin user NOT found');
            return;
        }

        console.log('--- User Info ---');
        console.log('Username:', admin.username);
        console.log('ID:', admin.id);
        console.log('Roles Assigned:', admin.userRoles.map(ur => ur.role.name).join(', '));

        const roleIds = admin.userRoles.map(ur => ur.roleId);
        const fullRoles = await prisma.role.findMany({
            where: { id: { in: roleIds } },
            include: {
                rolePermissions: {
                    include: { permission: true }
                }
            }
        });

        console.log('\n--- Role Analysis ---');
        fullRoles.forEach(fr => {
            console.log(`- Role [${fr.name}] (isSystem: ${fr.isSystemRole})`);
            console.log(`  Permissions Count: ${fr.rolePermissions.length}`);
            if (fr.rolePermissions.length > 0) {
                console.log(`  Sample Perms: ${fr.rolePermissions.slice(0, 3).map(rp => `${rp.permission.resource}:${rp.permission.action}`).join(', ')}...`);
            }
        });

        const rolesWithoutPermissions = await prisma.role.findMany({
            where: { rolePermissions: { none: {} } }
        });
        if (rolesWithoutPermissions.length > 0) {
            console.log('\n⚠️ Roles with NO permissions:', rolesWithoutPermissions.map(r => r.name).join(', '));
        }

        const permsCount = await prisma.permission.count();
        console.log('\n--- General Status ---');
        console.log('Total Permissions in DB:', permsCount);

    } catch (error) {
        console.error('Diagnostic error:', error);
    }
}

check().finally(() => prisma.$disconnect());
