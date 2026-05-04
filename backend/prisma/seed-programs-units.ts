import prisma from '../src/common/db/prisma';

async function main() {
    console.log('🌱 Starting programs and units seed...');

    // ============================================
    // 1. CREATE PROGRAMS
    // ============================================

    const level3Program = await prisma.program.upsert({
        where: { code: 'BTEC-L3-NEC' },
        update: {},
        create: {
            code: 'BTEC-L3-NEC',
            nameEn: 'BTEC Level 3 National Extended Certificate',
            nameAr: 'BTEC المستوى الثالث الشهادة الوطنية الموسعة',
            description: 'BTEC Level 3 National Extended Certificate in Business',
            durationMonths: 12,
            isActive: true
        }
    });
    console.log('✅ Program created: BTEC Level 3');

    const level5Program = await prisma.program.upsert({
        where: { code: 'BTEC-L5-HND' },
        update: {},
        create: {
            code: 'BTEC-L5-HND',
            nameEn: 'BTEC Level 5 Higher National Diploma HND',
            nameAr: 'BTEC المستوى الخامس الدبلوم الوطني العالي',
            description: 'BTEC Level 5 Higher National Diploma in Business',
            durationMonths: 24,
            isActive: true
        }
    });
    console.log('✅ Program created: BTEC Level 5 HND');

    // ============================================
    // 2. CREATE UNITS FOR LEVEL 3 & LINK TO PROGRAM
    // ============================================

    const level3Units = [
        {
            code: 'PL3-U01',
            nameEn: 'Exploring Business',
            nameAr: 'استكشاف الأعمال',
            abbreviation: 'EB',
            credits: 2,
        },
        {
            code: 'PL3-U02',
            nameEn: 'Research and Planning of Marketing Campaigns',
            nameAr: 'بحوث وتخطيط حملات التسويق',
            abbreviation: 'RPMC',
            credits: 2,
        },
        {
            code: 'PL3-U03',
            nameEn: 'Business Finance',
            nameAr: 'ماليات الأعمال',
            abbreviation: 'BF',
            credits: 2,
        },
        {
            code: 'PL3-U04',
            nameEn: 'Event Management',
            nameAr: 'إدارة الفعاليات',
            abbreviation: 'EM',
            credits: 2,
        },
        {
            code: 'PL3-U05',
            nameEn: 'International Business',
            nameAr: 'الأعمال الدولية',
            abbreviation: 'IB',
            credits: 2,
        },
        {
            code: 'PL3-U06',
            nameEn: 'Principles of Management',
            nameAr: 'مبادئ الإدارة',
            abbreviation: 'PM',
            credits: 2,
        },
        {
            code: 'PL3-U07',
            nameEn: 'Business Decision Making',
            nameAr: 'اتخاذ القرار في الأعمال',
            abbreviation: 'BDM',
            credits: 2,
        },
        {
            code: 'PL3-U08',
            nameEn: 'Human Resources',
            nameAr: 'الموارد البشرية',
            abbreviation: 'HR',
            credits: 2,
        },
        {
            code: 'PL3-U09',
            nameEn: 'Team Building',
            nameAr: 'بناء الفرق',
            abbreviation: 'TB',
            credits: 2,
        },
        {
            code: 'PL3-U20',
            nameEn: 'Business Ethics',
            nameAr: 'أخلاقيات الأعمال',
            abbreviation: 'BE',
            credits: 2,
        },
        {
            code: 'PL3-U22',
            nameEn: 'Marketing Research',
            nameAr: 'بحوث التسويق',
            abbreviation: 'MR',
            credits: 2,
        },
        {
            code: 'PL3-U23',
            nameEn: 'Business Experience',
            nameAr: 'الخبرة في إدارة الأعمال',
            abbreviation: 'BEP',
            credits: 2,
        },
        {
            code: 'PL3-U25',
            nameEn: 'Relationship Marketing',
            nameAr: 'التسويق بالعلاقات',
            abbreviation: 'RM',
            credits: 2,
        },
        {
            code: 'PL3-U26',
            nameEn: 'Procurement Processes',
            nameAr: 'عمليات المشتريات',
            abbreviation: 'PP',
            credits: 2,
        },
        {
            code: 'PL3-U28',
            nameEn: 'Methods and Techniques of Selling',
            nameAr: 'أساليب وطرق البيع',
            abbreviation: 'MTS',
            credits: 2,
        }
    ];

    let unitCount = 0;
    for (const unitData of level3Units) {
        // 1. Create Unit
        const unit = await prisma.unit.upsert({
            where: { code: unitData.code },
            update: {
                // Update existing unit if found
                nameAr: unitData.nameAr,
                nameEn: unitData.nameEn,
                description: `${unitData.nameEn} (${unitData.abbreviation})`,
                creditHours: unitData.credits,
                totalLectures: 6,
            },
            create: {
                code: unitData.code,
                nameAr: unitData.nameAr,
                nameEn: unitData.nameEn,
                description: `${unitData.nameEn} (${unitData.abbreviation})`,
                creditHours: unitData.credits,
                totalLectures: 6,
                isActive: true
            }
        });

        // 2. Link Unit to Program
        await prisma.programUnit.upsert({
            where: {
                programId_unitId: {
                    programId: level3Program.id,
                    unitId: unit.id
                }
            },
            update: {
                sequenceOrder: unitCount + 1,
            },
            create: {
                programId: level3Program.id,
                unitId: unit.id,
                sequenceOrder: unitCount + 1,
                isMandatory: true
            }
        });

        unitCount++;
        console.log(`✅ Unit ${unitCount}/15: ${unitData.code} - ${unitData.nameAr}`);
    }

    // ============================================
    // 3. CREATE UNITS FOR LEVEL 5 & LINK TO PROGRAM
    // ============================================

    const level5Units = [
        { code: 'PL5-U01', nameEn: 'Contemporary Business Environment', nameAr: 'بيئة الأعمال المعاصرة', abbreviation: 'CBE' },
        { code: 'PL5-U02', nameEn: 'Marketing Processes and Planning', nameAr: 'عمليات التسويق والتخطيط', abbreviation: 'MPP' },
        { code: 'PL5-U03', nameEn: 'Human Resource Management', nameAr: 'إدارة الموارد البشرية', abbreviation: 'HR' },
        { code: 'PL5-U04', nameEn: 'Leadership and Management', nameAr: 'الإدارة والقيادة', abbreviation: 'LM' },
        { code: 'PL5-U05', nameEn: 'Accounting Principles', nameAr: 'مبادئ المحاسبة', abbreviation: 'AP' },
        { code: 'PL5-U06', nameEn: 'Managing a Successful Business Project', nameAr: 'إدارة مشروع ناجح', abbreviation: 'MSPM' },
        { code: 'PL5-U07', nameEn: 'Business Law', nameAr: 'القانون التجاري', abbreviation: 'PL' },
        { code: 'PL5-U08', nameEn: 'Innovation and Commercialisation', nameAr: 'الابتكار والتجارة', abbreviation: 'IC' },
        { code: 'PL5-U19', nameEn: 'Research Project', nameAr: 'مشروع البحث', abbreviation: 'RP' },
        { code: 'PL5-U20', nameEn: 'Organizational Behaviour', nameAr: 'السلوك التنظيمي', abbreviation: 'OB' },
        { code: 'PL5-U43', nameEn: 'Business Strategies', nameAr: 'استراتيجيات الأعمال', abbreviation: 'BS' },
        { code: 'PL5-U46', nameEn: 'Developing Individuals, Teams and Organisations', nameAr: 'تطوير الأفراد والفرق والمؤسسات', abbreviation: 'DITO' },
        { code: 'PL5-U21', nameEn: 'Financial Reporting', nameAr: 'التقارير المالية', abbreviation: 'FR' },
        { code: 'PL5-U22', nameEn: 'Management Accounting', nameAr: 'المحاسبة الإدارية', abbreviation: 'MA' },
        { code: 'PL5-U23', nameEn: 'Financial Management', nameAr: 'الإدارة المالية', abbreviation: 'FM' },
        { code: 'PL5-U24', nameEn: 'Understanding and Leading Change', nameAr: 'فهم وإدارة التغيير', abbreviation: 'ULC' },
        { code: 'PL5-U25', nameEn: 'Global Business Environment', nameAr: 'بيئة الأعمال الدولية', abbreviation: 'GBE' },
        { code: 'PL5-U26', nameEn: 'Principles of Operations Management', nameAr: 'مبادئ إدارة العمليات', abbreviation: 'POM' },
        { code: 'PL5-U30', nameEn: 'Resource and Talent Planning', nameAr: 'تخطيط الموارد والمواهب', abbreviation: 'RTP' },
        { code: 'PL5-U31', nameEn: 'Employee Relations', nameAr: 'علاقات المنظمة', abbreviation: 'ER' },
        { code: 'PL5-U32', nameEn: 'Strategic Human Resource Management', nameAr: 'الإدارة الاستراتيجية للموارد البشرية', abbreviation: 'SHRM' },
    ];

    let l5UnitCount = 0;
    for (const unitData of level5Units) {
        // 1. Create Unit
        const unit = await prisma.unit.upsert({
            where: { code: unitData.code },
            update: {
                nameAr: unitData.nameAr,
                nameEn: unitData.nameEn,
                description: `${unitData.nameEn} (${unitData.abbreviation})`,
                creditHours: 2,
                totalLectures: 8,
            },
            create: {
                code: unitData.code,
                nameAr: unitData.nameAr,
                nameEn: unitData.nameEn,
                description: `${unitData.nameEn} (${unitData.abbreviation})`,
                creditHours: 2,
                totalLectures: 8,
                isActive: true
            }
        });

        // 2. Link Unit to Program
        await prisma.programUnit.upsert({
            where: {
                programId_unitId: {
                    programId: level5Program.id,
                    unitId: unit.id
                }
            },
            update: {
                sequenceOrder: l5UnitCount + 1,
            },
            create: {
                programId: level5Program.id,
                unitId: unit.id,
                sequenceOrder: l5UnitCount + 1,
                isMandatory: true
            }
        });

        l5UnitCount++;
        console.log(`✅ L5 Unit ${l5UnitCount}/21: ${unitData.code} - ${unitData.nameAr}`);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Programs created: 2`);
    console.log(`   - Level 3 Units created & linked: ${level3Units.length}`);
    console.log(`   - Level 5 Units created & linked: ${level5Units.length}`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
