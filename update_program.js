const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function updateExistingProgram() {
    try {
        console.log('🔄 Updating existing program with new fields...\n');

        // Get the first program
        const program = await prisma.program.findFirst();

        if (!program) {
            console.log('❌ No program found');
            return;
        }

        console.log(`Found program: ${program.nameAr}\n`);

        // Get first level (diploma)
        const level = await prisma.programLevel.findFirst({
            where: { nameEn: 'Diploma' }
        });

        // Get first awarding body (Pearson)
        const body = await prisma.awardingBody.findFirst({
            where: { code: 'PEARSON' }
        });

        if (!level || !body) {
            console.log('❌ Level or Body not found');
            return;
        }

        // Update program
        const updated = await prisma.program.update({
            where: { id: program.id },
            data: {
                levelId: level.id,
                awardingBodyId: body.id
            },
            include: {
                programLevel: true,
                awardingBody: true
            }
        });

        console.log('✅ Program updated successfully!');
        console.log(`   Level: ${updated.programLevel?.nameAr}`);
        console.log(`   Body: ${updated.awardingBody?.nameAr}\n`);

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

updateExistingProgram()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
