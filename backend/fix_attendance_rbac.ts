import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔧 Fixing Attendance Permissions for Admin Role...');

    // 1. Ensure Attendance Permissions Exist
    const resources = ['attendance', 'academic', 'students', 'assignments', 'settings'];
    const actions = ['read', 'create', 'update', 'delete', 'manage'];

    console.log('Checking permissions...');
    for (const resource of resources) {
        for (const action of actions) {
            await prisma.permission.upsert({
                where: { resource_action: { resource, action } },
                update: {},
                create: {
                    resource,
                    action,
                    description: `Can ${action} ${resource}`,
                },
            });
        }
    }
    console.log('✅ Permissions ensured.');

    // 2. Find Admin Role
    const adminRole = await prisma.role.findFirst({
        where: { name: 'Admin' }
    });

    if (!adminRole) {
        console.log('❌ Admin role not found!');
        return;
    }

    console.log(`✅ Found Admin role (ID: ${adminRole.id})`);

    // 3. Assign Attendance Permissions to Admin
    const attendancePerms = await prisma.permission.findMany({
        where: { resource: 'attendance' }
    });

    console.log(`Assigning ${attendancePerms.length} attendance permissions to Admin...`);

    for (const perm of attendancePerms) {
        await prisma.rolePermission.upsert({
            where: {
                roleId_permissionId: {
                    roleId: adminRole.id,
                    permissionId: perm.id
                }
            },
            update: {},
            create: {
                roleId: adminRole.id,
                permissionId: perm.id
            }
        });
    }

    // 4. Ensure Super Admin user exists for the current user if needed
    // But primarily, we just fix the Admin role which the user is already using.

    console.log('✨ RBAC Fix Complete! Please restart the backend and try again.');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
