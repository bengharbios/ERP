
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const classes = await prisma.class.findMany({
        select: {
            id: true,
            code: true,
            lectureStartTime: true,
            lectureEndTime: true
        }
    });

    console.log('Classes:', JSON.stringify(classes, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
