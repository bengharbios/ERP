
import prisma from './src/common/db/prisma.ts';
import bcrypt from 'bcryptjs';

async function main() {
    const password = 'password123';
    const hashedPassword = await bcrypt.hash(password, 10);

    console.log("Seeding admin user to Turso...");

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
    await prisma.userRole.create({
        data: {
            userId: adminUser.id,
            roleId: adminRole.id
        }
    }).catch(() => {
        console.log("Role link already exists or error occurred.");
    });

    console.log('\n✅ Admin user seeded successfully to Turso!');
    console.log(`Username: admin`);
    console.log(`Password: ${password}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
