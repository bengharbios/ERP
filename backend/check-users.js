const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const users = await prisma.user.findMany({
        include: {
            userRoles: {
                include: { role: true }
            }
        }
    });

    console.log(`Found ${users.length} users:`);
    users.forEach(u => {
        console.log(`- ${u.username} (${u.email}) - Active: ${u.isActive}`);
        console.log(`  Roles: ${u.userRoles.map(ur => ur.role.name).join(', ') || 'None'}`);
    });
}

check().finally(() => prisma.$disconnect());
