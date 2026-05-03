const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    console.log('🔧 Fixing RBAC issue...\n');

    // 1. Check current admin user state
    const admin = await prisma.user.findFirst({
        where: { email: 'admin@example.com' },
        include: {
            userRoles: {
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: { permission: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!admin) {
        console.log('❌ Admin user not found!');
        return;
    }

    console.log(`✅ Found admin: ${admin.username} (${admin.email})`);
    console.log(`   Current roles: ${admin.userRoles.map(ur => ur.role.name).join(', ')}`);

    // 2. Find or create Super Admin role
    let superAdminRole = await prisma.role.findFirst({
        where: {
            OR: [
                { name: 'Super Admin' },
                { name: 'SuperAdmin' },
                { name: 'super admin' }
            ]
        }
    });

    if (!superAdminRole) {
        console.log('⚠️  Super Admin role not found, creating...');
        superAdminRole = await prisma.role.create({
            data: {
                name: 'Super Admin',
                description: 'Full system access',
                isSystemRole: true
            }
        });
    }

    console.log(`✅ Super Admin role: ${superAdminRole.name} (ID: ${superAdminRole.id})`);

    // 3. Assign ALL permissions to Super Admin
    const allPermissions = await prisma.permission.findMany();
    console.log(`📋 Total permissions in DB: ${allPermissions.length}`);

    // Delete existing role permissions
    await prisma.rolePermission.deleteMany({
        where: { roleId: superAdminRole.id }
    });

    // Create new ones
    await prisma.rolePermission.createMany({
        data: allPermissions.map(p => ({
            roleId: superAdminRole.id,
            permissionId: p.id
        })),
        skipDuplicates: true
    });

    console.log(`✅ Assigned ${allPermissions.length} permissions to Super Admin`);

    // 4. Assign Super Admin role to admin user
    const existingUserRole = await prisma.userRole.findFirst({
        where: {
            userId: admin.id,
            roleId: superAdminRole.id
        }
    });

    if (!existingUserRole) {
        await prisma.userRole.create({
            data: {
                userId: admin.id,
                roleId: superAdminRole.id,
                scopeType: 'global'
            }
        });
        console.log('✅ Assigned Super Admin role to admin user');
    } else {
        console.log('ℹ️  Admin already has Super Admin role');
    }

    // 5. Verify
    const updatedAdmin = await prisma.user.findUnique({
        where: { id: admin.id },
        include: {
            userRoles: {
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: { permission: true }
                            }
                        }
                    }
                }
            }
        }
    });

    console.log('\n📊 Final State:');
    updatedAdmin.userRoles.forEach(ur => {
        console.log(`   Role: ${ur.role.name}`);
        console.log(`   Permissions: ${ur.role.rolePermissions.length}`);
        const usersPerms = ur.role.rolePermissions.filter(rp => rp.permission.resource === 'users');
        console.log(`   'users' perms: ${usersPerms.map(p => p.permission.action).join(', ')}`);
    });

    console.log('\n✨ Done! Please logout and login again.');
}

fix()
    .catch(e => console.error('Error:', e))
    .finally(() => prisma.$disconnect());
