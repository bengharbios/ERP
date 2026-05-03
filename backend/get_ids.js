const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const programs = await prisma.program.findMany({
        select: { id: true, code: true }
    });
    const classes = await prisma.class.findMany({
        select: { id: true, code: true }
    });
    console.log(JSON.stringify({ programs, classes }, null, 2));
}

main()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
