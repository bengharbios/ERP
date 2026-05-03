const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding system settings...');

    const settings = await prisma.settings.upsert({
        where: { id: 'singleton' },
        update: {},
        create: {
            id: 'singleton',
            instituteName: 'The Institution',
            instituteNameAr: 'المؤسسة التعليمية',
            instituteNameEn: 'Educational Institution',
            instituteEmail: 'info@institution.edu',
            institutePhone: '0500000000',
            instituteAddress: 'الرياض، المملكة العربية السعودية',
            instituteWebsite: 'https://alsalam.edu.sa',

            awardingBodies: [
                {
                    id: 'pearson',
                    name: 'بيرسون',
                    nameAr: 'بيرسون',
                    nameEn: 'Pearson',
                    code: 'PEARSON',
                    isActive: true,
                    registrationPrefix: 'P'
                },
                {
                    id: 'tvtc',
                    name: 'المؤسسة العامة للتدريب التقني والمهني',
                    nameAr: 'المؤسسة العامة للتدريب التقني والمهني',
                    nameEn: 'TVTC',
                    code: 'TVTC',
                    isActive: true,
                    registrationPrefix: 'T'
                }
            ],

            gradePassingPercentage: 50,
            attendanceThreshold: 75,
            defaultLanguage: 'ar',
            timezone: 'Asia/Riyadh',
            dateFormat: 'DD/MM/YYYY',
            currency: 'SAR',
            studentNumberPrefix: 'STU-',
            autoGenerateStudentNumber: true,
            emailEnabled: false,
            smsEnabled: false
        }
    });

    console.log('✅ Settings initialized:', settings.instituteNameAr);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
