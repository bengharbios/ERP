const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const units = [
    { code: 'PL5-U01', nameAr: 'بيئة الأعمال المعاصرة', nameEn: 'Contemporary Business Environment (CBE)' },
    { code: 'PL5-U02', nameAr: 'عمليات التسويق والتخطيط', nameEn: 'Marketing Processes and Planning (MPP)' },
    { code: 'PL5-U03', nameAr: 'إدارة الموارد البشرية', nameEn: 'Human Resource Management (HR)' },
    { code: 'PL5-U04', nameAr: 'الإدارة والقيادة', nameEn: 'Leadership and Management (LM)' },
    { code: 'PL5-U05', nameAr: 'مبادئ المحاسبة', nameEn: 'Accounting Principles (AP)' },
    { code: 'PL5-U06', nameAr: 'إدارة مشروع ناجح', nameEn: 'Managing a Successful Business Project (MSPM)' },
    { code: 'PL5-U07', nameAr: 'القانون التجاري', nameEn: 'Business Law (PL)' },
    { code: 'PL5-U08', nameAr: 'الابتكار والتجارة', nameEn: 'Innovation and Commercialisation (IC)' },
    { code: 'PL5-U19', nameAr: 'مشروع البحث', nameEn: 'Research Project (RP)' },
    { code: 'PL5-U20', nameAr: 'السلوك التنظيمي', nameEn: 'Organizational Behaviour (OB)' },
    { code: 'PL5-U43', nameAr: 'استراتيجيات الأعمال', nameEn: 'Business Strategies (BS)' },
    { code: 'PL5-U46', nameAr: 'تطوير الأفراد و الفرق والمؤسسات', nameEn: 'Developing Individuals, Teams and Organisations (DITO)' },
    { code: 'PL5-U21', nameAr: 'التقارير المالية', nameEn: 'Financial Reporting (FR)' },
    { code: 'PL5-U22', nameAr: 'المحاسبة الإدارية', nameEn: 'Management Accounting (MA)' },
    { code: 'PL5-U23', nameAr: 'الإدارة المالية', nameEn: 'Financial Management (FM)' },
    { code: 'PL5-U24', nameAr: 'فهم وإدارة التغيير', nameEn: 'Understanding and Leading Change (ULC)' },
    { code: 'PL5-U25', nameAr: 'بيئة الأعمال الدولية', nameEn: 'Global Business Environment (GBE)' },
    { code: 'PL5-U26', nameAr: 'مبادئ إدارة العمليات', nameEn: 'Principles of Operations Management (POM)' },
    { code: 'PL5-U30', nameAr: 'تخطيط الموارد والمواهب', nameEn: 'Resource and Talent Planning (RTP)' },
    { code: 'PL5-U31', nameAr: 'علاقات المنظمة', nameEn: 'Employee Relations (ER)' },
    { code: 'PL5-U32', nameAr: 'الإدارة الاستراتيجية للموارد البشرية', nameEn: 'Strategic Human Resource Management (SHRM)' },
];

async function main() {
    try {
        console.log('🔍 Searching for "BTEC Level 5 Higher National Diploma HND"...');

        let program = await prisma.program.findFirst({
            where: {
                OR: [
                    { nameEn: { contains: 'Higher National Diploma' } },
                    { nameEn: { contains: 'Level 5' } }
                ]
            }
        });

        if (!program) {
            console.error('❌ Program not found!');
            return;
        }

        console.log(`✅ Found Program: ${program.nameEn} (ID: ${program.id})`);

        // Fix existing "U. 01" if it exists
        const badUnit = await prisma.unit.findFirst({
            where: {
                code: 'U. 01', // Exact match from previous check
                programUnits: { some: { programId: program.id } }
            }
        });

        if (badUnit) {
            console.log('⚠️ Found legacy unit "U. 01", renaming to "PL5-U01"...');
            await prisma.unit.update({
                where: { id: badUnit.id },
                data: { code: 'PL5-U01' }
            });
            console.log('✅ Renamed successfully.');
        }

        console.log('🚀 Adding/Updating Units...');

        for (const unit of units) {
            // 1. Upsert Unit (Global lookup by code)
            const savedUnit = await prisma.unit.upsert({
                where: { code: unit.code },
                update: {
                    nameAr: unit.nameAr,
                    nameEn: unit.nameEn,
                    creditHours: 2,      // 2 hours duration
                    totalLectures: 8,    // 8 sessions
                },
                create: {
                    code: unit.code,
                    nameAr: unit.nameAr,
                    nameEn: unit.nameEn,
                    creditHours: 2,      // 2 hours duration
                    totalLectures: 8,    // 8 sessions
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
