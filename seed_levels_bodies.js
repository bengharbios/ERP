const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function seedLevelsAndBodies() {
    try {
        console.log('🌱 Seeding Program Levels and Awarding Bodies...\n');

        // 1. Create Program Levels
        console.log('📊 Creating Program Levels...');
        const levels = await Promise.all([
            prisma.programLevel.upsert({
                where: { id: 'level-diploma' },
                update: {},
                create: {
                    id: 'level-diploma',
                    nameAr: 'دبلوم',
                    nameEn: 'Diploma',
                    order: 1,
                    isActive: true
                }
            }),
            prisma.programLevel.upsert({
                where: { id: 'level-bachelor' },
                update: {},
                create: {
                    id: 'level-bachelor',
                    nameAr: 'بكالوريوس',
                    nameEn: 'Bachelor',
                    order: 2,
                    isActive: true
                }
            }),
            prisma.programLevel.upsert({
                where: { id: 'level-master' },
                update: {},
                create: {
                    id: 'level-master',
                    nameAr: 'ماجستير',
                    nameEn: 'Master',
                    order: 3,
                    isActive: true
                }
            })
        ]);
        console.log(`✅ Created ${levels.length} program levels\n`);

        // 2. Create Awarding Bodies
        console.log('🏛️ Creating Awarding Bodies...');
        const bodies = await Promise.all([
            prisma.awardingBody.upsert({
                where: { code: 'PEARSON' },
                update: {},
                create: {
                    code: 'PEARSON',
                    nameAr: 'بيرسون',
                    nameEn: 'Pearson',
                    description: 'Pearson Education - BTEC & Edexcel',
                    website: 'https://www.pearson.com',
                    isActive: true
                }
            }),
            prisma.awardingBody.upsert({
                where: { code: 'MOHE-SA' },
                update: {},
                create: {
                    code: 'MOHE-SA',
                    nameAr: 'وزارة التعليم السعودية',
                    nameEn: 'Ministry of Education - Saudi Arabia',
                    description: 'Saudi Ministry of Education',
                    website: 'https://www.moe.gov.sa',
                    isActive: true
                }
            }),
            prisma.awardingBody.upsert({
                where: { code: 'TVTC' },
                update: {},
                create: {
                    code: 'TVTC',
                    nameAr: 'المؤسسة العامة للتدريب التقني والمهني',
                    nameEn: 'Technical and Vocational Training Corporation',
                    description: 'TVTC - Saudi Arabia',
                    website: 'https://www.tvtc.gov.sa',
                    isActive: true
                }
            })
        ]);
        console.log(`✅ Created ${bodies.length} awarding bodies\n`);

        console.log('🎉 Seeding completed successfully!\n');

        // List all
        const allLevels = await prisma.programLevel.findMany({ orderBy: { order: 'asc' } });
        const allBodies = await prisma.awardingBody.findMany({ orderBy: { nameEn: 'asc' } });

        console.log('📊 Program Levels:');
        allLevels.forEach(l => console.log(`   - ${l.nameAr} / ${l.nameEn}`));

        console.log('\n🏛️ Awarding Bodies:');
        allBodies.forEach(b => console.log(`   - [${b.code}] ${b.nameAr} / ${b.nameEn}`));

    } catch (error) {
        console.error('❌ Error:', error);
    }
}

seedLevelsAndBodies()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
