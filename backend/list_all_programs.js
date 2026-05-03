const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const programs = await prisma.program.findMany({
            select: {
                id: true,
                nameAr: true,
                nameEn: true,
                code: true
            }
        });
        console.log('--- ALL PROGRAMS ---');
        programs.forEach(p => {
            console.log(`ID: ${p.id} | Code: ${p.code} | AR: ${p.nameAr} | EN: ${p.nameEn}`);
        });
        console.log('---------------------');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
