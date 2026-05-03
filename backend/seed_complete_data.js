const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Complete Data Seeding...\n');

    // ============================================
    // 1. FINANCIAL SETTINGS
    // ============================================
    console.log('📊 Creating Financial Settings...');
    const financialSettings = await prisma.financialSettings.upsert({
        where: { id: 'default' },
        update: {},
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
    // 2. PROGRAMS & LEVELS
    // ============================================
    console.log('📚 Creating Program Levels...');

    // Delete existing levels first
    await prisma.programLevel.deleteMany({});

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
        })
    ]);
    console.log(`✅ Created ${levels.length} Program Levels\n`);

    // Delete existing programs and units
    console.log('🗑️  Cleaning old programs and units...');
    await prisma.unit.deleteMany({});
    await prisma.program.deleteMany({});
    console.log('✅ Old programs and units cleaned\n');

    console.log('📚 Creating Programs...');
    const programs = await Promise.all([
        prisma.program.create({
            data: {
                nameAr: 'دبلوم إدارة الأعمال',
                nameEn: 'Business Administration Diploma',
                code: 'BA-DIP-001',
                durationMonths: 12,
                levelId: levels[0].id,
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
                isActive: true
            }
        })
    ]);
    console.log(`✅ Created ${programs.length} Programs\n`);

    // ============================================
    // 3. UNITS (COURSES)
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
                isActive: true
            }
        })
    ]);
    console.log(`✅ Created ${units.length} Units\n`);

    // ============================================
    // 4. STUDENTS
    // ============================================
    console.log('👨‍🎓 Creating Students...');
    const students = await Promise.all([
        prisma.student.create({
            data: {
                studentNumber: 'STD-2026-001',
                firstNameAr: 'أحمد',
                lastNameAr: 'محمد العلي',
                firstNameEn: 'Ahmed',
                lastNameEn: 'Mohammed Al Ali',
                dateOfBirth: new Date('2000-05-15'),
                gender: 'MALE',
                nationality: 'UAE',
                email: 'ahmed.ali@example.com',
                phone: '+971501234567',
                enrollmentDate: new Date('2026-01-15'),
                status: 'ACTIVE',
                programId: programs[0].id
            }
        }),
        prisma.student.create({
            data: {
                studentNumber: 'STD-2026-002',
                firstNameAr: 'فاطمة',
                lastNameAr: 'خالد السعدي',
                firstNameEn: 'Fatima',
                lastNameEn: 'Khaled Al Saadi',
                dateOfBirth: new Date('2001-08-22'),
                gender: 'FEMALE',
                nationality: 'UAE',
                email: 'fatima.saadi@example.com',
                phone: '+971502345678',
                enrollmentDate: new Date('2026-01-20'),
                status: 'ACTIVE',
                programId: programs[1].id
            }
        }),
        prisma.student.create({
            data: {
                studentNumber: 'STD-2026-003',
                firstNameAr: 'محمد',
                lastNameAr: 'عبدالله الشامسي',
                firstNameEn: 'Mohammed',
                lastNameEn: 'Abdullah Al Shamsi',
                dateOfBirth: new Date('1999-12-10'),
                gender: 'MALE',
                nationality: 'UAE',
                email: 'mohammed.shamsi@example.com',
                phone: '+971503456789',
                enrollmentDate: new Date('2026-02-01'),
                status: 'ACTIVE',
                programId: programs[2].id
            }
        }),
        prisma.student.create({
            data: {
                studentNumber: 'STD-2026-004',
                firstNameAr: 'مريم',
                lastNameAr: 'سالم المهيري',
                firstNameEn: 'Mariam',
                lastNameEn: 'Salem Al Muhairi',
                dateOfBirth: new Date('2002-03-18'),
                gender: 'FEMALE',
                nationality: 'UAE',
                email: 'mariam.muhairi@example.com',
                phone: '+971504567890',
                enrollmentDate: new Date('2026-02-05'),
                status: 'ACTIVE',
                programId: programs[0].id
            }
        }),
        prisma.student.create({
            data: {
                studentNumber: 'STD-2026-005',
                firstNameAr: 'علي',
                lastNameAr: 'حسن الكعبي',
                firstNameEn: 'Ali',
                lastNameEn: 'Hassan Al Kaabi',
                dateOfBirth: new Date('2000-11-25'),
                gender: 'MALE',
                nationality: 'UAE',
                email: 'ali.kaabi@example.com',
                phone: '+971505678901',
                enrollmentDate: new Date('2026-02-10'),
                status: 'ACTIVE',
                programId: programs[1].id
            }
        })
    ]);
    console.log(`✅ Created ${students.length} Students\n`);

    // ============================================
    // 5. TAX INVOICES
    // ============================================
    console.log('🧾 Creating Tax Invoices...');

    const invoiceCounter = await prisma.invoiceCounter.upsert({
        where: { id: 'default' },
        update: {},
        create: {
            id: 'default',
            currentNumber: 0
        }
    });

    const invoices = [];
    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const subtotal = 30000 + (i * 2000); // Different amounts
        const vatAmount = subtotal * 0.15;
        const totalAmount = subtotal + vatAmount;

        // Create invoice with ISSUED status (unpaid)
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber: `INV-2026-${String(i + 1).padStart(4, '0')}`,
                studentId: student.id,
                date: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                subtotal: subtotal,
                vatAmount: vatAmount,
                totalAmount: totalAmount,
                status: i < 2 ? 'ISSUED' : 'PAID', // First 2 are unpaid, rest are paid
                trnSnapshot: financialSettings.trn,
                vatRateSnapshot: financialSettings.vatRate,
                items: {
                    create: [
                        {
                            description: `رسوم دراسية - ${programs[i % programs.length].nameAr}`,
                            quantity: 1,
                            unitPrice: subtotal * 0.7,
                            taxableAmount: subtotal * 0.7,
                            vatAmount: subtotal * 0.7 * 0.15,
                            totalAmount: subtotal * 0.7 * 1.15
                        },
                        {
                            description: 'رسوم التسجيل والقبول',
                            quantity: 1,
                            unitPrice: subtotal * 0.2,
                            taxableAmount: subtotal * 0.2,
                            vatAmount: subtotal * 0.2 * 0.15,
                            totalAmount: subtotal * 0.2 * 1.15
                        },
                        {
                            description: 'رسوم الكتب والمواد الدراسية',
                            quantity: 1,
                            unitPrice: subtotal * 0.1,
                            taxableAmount: subtotal * 0.1,
                            vatAmount: subtotal * 0.1 * 0.15,
                            totalAmount: subtotal * 0.1 * 1.15
                        }
                    ]
                }
            },
            include: {
                items: true
            }
        });
        invoices.push(invoice);
    }

    await prisma.invoiceCounter.update({
        where: { id: 'default' },
        data: { currentNumber: invoices.length }
    });

    console.log(`✅ Created ${invoices.length} Tax Invoices\n`);

    // ============================================
    // 6. FEE TEMPLATES
    // ============================================
    console.log('💰 Creating Fee Templates...');
    const feeTemplates = await Promise.all([
        prisma.feeTemplate.create({
            data: {
                name: 'Standard Tuition - Business',
                nameAr: 'رسوم دراسية قياسية - إدارة أعمال',
                programId: programs[0].id,
                currency: 'AED',
                totalAmount: 30000,
                tuitionAmount: 25000,
                isActive: true,
                isDefault: true,
                feeItems: {
                    create: [
                        {
                            name: 'Tuition Fee',
                            nameAr: 'رسوم دراسية',
                            type: 'TUITION',
                            amount: 25000,
                            isIncludedInTuition: true,
                            isOptional: false,
                            isTaxable: true,
                            displayOrder: 1
                        },
                        {
                            name: 'Registration Fee',
                            nameAr: 'رسوم التسجيل',
                            type: 'REGISTRATION',
                            amount: 3000,
                            isIncludedInTuition: false,
                            isOptional: false,
                            isTaxable: true,
                            displayOrder: 2
                        },
                        {
                            name: 'Books & Materials',
                            nameAr: 'الكتب والمواد',
                            type: 'OTHER',
                            amount: 2000,
                            isIncludedInTuition: false,
                            isOptional: true,
                            isTaxable: true,
                            displayOrder: 3
                        }
                    ]
                }
            }
        }),
        prisma.feeTemplate.create({
            data: {
                name: 'Standard Tuition - IT',
                nameAr: 'رسوم دراسية قياسية - تقنية معلومات',
                programId: programs[1].id,
                currency: 'AED',
                totalAmount: 32000,
                tuitionAmount: 27000,
                isActive: true,
                isDefault: true,
                feeItems: {
                    create: [
                        {
                            name: 'Tuition Fee',
                            nameAr: 'رسوم دراسية',
                            type: 'TUITION',
                            amount: 27000,
                            isIncludedInTuition: true,
                            isOptional: false,
                            isTaxable: true,
                            displayOrder: 1
                        },
                        {
                            name: 'Registration Fee',
                            nameAr: 'رسوم التسجيل',
                            type: 'REGISTRATION',
                            amount: 3000,
                            isIncludedInTuition: false,
                            isOptional: false,
                            isTaxable: true,
                            displayOrder: 2
                        },
                        {
                            name: 'Lab Equipment',
                            nameAr: 'معدات المختبر',
                            type: 'OTHER',
                            amount: 2000,
                            isIncludedInTuition: false,
                            isOptional: false,
                            isTaxable: true,
                            displayOrder: 3
                        }
                    ]
                }
            }
        })
    ]);
    console.log(`✅ Created ${feeTemplates.length} Fee Templates\n`);

    // ============================================
    // 7. STUDENT FEE CALCULATIONS
    // ============================================
    console.log('📝 Creating Student Fee Calculations...');
    const calculations = [];
    for (let i = 0; i < students.length; i++) {
        const student = students[i];
        const template = feeTemplates[i % feeTemplates.length];
        const subtotal = template.totalAmount;
        const discountAmount = i === 0 ? 3000 : 0; // First student gets discount
        const totalAmount = subtotal - discountAmount;
        const paidAmount = i < 2 ? 0 : totalAmount; // First 2 haven't paid
        const balance = totalAmount - paidAmount;

        const calc = await prisma.studentFeeCalculation.create({
            data: {
                studentId: student.id,
                templateId: template.id,
                programId: student.programId,
                calculationNumber: `FEE-2026-${String(i + 1).padStart(4, '0')}`,
                title: `${template.nameAr} - ${student.firstNameAr} ${student.lastNameAr}`,
                subtotal: subtotal,
                discountAmount: discountAmount,
                scholarshipAmount: 0,
                totalAmount: totalAmount,
                paidAmount: paidAmount,
                balance: balance,
                currency: 'AED',
                status: balance === 0 ? 'PAID' : (i === 0 ? 'PARTIAL' : 'PENDING'),
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                feeItems: {
                    create: template.feeItems.map((item, idx) => ({
                        feeItemId: item.id,
                        name: item.name,
                        nameAr: item.nameAr,
                        type: item.type,
                        amount: item.amount,
                        isIncludedInTuition: item.isIncludedInTuition,
                        displayOrder: idx + 1
                    }))
                }
            }
        });
        calculations.push(calc);
    }
    console.log(`✅ Created ${calculations.length} Fee Calculations\n`);

    // ============================================
    // SUMMARY
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('✅ DATA SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(60));
    console.log(`📊 Financial Settings: 1`);
    console.log(`📚 Program Levels: ${levels.length}`);
    console.log(`📚 Programs: ${programs.length}`);
    console.log(`📖 Units (Courses): ${units.length}`);
    console.log(`👨‍🎓 Students: ${students.length}`);
    console.log(`🧾 Tax Invoices: ${invoices.length}`);
    console.log(`   - Unpaid (ISSUED): ${invoices.filter(i => i.status === 'ISSUED').length}`);
    console.log(`   - Paid: ${invoices.filter(i => i.status === 'PAID').length}`);
    console.log(`💰 Fee Templates: ${feeTemplates.length}`);
    console.log(`📝 Fee Calculations: ${calculations.length}`);
    console.log('='.repeat(60));
    console.log('\n🎉 You can now test the complete financial system!');
    console.log('📌 Try:');
    console.log('   1. View invoices in the Invoices page');
    console.log('   2. Create new invoices from Student Fees page');
    console.log('   3. Issue receipt vouchers and pay invoices');
    console.log('   4. View students and their programs');
    console.log('   5. Manage units and courses');
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
