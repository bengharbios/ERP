import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { AuthRequest } from '../../common/utils/jwt';
import {
    createStudentSchema,
    updateStudentSchema,
} from './students.validation';
import { ProgressService } from '../academic/progress.service';

// Create Student
export const createStudent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createStudentSchema.parse(req.body);
        console.log('--- Creating Student Request ---', { studentNumber: validatedData.studentNumber });

        // Auto-generate student number if not provided
        if (!validatedData.studentNumber) {
            const currentYear = new Date().getFullYear();
            const count = await prisma.student.count();
            validatedData.studentNumber = `S${currentYear}${String(count + 1).padStart(4, '0')}`; // e.g., S20260001
        }

        // Set admission date to today if not provided
        if (!validatedData.admissionDate) {
            validatedData.admissionDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        }

        // Check if student number already exists
        const existing = await prisma.student.findUnique({
            where: { studentNumber: validatedData.studentNumber },
        });

        if (existing) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'STUDENT_EXISTS',
                    message: 'Student with this student number already exists',
                },
            });
            return;
        }

        // Create student with User account
        // Create student with User account
        const { hashPassword } = await import('../../common/utils/password'); // Dynamic import to avoid top-level circle or just convenient
        const defaultPassword = await hashPassword('Student@123'); // Default password
        const userEmail = validatedData.email || `${validatedData.studentNumber!.toLowerCase()}@institute.local`;

        // Sanitize data for Student model using strict whitelist
        const studentData = {
            firstNameAr: validatedData.firstNameAr,
            lastNameAr: validatedData.lastNameAr,
            firstNameEn: validatedData.firstNameEn,
            lastNameEn: validatedData.lastNameEn,
            fullNameId: validatedData.fullNameId,
            fullNamePassport: validatedData.fullNamePassport,
            certificateName: validatedData.certificateName,
            gender: validatedData.gender,
            nationality: validatedData.nationality,
            nationalId: validatedData.nationalId,
            passportNumber: validatedData.passportNumber,
            passportExpiryDate: validatedData.passportExpiryDate ? new Date(validatedData.passportExpiryDate) : null,
            address: validatedData.address,
            city: validatedData.city,
            country: validatedData.country,
            phone: validatedData.phone, // Saving to Student table as well
            phone2: validatedData.phone2,
            email: validatedData.email, // Saving to Student table as well
            emergencyContactName: validatedData.emergencyContactName,
            emergencyContactPhone: validatedData.emergencyContactPhone,
            registrationNumberPearson: validatedData.registrationNumberPearson,
            enrolmentNumberAlsalam: validatedData.enrolmentNumberAlsalam,
            registrationDateAlsalam: validatedData.registrationDateAlsalam ? new Date(validatedData.registrationDateAlsalam) : null,
            specialization: validatedData.specialization,
            certificateCourseTitle: validatedData.certificateCourseTitle,
            notificationCourseTitle: validatedData.notificationCourseTitle,
            qualificationLevel: validatedData.qualificationLevel,
            awardType: validatedData.awardType,
            yearOfAward: validatedData.yearOfAward,
            platformUsername: validatedData.platformUsername,
            platformPassword: validatedData.platformPassword,
            isTaxExempt: validatedData.isTaxExempt || false,
        };

        const student = await prisma.student.create({
            data: {
                ...studentData,
                studentNumber: validatedData.studentNumber, // Explicitly set
                dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
                enrollmentDate: validatedData.admissionDate ? new Date(validatedData.admissionDate) : new Date(),
                status: validatedData.status, // Normalized by Zod preprocess
                user: {
                    create: {
                        username: validatedData.studentNumber!,
                        email: userEmail,
                        passwordHash: defaultPassword,
                        firstName: validatedData.firstNameEn,
                        lastName: validatedData.lastNameEn,
                        phone: validatedData.phone, // Pass phone from validatedData
                        isActive: true,
                    }
                }
            },
        });

        // === ENROLLMENT LOGIC START ===
        // If classId is provided, enroll the student
        if (validatedData.classId) {
            try {
                // Check if class exists
                const classExists = await prisma.class.findUnique({
                    where: { id: validatedData.classId },
                });

                if (classExists) {
                    const enrollment = await prisma.studentEnrollment.create({
                        data: {
                            studentId: student.id,
                            classId: validatedData.classId,
                            enrollmentDate: new Date(),
                            status: 'enrolled',
                        },
                    });

                    // Initialize unit progress
                    await ProgressService.initializeProgress(student.id, enrollment.id, validatedData.classId);

                    console.log(`✅ Student ${student.studentNumber} automatically enrolled and progress initialized in class ${classExists.code}`);
                } else {
                    console.warn(`⚠️ Class ID ${validatedData.classId} provided but not found. Skipping enrollment.`);
                }
            } catch (enrollError) {
                console.error("❌ Failed to auto-enroll student:", enrollError);
                // Don't fail the request, just log it
            }
        }
        // === ENROLLMENT LOGIC END ===

        // === FINANCIAL LOGIC START ===
        if (
            validatedData.tuitionFee ||
            validatedData.registrationFee ||
            validatedData.initialPayment
        ) {
            try {
                const tuitionRaw = validatedData.tuitionFee || 0;
                const regFee = validatedData.registrationFee || 0;
                const initialPay = validatedData.initialPayment || 0;
                const numInstallments = validatedData.installmentCount || 1;
                const firstInstDate = validatedData.firstInstallmentDate ? new Date(validatedData.firstInstallmentDate) : new Date();

                // 1. Calculate Discount
                let discountAmt = 0;
                if (validatedData.discountValue && validatedData.discountValue > 0) {
                    if (validatedData.discountType === 'percentage') {
                        discountAmt = tuitionRaw * (validatedData.discountValue / 100);
                    } else {
                        discountAmt = validatedData.discountValue;
                    }
                }
                const netTuition = Math.max(0, tuitionRaw - discountAmt);
                // 1. Calculate Discount (on Tuition only)
                // ... (Discount logic kept same, handled by existing code above) ...

                // NEW: Calculate VAT (15%)
                // Taxable Base = Net Tuition + Registration Fee (Standard)
                // Note: Scholarship/Discount reduces the taxable tuition base.
                // Calculate VAT dynamically based on settings
                const settings = await prisma.settings.findFirst({ where: { id: 'singleton' } });
                const isTaxEnabled = settings?.taxEnabled ?? false;
                const isExempt = validatedData.isTaxExempt ?? false;
                const taxRatePercent = settings?.taxRate ? Number(settings.taxRate) : 15;
                const VAT_RATE = (isTaxEnabled && !isExempt) ? (taxRatePercent / 100) : 0;
                const taxableAmount = netTuition + regFee;
                const taxAmount = taxableAmount * VAT_RATE;

                // 2. Calculate Totals
                const subtotal = tuitionRaw + regFee;
                const totalAmount = netTuition + regFee + taxAmount; // Include Tax
                const balance = totalAmount - initialPay;

                // Create Fee Calculation
                const calculation = await prisma.studentFeeCalculation.create({
                    data: {
                        studentId: student.id,
                        calculationNumber: `CALC-${student.studentNumber}-${Date.now()}`,
                        title: `Fees for ${new Date().getFullYear()}`,
                        programId: validatedData.programId,
                        subtotal: subtotal,
                        discountAmount: discountAmt,
                        scholarshipAmount: 0,
                        taxAmount: taxAmount, // Store VAT
                        totalAmount: totalAmount,
                        paidAmount: initialPay,
                        balance: balance,
                        currency: 'AED',
                        status: balance <= 0 ? 'PAID' : (initialPay > 0 ? 'PARTIAL' : 'PENDING'),
                        issueDate: new Date(),
                        feeItems: {
                            create: [
                                ...(regFee > 0 ? [{
                                    name: 'Registration Fee',
                                    nameAr: 'رسوم التسجيل',
                                    amount: regFee,
                                    type: 'REGISTRATION' as const,
                                    // isTaxable: true // Temporarily disabled until Prisma generate succeeds
                                }] : []),
                                ...(tuitionRaw > 0 ? [{
                                    name: 'Tuition Fees',
                                    nameAr: 'الرسوم الدراسية',
                                    amount: tuitionRaw,
                                    type: 'TUITION' as const,
                                    // isTaxable: true // Temporarily disabled until Prisma generate succeeds
                                }] : [])
                                // We don't necessarily need a separate "Tax Item" if handled in UI via taxAmount
                            ]
                        }
                    }
                });

                // Create Discount Record if exists
                if (discountAmt > 0) {
                    await prisma.feeCalculationDiscount.create({
                        data: {
                            calculationId: calculation.id,
                            name: 'Scholarship / Discount',
                            nameAr: 'منحة / خصم',
                            type: validatedData.discountType === 'percentage' ? 'PERCENTAGE' : 'FIXED_AMOUNT',
                            percentage: validatedData.discountType === 'percentage' ? validatedData.discountValue : null,
                            fixedAmount: validatedData.discountType === 'fixed' ? validatedData.discountValue : null,
                            calculatedAmount: discountAmt,
                            isScholarship: true // Assuming generic scholarship
                        }
                    });
                }

                // 3. Generate Installments

                if (numInstallments && numInstallments > 0 && balance > 0) {
                    // Get user preference
                    const includeReg = validatedData.includeRegistrationInInstallments !== undefined ? validatedData.includeRegistrationInInstallments : true;

                    // Calculate Full Portions with Tax (for reconciliation)
                    const regFeeTotalWithTax = regFee * (1 + VAT_RATE);
                    const tuitionTotalWithTax = netTuition * (1 + VAT_RATE);

                    const installmentsData: any[] = [];
                    const startDate = firstInstDate ? new Date(firstInstDate) : new Date();

                    if (!includeReg && regFeeTotalWithTax > 0.01) {
                        // === Option B: Separate Reg Fee ===
                        const regDate = validatedData.registrationFeeDate ? new Date(validatedData.registrationFeeDate) : startDate;
                        installmentsData.push({
                            installmentNumber: 0,
                            amount: regFeeTotalWithTax,
                            dueDate: regDate,
                            notes: 'Registration Fee'
                        });

                        // Tuition Installments
                        const monthlyAmount = tuitionTotalWithTax / numInstallments;
                        for (let i = 0; i < numInstallments; i++) {
                            const d = new Date(startDate);
                            d.setMonth(d.getMonth() + i);
                            installmentsData.push({
                                installmentNumber: i + 1,
                                amount: monthlyAmount,
                                dueDate: d,
                                notes: 'Tuition Installment'
                            });
                        }
                    } else {
                        // === Option A: Lump Sum ===
                        const monthlyAmount = totalAmount / numInstallments;
                        for (let i = 0; i < numInstallments; i++) {
                            const d = new Date(startDate);
                            d.setMonth(d.getMonth() + i);
                            installmentsData.push({
                                installmentNumber: i + 1,
                                amount: monthlyAmount,
                                dueDate: d
                            });
                        }
                    }

                    let planName = `${numInstallments} Installments`;
                    if (!includeReg && regFeeTotalWithTax > 0.01) planName += " + Reg Fee";

                    // --- AUTO-RECONCILE NEW PLAN WITH INITIAL PAYMENT ---
                    let remainingToApply = initialPay;
                    const reconciledInstallments = installmentsData.map(inst => {
                        const amt = Number(inst.amount);
                        const paid = Math.min(remainingToApply, amt);
                        const instBal = Math.max(0, amt - paid);
                        remainingToApply -= paid;

                        return {
                            ...inst,
                            paidAmount: paid,
                            balance: instBal,
                            status: instBal <= 0.01 ? 'PAID' : (paid > 0.01 ? 'PARTIAL' : 'PENDING')
                        };
                    });

                    await prisma.installmentPlan.create({
                        data: {
                            calculationId: calculation.id,
                            name: planName,
                            nameAr: planName,
                            totalAmount: totalAmount,
                            numberOfMonths: numInstallments,
                            installmentAmount: totalAmount / (installmentsData.length || 1),
                            startDate: installmentsData.length > 0 ? installmentsData[0].dueDate : startDate,
                            endDate: installmentsData.length > 0 ? installmentsData[installmentsData.length - 1].dueDate : startDate,
                            dayOfMonth: startDate.getDate(),
                            isActive: true,
                            installments: {
                                create: reconciledInstallments.map(inst => ({
                                    installmentNumber: inst.installmentNumber,
                                    amount: inst.amount,
                                    dueDate: inst.dueDate,
                                    status: inst.status,
                                    paidAmount: inst.paidAmount,
                                    balance: inst.balance,
                                    notes: inst.notes
                                }))
                            }
                        }
                    });

                }

                console.log(`✅ Financial records created for student ${student.studentNumber}`);

            } catch (finError: any) {
                console.error("❌ Failed to create financial records:", finError);
                // We don't block student creation, just log error
            }
        }
        // === FINANCIAL LOGIC END ===

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'STUDENT_CREATED',
                    resourceType: 'Student',
                    resourceId: student.id,
                    afterData: {
                        studentNumber: student.studentNumber,
                        name: `${student.firstNameEn} ${student.lastNameEn}`,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.status(201).json({
            success: true,
            data: { student },
        });
    } catch (error: any) {
        if (error instanceof Error) {
            console.error('Create student error:', error.message);
            console.error(error.stack);
        } else {
            console.error('Create student error (unknown):', error.message || error);
        }

        if (error.code === 'P2002') {
            const target = error.meta?.target;
            const field = Array.isArray(target) ? target[0] : target;
            let message = 'Student with this data already exists';

            if (field === 'email') message = 'This email address is already registered';
            if (field === 'student_number') message = 'This student number is already taken';
            if (field === 'national_id') message = 'This National ID is already registered';

            res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ENTRY',
                    message: message,
                    details: error.meta,
                },
            });
            return;
        }

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors,
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: `An error occurred while creating the student: ${error.message}`,
            },
        });
    }
};

