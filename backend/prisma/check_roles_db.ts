import prisma from 'c:/Users/ALsalam - Marketing/Desktop/Coding/erp/backend/src/common/db/prisma';

async function main() {
    console.log('Querying roles and permissions from DB...');
    const roles = await prisma.role.findMany({
        include: {
            _count: {
                select: {
                    rolePermissions: true,
                    userRoles: true
                }
            },
            rolePermissions: {
                take: 5,
                include: {
                    permission: true
                }
            }
        }
    });

    console.log('Roles found in database:');
    for (const r of roles) {
        console.log(`- Role: "${r.name}" (ID: ${r.id})`);
        console.log(`  Description: ${r.description}`);
        console.log(`  Is System Role: ${r.isSystemRole}`);
        console.log(`  Users assigned: ${r._count.userRoles}`);
        console.log(`  Total Permissions assigned: ${r._count.rolePermissions}`);
        console.log(`  First few permissions assigned:`);
        r.rolePermissions.forEach(rp => {
            console.log(`    * ${rp.permission.action}_${rp.permission.resource} (ID: ${rp.permission.id})`);
        });
        console.log('--------------------------------------------------');
    }
}

main().catch(console.error);
