const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const programs = await prisma.program.findMany({
        select: {
            id: true,
            code: true,
            nameEn: true,
            nameAr: true
        }
    });

    console.log('\n📚 Available Programs:\n');
    programs.forEach((p, idx) => {
        console.log(`${idx + 1}. [${p.code}] ${p.nameAr} / ${p.nameEn}`);
        console.log(`   ID: ${p.id}\n`);
    });

    if (programs.length === 0) {
        console.log('⚠️  No programs found. Please create a program first.');
    }
}

main().finally(() => prisma.$disconnect());
