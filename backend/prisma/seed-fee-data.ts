import prisma from '../src/common/db/prisma';

async function main() {
    console.log('💰 Seeding Fee Data...');

    // 1. Create Fee Template for BTEC HND (Example)
    const hndTemplate = await prisma.feeTemplate.upsert({
        where: { id: 'template-btec-hnd-2026' },
        update: {},
        create: {
            id: 'template-btec-hnd-2026',
            name: 'BTEC Level 5 HND - Full Program',
            nameAr: 'دبلوم BTEC المستوى الخامس - البرنامج الكامل',
            description: 'Standard fees for the 2-year HND program',
            currency: 'SAR',
            tuitionAmount: 24000,
            totalAmount: 26500, // 24000 Tuition + 2000 Registration + 500 Certificate
            isActive: true,
            isDefault: true
        }
    });

    console.log('✅ Created Fee Template: BTEC HND');

    // 2. Create Fee Items
    const feeItems = [
        {
            name: 'Registration Fee',
            nameAr: 'رسوم التسجيل',
            type: 'REGISTRATION',
            amount: 2000,
            isIncludedInTuition: false,
            displayOrder: 1
        },
        {
            name: 'Tuition Fee (Year 1)',
            nameAr: 'الرسوم الدراسية (السنة الأولى)',
            type: 'TUITION',
            amount: 12000,
            isIncludedInTuition: true, // Part of the base tuition
            displayOrder: 2
        },
        {
            name: 'Tuition Fee (Year 2)',
            nameAr: 'الرسوم الدراسية (السنة الثانية)',
            type: 'TUITION',
            amount: 12000,
            isIncludedInTuition: true,
            displayOrder: 3
        },
        {
            name: 'Certificate Issuance',
            nameAr: 'إصدار الشهادة',
            type: 'CERTIFICATE',
            amount: 500,
            isIncludedInTuition: false,
            displayOrder: 4
        }
    ];

    for (const item of feeItems) {
        await prisma.feeItem.create({
            data: {
                templateId: hndTemplate.id,
                ...item
            }
        });
    }

    console.log('✅ Added Fee Items to Template');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
