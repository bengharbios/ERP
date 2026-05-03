const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const rolesCount = await prisma.role.count();
    const permsCount = await prisma.permission.count();
    const users = await prisma.user.findMany({
        include: { userRoles: { include: { role: true } } }
    });

    console.log('--- DB Diagnostic ---');
    console.log('Roles Count:', rolesCount);
    console.log('Permissions Count:', permsCount);
    console.log('Users and their roles:');
    users.forEach(u => {
        console.log(`- ${u.username} (${u.email}): ${u.userRoles.map(ur => ur.role.name).join(', ')}`);
    });
}

check().finally(() => prisma.$disconnect());
