const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    // 1. Create Role
    const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: {
            name: 'admin',
            description: 'System Administrator',
            isSystemRole: true
        }
    });

    // 2. Create User
    const adminUser = await prisma.user.upsert({
        where: { username: 'admin' },
        update: {
            passwordHash: hashedPassword,
            isActive: true
        },
        create: {
            username: 'admin',
            email: 'admin@institute.erp',
            passwordHash: hashedPassword,
            firstName: 'System',
            lastName: 'Admin',
            isActive: true
        }
    });

    // 3. Link Role
    await prisma.userRole.upsert({
        where: {
            id: 'admin-role-link' // arbitrary ID for upsert or use findFirst logic
        },
        update: {
            userId: adminUser.id,
            roleId: adminRole.id
        },
        create: {
            id: 'admin-role-link',
            userId: adminUser.id,
            roleId: adminRole.id
        }
    }).catch(async (e) => {
        // Fallback for unique constraint if ID isn't what we expect
        await prisma.userRole.create({
            data: {
                userId: adminUser.id,
                roleId: adminRole.id
            }
        }).catch(() => { });
    });

    console.log('\n✅ Admin user created/updated successfully!');
    console.log(`Username: admin`);
    console.log(`Password: ${password}`);
    console.log(`User ID: ${adminUser.id}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
