const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function testCompleteFlow() {
    console.log('\n🧪 Testing Complete Flow...\n');

    try {
        // 1. Test get levels
        console.log('1️⃣ Testing GET levels:');
        const levels = await prisma.programLevel.findMany({
            where: { isActive: true },
            orderBy: { order: 'asc' }
        });
        console.log(`   ✅ Found ${levels.length} active levels`);
        levels.forEach(l => console.log(`      - ${l.nameAr} (${l.nameEn})`));

        // 2. Test get awarding bodies
        console.log('\n2️⃣ Testing GET awarding bodies:');
        const bodies = await prisma.awardingBody.findMany({
            where: { isActive: true }
        });
        console.log(`   ✅ Found ${bodies.length} active awarding bodies`);
        bodies.forEach(b => console.log(`      - ${b.nameAr} (${b.nameEn})`));

        // 3. Test create new level
        console.log('\n3️⃣ Testing CREATE new level:');
        const newLevel = await prisma.programLevel.create({
            data: {
                nameAr: 'دكتوراه',
                nameEn: 'PhD',
                order: 4,
                isActive: true
            }
        });
        console.log(`   ✅ Created: ${newLevel.nameAr} (${newLevel.nameEn})`);

        // 4. Test create new awarding body
        console.log('\n4️⃣ Testing CREATE new awarding body:');
        const newBody = await prisma.awardingBody.create({
            data: {
                code: 'TEST123',
                nameAr: 'جهة اختبار',
                nameEn: 'Test Body',
                description: 'This is a test',
                isActive: true
            }
        });
        console.log(`   ✅ Created: ${newBody.nameAr} (${newBody.code})`);

        // 5. Test get programs with relations
        console.log('\n5️⃣ Testing GET programs with relations:');
        const programs = await prisma.program.findMany({
            include: {
                programLevel: true,
                awardingBody: true
            }
        });
        console.log(`   ✅ Found ${programs.length} programs`);
        programs.forEach(p => {
            console.log(`      - ${p.nameAr}`);
            console.log(`        Level: ${p.programLevel ? p.programLevel.nameAr : 'N/A'}`);
            console.log(`        Body: ${p.awardingBody ? p.awardingBody.nameAr : 'N/A'}`);
        });

        // 6. Clean up test data
        console.log('\n6️⃣ Cleaning up test data:');
        await prisma.programLevel.delete({ where: { id: newLevel.id } });
        await prisma.awardingBody.delete({ where: { id: newBody.id } });
        console.log('   ✅ Test data cleaned up');

        console.log('\n✅ ALL TESTS PASSED!\n');
        console.log('📝 Summary:');
        console.log('   - Database connection: ✅');
        console.log('   - Read operations: ✅');
        console.log('   - Create operations: ✅');
        console.log('   - Delete operations: ✅');
        console.log('   - Relations working: ✅');
        console.log('\n🎯 Backend is working correctly!');
        console.log('💡 If frontend still has issues, check browser console for errors.\n');

    } catch (error) {
        console.error('\n❌ TEST FAILED!');
        console.error('Error:', error.message);
        if (error.code) console.error('Error code:', error.code);
    }
}

testCompleteFlow()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
