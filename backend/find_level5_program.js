const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Searching for programs related to "Level 5"...');
        const programs = await prisma.program.findMany({
            where: {
                OR: [
                    { nameEn: { contains: 'Level 5' } },
                    { nameAr: { contains: 'المستوى الخامس' } }
                ]
            }
        });

        if (programs.length === 0) {
            console.log('No programs found.');
        } else {
            console.log(`Found ${programs.length} program(s):`);
            programs.forEach(p => {
                console.log(`- ID: ${p.id}, Name: ${p.nameEn} / ${p.nameAr}`);
            });
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