// Get All Students
export const getStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, search, classId } = req.query;

        const where: any = {};
        if (status) where.status = (status as string).toLowerCase();

        // Search by name or student number
        if (search) {
            where.OR = [
                { studentNumber: { contains: search as string } },
                { firstNameEn: { contains: search as string } },
                { lastNameEn: { contains: search as string } },
                { firstNameAr: { contains: search as string } },
                { lastNameAr: { contains: search as string } },
            ];
        }

        // Filter by class
        if (classId) {
            where.enrollments = {
                some: {
                    classId: classId as string,
                    status: 'enrolled',
                },
            };
        }

        const students = await prisma.student.findMany({
            where,
            include: {
                user: {
                    select: {
                        email: true,
                        phone: true,
                        firstName: true,
                        lastName: true
                    }
                },
                _count: {
                    select: {
                        enrollments: true,
                        attendanceRecords: true,
                        studentParents: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({
            success: true,
            data: {
                students,
                total: students.length,
            },
        });
    } catch (error: any) {
        console.error('Get students error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching students',
            },
        });
    }
};

// Get Student by ID
export const getStudentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                enrollments: {
                    include: {
                        class: {
                            select: {
                                id: true,
                                programId: true,
                                code: true,
                                name: true,
                                startDate: true,
                                status: true,
                                program: {
                                    select: {
                                        id: true,
                                        code: true,
                                        nameEn: true,
                                        nameAr: true,
                                        programUnits: {
                                            include: {
                                                unit: {
                                                    select: {
                                                        id: true,
                                                        code: true,
                                                        nameAr: true,
                                                        nameEn: true,
                                                        creditHours: true
                                                    }
                                                }
                                            }
                                        }
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        enrollmentDate: 'desc',
                    },
                },
                studentParents: {
                    include: {
                        parent: true
                    }
                },
                _count: {
                    select: {
                        attendanceRecords: true,
                        studentAssignments: true,
                    },
                },
                feeCalculations: {
                    include: {
                        feeItems: true,
                        installmentPlans: {
                            include: {
                                installments: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    },
                    take: 1
                }
            },
        });

        if (!student) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'STUDENT_NOT_FOUND',
                    message: 'Student not found',
                },
            });
            return;
        }

        res.json({
            success: true,
            data: { student },
        });
    } catch (error: any) {
        console.error('Get student error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching the student',
            },
        });
    }
};

