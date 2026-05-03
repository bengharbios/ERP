const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const admin = await prisma.user.findFirst({
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

    if (!admin) {
        console.log('❌ Admin not found');
        return;
    }

    console.log('👤 Admin User:', admin.username);
    console.log('📧 Email:', admin.email);
    console.log('\n🎭 Roles:');

    admin.userRoles.forEach(ur => {
        console.log(`\n  Role: ${ur.role.name}`);
        console.log(`  System Role: ${ur.role.isSystemRole}`);
        console.log(`  Permissions Count: ${ur.role.rolePermissions.length}`);

        const usersPerms = ur.role.rolePermissions.filter(rp => rp.permission.resource === 'users');
        console.log(`  'users' permissions: ${usersPerms.map(p => p.permission.action).join(', ') || 'NONE!'}`);

        const rolesPerms = ur.role.rolePermissions.filter(rp => rp.permission.resource === 'roles');
        console.log(`  'roles' permissions: ${rolesPerms.map(p => p.permission.action).join(', ') || 'NONE!'}`);
    });
}

check().finally(() => prisma.$disconnect());
