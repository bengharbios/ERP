const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const units = [
    { code: 'PL3-U02', nameAr: 'بحوث وتخطيط حملات التسويق', nameEn: 'Research and Planning of Marketing Campaigns (RPMC)' },
    { code: 'PL3-U03', nameAr: 'ماليات الأعمال', nameEn: 'Business Finance (BF)' },
    { code: 'PL3-U04', nameAr: 'إدارة الفعاليات', nameEn: 'Event Management (EM)' },
    { code: 'PL3-U05', nameAr: 'الأعمال الدولية', nameEn: 'International Business (IB)' },
    { code: 'PL3-U06', nameAr: 'مبادئ الإدارة', nameEn: 'Principles of Management (PM)' },
    { code: 'PL3-U07', nameAr: 'اتخاذ القرار في الأعمال', nameEn: 'Business Decision Making (BDM)' },
    { code: 'PL3-U08', nameAr: 'الموارد البشرية', nameEn: 'Human Resources (HR)' },
    { code: 'PL3-U09', nameAr: 'بناء الفرق', nameEn: 'Team Building (TB)' },
    { code: 'PL3-U20', nameAr: 'أخلاقيات الأعمال', nameEn: 'Business Ethics (BE)' },
    { code: 'PL3-U22', nameAr: 'بحوث التسويق', nameEn: 'Marketing Research (MR)' },
    { code: 'PL3-U23', nameAr: 'الخبرة في إدارة الأعمال', nameEn: 'Business Experience (BEP)' },
    { code: 'PL3-U25', nameAr: 'التسويق بالعلاقات', nameEn: 'Relationship Marketing (RM)' },
    { code: 'PL3-U26', nameAr: 'عمليات المشتريات', nameEn: 'Procurement Processes (PP)' },
    { code: 'PL3-U28', nameAr: 'أساليب وطرق البيع', nameEn: 'Methods and Techniques of Selling (MTS)' },
];

async function main() {
    console.log('🔍 Searching for "BTEC Level 3 National Extended Certificate"...');

    // Find program by name
    let program = await prisma.program.findFirst({
        where: {
            OR: [
                { nameEn: { contains: 'Extended Certificate' } },
                { nameEn: { contains: 'Level 3' } }
            ]
        }
    });

    if (!program) {
        console.error('❌ Program not found!');
        const all = await prisma.program.findMany();
        console.log('Available Programs:');
        all.forEach(p => console.log(`- ${p.nameEn}`));
        return;
    }

    console.log(`✅ Found Program: ${program.nameEn} (ID: ${program.id})`);

    console.log('🚀 Adding Units...');

    for (const unit of units) {
        const result = await prisma.unit.upsert({
            where: {
                programId_code: {
                    programId: program.id,
                    code: unit.code
                }
            },
            update: {
                nameAr: unit.nameAr,
                nameEn: unit.nameEn,
            },
            create: {
                programId: program.id,
                code: unit.code,
                nameAr: unit.nameAr,
                nameEn: unit.nameEn,
                credits: 10, // Default credits
                isActive: true
            }
        });
        console.log(`   + Upserted Unit: ${unit.code} - ${unit.nameEn}`);
    }

    console.log('🎉 Done!');
}

main()
    .catch(e => console.error(e))
    .finally(() => prisma.$disconnect());
