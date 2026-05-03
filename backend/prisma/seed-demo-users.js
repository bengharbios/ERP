const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Demo Users...');

    // 1. Fetch Roles
    const roles = await prisma.role.findMany();
    const adminRole = roles.find(r => r.name === 'Admin');
    const instructorRole = roles.find(r => r.name === 'Instructor');
    const studentRole = roles.find(r => r.name === 'Student');

    if (!adminRole || !instructorRole || !studentRole) {
        console.error('❌ Roles not found! Please run seed-rbac.js first.');
        return;
    }

    const passwordHash = await bcrypt.hash('password123', 10);

    const demoUsers = [
        {
            username: 'demo_admin',
            email: 'admin@demo.com',
            firstName: 'Demo',
            lastName: 'Admin',
            roleId: adminRole.id
        },
        {
            username: 'demo_instructor',
            email: 'instructor@demo.com',
            firstName: 'Demo',
            lastName: 'Instructor',
            roleId: instructorRole.id
        },
        {
            username: 'demo_student',
            email: 'student@demo.com',
            firstName: 'Demo',
            lastName: 'Student',
            roleId: studentRole.id
        }
    ];

    for (const u of demoUsers) {
        const user = await prisma.user.upsert({
            where: { username: u.username },
            update: {},
            create: {
                username: u.username,
                email: u.email,
                passwordHash: passwordHash,
                firstName: u.firstName,
                lastName: u.lastName,
                isActive: true
            }
        });

        // Assign Role
        const existingRole = await prisma.userRole.findFirst({
            where: {
                userId: user.id,
                roleId: u.roleId
            }
        });

        if (!existingRole) {
            await prisma.userRole.create({
                data: {
                    userId: user.id,
                    roleId: u.roleId
                }
            });
            console.log(`✅ Created user: ${u.username} with role: ${u.username.split('_')[1]}`);
        } else {
            console.log(`ℹ️ User ${u.username} already exists.`);
        }
    }

    console.log('✨ Demo users seeding complete!');
    console.log('------------------------------------------------');
    console.log('🔑 Credentials for all users:');
    console.log('   Password: password123');
    console.log('------------------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
