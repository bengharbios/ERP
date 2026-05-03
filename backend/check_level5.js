const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Searching for "BTEC Level 5"...');

    // Find program by name
    let program = await prisma.program.findFirst({
        where: {
            OR: [
                { nameEn: { contains: 'HND' } },
                { nameEn: { contains: 'Level 5' } }
            ]
        },
        include: {
            programUnits: {
                include: {
                    unit: true
                }
            }
        }
    });

    if (!program) {
        console.error('❌ Program not found!');
        return;
    }

    console.log(`✅ Found Program: ${program.nameEn} (ID: ${program.id})`);
    console.log('📋 Existing Units:');
    program.programUnits.forEach(pu => {
        console.log(`   - [${pu.unit.code}] ${pu.unit.nameEn}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