// Update Student
export const updateStudent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        console.log('Update Student Request Body:', JSON.stringify(req.body, null, 2));
        const validatedData = updateStudentSchema.parse(req.body);

        const existing = await prisma.student.findUnique({
            where: { id },
            include: { enrollments: { where: { status: 'enrolled' } } }
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'STUDENT_NOT_FOUND',
                    message: 'Student not found',
                },
            });
            return;
        }

        // Check if student number is being changed and already exists
        if (validatedData.studentNumber && validatedData.studentNumber !== existing.studentNumber) {
            const numberExists = await prisma.student.findUnique({
                where: { studentNumber: validatedData.studentNumber },
            });

            if (numberExists) {
                res.status(409).json({
                    success: false,
                    error: {
                        code: 'STUDENT_NUMBER_EXISTS',
                        message: 'Student number already exists',
                    },
                });
                return;
            }
        }

        // === SAFE TRANSFER LOGIC (CHECK FOR CLASS CHANGE) ===
        if (validatedData.classId) {
            const currentEnrollment = existing.enrollments[0]; // Assuming one active enrollment

            // If enrolling in a new class and user has an existing active class
            if (currentEnrollment && currentEnrollment.classId !== validatedData.classId) {
                // Check for dependencies in the OLD class
                const activityCount = await prisma.attendanceRecord.count({
                    where: {
                        studentId: id,
                        lecture: {
                            classId: currentEnrollment.classId
                        }
                    }
                });

                if (activityCount > 0) {
                    // BLOCK TRANSFER
                    res.status(400).json({
                        success: false,
                        error: {
                            code: 'CANNOT_TRANSFER_ACTIVE_STUDENT',
                            message: 'Cannot transfer student directly: Attendance records exist in current class. Please drop/complete current enrollment first.',
                        },
                    });
                    return;
                } else {
                    // SAFE TO TRANSFER - Update existing enrollment
                    await prisma.studentEnrollment.update({
                        where: { id: currentEnrollment.id },
                        data: {
                            classId: validatedData.classId,
                            enrollmentDate: new Date() // Reset date or keep? Usually reset for new class
                        }
                    });
                }
            } else if (!currentEnrollment) {
                // No ACTIVE enrollment found.
                // Check if ANY enrollment exists (e.g., withdrawn, completed, or different status)
                const existingEnrollmentInClass = await prisma.studentEnrollment.findUnique({
                    where: {
                        studentId_classId: {
                            studentId: id,
                            classId: validatedData.classId
                        }
                    }
                });

                if (existingEnrollmentInClass) {
                    console.log('Found existing non-active enrollment, reactivating:', existingEnrollmentInClass.id);
                    // Reactivate existing enrollment
                    await prisma.studentEnrollment.update({
                        where: { id: existingEnrollmentInClass.id },
                        data: {
                            status: 'enrolled',
                            enrollmentDate: new Date()
                        }
                    });
                } else {
                    // Create NEW enrollment
                    const classExists = await prisma.class.findUnique({ where: { id: validatedData.classId } });
                    if (classExists) {
                        await prisma.studentEnrollment.create({
                            data: {
                                studentId: id,
                                classId: validatedData.classId,
                                enrollmentDate: new Date(),
                                status: 'enrolled'
                            }
                        });
                    }
                }
            }
        }
        // === END SAFE TRANSFER LOGIC ===

        // Prepare update data
        const {
            username, classId, programId,
            tuitionFee, registrationFee, initialPayment,
            installmentCount, firstInstallmentDate,
            discountType, discountValue,
            includeRegistrationInInstallments,
            deductInitialPaymentFromInstallments,
            registrationFeeDate,
            admissionDate, // Not a field in Student model
            ...cleanData
        } = validatedData;
        const updateData: any = { ...cleanData };

        if (validatedData.dateOfBirth) {
            updateData.dateOfBirth = new Date(validatedData.dateOfBirth);
        }

        if (validatedData.passportExpiryDate) {
            updateData.passportExpiryDate = new Date(validatedData.passportExpiryDate);
        } else if (validatedData.passportExpiryDate === '') {
            updateData.passportExpiryDate = null;
        }

        if (validatedData.registrationDateAlsalam) {
            updateData.registrationDateAlsalam = new Date(validatedData.registrationDateAlsalam);
        }

        if (validatedData.enrollmentDate) {
            updateData.enrollmentDate = new Date(validatedData.enrollmentDate);
        }

        console.log('Final Update Data:', updateData);

        const student = await prisma.student.update({
            where: { id },
            data: updateData,
        });

        // Update Class Enrollment if classId is provided
        if (classId) {
            // Find current active enrollment
            const currentEnrollment = await prisma.studentEnrollment.findFirst({
                where: { studentId: id, status: 'enrolled' }
            });

            // If class changed, update or create enrollment
            if (!currentEnrollment || currentEnrollment.classId !== classId) {
                // Mark old enrollment as completed if exists
                if (currentEnrollment) {
                    await prisma.studentEnrollment.update({
                        where: { id: currentEnrollment.id },
                        data: { status: 'dropped' }
                    });
                }

                // Create new enrollment
                const enrollment = await prisma.studentEnrollment.create({
                    data: {
                        studentId: id,
                        classId: classId,
                        enrollmentDate: updateData.enrollmentDate || new Date(),
                        status: 'enrolled' // Changed from 'active' to 'enrolled' to stay consistent
                    }
                });

                // Initialize unit progress
                await ProgressService.initializeProgress(id, enrollment.id, classId);

                console.log(`Updated student ${id} enrollment to class ${classId} and initialized progress`);
            }
        }

        // Update Financial Data if any financial fields are provided
        if (tuitionFee !== undefined || registrationFee !== undefined || discountValue !== undefined || initialPayment !== undefined) {
            console.log('Financial update requested for student:', id);

            const tuitionRaw = tuitionFee || 0;
            const regFee = registrationFee || 0;
            const initialPay = initialPayment || 0;

            // Calculate discount
            let discountAmt = 0;
            if (discountValue && discountValue > 0) {
                if (discountType === 'percentage') {
                    discountAmt = tuitionRaw * (discountValue / 100);
                } else {
                    discountAmt = discountValue;
                }
            }
            const netTuition = Math.max(0, tuitionRaw - discountAmt);

            // Calculate VAT (15%)
            // Calculate VAT dynamically based on settings
            const settings = await prisma.settings.findFirst({ where: { id: 'singleton' } });
            const isTaxEnabled = settings?.taxEnabled ?? false;
            const isExempt = validatedData.isTaxExempt ?? existing.isTaxExempt ?? false;
            const taxRatePercent = settings?.taxRate ? Number(settings.taxRate) : 15;
            const VAT_RATE = (isTaxEnabled && !isExempt) ? (taxRatePercent / 100) : 0;
            const taxableAmount = netTuition + regFee;
            const taxAmount = taxableAmount * VAT_RATE;

            // Calculate totals
            const subtotal = tuitionRaw + regFee;
            const totalAmount = netTuition + regFee + taxAmount;
            const balance = totalAmount - initialPay;

            // Find existing calculation or create new one
            const existingCalculation = await prisma.studentFeeCalculation.findFirst({
                where: { studentId: id },
                orderBy: { createdAt: 'desc' }
            });

            // 15-digit limit check for security/crash prevention
            // DB Decimal(10,2) max value is 99,999,999.99
            if (subtotal > 90000000 || totalAmount > 90000000) {
                console.warn(`⚠️ Financial update skipped: Amount too large for DB (Subtotal: ${subtotal})`);
                // We don't throw error to avoid crashing the whole update, just skip financial update
            } else {
                let finalCalculationId: string;

                if (existingCalculation) {
                    finalCalculationId = existingCalculation.id;

                    // Preserve existing internal notes
                    let notesObj: any = {};
                    try {
                        notesObj = existingCalculation.internalNotes ? JSON.parse(existingCalculation.internalNotes) : {};
                    } catch (e) {
                        // If not JSON, keep as string in a property or ignore? Let's ignore old string content for now or wrap it.
                        // Assuming it's empty or JSON for this new feature.
                    }
                    if (includeRegistrationInInstallments !== undefined) {
                        notesObj.includeRegistrationInInstallments = includeRegistrationInInstallments;
                    }

                    // Update existing calculation
                    await prisma.studentFeeCalculation.update({
                        where: { id: existingCalculation.id },
                        data: {
                            subtotal,
                            discountAmount: discountAmt,
                            taxAmount,
                            totalAmount,
                            paidAmount: initialPay,
                            balance,
                            internalNotes: JSON.stringify(notesObj),
                            status: balance <= 0 ? 'PAID' : (initialPay > 0 ? 'PARTIAL' : 'PENDING')
                        }
                    });

                    // Update fee items
                    await prisma.feeCalculationItem.deleteMany({
                        where: { calculationId: existingCalculation.id }
                    });

                    await prisma.feeCalculationItem.createMany({
                        data: [
                            ...(regFee > 0 ? [{
                                calculationId: existingCalculation.id,
                                name: 'Registration Fee',
                                nameAr: 'رسوم التسجيل',
                                amount: regFee,
                                type: 'REGISTRATION' as const,
                                // isIncludedInTuition: false,
                                // isTaxable: true
                            }] : []),
                            ...(tuitionRaw > 0 ? [{
                                calculationId: existingCalculation.id,
                                name: 'Tuition Fees',
                                nameAr: 'الرسوم الدراسية',
                                amount: tuitionRaw,
                                type: 'TUITION' as const,
                                // isIncludedInTuition: true,
                                // isTaxable: true
                            }] : [])
                        ]
                    });

                    console.log(`✅ Updated financial calculation for student ${id}`);
                } else {
                    // Create new calculation if none exists
                    const notesObj = { includeRegistrationInInstallments: includeRegistrationInInstallments ?? false };

                    const newCalculation = await prisma.studentFeeCalculation.create({
                        data: {
                            studentId: id,
                            calculationNumber: `CALC-${student.studentNumber}-${Date.now()}`,
                            title: `Fees for ${new Date().getFullYear()}`,
                            programId: programId || null,
                            subtotal,
                            discountAmount: discountAmt,
                            scholarshipAmount: 0,
                            taxAmount,
                            totalAmount,
                            paidAmount: initialPay,
                            balance,
                            currency: 'AED',
                            status: balance <= 0 ? 'PAID' : (initialPay > 0 ? 'PARTIAL' : 'PENDING'),
                            internalNotes: JSON.stringify(notesObj),
                            issueDate: new Date(),
                            feeItems: {
                                create: [
                                    ...(regFee > 0 ? [{
                                        name: 'Registration Fee',
                                        nameAr: 'رسوم التسجيل',
                                        amount: regFee,
                                        type: 'REGISTRATION' as const,
                                        // isIncludedInTuition: false,
                                        // isTaxable: true
                                    }] : []),
                                    ...(tuitionRaw > 0 ? [{
                                        name: 'Tuition Fees',
                                        nameAr: 'الرسوم الدراسية',
                                        amount: tuitionRaw,
                                        type: 'TUITION' as const,
                                        // isIncludedInTuition: true,
                                        // isTaxable: true
                                    }] : [])
                                ]
                            }
                        }
                    });
                    finalCalculationId = newCalculation.id;
                    console.log(`✅ Created new financial calculation for student ${id}:`, newCalculation.id);
                }

                // === Handle Installment Plan ===
                // === Handle Installment Plan ===
                if (installmentCount && installmentCount > 0 && balance > 0) {
                    // Delete existing plan if any
                    await prisma.installmentPlan.deleteMany({
                        where: { calculationId: finalCalculationId }
                    });

                    // Determine if using existing value or new value for includeRegistration
                    let includeReg = includeRegistrationInInstallments;
                    if (includeReg === undefined) {
                        try {
                            // Fallback to existing calculation notes if available
                            if (existingCalculation?.internalNotes) {
                                const notes = JSON.parse(existingCalculation.internalNotes);
                                includeReg = notes.includeRegistrationInInstallments;
                            }
                        } catch (e) {
                            console.warn('Failed to parse existing notes for includeReg setting');
                        }
                    }
                    // Default to TRUE if not specified (Standard behavior)
                    if (includeReg === undefined) includeReg = true;

                    // Calculate Full Portions with Tax (for reconciliation)
                    const regFeeTotalWithTax = regFee * (1 + VAT_RATE);
                    const tuitionTotalWithTax = netTuition * (1 + VAT_RATE);

                    const installmentsData: any[] = [];
                    const startDate = firstInstallmentDate ? new Date(firstInstallmentDate) : new Date();

                    if (!includeReg && regFeeTotalWithTax > 0.01) {
                        // === Option B: Separate Reg Fee ===
                        const regDate = validatedData.registrationFeeDate ? new Date(validatedData.registrationFeeDate) : startDate;
                        installmentsData.push({
                            installmentNumber: 0,
                            amount: regFeeTotalWithTax,
                            dueDate: regDate,
                            notes: 'Registration Fee'
                        });

                        // Tuition Installments
                        const monthlyAmount = tuitionTotalWithTax / installmentCount;
                        for (let i = 0; i < installmentCount; i++) {
                            const dueDate = new Date(startDate);
                            dueDate.setMonth(dueDate.getMonth() + i);
                            installmentsData.push({
                                installmentNumber: i + 1,
                                amount: monthlyAmount,
                                dueDate: dueDate,
                                notes: 'Tuition Installment'
                            });
                        }
                    } else {
                        // === Option A: Lump Sum ===
                        const monthlyAmount = totalAmount / installmentCount;
                        for (let i = 0; i < installmentCount; i++) {
                            const dueDate = new Date(startDate);
                            dueDate.setMonth(dueDate.getMonth() + i);
                            installmentsData.push({
                                installmentNumber: i + 1,
                                amount: monthlyAmount,
                                dueDate: dueDate
                            });
                        }
                    }

                    // Calculate plan name
                    let planName = `${installmentCount} Installments`;
                    if (!includeReg && regFeeTotalWithTax > 0.01) planName += " + Reg Fee";


                    // --- AUTO-RECONCILE NEW PLAN WITH PAID AMOUNT ---
                    // IMPORTANT: We use 'paidAmount' from the calculation (which includes any payments made after registration)
                    // and distribute it across the new installments.
                    let remainingToApply = subtotal + taxAmount - balance; // Total amount paid so far

                    const reconciledInstallments = installmentsData.map(inst => {
                        const amt = Number(inst.amount);
                        const paid = Math.min(remainingToApply, amt);
                        const instBal = Math.max(0, amt - paid);
                        remainingToApply -= paid;

                        return {
                            ...inst,
                            paidAmount: paid,
                            balance: instBal,
                            status: instBal <= 0.01 ? 'PAID' : (paid > 0.01 ? 'PARTIAL' : 'PENDING')
                        };
                    });

                    await prisma.installmentPlan.create({
                        data: {
                            calculationId: finalCalculationId,
                            name: planName,
                            nameAr: planName,
                            totalAmount: balance + (subtotal + taxAmount - balance), // Total including paid
                            numberOfMonths: installmentCount,
                            installmentAmount: (subtotal + taxAmount) / (installmentsData.length || 1),
                            startDate: installmentsData.length > 0 ? installmentsData[0].dueDate : startDate,
                            endDate: installmentsData.length > 0 ? installmentsData[installmentsData.length - 1].dueDate : startDate,
                            dayOfMonth: startDate.getDate(),
                            isActive: true,
                            installments: {
                                create: reconciledInstallments.map(inst => ({
                                    installmentNumber: inst.installmentNumber,
                                    amount: inst.amount,
                                    dueDate: inst.dueDate,
                                    status: inst.status,
                                    paidAmount: inst.paidAmount,
                                    balance: inst.balance,
                                    notes: inst.notes
                                }))
                            }
                        }
                    });
                    console.log(`✅ Created installment plan for calculation ${finalCalculationId} with reconciled payments`);

                }
            }
        }
        // End of update


        // Log action
        if (req.user) {
            try {
                await prisma.auditLog.create({
                    data: {
                        userId: req.user.id,
                        action: 'STUDENT_UPDATED',
                        resourceType: 'Student',
                        resourceId: student.id,
                        beforeData: existing,
                        afterData: student,
                        ipAddress: req.ip,
                        userAgent: req.get('user-agent'),
                    },
                });
            } catch (auditError: any) {
                console.error('Failed to create audit log:', auditError.message || auditError);
                // Do not throw, as the main operation was successful
            }
        }

        res.json({
            success: true,
            data: { student },
        });
    } catch (error: any) {
        console.error('=== UPDATE STUDENT ERROR ===');
        console.error('Error Type:', error.constructor?.name || typeof error);
        console.error('Error Message:', error.message);

        // Safer logging of the error object to avoid node:internal/util/inspect crashes
        try {
            if (error.errors) {
                console.error('Validation Details:', JSON.stringify(error.errors, null, 2));
            } else {
                console.error('Stack Trace:', error.stack || error.message || error);
            }
        } catch (logError) {
            console.error('Could not stringify error details');
        }

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors,
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: `An error occurred while updating the student: ${error.message}`,
                debug: error.message
            },
        });
    }
};

