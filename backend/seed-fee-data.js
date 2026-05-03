const { PrismaClient } = require('@prisma/client');
const { testData } = require('./test-fee-data');

const prisma = new PrismaClient();

async function seedFeeData() {
    console.log('🌱 Seeding Fee System Test Data...\n');

    try {
        // 1. Get a program to link templates
        const program = await prisma.program.findFirst();
        if (!program) {
            console.log('⚠️  No programs found. Please create a program first.');
            return;
        }
        console.log(`✓ Using program: ${program.nameEn}\n`);

        // 2. Create BTEC Template
        console.log('📋 Creating BTEC Fee Template...');
        const btecTemplate = await prisma.feeTemplate.create({
            data: {
                ...testData.btecTemplate,
                programId: program.id,
                totalAmount: testData.btecTemplate.feeItems.reduce((s, i) => s + i.amount, 0),
                tuitionAmount: testData.btecTemplate.feeItems
                    .filter(i => i.isIncludedInTuition)
                    .reduce((s, i) => s + i.amount, 0),
                feeItems: {
                    create: testData.btecTemplate.feeItems
                }
            },
            include: {
                feeItems: true
            }
        });
        console.log(`✓ Created template: ${btecTemplate.name}`);
        console.log(`  - Total: ${btecTemplate.totalAmount} SAR`);
        console.log(`  - Items: ${btecTemplate.feeItems.length}\n`);

        // 3. Create Accounting Template
        console.log('📋 Creating Accounting Fee Template...');
        const accountingTemplate = await prisma.feeTemplate.create({
            data: {
                ...testData.accountingTemplate,
                programId: program.id,
                totalAmount: testData.accountingTemplate.feeItems.reduce((s, i) => s + i.amount, 0),
                tuitionAmount: testData.accountingTemplate.feeItems
                    .filter(i => i.isIncludedInTuition)
                    .reduce((s, i) => s + i.amount, 0),
                feeItems: {
                    create: testData.accountingTemplate.feeItems
                }
            }
        });
        console.log(`✓ Created template: ${accountingTemplate.name}\n`);

        // 4. Create Discounts
        console.log('🎁 Creating Discounts...');

        const earlyBirdDiscount = await prisma.discount.create({
            data: {
                ...testData.percentageDiscount,
                validFrom: new Date(testData.percentageDiscount.validFrom),
                validUntil: new Date(testData.percentageDiscount.validUntil),
            }
        });
        console.log(`✓ Created: ${earlyBirdDiscount.name} (${earlyBirdDiscount.percentage}%)`);

        const siblingDiscount = await prisma.discount.create({
            data: {
                ...testData.fixedDiscount,
            }
        });
        console.log(`✓ Created: ${siblingDiscount.name} (${siblingDiscount.fixedAmount} SAR)`);

        const scholarship = await prisma.discount.create({
            data: {
                ...testData.scholarship,
                validFrom: new Date(testData.scholarship.validFrom),
                validUntil: new Date(testData.scholarship.validUntil),
            }
        });
        console.log(`✓ Created: ${scholarship.name} (${scholarship.percentage}%)\n`);

        // 5. Get a student for calculations
        const student = await prisma.student.findFirst();
        if (!student) {
            console.log('⚠️  No students found. Skipping student calculations.');
        } else {
            console.log(`✓ Using student: ${student.id}\n`);

            // 6. Create Student Fee Calculation with Discount
            console.log('💰 Creating Student Fee Calculation (with discount)...');

            const subtotal = testData.studentCalculationWithDiscount.feeItems
                .reduce((s, i) => s + i.amount, 0);
            const discountAmount = (subtotal * 10) / 100; // 10% discount
            const totalAmount = subtotal - discountAmount;

            const calculation1 = await prisma.studentFeeCalculation.create({
                data: {
                    studentId: student.id,
                    templateId: btecTemplate.id,
                    programId: program.id,
                    calculationNumber: `FEE-2026-${String(Math.floor(Math.random() * 1000)).padStart(4, '0')}`,
                    title: testData.studentCalculationWithDiscount.title,
                    currency: testData.studentCalculationWithDiscount.currency,
                    subtotal,
                    discountAmount,
                    scholarshipAmount: 0,
                    totalAmount,
                    balance: totalAmount,
                    paidAmount: 0,
                    status: 'PENDING',
                    dueDate: new Date(testData.studentCalculationWithDiscount.dueDate),
                    notes: testData.studentCalculationWithDiscount.notes,
                    feeItems: {
                        create: testData.studentCalculationWithDiscount.feeItems
                    },
                    discounts: {
                        create: testData.studentCalculationWithDiscount.discounts.map(d => ({
                            ...d,
                            calculatedAmount: discountAmount
                        }))
                    }
                },
                include: {
                    feeItems: true,
                    discounts: true
                }
            });
            console.log(`✓ Created calculation: ${calculation1.calculationNumber}`);
            console.log(`  - Subtotal: ${calculation1.subtotal} SAR`);
            console.log(`  - Discount: ${calculation1.discountAmount} SAR`);
            console.log(`  - Total: ${calculation1.totalAmount} SAR\n`);

            // 7. Create Installment Plan
            console.log('📅 Creating Installment Plan...');

            const installmentAmount = Math.ceil((Number(calculation1.balance) / 12) * 100) / 100;
            const startDate = new Date('2026-03-01');
            const endDate = new Date('2027-02-01');

            const installmentPlan = await prisma.installmentPlan.create({
                data: {
                    calculationId: calculation1.id,
                    name: testData.installmentPlan12Months.name,
                    nameAr: testData.installmentPlan12Months.nameAr,
                    totalAmount: calculation1.balance,
                    numberOfMonths: 12,
                    installmentAmount,
                    startDate,
                    endDate,
                    dayOfMonth: 1,
                    notes: testData.installmentPlan12Months.notes,
                    installments: {
                        create: Array.from({ length: 12 }, (_, i) => {
                            const dueDate = new Date(startDate);
                            dueDate.setMonth(startDate.getMonth() + i);
                            return {
                                installmentNumber: i + 1,
                                amount: installmentAmount,
                                dueDate,
                                balance: installmentAmount,
                                paidAmount: 0,
                                status: 'PENDING'
                            };
                        })
                    }
                },
                include: {
                    installments: true
                }
            });
            console.log(`✓ Created installment plan: ${installmentPlan.name}`);
            console.log(`  - Installments: ${installmentPlan.numberOfMonths}`);
            console.log(`  - Amount per month: ${installmentPlan.installmentAmount} SAR\n`);
        }

        // Summary
        console.log('═══════════════════════════════════════');
        console.log('✅ Seed completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - Fee Templates: 2`);
        console.log(`   - Discounts: 3`);
        console.log(`   - Student Calculations: ${student ? '1' : '0'}`);
        console.log(`   - Installment Plans: ${student ? '1' : '0'}`);
        console.log('═══════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error seeding data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedFeeData()
    .then(() => {
        console.log('✅ Done!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('❌ Failed:', error);
        process.exit(1);
    });
