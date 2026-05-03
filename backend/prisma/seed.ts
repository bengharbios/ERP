import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting seed...');

    // Create Admin Role
    const adminRole = await prisma.role.upsert({
        where: { name: 'Admin' },
        update: {},
        create: {
            name: 'Admin',
            description: 'System Administrator',
            isSystemRole: true,
        },
    });

    console.log('✅ Admin role created');

    // Find or create Admin User (handle both email & username uniqueness)
    const hashedPassword = await bcrypt.hash('admin123', 10);

    let adminUser = await prisma.user.findFirst({
        where: {
            OR: [
                { email: 'admin@example.com' },
                { username: 'admin' }
            ]
        }
    });

    if (!adminUser) {
        adminUser = await prisma.user.create({
            data: {
                username: 'admin',
                email: 'admin@example.com',
                passwordHash: hashedPassword,
                firstName: 'Admin',
                lastName: 'User',
                isActive: true,
                emailVerified: true,
            },
        });
        console.log('✅ Admin user created');
    } else {
        console.log('ℹ️  Admin user already exists, skipping creation');
    }

    // Assign Admin Role to User
    const existingUserRole = await prisma.userRole.findFirst({
        where: {
            userId: adminUser.id,
            roleId: adminRole.id,
        },
    });

    if (!existingUserRole) {
        await prisma.userRole.create({
            data: {
                userId: adminUser.id,
                roleId: adminRole.id,
                scopeType: 'global',
            },
        });
    }

    console.log('✅ Admin role assigned to user');

    // Create Permissions for Admin
    const permissions = [
        { resource: 'students', action: 'create' },
        { resource: 'students', action: 'read' },
        { resource: 'students', action: 'update' },
        { resource: 'students', action: 'delete' },
        { resource: 'students', action: 'enroll' },
        { resource: 'programs', action: 'create' },
        { resource: 'programs', action: 'read' },
        { resource: 'programs', action: 'update' },
        { resource: 'programs', action: 'delete' },
        { resource: 'classes', action: 'create' },
        { resource: 'classes', action: 'read' },
        { resource: 'classes', action: 'update' },
        { resource: 'classes', action: 'delete' },
        { resource: 'units', action: 'create' },
        { resource: 'units', action: 'read' },
        { resource: 'units', action: 'update' },
        { resource: 'units', action: 'update' },
        { resource: 'units', action: 'delete' },
        { resource: 'database', action: 'export' },
        { resource: 'database', action: 'import' },
        { resource: 'database', action: 'seed' },
        // Assignments Permissions
        { resource: 'assignments', action: 'create' },
        { resource: 'assignments', action: 'read' },
        { resource: 'assignments', action: 'update' },
        { resource: 'assignments', action: 'delete' },
        { resource: 'assignments', action: 'submit' },
        { resource: 'assignments', action: 'grade' },
        // Accounting Permissions
        { resource: 'accounts', action: 'view' },
        { resource: 'accounts', action: 'create' },
        { resource: 'accounts', action: 'edit' },
        { resource: 'accounts', action: 'delete' },
        { resource: 'journal_entries', action: 'view' },
        { resource: 'journal_entries', action: 'create' },
        { resource: 'journal_entries', action: 'post' },
        { resource: 'journal_entries', action: 'delete' },
        { resource: 'financial_settings', action: 'view' },
        { resource: 'financial_settings', action: 'manage' },
        { resource: 'financial_receipts', action: 'view' },
        { resource: 'financial_receipts', action: 'create' },
        { resource: 'financial_receipts', action: 'edit' },
        { resource: 'financial_receipts', action: 'post' },
        { resource: 'financial_receipts', action: 'delete' },
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

        // Assign permission to Admin role
        const existingRolePermission = await prisma.rolePermission.findUnique({
            where: {
                roleId_permissionId: {
                    roleId: adminRole.id,
                    permissionId: permission.id,
                },
            },
        });

        if (!existingRolePermission) {
            await prisma.rolePermission.create({
                data: {
                    roleId: adminRole.id,
                    permissionId: permission.id,
                },
            });
        }
    }

    console.log('✅ Permissions created and assigned to Admin role');

    console.log('\n🎉 Seed completed successfully!');
    console.log('\nLogin with:');
    console.log('  Email: admin@example.com');
    console.log('  Password: admin123');
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
