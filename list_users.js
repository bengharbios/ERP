const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: {
            id: true,
            username: true,
            email: true,
            isActive: true
        }
    });

    console.log('--- USER LIST ---');
    if (users.length === 0) {
        console.log('NO USERS FOUND IN DATABASE!');
    } else {
        users.forEach(u => {
            console.log(`ID: ${u.id} | Username: ${u.username} | Email: ${u.email} | Active: ${u.isActive}`);
        });
    }

    const auditLogsCount = await prisma.auditLog.count();
    console.log(`Total Audit Logs: ${auditLogsCount}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