// Delete Student
export const deleteStudent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                enrollments: true,
                attendanceRecords: true,
            },
        });

        if (!student) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'STUDENT_NOT_FOUND',
                    message: 'Student not found',
                },
            });
            return;
        }

        // Check if student has enrollments
        if (student.enrollments.length > 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'STUDENT_HAS_ENROLLMENTS',
                    message: 'Cannot delete student with existing enrollments',
                },
            });
            return;
        }

        await prisma.student.delete({
            where: { id },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'STUDENT_DELETED',
                    resourceType: 'Student',
                    resourceId: id,
                    beforeData: student,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Student deleted successfully' },
        });
    } catch (error: any) {
        console.error('Delete student error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting the student',
            },
        });
    }
};

// ==========================================
// MASTERMIND LOGIC: ACADEMIC RECORD
// ==========================================

// Get Student Academic Record (The Mastermind Logic)
export const getStudentAcademicRecord = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const queryProgramId = req.query.programId as string;

        // 1. جلب الطالب مع كافة بيانات التسجيل والبرامج المرتبطة
        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                enrollments: {
                    include: {
                        class: {
                            include: { program: true }
                        }
                    },
                    orderBy: { enrollmentDate: 'desc' }
                }
            }
        });

        if (!student) {
            res.status(404).json({ success: false, error: { message: 'الطالب غير موجود' } });
            return;
        }

        // ============================================================
        // المنطق الجديد: "الوحدة هي العملة، والفصل هو الوسيلة"
        // ============================================================

        // 1. تحديد البرنامج (من الطالب أو من أول تسجيل)
        let targetProgramId: string | undefined = queryProgramId;
        if (!targetProgramId && student.enrollments.length > 0) {
            const enrollmentWithProgram = student.enrollments.find(e => e.class?.programId);
            targetProgramId = enrollmentWithProgram?.class?.programId;
        }

        if (!targetProgramId) {
            res.status(400).json({
                success: false,
                error: { message: 'لا يمكن تحديد البرنامج الأكاديمي للطالب. يرجى ربط الطالب ببرنامج أو فصل دراسي.' }
            });
            return;
        }

        // 2. جلب هيكل البرنامج الكامل (مصدر الحقيقة)
        const program = await prisma.program.findUnique({
            where: { id: targetProgramId },
            include: {
                programUnits: {
                    include: { unit: true },
                    orderBy: { sequenceOrder: 'asc' }
                }
            }
        });

        if (!program) {
            res.status(404).json({
                success: false,
                error: { message: 'البرنامج الأكاديمي غير موجود' }
            });
            return;
        }

        // 3. جلب سجل الإنجاز الفعلي للطالب (من كل تسجيلاته)
        const allProgress = await prisma.studentUnitProgress.findMany({
            where: { studentId: id },
            orderBy: { updatedAt: 'desc' }
        });
        console.log(`[getStudentAcademicRecord] Found ${allProgress.length} progress records for student ${id}`);

        // 4. جلب معلومات الفصل الحالي (للسياق فقط)
        const activeEnrollments = await prisma.studentEnrollment.findMany({
            where: { studentId: id, status: 'active' },
            include: {
                class: {
                    include: {
                        unitSchedules: {
                            include: { unit: true }
                        }
                    }
                }
            }
        });

        // 5. بناء خريطة الوحدات الحالية (للعرض فقط)
        const currentClassUnitsMap = new Map();
        activeEnrollments.forEach(enrollment => {
            enrollment.class.unitSchedules.forEach(schedule => {
                currentClassUnitsMap.set(schedule.unitId, {
                    className: enrollment.class.name,
                    classCode: enrollment.class.code,
                    startDate: schedule.startDate,
                    endDate: schedule.endDate
                });
            });
        });

        // 6. بناء السجل الأكاديمي النهائي
        console.log(`[getStudentAcademicRecord] Mapping ${program.programUnits.length} program units for student ${id}`);
        console.log(`[getStudentAcademicRecord] Available Progress Unit IDs sample:`, allProgress.slice(0, 5).map(p => p.unitId));

        const academicRecord = program.programUnits.map(pu => {
            const unit = pu.unit;

            // البحث عن أحدث سجل إنجاز لهذه الوحدة (من أي تسجيل سابق أو حالي)
            const latestProgress = allProgress.find(p => p.unitId === unit.id);
            if (latestProgress) {
                console.log(`[getStudentAcademicRecord] ✅ Match found for unit ${unit.code} (${unit.id}): Status=${latestProgress.status}`);
            }

            // معلومات الفصل الحالي (إن وجدت)
            const currentClassInfo = currentClassUnitsMap.get(unit.id);

            // تحديد الحالة بذكاء:
            let status = latestProgress?.status || 'not_started';
            let isCurrent = !!currentClassInfo;

            // إذا كانت الوحدة في الفصل الحالي ولم تُنجز بعد، نعتبرها "مسجلة"
            if (currentClassInfo && status === 'not_started') {
                status = 'scheduled';
            }

            // إذا كانت منجزة أو معفاة، لا تظهر كـ "حالية" حتى لو كانت في الجدول
            if (status === 'completed' || status === 'exempted') {
                isCurrent = false;
            }

            return {
                unitId: unit.id,
                unitCode: unit.code,
                unitNameAr: unit.nameAr,
                unitNameEn: unit.nameEn,
                creditHours: unit.creditHours,
                status: status,
                grade: latestProgress?.grade || null,
                completionDate: latestProgress?.completionDate || null,
                startDate: latestProgress?.startDate || null,
                isCurrent: isCurrent,
                className: currentClassInfo?.className || null,
                classCode: currentClassInfo?.classCode || null
            };
        });

        // 7. حساب الإحصائيات
        const totalUnits = academicRecord.length;
        const completedUnits = academicRecord.filter(u => u.status === 'completed').length;
        const exemptedUnits = academicRecord.filter(u => u.status === 'exempted').length;
        const inProgressUnits = academicRecord.filter(u => u.status === 'in_progress').length;
        const scheduledUnits = academicRecord.filter(u => u.status === 'scheduled').length;
        const missingUnits = academicRecord.filter(u => u.status === 'missing').length;

        const studentFullNameAr = student.firstNameAr ? `${student.firstNameAr} ${student.lastNameAr}` : 'طالب';

        res.json({
            success: true,
            data: {
                studentId: student.id,
                studentName: studentFullNameAr,
                programId: program.id,
                programName: program.nameAr,
                programCode: program.code,
                currentClass: activeEnrollments[0]?.class?.name || null,
                academicRecord,
                statistics: {
                    totalUnits,
                    completedUnits,
                    exemptedUnits,
                    inProgressUnits,
                    scheduledUnits,
                    missingUnits,
                    remainingUnits: totalUnits - completedUnits - exemptedUnits,
                    progressPercentage: totalUnits > 0 ? Math.round(((completedUnits + exemptedUnits) / totalUnits) * 100) : 0
                }
            }
        });

    } catch (error: any) {
        console.error('=== MASTERMIND ERROR ===');
        console.error('Error Message:', error.message);
        try {
            if (error.errors) {
                console.error('Validation Details:', JSON.stringify(error.errors, null, 2));
            } else {
                console.error('Stack Trace:', error.stack || error.message || error);
            }
        } catch (logError) {
            console.error('Could not log error details');
        }

        if (error.code === 'P2002') {
            // Handle unique constraint violation (e.g., duplicate email)
            res.status(409).json({
                success: false,
                error: {
                    code: 'DUPLICATE_ENTRY',
                    message: 'طالب بنفس البريد الإلكتروني أو رقم الهوية موجود بالفعل.',
                },
            });
        } else {
            res.status(500).json({ success: false, error: { message: 'خطأ داخلي في الخادم: ' + error.message } });
        }
    }
};

