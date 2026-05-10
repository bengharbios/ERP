const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding RBAC data...');

    // 1. Define Resources and Actions
    const resources = [
        'academic_programs', 'academic_units', 'academic_classes', 'students', 'attendance_lectures', 'assignments', 'academic_reports',
        'finance_fees', 'finance_receipts', 'finance_expenses', 'finance_invoices', 'chart_of_accounts', 'journal_entries', 'financial_settings', 'financial_reports',
        'crm_dashboard', 'crm_leads', 'crm_pipeline', 'crm_activities', 'crm_teams', 'crm_stages', 'crm_customers',
        'hr_employees', 'hr_departments', 'hr_shifts', 'hr_staff_attendance', 'hr_attendance_reports', 'hr_payroll', 'hr_leaves', 'hr_recruitment', 'hr_employee_actions', 'hr_settings', 'biometric_devices',
        'sys_users', 'sys_roles', 'sys_settings', 'sys_whatsapp', 'sys_marketing'
    ];
    const actions = ['view', 'read', 'create', 'update', 'delete', 'manage'];

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
    console.log('Upserting permissions...');
    for (const perm of permissions) {
        await prisma.permission.upsert({
            where: { resource_action: { resource: perm.resource, action: perm.action } },
            update: {},
            create: perm
        });
    }
    console.log(`✅ ${permissions.length} permissions upserted.`);

    // 3. Create Basic Roles
    const roles = [
        { name: 'Super Admin', description: 'Full access to everything', isSystemRole: true },
        { name: 'Admin', description: 'Administrative access with some restrictions', isSystemRole: true },
        { name: 'Instructor', description: 'Access to academic and student management', isSystemRole: true },
        { name: 'Student', description: 'Limited access to own data', isSystemRole: true }
    ];

    console.log('Creating/Updating roles...');
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
            console.log('✅ Super Admin permissions assigned.');
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
            console.log('✅ Admin permissions assigned.');
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
                console.log('✅ User "admin" promoted to Super Admin.');
            } else {
                console.log('ℹ️ User "admin" is already a Super Admin.');
            }
        }
    }

    console.log('✨ Seeding complete!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
