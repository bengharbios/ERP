const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const users = await prisma.user.findMany({
            where: {
                telegramUserId: { not: null }
            },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                telegramUserId: true,
                telegramUsername: true
            }
        });
        
        console.log('--- USERS WITH LINKED TELEGRAM ---');
        console.log(JSON.stringify(users, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
