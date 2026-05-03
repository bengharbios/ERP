const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Financial Settings...');

    // Upsert default settings
    const settings = await prisma.financialSettings.upsert({
        where: { trn: '100000000000001' }, // Default TRN for first-time seed
        update: {},
        create: {
            companyNameAr: 'معهد القمة التعليمي',
            companyNameEn: 'Al Qemma Institute',
            trn: '100000000000001',
            vatRate: 5.0,
            currency: 'AED',
            bankName: 'ADIB - Abu Dhabi Islamic Bank',
            iban: 'AE000000000000000000000',
            swiftCode: 'ADIB AEAA',
            bankAddress: 'Abu Dhabi, UAE',
            // We'll link default accounts later once we have the COA IDs
        },
    });

    console.log('✅ Financial Settings seeded:', settings.companyNameEn);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