// Manually Update Unit Status (For Credit Transfer / Exemptions / Corrections)
export const updateStudentUnitStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params; // Student ID
        const { unitId, status, grade } = req.body;

        console.log(`[updateStudentUnitStatus] Request received:`, {
            studentId: id,
            unitId,
            status,
            grade
        });

        if (!id || !unitId || !status) {
            console.error('[updateStudentUnitStatus] Missing required fields');
            res.status(400).json({
                success: false,
                error: { message: 'Missing required fields: id, unitId, or status' }
            });
            return;
        }

        // 1. البحث عن سجل موجود لهذه الوحدة في أي enrollment (الأحدث أولاً)
        // 1. البحث عن سجل موجود لهذه الوحدة في أي enrollment (الأحدث أولاً)
        const existingProgress = await prisma.studentUnitProgress.findFirst({
            where: {
                studentId: id,
                unitId: unitId
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });

        let recordId: string | undefined;

        if (existingProgress) {
            // تحديث السجل الموجود
            console.log(`[updateStudentUnitStatus] Updating existing progress record: ${existingProgress.id}`);
            const updated = await prisma.studentUnitProgress.update({
                where: { id: existingProgress.id },
                data: {
                    status: status,
                    grade: grade,
                    completionDate: (status === 'completed' || status === 'exempted') ? new Date() : null,
                    updatedAt: new Date()
                }
            });
            console.log(`[updateStudentUnitStatus] Record updated:`, updated);
            recordId = updated.id;
        } else {
            // إنشاء سجل جديد - نحتاج enrollment
            console.log(`[updateStudentUnitStatus] No existing record found. Creating new one.`);

            const student = await prisma.student.findUnique({
                where: { id },
                include: {
                    enrollments: {
                        orderBy: { enrollmentDate: 'desc' },
                        take: 1
                    }
                }
            });

            if (!student) {
                console.error(`[updateStudentUnitStatus] Student not found: ${id}`);
                res.status(404).json({ success: false, error: { message: 'Student not found' } });
                return;
            }

            if (student.enrollments.length === 0) {
                console.error(`[updateStudentUnitStatus] No enrollments for student: ${id}`);
                res.status(400).json({
                    success: false,
                    error: { message: 'الطالب يجب أن يكون مسجلاً في فصل دراسي لتحديث السجل الأكاديمي' }
                });
                return;
            }

            const enrollmentId = student.enrollments[0].id;
            console.log(`[updateStudentUnitStatus] Creating new progress record for enrollment: ${enrollmentId}`);

            const created = await prisma.studentUnitProgress.create({
                data: {
                    studentId: id,
                    enrollmentId: enrollmentId,
                    unitId: unitId,
                    status: status,
                    grade: grade,
                    startDate: new Date(),
                    completionDate: (status === 'completed' || status === 'exempted') ? new Date() : null,
                }
            });
            console.log(`[updateStudentUnitStatus] Record created:`, created);
            recordId = created.id;
        }

        // Verify persistence
        const finalRecord = await prisma.studentUnitProgress.findFirst({
            where: { id: recordId },
        });

        console.log(`[updateStudentUnitStatus] Final Verified Record:`, finalRecord);

        res.json({
            success: true,
            message: 'تم تحديث السجل الأكاديمي بنجاح',
            data: finalRecord
        });

    } catch (error: any) {
        console.error('Update unit status error:', error.message || error);
        res.status(500).json({
            success: false,
            error: { message: 'خطأ داخلي: ' + error.message }
        });
    }
};
// Update Student Overall System Status (Active, Frozen, etc.)
export const updateStudentStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        await prisma.student.update({
            where: { id },
            data: { status }
        });

        res.json({ success: true, message: 'تم تحديث حالة الطالب بنجاح' });
    } catch (error: any) {
        console.error('Update student status error:', error.message || error);
        res.status(500).json({ success: false, error: { message: 'خطأ في تحديث الحالة: ' + error.message } });
    }
};
