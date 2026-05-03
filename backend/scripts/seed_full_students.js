const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding Comprehensive Student Data...');

    // 1. Ensure we have an Admin User for 'recordedBy' and a default Role
    const studentRole = await prisma.role.upsert({
        where: { name: 'Student' },
        update: {},
        create: {
            name: 'Student',
            description: 'Regular student role',
            isSystemRole: true
        }
    });

    // 2. Ensure we have at least one Program and Class
    let program = await prisma.program.findFirst();
    if (!program) {
        program = await prisma.program.create({
            data: {
                code: 'HND-COMP-2026',
                nameAr: 'دبلوم عالٍ في الحوسبة',
                nameEn: 'Higher National Diploma in Computing',
                durationMonths: 24,
                totalUnits: 15,
                isActive: true
            }
        });
        console.log('✅ Created default Program');
    }

    let academicYear = await prisma.academicYear.findFirst();
    if (!academicYear) {
        academicYear = await prisma.academicYear.create({
            data: {
                name: '2026-2027',
                startDate: new Date('2026-09-01'),
                endDate: new Date('2027-06-30'),
                isActive: true
            }
        });
    }

    let classInstance = await prisma.class.findFirst();
    if (!classInstance) {
        classInstance = await prisma.class.create({
            data: {
                code: 'HND-26-A',
                name: 'HND Computing - Group A',
                programId: program.id,
                academicYearId: academicYear.id,
                startDate: new Date('2026-09-15'),
                durationMonths: 12,
                status: 'active',
                studyMode: 'IN_PERSON',
                classroom: 'Lab 101'
            }
        });
        console.log('✅ Created default Class');
    }

    const passwordHash = await bcrypt.hash('Student@123', 10);

    const studentsToSeed = [
        {
            studentNumber: 'S20260001',
            firstNameAr: 'أحمد',
            lastNameAr: 'منصور',
            firstNameEn: 'Ahmed',
            lastNameEn: 'Mansour',
            email: 'ahmed.mansour@example.com',
            gender: 'male',
            nationality: 'Egyptian',
            nationalId: '29001011234567',
            phone: '+971501112233',
            phone2: '+971551112233',
            admissionDate: '2026-02-01',
            specialization: 'Software Engineering',
            qualificationLevel: 'Level 5',
            tuitionFee: 25000,
            registrationFee: 1000,
            initialPay: 5000,
            installments: 10
        },
        {
            studentNumber: 'S20260002',
            firstNameAr: 'سارة',
            lastNameAr: 'العتيبي',
            firstNameEn: 'Sara',
            lastNameEn: 'Al-Otaibi',
            email: 'sara.otaibi@example.com',
            gender: 'female',
            nationality: 'Saudi',
            nationalId: '1098765432',
            phone: '+966509998877',
            phone2: '+966559998877',
            admissionDate: '2026-02-02',
            specialization: 'Cybersecurity',
            qualificationLevel: 'Level 5',
            tuitionFee: 30000,
            registrationFee: 1500,
            initialPay: 7000,
            installments: 8
        },
        {
            studentNumber: 'S20260003',
            firstNameAr: 'يوسف',
            lastNameAr: 'الهاشمي',
            firstNameEn: 'Yousef',
            lastNameEn: 'Al-Hashimi',
            email: 'yousef.hashimi@example.com',
            gender: 'male',
            nationality: 'Emirati',
            nationalId: '784-1995-1234567-1',
            phone: '+971502223344',
            admissionDate: '2026-02-03',
            specialization: 'Network Engineering',
            qualificationLevel: 'Level 4',
            tuitionFee: 22000,
            registrationFee: 1000,
            initialPay: 3000,
            installments: 12
        },
        {
            studentNumber: 'S20260004',
            firstNameAr: 'مريم',
            lastNameAr: 'خالد',
            firstNameEn: 'Mariam',
            lastNameEn: 'Khaled',
            email: 'mariam.khaled@example.com',
            gender: 'female',
            nationality: 'Jordanian',
            nationalId: '9902034567',
            phone: '+962791112233',
            admissionDate: '2026-02-04',
            specialization: 'Data Science',
            qualificationLevel: 'Level 5',
            tuitionFee: 28000,
            registrationFee: 1200,
            initialPay: 10000,
            installments: 6
        },
        {
            studentNumber: 'S20260005',
            firstNameAr: 'عمر',
            lastNameAr: 'فاروق',
            firstNameEn: 'Omar',
            lastNameEn: 'Farouk',
            email: 'omar.farouk@example.com',
            gender: 'male',
            nationality: 'Egyptian',
            nationalId: '29505051234567',
            phone: '+971503334455',
            admissionDate: '2026-02-05',
            specialization: 'AI & Robotics',
            qualificationLevel: 'Level 5',
            tuitionFee: 32000,
            registrationFee: 2000,
            initialPay: 15000,
            installments: 4
        }
    ];

    for (const s of studentsToSeed) {
        try {
            // Create Student & User
            const student = await prisma.student.upsert({
                where: { studentNumber: s.studentNumber },
                update: {},
                create: {
                    studentNumber: s.studentNumber,
                    firstNameAr: s.firstNameAr,
                    lastNameAr: s.lastNameAr,
                    firstNameEn: s.firstNameEn,
                    lastNameEn: s.lastNameEn,
                    email: s.email,
                    gender: s.gender,
                    nationality: s.nationality,
                    nationalId: s.nationalId,
                    phone: s.phone,
                    phone2: s.phone2,
                    enrollmentDate: new Date(s.admissionDate),
                    specialization: s.specialization,
                    qualificationLevel: s.qualificationLevel,
                    status: 'active',
                    user: {
                        create: {
                            username: s.studentNumber,
                            email: s.email,
                            passwordHash: passwordHash,
                            firstName: s.firstNameEn,
                            lastName: s.lastNameEn,
                            phone: s.phone,
                            isActive: true
                        }
                    }
                }
            });

            // Role assignment
            await prisma.userRole.create({
                data: {
                    userId: student.userId,
                    roleId: studentRole.id,
                    scopeType: 'global'
                }
            });

            // Enrollment
            await prisma.studentEnrollment.upsert({
                where: {
                    studentId_classId: {
                        studentId: student.id,
                        classId: classInstance.id
                    }
                },
                update: {},
                create: {
                    studentId: student.id,
                    classId: classInstance.id,
                    enrollmentDate: new Date(),
                    status: 'active'
                }
            });

            // Financials (Simplified logic mimic'ing controller)
            const VAT_RATE = 0.15;
            const taxableAmount = s.tuitionFee + s.registrationFee;
            const taxAmount = taxableAmount * VAT_RATE;
            const totalAmount = taxableAmount + taxAmount;
            const balance = totalAmount - s.initialPay;

            const calculation = await prisma.studentFeeCalculation.create({
                data: {
                    studentId: student.id,
                    calculationNumber: `CALC-${s.studentNumber}-${Date.now()}`,
                    title: `Academic Fees 2026`,
                    programId: program.id,
                    subtotal: taxableAmount,
                    taxAmount: taxAmount,
                    totalAmount: totalAmount,
                    paidAmount: s.initialPay,
                    balance: balance,
                    currency: 'SAR',
                    status: balance <= 0 ? 'PAID' : (s.initialPay > 0 ? 'PARTIAL' : 'PENDING'),
                    issueDate: new Date()
                }
            });

            // Fee Items
            await prisma.feeCalculationItem.createMany({
                data: [
                    {
                        calculationId: calculation.id,
                        name: 'Registration Fee',
                        nameAr: 'رسوم التسجيل',
                        amount: s.registrationFee,
                        type: 'REGISTRATION'
                    },
                    {
                        calculationId: calculation.id,
                        name: 'Tuition Fees',
                        nameAr: 'الرسوم الدراسية',
                        amount: s.tuitionFee,
                        type: 'TUITION'
                    }
                ]
            });

            // Installment Plan
            if (balance > 0 && s.installments > 0) {
                const installmentAmount = balance / s.installments;
                const installmentsData = [];
                for (let i = 0; i < s.installments; i++) {
                    const dueDate = new Date();
                    dueDate.setMonth(dueDate.getMonth() + i + 1);
                    installmentsData.push({
                        installmentNumber: i + 1,
                        dueDate: dueDate,
                        amount: installmentAmount,
                        status: 'PENDING',
                        paidAmount: 0,
                        balance: installmentAmount
                    });
                }

                await prisma.installmentPlan.create({
                    data: {
                        calculationId: calculation.id,
                        name: `${s.installments} Monthly Installments`,
                        nameAr: `${s.installments} أقساط شهرية`,
                        totalAmount: balance,
                        numberOfMonths: s.installments,
                        installmentAmount: installmentAmount,
                        startDate: new Date(),
                        endDate: installmentsData[installmentsData.length - 1].dueDate,
                        isActive: true,
                        installments: {
                            createMany: {
                                data: installmentsData
                            }
                        }
                    }
                });
            }

            console.log(`✅ Seeded student: ${s.firstNameEn} (${s.studentNumber})`);
        } catch (err) {
            console.error(`❌ Error seeding student ${s.studentNumber}:`, err.message);
        }
    }

    console.log('\n🎉 Finished seeding students!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
