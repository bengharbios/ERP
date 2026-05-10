import prisma from '../src/common/db/prisma';

async function main() {
    console.log('🌱 Seeding RBAC data to Turso remote database...');

    // 1. Define Resources and Actions
    const resources = ['users', 'roles', 'permissions', 'academic', 'students', 'attendance', 'assignments', 'settings', 'accounts', 'journal_entries', 'receipts', 'fees', 'crm'];
    const actions = ['read', 'create', 'update', 'delete', 'manage'];

    const permissions = [];
    for (const resource of resources) {
        for (const action of actions) {
            permissions.push({
                resource,
                action,
                description: `Can ${action} ${resource}`
            });
        }
    }

    // Add specialized actions
    permissions.push({ resource: 'users', action: 'assign_roles', description: 'Can assign roles to users' });
    permissions.push({ resource: 'roles', action: 'assign_permissions', description: 'Can assign permissions to roles' });

    // 2. Upsert Permissions
    console.log('Upserting permissions on Turso...');
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { resource_action: { resource: perm.resource, action: perm.action } },
            update: {},
            create: perm
        });
    }
    console.log(`✅ ${permissions.length} permissions upserted on Turso.`);

    // 3. Create Basic Roles
    const roles = [
        { name: 'Super Admin', description: 'Full access to everything', isSystemRole: true },
        { name: 'Admin', description: 'Administrative access with some restrictions', isSystemRole: true },
        { name: 'Instructor', description: 'Access to academic and student management', isSystemRole: true },
        { name: 'Student', description: 'Limited access to own data', isSystemRole: true }
    ];

    console.log('Creating/Updating roles on Turso...');
    for (const roleData of roles) {
        const role = await prisma.role.upsert({
            where: { name: roleData.name },
            update: { description: roleData.description, isSystemRole: roleData.isSystemRole },
            create: roleData
        });

        // 4. Assign Permissions to Roles
        if (role.name === 'Super Admin') {
            const allPerms = await prisma.permission.findMany();
            await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
            await prisma.rolePermission.createMany({
                data: allPerms.map(p => ({ roleId: role.id, permissionId: p.id }))
            });
            console.log('✅ Super Admin permissions assigned on Turso.');
        } else if (role.name === 'Admin') {
            const adminPerms = await prisma.permission.findMany({
                where: {
                    NOT: [
                        { resource: 'permissions', action: 'manage' },
                        { resource: 'roles', action: 'delete' }
                    ]
                }
            });
            await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });
            await prisma.rolePermission.createMany({
                data: adminPerms.map(p => ({ roleId: role.id, permissionId: p.id }))
            });
            console.log('✅ Admin permissions assigned on Turso.');
        }
    }

    // 5. Promote 'admin' user to Super Admin
    const adminUser = await prisma.user.findFirst({ where: { username: 'admin' } });
    if (adminUser) {
        const superAdminRole = await prisma.role.findFirst({ where: { name: 'Super Admin' } });
        if (superAdminRole) {
            // Check if already assigned
            const existing = await prisma.userRole.findFirst({
                where: { userId: adminUser.id, roleId: superAdminRole.id }
            });
            if (!existing) {
                await prisma.userRole.create({
                    data: {
                        userId: adminUser.id,
                        roleId: superAdminRole.id,
                        scopeType: 'global'
                    }
                });
                console.log('✅ User "admin" promoted to Super Admin on Turso.');
            } else {
                console.log('ℹ️ User "admin" is already a Super Admin on Turso.');
            }
        }
    }

    console.log('✨ Turso Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        // No $disconnect with custom adapter as it is handled by libsql connection pool
    });
