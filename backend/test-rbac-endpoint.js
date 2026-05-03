const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testEndpoint() {
    console.log('🔍 Testing RBAC Endpoint Access...\n');

    // 1. Check database state
    const rolesCount = await prisma.role.count();
    const permsCount = await prisma.permission.count();
    const adminUser = await prisma.user.findFirst({
        where: { username: 'admin' },
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

    console.log('📊 Database Status:');
    console.log(`   Roles: ${rolesCount}`);
    console.log(`   Permissions: ${permsCount}`);

    if (adminUser) {
        console.log(`\n👤 Admin User (${adminUser.username}):`);
        console.log(`   ID: ${adminUser.id}`);
        console.log(`   Roles: ${adminUser.userRoles.length}`);

        adminUser.userRoles.forEach(ur => {
            console.log(`\n   📌 Role: ${ur.role.name}`);
            console.log(`      Scope: ${ur.scopeType || 'global'}`);
            console.log(`      Permissions: ${ur.role.rolePermissions.length}`);

            // Check for specific 'roles' permissions
            const rolesPerms = ur.role.rolePermissions.filter(rp => rp.permission.resource === 'roles');
            if (rolesPerms.length > 0) {
                console.log(`      ✅ Has 'roles' permissions: ${rolesPerms.map(rp => rp.permission.action).join(', ')}`);
            } else {
                console.log(`      ❌ NO 'roles' permissions found!`);
            }
        });
    } else {
        console.log('\n❌ Admin user NOT found!');
    }

    // 2. Check if there are any roles without permissions
    const emptyRoles = await prisma.role.findMany({
        where: {
            rolePermissions: { none: {} }
        }
    });

    if (emptyRoles.length > 0) {
        console.log(`\n⚠️  Roles with NO permissions: ${emptyRoles.map(r => r.name).join(', ')}`);
    }

    console.log('\n✅ Diagnostic complete!');
}

testEndpoint()
    .catch(e => console.error('Error:', e))
    .finally(() => prisma.$disconnect());
