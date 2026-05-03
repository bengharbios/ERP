const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function testAPIs() {
    try {
        console.log('🧪 Testing APIs...\n');

        // 1. Get Levels
        console.log('1. Testing Program Levels:');
        const levels = await prisma.programLevel.findMany();
        console.log(`   Found ${levels.length} levels`);
        levels.forEach(l => console.log(`   - ${l.nameAr} (${l.nameEn})`));

        // 2. Get Awarding Bodies
        console.log('\n2. Testing Awarding Bodies:');
        const bodies = await prisma.awardingBody.findMany();
        console.log(`   Found ${bodies.length} awarding bodies`);
        bodies.forEach(b => console.log(`   - ${b.nameAr} (${b.nameEn})`));

        // 3. Get Programs with new relations
        console.log('\n3. Testing Programs with relations:');
        const programs = await prisma.program.findMany({
            include: {
                programLevel: true,
                awardingBody: true,
                _count: {
                    select: { classes: true }
                }
            }
        });
        console.log(`   Found ${programs.length} programs`);
        programs.forEach(p => {
            console.log(`   - ${p.nameAr}`);
            console.log(`     Level: ${p.programLevel?.nameAr || p.level || 'N/A'}`);
            console.log(`     Body: ${p.awardingBody?.nameAr || 'N/A'}`);
        });

        console.log('\n✅ All tests passed!\n');

    } catch (error) {
        console.error('\n❌ Error:', error);
    }
}

testAPIs()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
