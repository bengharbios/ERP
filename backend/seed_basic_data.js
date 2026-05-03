const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Basic Data Seeding...\n');

    // ============================================
    // 1. FINANCIAL SETTINGS
    // ============================================
    console.log('📊 Creating Financial Settings...');
    const financialSettings = await prisma.financialSettings.upsert({
        where: { id: 'default' },
        update: {
            companyNameAr: 'معهد العلم للتطوير',
            companyNameEn: 'Science Development Institute',
            trn: '100123456700003',
            vatRate: 15,
            currency: 'AED',
            bankName: 'Emirates NBD',
            iban: 'AE070331234567890123456',
            swiftCode: 'EBILAEAD',
            bankAddress: 'Dubai, UAE'
        },
        create: {
            id: 'default',
            companyNameAr: 'معهد العلم للتطوير',
            companyNameEn: 'Science Development Institute',
            trn: '100123456700003',
            vatRate: 15,
            currency: 'AED',
            bankName: 'Emirates NBD',
            iban: 'AE070331234567890123456',
            swiftCode: 'EBILAEAD',
            bankAddress: 'Dubai, UAE'
        }
    });
    console.log('✅ Financial Settings Created\n');

    // ============================================
    // 2. PROGRAM LEVELS
    // ============================================
    console.log('📚 Creating Program Levels...');

    // Delete existing data first
    console.log('🗑️  Cleaning old data...');
    await prisma.unit.deleteMany({});
    await prisma.program.deleteMany({});
    await prisma.programLevel.deleteMany({});
    console.log('✅ Old data cleaned\n');

    const levels = await Promise.all([
        prisma.programLevel.create({
            data: {
                nameAr: 'المستوى الرابع',
                nameEn: 'Level 4',
                order: 4,
                isActive: true
            }
        }),
        prisma.programLevel.create({
            data: {
                nameAr: 'المستوى الخامس',
                nameEn: 'Level 5',
                order: 5,
                isActive: true
            }
        }),
        prisma.programLevel.create({
            data: {
                nameAr: 'المستوى السادس',
                nameEn: 'Level 6',
                order: 6,
                isActive: true
            }
        })
    ]);
    console.log(`✅ Created ${levels.length} Program Levels\n`);

    // ============================================
    // 3. PROGRAMS
    // ============================================
    console.log('📚 Creating Programs...');
    const programs = await Promise.all([
        prisma.program.create({
            data: {
                nameAr: 'دبلوم إدارة الأعمال',
                nameEn: 'Business Administration Diploma',
                code: 'BA-DIP-001',
                durationMonths: 12,
                levelId: levels[0].id,
                description: 'برنامج دبلوم في إدارة الأعمال',
                isActive: true
            }
        }),
        prisma.program.create({
            data: {
                nameAr: 'دبلوم تقنية المعلومات',
                nameEn: 'Information Technology Diploma',
                code: 'IT-DIP-001',
                durationMonths: 12,
                levelId: levels[0].id,
                description: 'برنامج دبلوم في تقنية المعلومات',
                isActive: true
            }
        }),
        prisma.program.create({
            data: {
                nameAr: 'دبلوم المحاسبة المالية',
                nameEn: 'Financial Accounting Diploma',
                code: 'ACC-DIP-001',
                durationMonths: 12,
                levelId: levels[1].id,
                description: 'برنامج دبلوم في المحاسبة المالية',
                isActive: true
            }
        }),
        prisma.program.create({
            data: {
                nameAr: 'دبلوم التسويق الرقمي',
                nameEn: 'Digital Marketing Diploma',
                code: 'MKT-DIP-001',
                durationMonths: 9,
                levelId: levels[0].id,
                description: 'برنامج دبلوم في التسويق الرقمي',
                isActive: true
            }
        })
    ]);
    console.log(`✅ Created ${programs.length} Programs\n`);

    // ============================================
    // 4. UNITS (COURSES)
    // ============================================
    console.log('📖 Creating Units...');
    const units = await Promise.all([
        // Business Administration Units
        prisma.unit.create({
            data: {
                nameAr: 'مبادئ الإدارة',
                nameEn: 'Principles of Management',
                code: 'BA-101',
                creditHours: 3,
                totalLectures: 30,
                description: 'مقدمة في مبادئ الإدارة الحديثة',
                isActive: true
            }
        }),
        prisma.unit.create({
            data: {
                nameAr: 'المحاسبة المالية',
                nameEn: 'Financial Accounting',
                code: 'BA-102',
                creditHours: 3,
                totalLectures: 30,
                description: 'أساسيات المحاسبة المالية',
                isActive: true
            }
        }),
        prisma.unit.create({
            data: {
                nameAr: 'التسويق الحديث',
                nameEn: 'Modern Marketing',
                code: 'BA-103',
                creditHours: 3,
                totalLectures: 30,
                description: 'استراتيجيات التسويق المعاصرة',
                isActive: true
            }
        }),
        prisma.unit.create({
            data: {
                nameAr: 'إدارة الموارد البشرية',
                nameEn: 'Human Resource Management',
                code: 'BA-104',
                creditHours: 3,
                totalLectures: 30,
                description: 'إدارة الموارد البشرية في المنظمات',
                isActive: true
            }
        }),
        // IT Units
        prisma.unit.create({
            data: {
                nameAr: 'أساسيات البرمجة',
                nameEn: 'Programming Fundamentals',
                code: 'IT-101',
                creditHours: 4,
                totalLectures: 40,
                description: 'مقدمة في البرمجة باستخدام Python',
                isActive: true
            }
        }),
        prisma.unit.create({
            data: {
                nameAr: 'قواعد البيانات',
                nameEn: 'Database Systems',
                code: 'IT-102',
                creditHours: 4,
                totalLectures: 40,
                description: 'تصميم وإدارة قواعد البيانات',
                isActive: true
            }
        }),
        prisma.unit.create({
            data: {
                nameAr: 'شبكات الحاسوب',
                nameEn: 'Computer Networks',
                code: 'IT-103',
                creditHours: 3,
                totalLectures: 30,
                description: 'أساسيات الشبكات والاتصالات',
                isActive: true
            }
        }),
        prisma.unit.create({
            data: {
                nameAr: 'تطوير الويب',
                nameEn: 'Web Development',
                code: 'IT-104',
                creditHours: 4,
                totalLectures: 40,
                description: 'تطوير تطبيقات الويب الحديثة',
                isActive: true
            }
        }),
        // Accounting Units
        prisma.unit.create({
            data: {
                nameAr: 'المحاسبة المتقدمة',
                nameEn: 'Advanced Accounting',
                code: 'ACC-201',
                creditHours: 4,
                totalLectures: 40,
                description: 'موضوعات متقدمة في المحاسبة',
                isActive: true
            }
        }),
        prisma.unit.create({
            data: {
                nameAr: 'التدقيق والمراجعة',
                nameEn: 'Auditing',
                code: 'ACC-202',
                creditHours: 3,
                totalLectures: 30,
                description: 'مبادئ التدقيق والمراجعة',
                isActive: true
            }
        }),
        prisma.unit.create({
            data: {
                nameAr: 'المحاسبة الإدارية',
                nameEn: 'Managerial Accounting',
                code: 'ACC-203',
                creditHours: 3,
                totalLectures: 30,
                description: 'المحاسبة لاتخاذ القرارات الإدارية',
                isActive: true
            }
        }),
        // Marketing Units
        prisma.unit.create({
            data: {
                nameAr: 'التسويق عبر وسائل التواصل الاجتماعي',
                nameEn: 'Social Media Marketing',
                code: 'MKT-101',
                creditHours: 3,
                totalLectures: 30,
                description: 'استراتيجيات التسويق عبر السوشيال ميديا',
                isActive: true
            }
        }),
        prisma.unit.create({
            data: {
                nameAr: 'تحسين محركات البحث (SEO)',
                nameEn: 'Search Engine Optimization',
                code: 'MKT-102',
                creditHours: 3,
                totalLectures: 30,
                description: 'تحسين ظهور المواقع في محركات البحث',
                isActive: true
            }
        })
    ]);
    console.log(`✅ Created ${units.length} Units\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ BASIC DATA SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`📊 Financial Settings: 1`);
    console.log(`📚 Program Levels: ${levels.length}`);
    console.log(`📚 Programs: ${programs.length}`);
    console.log(`📖 Units (Courses): ${units.length}`);
    console.log('='.repeat(60));
    console.log('\n🎉 Basic data is ready!');
    console.log('📌 Next steps:');
    console.log('   1. Create students from the Students page');
    console.log('   2. Generate fee calculations for students');
    console.log('   3. Create tax invoices from Student Fees page');
    console.log('   4. Issue receipt vouchers to pay invoices');
    console.log('\n');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
