const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Starting Students & Fees Seeding (Fix)...\n');

    // 1. Get Programs
    const programs = await prisma.program.findMany();
    if (programs.length === 0) {
        console.error('❌ No programs found! Please run seed_basic_data.js first.');
        process.exit(1);
    }
    console.log(`✅ Found ${programs.length} Programs\n`);

    // 2. Get or Create STUDENT Role
    let studentRole = await prisma.role.findFirst({ where: { name: 'STUDENT' } });
    if (!studentRole) {
        studentRole = await prisma.role.create({
            data: {
                name: 'STUDENT',
                description: 'Default role for students',
                isSystemRole: true
            }
        });
        console.log('✅ Created STUDENT role');
    }

    // 3. Create Students (with Users)
    console.log('👨‍🎓 Creating Students & Users...');

    // Cleanup with individual try-catch to ensure robustness
    try { await prisma.invoice.deleteMany({}); console.log('Deleted invoices'); } catch (e) { }
    try { await prisma.studentFeeCalculation.deleteMany({}); console.log('Deleted fee calculations'); } catch (e) { }
    try { await prisma.student.deleteMany({}); console.log('Deleted students'); } catch (e) { }

    const studentsData = [
        {
            firstNameAr: 'أحمد', lastNameAr: 'محمد العلي',
            firstNameEn: 'Ahmed', lastNameEn: 'Mohammed Al Ali',
            email: 'ahmed.student.fix@example.com', phone: '+971501111111',
            programCode: 'BA-DIP-001'
        },
        {
            firstNameAr: 'فاطمة', lastNameAr: 'خالد السعدي',
            firstNameEn: 'Fatima', lastNameEn: 'Khaled Al Saadi',
            email: 'fatima.student.fix@example.com', phone: '+971502222222',
            programCode: 'IT-DIP-001'
        },
        {
            firstNameAr: 'محمد', lastNameAr: 'عبدالله الشامسي',
            firstNameEn: 'Mohammed', lastNameEn: 'Abdullah Al Shamsi',
            email: 'mohammed.student.fix@example.com', phone: '+971503333333',
            programCode: 'ACC-DIP-001'
        },
        {
            firstNameAr: 'مريم', lastNameAr: 'سالم المهيري',
            firstNameEn: 'Mariam', lastNameEn: 'Salem Al Muhairi',
            email: 'mariam.student.fix@example.com', phone: '+971504444444',
            programCode: 'BA-DIP-001'
        },
        {
            firstNameAr: 'علي', lastNameAr: 'حسن الكعبي',
            firstNameEn: 'Ali', lastNameEn: 'Hassan Al Kaabi',
            email: 'ali.student.fix@example.com', phone: '+971505555555',
            programCode: 'IT-DIP-001'
        }
    ];

    const createdStudents = [];

    for (let i = 0; i < studentsData.length; i++) {
        const s = studentsData[i];
        const program = programs.find(p => p.code === s.programCode) || programs[0];

        // Create User
        let user = await prisma.user.findUnique({ where: { email: s.email } });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    username: s.email.split('@')[0],
                    email: s.email,
                    passwordHash: '$2b$10$EpRnTzVlqHNP0.fUbXUwSOyuiXe/QLSUG6xNekdHgTGmrpHEfIoxm', // 'password123'
                    firstName: s.firstNameEn,
                    lastName: s.lastNameEn,
                    phone: s.phone,
                    isActive: true,
                    userRoles: {
                        create: {
                            roleId: studentRole.id
                        }
                    }
                }
            });
        }

        // Create Student with a NEW unique number to avoid conflict
        const studentNumber = `STD-2026-FIX-${String(i + 1).padStart(3, '0')}`;

        try {
            // Check if student exists by userId first, if so delete?
            // Actually, we already ran deleteMany on Student above.
            // But if userId is still linked to a deleted student... no, deleteMany should clear it.
            // Unless the previous deleteMany failed silently.
            // Let's force delete by UserId just in case
            await prisma.student.deleteMany({ where: { userId: user.id } });

            const student = await prisma.student.create({
                data: {
                    studentNumber: studentNumber,
                    userId: user.id,
                    firstNameAr: s.firstNameAr,
                    lastNameAr: s.lastNameAr,
                    firstNameEn: s.firstNameEn,
                    lastNameEn: s.lastNameEn,
                    email: s.email,
                    phone: s.phone,
                    enrollmentDate: new Date(),
                    status: 'ACTIVE'
                }
            });
            createdStudents.push({ ...student, programId: program.id });
        } catch (e) {
            console.error(`Failed to create student ${s.email}:`, e.message);
        }
    }
    console.log(`✅ Created ${createdStudents.length} Students\n`);

    if (createdStudents.length === 0) {
        console.log('⚠️ Skipping Fees seeding as no students were created.');
        return;
    }

    // 4. Create Fee Templates
    console.log('💰 Creating Fee Templates...');
    try { await prisma.feeTemplate.deleteMany({}); } catch (e) { }

    const uniqueProgramIds = [...new Set(programs.map(p => p.id))];
    const feeTemplates = [];

    for (const progId of uniqueProgramIds) {
        const prog = programs.find(p => p.id === progId);
        const tmpl = await prisma.feeTemplate.create({
            data: {
                name: `Standard Tuition - ${prog.code}`,
                nameAr: `رسوم دراسية - ${prog.nameAr}`,
                programId: progId,
                currency: 'AED',
                totalAmount: 25000,
                tuitionAmount: 20000,
                isActive: true,
                isDefault: true,
                feeItems: {
                    create: [
                        {
                            name: 'Tuition Fee',
                            nameAr: 'الرسوم الدراسية',
                            type: 'TUITION',
                            amount: 20000,
                            isIncludedInTuition: true,
                            isTaxable: true,
                            displayOrder: 1
                        },
                        {
                            name: 'Registration',
                            nameAr: 'تسجيل',
                            type: 'REGISTRATION',
                            amount: 3000,
                            isIncludedInTuition: false,
                            isTaxable: true,
                            displayOrder: 2
                        },
                        {
                            name: 'Books',
                            nameAr: 'كتب',
                            type: 'OTHER',
                            amount: 2000,
                            isIncludedInTuition: false,
                            isTaxable: true,
                            displayOrder: 3
                        }
                    ]
                }
            },
            include: { feeItems: true }
        });
        feeTemplates.push(tmpl);
    }
    console.log(`✅ Created ${feeTemplates.length} Fee Templates\n`);

    // 5. Create Fee Calculations & Invoices
    console.log('🧾 Creating Invoices & Calculations...');

    // Get financial settings for TRN/VAT
    const finSettings = await prisma.financialSettings.findUnique({ where: { id: 'default' } });

    for (let i = 0; i < createdStudents.length; i++) {
        const std = createdStudents[i];
        // Find template for this student's program
        const tmpl = feeTemplates.find(t => t.programId === std.programId) || feeTemplates[0];

        // Fee Calculation
        await prisma.studentFeeCalculation.create({
            data: {
                studentId: std.id,
                templateId: tmpl.id,
                programId: std.programId, // Assuming this field exists on Calculation
                calculationNumber: `CALC-2026-${String(i + 1).padStart(3, '0')}`,
                title: 'Tuition Fees 2026',
                subtotal: tmpl.totalAmount,
                discountAmount: 0,
                scholarshipAmount: 0,
                totalAmount: tmpl.totalAmount,
                paidAmount: i < 2 ? 0 : tmpl.totalAmount, // First 2 unpaid
                balance: i < 2 ? tmpl.totalAmount : 0,
                currency: 'AED',
                status: i < 2 ? 'PENDING' : 'PAID',
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                feeItems: {
                    create: tmpl.feeItems.map((fi, idx) => ({
                        // feeItemId: fi.id, // Remove if causing issues, allow auto-gen or link differently?
                        // Usually FeeItem on calculation is a snapshot copy, not relation.
                        name: fi.name,
                        nameAr: fi.nameAr,
                        type: fi.type,
                        amount: fi.amount,
                        isIncludedInTuition: fi.isIncludedInTuition,
                        displayOrder: idx
                    }))
                }
            }
        });

        // Invoice
        const subtotal = Number(tmpl.totalAmount);
        const vat = subtotal * 0.05; // 5% VAT assumption or use settings
        const total = subtotal + vat;

        await prisma.invoice.create({
            data: {
                invoiceNumber: `INV-2026-${String(i + 1).padStart(3, '0')}`,
                studentId: std.id,
                date: new Date(),
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                subtotal: subtotal,
                vatAmount: vat,
                totalAmount: total,
                status: i < 2 ? 'ISSUED' : 'PAID',
                trnSnapshot: finSettings?.trn || '',
                vatRateSnapshot: finSettings?.vatRate || 5,
                items: {
                    create: tmpl.feeItems.map(fi => ({
                        description: fi.name,
                        quantity: 1,
                        unitPrice: Number(fi.amount),
                        taxableAmount: Number(fi.amount),
                        vatAmount: Number(fi.amount) * 0.05,
                        totalAmount: Number(fi.amount) * 1.05
                    }))
                }
            }
        });
    }
    console.log('✅ Created Invoices and Fee Calculations');

    console.log('\n=====================================');
    console.log('🎉 STUDENTS & FEES SEEDING COMPLETE!');
    console.log('=====================================\n');
}

main()
    .catch((e) => {
        console.error('❌ Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
