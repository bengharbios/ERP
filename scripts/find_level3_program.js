const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Searching for Level 3 Programs...');
    const programs = await prisma.program.findMany({
        where: {
            OR: [
                { nameEn: { contains: 'Level 3' } },
                { nameAr: { contains: 'المستوى الثالث' } }
            ]
        },
        include: {
            programLevel: true
        }
    });

    if (programs.length === 0) {
        console.log('❌ No programs found matching "Level 3". Listing all programs:');
        const all = await prisma.program.findMany();
        all.forEach(p => console.log(`- ${p.nameEn} (${p.id})`));
    } else {
        programs.forEach(p => {
            console.log(`✅ Found: ${p.nameEn}`);
            console.log(`   ID: ${p.id}`);
            console.log(`   Level: ${p.programLevel?.nameEn}`);
        });
    }
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
