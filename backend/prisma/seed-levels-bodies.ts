import prisma from '../src/common/db/prisma';

async function main() {
    console.log('🌱 Seeding program levels and awarding bodies...');

    // 1. Program Levels
    const levels = [
        { nameAr: 'دبلوم وطني عالي (HND)', nameEn: 'Higher National Diploma (HND)', order: 1 },
        { nameAr: 'شهادة وطنية (NC)', nameEn: 'National Certificate (NC)', order: 2 },
        { nameAr: 'دبلوم احترافي', nameEn: 'Professional Diploma', order: 3 },
    ];

    for (const level of levels) {
        const existing = await prisma.programLevel.findFirst({
            where: { nameAr: level.nameAr }
        });

        if (!existing) {
            await prisma.programLevel.create({
                data: {
                    ...level,
                    isActive: true
                }
            });
            console.log(`✅ Created level: ${level.nameAr}`);
        }
    }

    // 2. Awarding Bodies
    const bodies = [
        { code: 'PEARSON', nameAr: 'بيرسون (Pearson)', nameEn: 'Pearson Education' },
        { code: 'TVTC', nameAr: 'المؤسسة العامة للتدريب التقني والمهني', nameEn: 'Technical and Vocational Training Corporation' },
        { code: 'ATHE', nameAr: 'آثي (ATHE)', nameEn: 'Awards for Training and Higher Education' },
    ];

    for (const body of bodies) {
        await prisma.awardingBody.upsert({
            where: { code: body.code },
            update: {},
            create: {
                ...body,
                isActive: true
            }
        });
        console.log(`✅ Created/Updated awarding body: ${body.code}`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
