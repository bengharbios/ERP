const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function addFeePermissions() {
    console.log('🔧 Adding Fee Management Permissions...\n');

    try {
        // Define fee permissions
        const feePermissions = [
            {
                resource: 'fees',
                action: 'create',
                description: 'Create fee templates and calculations',
                descriptionAr: 'إنشاء قوالب الرسوم والحسابات',
            },
            {
                resource: 'fees',
                action: 'read',
                description: 'View fee templates and calculations',
                descriptionAr: 'عرض قوالب الرسوم والحسابات',
            },
            {
                resource: 'fees',
                action: 'update',
                description: 'Update fee templates and calculations',
                descriptionAr: 'تحديث قوالب الرسوم والحسابات',
            },
            {
                resource: 'fees',
                action: 'delete',
                description: 'Delete fee templates and calculations',
                descriptionAr: 'حذف قوالب الرسوم والحسابات',
            },
        ];

        // Add permissions
        for (const perm of feePermissions) {
            const existing = await prisma.permission.findFirst({
                where: {
                    resource: perm.resource,
                    action: perm.action,
                },
            });

            if (existing) {
                console.log(`✓ Permission already exists: ${perm.resource}:${perm.action}`);
            } else {
                await prisma.permission.create({
                    data: perm,
                });
                console.log(`✓ Created permission: ${perm.resource}:${perm.action}`);
            }
        }

        console.log('\n✅ Fee permissions setup complete!\n');

        // Get Admin role
        const adminRole = await prisma.role.findFirst({
            where: { name: 'Admin' },
        });

        if (adminRole) {
            console.log('🔑 Assigning fee permissions to Admin role...\n');

            const feePerms = await prisma.permission.findMany({
                where: { resource: 'fees' },
            });

            for (const perm of feePerms) {
                const existing = await prisma.rolePermission.findFirst({
                    where: {
                        roleId: adminRole.id,
                        permissionId: perm.id,
                    },
                });

                if (!existing) {
                    await prisma.rolePermission.create({
                        data: {
                            roleId: adminRole.id,
                            permissionId: perm.id,
                        },
                    });
                    console.log(`✓ Assigned ${perm.resource}:${perm.action} to Admin`);
                } else {
                    console.log(`✓ Admin already has ${perm.resource}:${perm.action}`);
                }
            }

            console.log('\n✅ Admin role updated successfully!\n');
        } else {
            console.log('⚠️  Admin role not found. Please assign permissions manually.\n');
        }

        // Summary
        console.log('📊 Summary:');
        console.log('─────────────────────────────────────');
        const totalFeePerms = await prisma.permission.count({
            where: { resource: 'fees' },
        });
        console.log(`Total fee permissions: ${totalFeePerms}`);
        console.log('─────────────────────────────────────\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

addFeePermissions()
    .then(() => {
        console.log('✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed:', error);
        process.exit(1);
    });
