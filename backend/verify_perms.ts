
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Verifying Admin Permissions...');

    const user = await prisma.user.findUnique({
        where: { email: 'admin@example.com' },
        include: {
            userRoles: {
                include: {
                    role: {
                        include: {
                            rolePermissions: {
                                include: {
                                    permission: true
                                }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!user) {
        console.log('❌ Admin user not found!');
        return;
    }

    console.log(`👤 User: ${user.username}`);

    let hasExport = false;
    user.userRoles.forEach(ur => {
        console.log(`🏷️ Role: ${ur.role.name}`);
        ur.role.rolePermissions.forEach(rp => {
            const p = rp.permission;
            if (p.resource === 'database' && p.action === 'export') {
                hasExport = true;
                console.log(`   ✅ Has Permission: ${p.resource}:${p.action}`);
            }
        });
    });

    if (hasExport) {
        console.log('✅ Admin has export permission.');
    } else {
        console.log('❌ Admin MISSING export permission.');
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
