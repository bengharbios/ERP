
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Updating Admin Permissions...');

    const adminRole = await prisma.role.findFirst({ where: { name: 'Admin' } });
    if (!adminRole) {
        console.error('❌ Admin role not found');
        return;
    }

    const permissions = [
        { resource: 'database', action: 'export' },
        { resource: 'database', action: 'import' },
        { resource: 'database', action: 'seed' },
    ];

    for (const perm of permissions) {
        const permission = await prisma.permission.upsert({
            where: {
                resource_action: {
                    resource: perm.resource,
                    action: perm.action,
                },
            },
            update: {},
            create: {
                resource: perm.resource,
                action: perm.action,
                description: `${perm.action} ${perm.resource}`,
            },
        });

        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: adminRole.id,
                    permissionId: permission.id,
                },
            },
            update: {},
            create: {
                roleId: adminRole.id,
                permissionId: permission.id,
            },
        });
        console.log(`✅ Added permission: ${perm.resource}:${perm.action}`);
    }

    console.log('🎉 Permissions updated successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
