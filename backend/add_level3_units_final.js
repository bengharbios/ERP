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
    try {
        console.log('🔍 Searching for "BTEC Level 3 National Extended Certificate"...');

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
            return;
        }

        console.log(`✅ Found Program: ${program.nameEn} (ID: ${program.id})`);
        console.log('🚀 Adding Units...');

        for (const unit of units) {
            // 1. Upsert Unit (Global lookup by code)
            const savedUnit = await prisma.unit.upsert({
                where: { code: unit.code },
                update: {
                    nameAr: unit.nameAr,
                    nameEn: unit.nameEn,
                    creditHours: 2,
                    totalLectures: 6,
                },
                create: {
                    code: unit.code,
                    nameAr: unit.nameAr,
                    nameEn: unit.nameEn,
                    creditHours: 2,
                    totalLectures: 6,
                    isActive: true
                }
            });

            // 2. Link to Program (ProgramUnit)
            await prisma.programUnit.upsert({
                where: {
                    programId_unitId: {
                        programId: program.id,
                        unitId: savedUnit.id
                    }
                },
                update: {},
                create: {
                    programId: program.id,
                    unitId: savedUnit.id,
                    isMandatory: true,
                    sequenceOrder: 0
                }
            });

            console.log(`   + Upserted Unit: ${unit.code}`);
        }

        console.log('🎉 Done!');
    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
