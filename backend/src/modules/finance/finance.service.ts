import prisma from '../../common/db/prisma';
import { PaymentStatus, Prisma } from '@prisma/client';
import journalService from '../../services/journal.service';
const Decimal = Prisma.Decimal;

// ============================================
// FEE TEMPLATE SERVICE
// ============================================

export const feeTemplateService = {
    // Get all fee templates
    async getAll(programId?: string) {
        return await prisma.feeTemplate.findMany({
            where: programId ? { programId } : undefined,
            include: {
                feeItems: {
                    orderBy: {
                        displayOrder: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },

    // Get fee template by ID
    async getById(id: string) {
        return await prisma.feeTemplate.findUnique({
            where: { id },
            include: {
                feeItems: {
                    orderBy: {
                        displayOrder: 'asc',
                    },
                },
            },
        });
    },

    // Create fee template
    async create(data: any) {
        const { feeItems, ...templateData } = data;

        // Calculate totals
        const totalAmount = feeItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
        const tuitionAmount = feeItems
            .filter((item: any) => item.isIncludedInTuition)
            .reduce((sum: number, item: any) => sum + Number(item.amount), 0);

        // If this is set as default, unset other defaults for the same program
        if (templateData.isDefault && templateData.programId) {
            await prisma.feeTemplate.updateMany({
                where: {
                    programId: templateData.programId,
                    isDefault: true,
                },
                data: {
                    isDefault: false,
                },
            });
        }

        return await prisma.feeTemplate.create({
            data: {
                ...templateData,
                totalAmount,
                tuitionAmount,
                feeItems: {
                    create: feeItems,
                },
            },
            include: {
                feeItems: {
                    orderBy: {
                        displayOrder: 'asc',
                    },
                },
            },
        });
    },

    // Update fee template
    async update(id: string, data: any) {
        const { feeItems, ...templateData } = data;

        let totalAmount = templateData.totalAmount;
        let tuitionAmount = templateData.tuitionAmount;

        // If fee items are provided, recalculate totals
        if (feeItems) {
            totalAmount = feeItems.reduce((sum: number, item: any) => sum + Number(item.amount), 0);
            tuitionAmount = feeItems
                .filter((item: any) => item.isIncludedInTuition)
                .reduce((sum: number, item: any) => sum + Number(item.amount), 0);

            // Delete existing fee items
            await prisma.feeItem.deleteMany({
                where: { templateId: id },
            });
        }

        // If this is set as default, unset other defaults for the same program
        if (templateData.isDefault && templateData.programId) {
            await prisma.feeTemplate.updateMany({
                where: {
                    programId: templateData.programId,
                    isDefault: true,
                    NOT: { id },
                },
                data: {
                    isDefault: false,
                },
            });
        }

        return await prisma.feeTemplate.update({
            where: { id },
            data: {
                ...templateData,
                totalAmount,
                tuitionAmount,
                ...(feeItems && {
                    feeItems: {
                        create: feeItems,
                    },
                }),
            },
            include: {
                feeItems: {
                    orderBy: {
                        displayOrder: 'asc',
                    },
                },
            },
        });
    },

    // Delete fee template
    async delete(id: string) {
        return await prisma.feeTemplate.delete({
            where: { id },
        });
    },
};

// ============================================
// STUDENT FEE CALCULATION SERVICE
// ============================================

export const studentFeeCalculationService = {
    // Generate unique calculation number
    async generateCalculationNumber(): Promise<string> {
        const year = new Date().getFullYear();
        const count = await prisma.studentFeeCalculation.count({
            where: {
                calculationNumber: {
                    startsWith: `FEE-${year}-`,
                },
            },
        });
        return `FEE-${year}-${String(count + 1).padStart(4, '0')}`;
    },

    // Calculate totals from fee items and discounts
    calculateTotals(feeItems: any[], discounts: any[], isTaxExempt: boolean = false, taxRate: number = 0) {
        const subtotal = feeItems.reduce((sum, item) => sum + Number(item.amount), 0);
        const taxableSubtotal = feeItems.filter(item => item.isTaxable).reduce((sum, item) => sum + Number(item.amount), 0);

        let discountAmount = 0;
        let scholarshipAmount = 0;

        discounts.forEach(discount => {
            let calculatedAmount = 0;

            if (discount.type === 'PERCENTAGE' && discount.percentage) {
                calculatedAmount = (subtotal * Number(discount.percentage)) / 100;
            } else if (discount.type === 'FIXED_AMOUNT' && discount.fixedAmount) {
                calculatedAmount = Math.min(Number(discount.fixedAmount), subtotal);
            }

            if (discount.isScholarship) {
                scholarshipAmount += calculatedAmount;
            } else {
                discountAmount += calculatedAmount;
            }

            discount.calculatedAmount = calculatedAmount;
        });

        // Calculate tax after discounts (proportional)
        const totalDiscounts = discountAmount + scholarshipAmount;
        const discountRatio = subtotal > 0 ? totalDiscounts / subtotal : 0;
        const netTaxableAmount = Math.max(0, taxableSubtotal * (1 - discountRatio));

        const taxAmount = !isTaxExempt ? (netTaxableAmount * (taxRate / 100)) : 0;

        const totalAmount = Math.max(0, subtotal - totalDiscounts + taxAmount);
        const balance = totalAmount;

        return {
            subtotal,
            discountAmount,
            scholarshipAmount,
            taxAmount,
            totalAmount,
            balance,
        };
    },

    // Get all calculations
    async getAll(studentId?: string, status?: string) {
        return await prisma.studentFeeCalculation.findMany({
            where: {
                ...(studentId && { studentId }),
                ...(status && { status: status as any }),
            },
            include: {
                student: {
                    select: {
                        id: true,
                        studentNumber: true,
                        isTaxExempt: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
                feeItems: {
                    orderBy: {
                        displayOrder: 'asc',
                    },
                },
                discounts: true,
                installmentPlans: {
                    include: {
                        installments: {
                            orderBy: {
                                installmentNumber: 'asc',
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },

    // Get calculation by ID
    async getById(id: string) {
        return await prisma.studentFeeCalculation.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        studentNumber: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
                template: {
                    include: {
                        feeItems: true,
                    },
                },
                feeItems: {
                    orderBy: {
                        displayOrder: 'asc',
                    },
                },
                discounts: true,
                installmentPlans: {
                    include: {
                        installments: {
                            orderBy: {
                                installmentNumber: 'asc',
                            },
                        },
                    },
                },
                payments: {
                    orderBy: {
                        paymentDate: 'desc',
                    },
                },
            },
        });
    },

    // Create calculation
    async create(data: any, userId?: string) {
        const { feeItems, discounts, ...calculationData } = data;

        // Fetch student details for tax exemption
        const student = await prisma.student.findUnique({
            where: { id: calculationData.studentId },
            select: { isTaxExempt: true }
        });

        // Fetch settings for tax
        const settings = await prisma.settings.findFirst({ where: { id: 'singleton' } });
        const taxEnabled = settings?.taxEnabled ?? false;
        const taxRate = taxEnabled ? Number(settings?.taxRate || 15) : 0;
        const isExempt = student?.isTaxExempt ?? false;

        // Calculate totals
        const totals = this.calculateTotals(feeItems, discounts || [], isExempt, taxRate);

        // Parse due date if provided
        const dueDate = calculationData.dueDate ? new Date(calculationData.dueDate) : null;

        // Generate calculation number
        const calculationNumber = await this.generateCalculationNumber();

        const createdCalculation = await prisma.studentFeeCalculation.create({
            data: {
                ...calculationData,
                calculationNumber,
                ...totals,
                dueDate,
                createdBy: userId,
                feeItems: {
                    create: feeItems,
                },
                ...(discounts && discounts.length > 0 && {
                    discounts: {
                        create: discounts,
                    },
                }),
            },
            include: {
                student: {
                    select: {
                        id: true,
                        studentNumber: true,
                        firstNameAr: true,
                        lastNameAr: true,
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                            },
                        },
                    },
                },
                feeItems: {
                    orderBy: {
                        displayOrder: 'asc',
                    },
                },
                discounts: true,
            },
        });

        // --- DOUBLE ENTRY ACCOUNTING (Accrual Journal Entry) ---
        try {
            const finSettings = await prisma.financialSettings.findFirst();
            if (finSettings && finSettings.defaultStudentReceivableAccountId) {
                // Find sales journal
                const journal = await prisma.financialJournal.findFirst({
                    where: { type: 'SALE' }
                });

                // Determine revenue account (prioritize item-specific, then settings, then default income)
                const revenueAccountId = finSettings.defaultIncomeAccountId;

                if (revenueAccountId) {
                    const studentName = createdCalculation.student?.firstNameAr || createdCalculation.student?.user?.firstName || 'الطالب';

                    // --- ADVANCED ROUTING LOGIC ---
                    // Group fee items by their income account to create detailed journal lines
                    const revenueLines = createdCalculation.feeItems.map(item => {
                        // Priority: 1. Item-specific account | 2. Global settings default
                        const targetAccountId = item.incomeAccountId || finSettings.defaultIncomeAccountId;
                        return {
                            accountId: targetAccountId!,
                            debit: 0,
                            credit: Number(item.amount),
                            description: `إيراد ${item.nameAr} - ${createdCalculation.calculationNumber}`
                        };
                    });

                    // Add VAT line if applicable
                    if (Number(createdCalculation.taxAmount) > 0 && finSettings.defaultVatAccountId) {
                        revenueLines.push({
                            accountId: finSettings.defaultVatAccountId,
                            debit: 0,
                            credit: Number(createdCalculation.taxAmount),
                            description: `ضريبة القيمة المضافة - ${createdCalculation.calculationNumber}`
                        });
                    }

                    // --- NEW: DISCOUNT RECOGNITION ---
                    // If there are discounts, we should debit the discount expense account
                    const discountLines: any[] = [];
                    const totalDiscounts = Number(createdCalculation.discountAmount) + Number(createdCalculation.scholarshipAmount);
                    if (totalDiscounts > 0 && finSettings.defaultSalesDiscountAccountId) {
                        discountLines.push({
                            accountId: finSettings.defaultSalesDiscountAccountId,
                            debit: totalDiscounts,
                            credit: 0,
                            description: `خصومات ومنح دراسية - ${createdCalculation.calculationNumber}`
                        });
                    }

                    const je = await journalService.createJournalEntry({
                        date: new Date().toISOString(),
                        description: `استحقاق رسوم - ${createdCalculation.title} - ${studentName} (${createdCalculation.calculationNumber})`,
                        reference: createdCalculation.calculationNumber,
                        journalId: journal?.id,
                        lines: [
                            {
                                accountId: finSettings.defaultStudentReceivableAccountId,
                                debit: Number(createdCalculation.subtotal) + (Number(createdCalculation.taxAmount) || 0) - totalDiscounts, // Net Receivable
                                credit: 0,
                                description: `إثبات مديونية الطالب (صافي) - ${createdCalculation.calculationNumber}`
                            },
                            ...discountLines, // Debit discounts
                            ...revenueLines  // Credit revenue
                        ]
                    }, userId || 'system');

                    await journalService.postJournalEntry(je.id, userId || 'system');
                }
            }
        } catch (accError) {
            console.error('Accounting Error (Calculation Create):', accError);
        }

        return createdCalculation;
    },

    // Update calculation
    async update(id: string, data: any) {
        const { feeItems, discounts, status, ...calculationData } = data;

        let updateData: any = { ...calculationData };

        // If fee items or discounts are updated, recalculate totals
        if (feeItems || discounts) {
            const currentCalc = await prisma.studentFeeCalculation.findUnique({
                where: { id },
                include: {
                    feeItems: true,
                    discounts: true,
                },
            });

            if (!currentCalc) throw new Error('Calculation not found');

            const itemsToUse = feeItems || currentCalc.feeItems;
            const discountsToUse = discounts || currentCalc.discounts;

            const totals = this.calculateTotals(itemsToUse, discountsToUse);
            updateData = { ...updateData, ...totals };

            // Delete and recreate fee items if provided
            if (feeItems) {
                await prisma.feeCalculationItem.deleteMany({
                    where: { calculationId: id },
                });
            }

            // Delete and recreate discounts if provided
            if (discounts) {
                await prisma.feeCalculationDiscount.deleteMany({
                    where: { calculationId: id },
                });
            }
        }

        // Update status if provided
        if (status) {
            updateData.status = status;
        }

        return await prisma.studentFeeCalculation.update({
            where: { id },
            data: {
                ...updateData,
                ...(feeItems && {
                    feeItems: {
                        create: feeItems,
                    },
                }),
                ...(discounts && {
                    discounts: {
                        create: discounts,
                    },
                }),
            },
            include: {
                feeItems: {
                    orderBy: {
                        displayOrder: 'asc',
                    },
                },
                discounts: true,
            },
        });
    },

    // Delete calculation
    async delete(id: string) {
        return await prisma.studentFeeCalculation.delete({
            where: { id },
        });
    },
};

// ============================================
// INSTALLMENT PLAN SERVICE
// ============================================

export const installmentPlanService = {
    // Generate installment dates
    generateInstallmentDates(startDate: Date, numberOfMonths: number, dayOfMonth: number): Date[] {
        const dates: Date[] = [];
        const current = new Date(startDate);

        for (let i = 0; i < numberOfMonths; i++) {
            const installmentDate = new Date(current);
            installmentDate.setDate(Math.min(dayOfMonth, 28));
            dates.push(new Date(installmentDate));
            current.setMonth(current.getMonth() + 1);
        }

        return dates;
    },

    // Create installment plan
    async create(data: any) {
        const { calculationId, numberOfMonths, startDate, dayOfMonth, ...planData } = data;

        // Get the calculation
        const calculation = await prisma.studentFeeCalculation.findUnique({
            where: { id: calculationId },
        });

        if (!calculation) {
            throw new Error('Calculation not found');
        }

        // Calculate installment amount
        const totalAmount = Number(calculation.balance);
        const installmentAmount = Math.ceil((totalAmount / numberOfMonths) * 100) / 100;

        // Generate dates
        const startDateObj = new Date(startDate);
        const dates = this.generateInstallmentDates(startDateObj, numberOfMonths, dayOfMonth || 1);
        const endDate = dates[dates.length - 1];

        // Create plan with installments
        return await prisma.installmentPlan.create({
            data: {
                ...planData,
                calculationId,
                totalAmount,
                numberOfMonths,
                installmentAmount,
                startDate: startDateObj,
                endDate,
                dayOfMonth: dayOfMonth || 1,
                installments: {
                    create: dates.map((date, index) => ({
                        installmentNumber: index + 1,
                        amount: installmentAmount,
                        dueDate: date,
                        balance: installmentAmount,
                    })),
                },
            },
            include: {
                installments: {
                    orderBy: {
                        installmentNumber: 'asc',
                    },
                },
            },
        });
    },

    // Get plan by ID
    async getById(id: string) {
        return await prisma.installmentPlan.findUnique({
            where: { id },
            include: {
                calculation: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                studentNumber: true,
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                },
                installments: {
                    orderBy: {
                        installmentNumber: 'asc',
                    },
                },
            },
        });
    },

    // Get plans by calculation ID
    async getByCalculationId(calculationId: string) {
        return await prisma.installmentPlan.findMany({
            where: { calculationId },
            include: {
                installments: {
                    orderBy: {
                        installmentNumber: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    },
};

// ============================================
// DISCOUNT SERVICE
// ============================================

export const discountService = {
    // Get all discounts
    async getAll(isActive?: boolean) {
        return await prisma.discount.findMany({
            where: isActive !== undefined ? { isActive } : undefined,
            orderBy: {
                createdAt: 'desc',
            },
        });
    },

    // Get discount by ID
    async getById(id: string) {
        return await prisma.discount.findUnique({
            where: { id },
        });
    },

    // Get discount by code
    async getByCode(code: string) {
        return await prisma.discount.findUnique({
            where: { code },
        });
    },

    // Create discount
    async create(data: any) {
        // Check if code already exists
        const existing = await this.getByCode(data.code);
        if (existing) {
            throw new Error('Discount code already exists');
        }

        // Parse dates if provided
        const validFrom = data.validFrom ? new Date(data.validFrom) : null;
        const validUntil = data.validUntil ? new Date(data.validUntil) : null;

        return await prisma.discount.create({
            data: {
                ...data,
                validFrom,
                validUntil,
            },
        });
    },

    // Update discount
    async update(id: string, data: any) {
        // If code is being changed, check if it exists
        if (data.code) {
            const existing = await prisma.discount.findFirst({
                where: {
                    code: data.code,
                    NOT: { id },
                },
            });
            if (existing) {
                throw new Error('Discount code already exists');
            }
        }

        // Parse dates if provided
        const validFrom = data.validFrom ? new Date(data.validFrom) : undefined;
        const validUntil = data.validUntil ? new Date(data.validUntil) : undefined;

        return await prisma.discount.update({
            where: { id },
            data: {
                ...data,
                ...(validFrom && { validFrom }),
                ...(validUntil && { validUntil }),
            },
        });
    },

    // Delete discount
    async delete(id: string) {
        return await prisma.discount.delete({
            where: { id },
        });
    },

    // Validate and apply discount
    async validateAndApply(code: string, amount: number) {
        const discount = await this.getByCode(code);

        if (!discount) {
            throw new Error('Discount not found');
        }

        if (!discount.isActive) {
            throw new Error('Discount is not active');
        }

        // Check validity dates
        const now = new Date();
        if (discount.validFrom && now < discount.validFrom) {
            throw new Error('Discount is not yet valid');
        }
        if (discount.validUntil && now > discount.validUntil) {
            throw new Error('Discount has expired');
        }

        // Check max uses
        if (discount.maxUses && discount.currentUses >= discount.maxUses) {
            throw new Error('Discount has reached maximum uses');
        }

        // Calculate discount amount
        let discountAmount = 0;
        if (discount.type === 'PERCENTAGE' && discount.percentage) {
            discountAmount = (amount * Number(discount.percentage)) / 100;
        } else if (discount.type === 'FIXED_AMOUNT' && discount.fixedAmount) {
            discountAmount = Math.min(Number(discount.fixedAmount), amount);
        }

        // Increment usage count
        await prisma.discount.update({
            where: { id: discount.id },
            data: {
                currentUses: discount.currentUses + 1,
            },
        });

        return {
            discount,
            discountAmount,
        };
    },
};

// ============================================
// PAYMENT SERVICE
// ============================================

export const paymentService = {
    // Create a new payment
    async create(data: any, userId?: string) {
        const { calculationId, installmentId, amount, lateFee, discount, paymentDate, ...paymentData } = data;

        // Start transaction
        const payment = await prisma.$transaction(async (tx) => {
            // 1. Get the calculation with installments
            const calculation = await tx.studentFeeCalculation.findUnique({
                where: { id: calculationId },
                include: {
                    installmentPlans: {
                        include: {
                            installments: true
                        }
                    }
                }
            });

            if (!calculation) throw new Error('Calculation not found');

            // --- SAFETY CHECK: Prevent double payment or zero payment ---
            const payAmountNum = Number(amount || 0);
            if (payAmountNum <= 0.01) {
                throw new Error('يرجى إدخال مبلغ صحيح للسداد (Amount must be greater than 0)');
            }

            if (installmentId) {
                const installment = calculation.installmentPlans?.[0]?.installments?.find(i => i.id === installmentId);
                if (installment && (installment.status === 'PAID' || Number(installment.balance) <= 0.01)) {
                    throw new Error('هذا القسط مدفوع بالكامل مسبقاً (Already Paid)');
                }
            } else if (Number(calculation.balance) <= 0.01) {
                throw new Error('هذه الفاتورة مدفوعة بالكامل مسبقاً (Already Paid)');
            }



            // 2. Generate receipt number if not provided
            let finalReceiptNumber = paymentData.receiptNumber;
            if (!finalReceiptNumber) {
                finalReceiptNumber = await paymentService.generateReceiptNumber(tx);
            }

            // 3. Create the payment record
            const method = paymentData.method || 'CASH';
            const isCash = method === 'CASH';

            const createdPayment = await tx.payment.create({
                data: {
                    ...paymentData,
                    calculationId,
                    installmentId,
                    receiptNumber: finalReceiptNumber,
                    amount: new Decimal(amount),
                    lateFee: new Decimal(lateFee || 0),
                    discount: new Decimal(discount || 0),
                    paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
                    recordedBy: userId,
                    reconciliationStatus: isCash ? 'RECONCILED' : 'PENDING',
                },
            });

            // --- DOUBLE ENTRY ACCOUNTING (Automatic Journal Entry) ---
            try {
                const finSettings = await tx.financialSettings.findFirst();
                if (finSettings && finSettings.defaultStudentReceivableAccountId) {
                    // Find appropriate journal
                    const journalCode = isCash ? 'CSH' : 'BNK';
                    const journal = await tx.financialJournal.findUnique({
                        where: { code: journalCode }
                    });

                    const debitAccountId = journal?.defaultAccountId || (isCash
                        ? finSettings.defaultCashAccountId
                        : finSettings.defaultBankSuspenseAccountId);

                    if (debitAccountId) {
                        const je = await journalService.createJournalEntry({
                            date: (paymentDate ? new Date(paymentDate) : new Date()).toISOString(),
                            description: `سداد رسوم - إيصال ${finalReceiptNumber} - ${calculation.calculationNumber}`,
                            reference: finalReceiptNumber,
                            journalId: journal?.id,
                            lines: [
                                {
                                    accountId: debitAccountId,
                                    debit: new Decimal(amount).toNumber(),
                                    credit: 0,
                                    description: `إيداع مبلغ السداد (${method})${journal ? ` عبر يومية ${journal.nameAr}` : ''}`
                                },
                                {
                                    accountId: finSettings.defaultStudentReceivableAccountId,
                                    debit: 0,
                                    credit: new Decimal(amount).toNumber(),
                                    description: `تخفيض مديونية الطالب - إيصال ${finalReceiptNumber}`
                                }
                            ]
                        }, userId || 'system', tx);

                        await journalService.postJournalEntry(je.id, userId || 'system', tx);

                        // Link payment to journal if possible (if we add journalId to Payment model)
                        await tx.payment.update({
                            where: { id: createdPayment.id },
                            data: { journalId: journal?.id }
                        });
                    }
                }
            } catch (accError) {
                console.error('Accounting Error (Payment Create):', accError);
                // In production, you might want to throw if accounting is critical
            }

            // 3. Update Calculation totals
            const calcPaidAmount = new Decimal(calculation.paidAmount.toString());
            const calcTotalAmount = new Decimal(calculation.totalAmount.toString());
            const payAmount = new Decimal(amount);

            const newPaidAmount = calcPaidAmount.add(payAmount);
            const absoluteBalance = calcTotalAmount.sub(newPaidAmount);
            const newBalance = absoluteBalance.lessThan(0) ? new Decimal(0) : absoluteBalance;

            // Determine status based on balance AND payment method
            let newStatus: any = 'PARTIAL';
            if (newBalance.equals(0)) {
                newStatus = isCash ? 'PAID' : 'IN_PAYMENT';
            } else if (newPaidAmount.equals(0)) {
                newStatus = 'PENDING';
            } else if (!isCash && newBalance.gt(0)) {
                // If it's partial and bank, we keep it as PARTIAL but the payment itself is PENDING recon
                newStatus = 'PARTIAL';
            }

            await tx.studentFeeCalculation.update({
                where: { id: calculationId },
                data: {
                    paidAmount: newPaidAmount,
                    balance: newBalance,
                    status: newStatus,
                },
            });

            // 4. Update Installment(s)
            let remainingAmountToDistribute = payAmount;

            if (installmentId) {
                const installment = await tx.installment.findUnique({
                    where: { id: installmentId },
                });

                if (installment) {
                    const instPaidAmount = new Decimal(installment.paidAmount.toString());
                    const instTotalAmount = new Decimal(installment.amount.toString());
                    const instNeeded = instTotalAmount.sub(instPaidAmount);

                    const amountToApply = Decimal.min(remainingAmountToDistribute, instNeeded);
                    const instNewPaidAmount = instPaidAmount.add(amountToApply);
                    const instNewBalance = instTotalAmount.sub(instNewPaidAmount).lessThan(0) ? new Decimal(0) : instTotalAmount.sub(instNewPaidAmount);

                    const instStatus = instNewBalance.equals(0)
                        ? (isCash ? 'PAID' : 'IN_PAYMENT')
                        : 'PARTIAL';

                    await tx.installment.update({
                        where: { id: installmentId },
                        data: {
                            paidAmount: instNewPaidAmount,
                            balance: instNewBalance,
                            status: instStatus as any,
                            paidDate: instNewBalance.equals(0) ? (paymentDate ? new Date(paymentDate) : new Date()) : installment.paidDate,
                        },
                    });
                }
            } else {
                const pendingInstallments = await tx.installment.findMany({
                    where: {
                        plan: { calculationId },
                        status: { not: 'PAID' }
                    },
                    orderBy: { installmentNumber: 'asc' }
                });

                for (const inst of pendingInstallments) {
                    if (remainingAmountToDistribute.lte(0)) break;

                    const instPaidAmount = new Decimal(inst.paidAmount.toString());
                    const instTotalAmount = new Decimal(inst.amount.toString());
                    const instNeeded = instTotalAmount.sub(instPaidAmount);

                    if (instNeeded.lte(0)) {
                        await tx.installment.update({
                            where: { id: inst.id },
                            data: { status: 'PAID' }
                        });
                        continue;
                    }

                    const amountToApply = remainingAmountToDistribute.gt(instNeeded) ? instNeeded : remainingAmountToDistribute;
                    const instNewPaidAmount = instPaidAmount.add(amountToApply);
                    const instNewBalance = instTotalAmount.sub(instNewPaidAmount);
                    const finalBalance = instNewBalance.lt(0) ? new Decimal(0) : instNewBalance;

                    const instStatus = finalBalance.equals(0)
                        ? (isCash ? 'PAID' : 'IN_PAYMENT')
                        : 'PARTIAL';

                    await tx.installment.update({
                        where: { id: inst.id },
                        data: {
                            paidAmount: instNewPaidAmount,
                            balance: finalBalance,
                            status: instStatus as any,
                            paidDate: finalBalance.equals(0) ? (paymentDate ? new Date(paymentDate) : new Date()) : inst.paidDate,
                        },
                    });

                    remainingAmountToDistribute = remainingAmountToDistribute.sub(amountToApply);
                }
            }

            return createdPayment;
        }); // End transaction

        // 5. Generate Tax Invoice Automatically
        try {
            await paymentService.generateAutomaticInvoice(calculationId, installmentId, amount, paymentDate, payment.id);
        } catch (invoiceError) {
            console.error('Failed to generate automatic tax invoice:', invoiceError);
        }

        return payment;
    },

    // Helper to generate invoice with retry logic
    async generateAutomaticInvoice(calculationId: string, installmentId: string | undefined, amount: any, paymentDate: any, paymentId: string) {
        const calculation = await prisma.studentFeeCalculation.findUnique({
            where: { id: calculationId },
            include: { student: true }
        });
        if (!calculation) return;

        const finSettings = await prisma.financialSettings.findFirst();
        const settings = await prisma.settings.findFirst({ where: { id: 'singleton' } });

        const isTaxEnabled = settings?.taxEnabled ?? false;
        const isExempt = calculation.student?.isTaxExempt ?? false;
        const vatRate = isTaxEnabled && !isExempt ? Number(settings?.taxRate || 15) : 0;

        const payAmountNum = Number(amount);
        const subtotal = payAmountNum / (1 + (vatRate / 100));
        const vatAmount = payAmountNum - subtotal;

        let description = `سداد رسوم - ${calculation.title}`;
        if (installmentId) {
            const inst = await prisma.installment.findUnique({ where: { id: installmentId } });
            if (inst) {
                description = `سداد القسط رقم ${inst.installmentNumber} - ${calculation.title}`;
            }
        }

        let attempts = 0;
        let invoiceCreated = false;

        // 1. Fetch recent invoices for the year to find the starting point
        const year = new Date().getFullYear();
        const recentInvoices = await prisma.invoice.findMany({
            where: { invoiceNumber: { contains: `-${year}-` } },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: { invoiceNumber: true }
        });

        // 2. Find the absolute maximum numeric suffix
        let maxSuffix = 0;
        const suffixRegex = /(\d+)$/;

        for (const inv of recentInvoices) {
            const match = inv.invoiceNumber.match(suffixRegex);
            if (match) {
                const num = parseInt(match[1]);
                if (!isNaN(num) && num > maxSuffix) maxSuffix = num;
            }
        }

        let nextNum = maxSuffix + 1;

        // 3. Robust creation loop with conflict resolution
        while (attempts < 15 && !invoiceCreated) {
            try {
                const invoiceNumber = `INV-${year}-${nextNum.toString().padStart(4, '0')}`;

                await prisma.invoice.create({
                    data: {
                        invoiceNumber,
                        studentId: calculation.studentId,
                        date: paymentDate ? new Date(paymentDate) : new Date(),
                        subtotal: new Decimal(subtotal.toFixed(2)),
                        vatAmount: new Decimal(vatAmount.toFixed(2)),
                        totalAmount: new Decimal(payAmountNum.toFixed(2)),
                        status: 'PAID',
                        trnSnapshot: settings?.trn || finSettings?.trn,
                        vatRateSnapshot: new Decimal(vatRate),
                        paymentId: paymentId,
                        items: {
                            create: [{
                                description,
                                quantity: 1,
                                unitPrice: new Decimal(subtotal.toFixed(2)),
                                taxableAmount: new Decimal(subtotal.toFixed(2)),
                                vatAmount: new Decimal(vatAmount.toFixed(2)),
                                totalAmount: new Decimal(payAmountNum.toFixed(2)),
                            }]
                        }
                    }
                });
                invoiceCreated = true;
                console.log(`✅ Automatically generated invoice: ${invoiceNumber}`);
            } catch (err: any) {
                // Prisma Error: Unique constraint failed
                if (err.code === 'P2002') {
                    const target = err.meta?.target || [];

                    if (target.includes('invoice_number')) {
                        console.warn(`⚠️ Invoice number collision on ${nextNum}, incrementing...`);
                        nextNum++;
                        attempts++;
                    } else if (target.includes('payment_id')) {
                        // Crucial: Check if this payment ALREADY has an invoice (prevents duplicates)
                        const existing = await prisma.invoice.findUnique({ where: { paymentId } });
                        if (existing) {
                            console.log(`ℹ️ Invoice ${existing.invoiceNumber} already exists for payment ${paymentId}. Skipping.`);
                            invoiceCreated = true; // Mark as done to exit loop
                        } else {
                            // Some other payment_id conflict? Unlikely but possible with race conditions.
                            throw err;
                        }
                    } else {
                        throw err;
                    }
                } else {
                    console.error('❌ Unexpected error during invoice generation:', err);
                    throw err;
                }
            }
        }

        if (!invoiceCreated) {
            console.error(`❌ Failed to generate invoice after ${attempts} attempts.`);
        }

    },

    // Reconcile a payment (Professional Accounting Step)
    async reconcilePayment(paymentId: string, status: 'RECONCILED' | 'FAILED' = 'RECONCILED', userId?: string) {
        return await prisma.$transaction(async (tx) => {
            const payment = await tx.payment.findUnique({
                where: { id: paymentId },
                include: {
                    feeCalculation: { include: { student: true } },
                    installment: true
                }
            });

            if (!payment) throw new Error('Payment not found');
            if (payment.reconciliationStatus === 'RECONCILED') return payment;

            const updatedPayment = await tx.payment.update({
                where: { id: paymentId },
                data: { reconciliationStatus: status }
            });

            // 2. If status is RECONCILED, check if we need to update Calculation/Installment statuses
            if (status === 'RECONCILED') {
                // Update Calculation status if it was IN_PAYMENT and now fully cleared
                if (payment.feeCalculation && payment.feeCalculation.status === 'IN_PAYMENT') {
                    await tx.studentFeeCalculation.update({
                        where: { id: payment.feeCalculation.id },
                        data: { status: 'PAID' }
                    });
                }

                // Update Installment status if it was IN_PAYMENT
                if (payment.installmentId) {
                    const inst = await tx.installment.findUnique({ where: { id: payment.installmentId } });
                    if (inst && inst.status === 'IN_PAYMENT') {
                        await tx.installment.update({
                            where: { id: inst.id },
                            data: { status: 'PAID' }
                        });
                    }
                }

                // --- DOUBLE ENTRY ACCOUNTING (Reconciliation) ---
                try {
                    const finSettings = await tx.financialSettings.findFirst();
                    if (finSettings && finSettings.defaultBankAccountId && finSettings.defaultBankSuspenseAccountId) {
                        const amount = new Decimal(payment.amount.toString());

                        const je = await journalService.createJournalEntry({
                            date: new Date().toISOString(),
                            description: `مطابقة بنكية - إيصال ${payment.receiptNumber}`,
                            reference: payment.receiptNumber || undefined,
                            lines: [
                                {
                                    accountId: finSettings.defaultBankAccountId,
                                    debit: amount.toNumber(),
                                    credit: 0,
                                    description: `نقل المبلغ للحساب البنكي`
                                },
                                {
                                    accountId: finSettings.defaultBankSuspenseAccountId,
                                    debit: 0,
                                    credit: amount.toNumber(),
                                    description: `تصفية حساب الوسيط الاستحقاقي`
                                }
                            ]
                        }, userId || 'system', tx);

                        await journalService.postJournalEntry(je.id, userId || 'system', tx);
                    }
                } catch (accError) {
                    console.error('Accounting Error (Reconciliation):', accError);
                }
            }

            return updatedPayment;
        });
    },

    // Get all payments (with filters)
    async getAll(filters: any = {}) {
        const { studentId, calculationId, installmentId, startDate, endDate } = filters;

        return await prisma.payment.findMany({
            where: {
                calculationId,
                installmentId,
                paymentDate: {
                    gte: startDate ? new Date(startDate) : undefined,
                    lte: endDate ? new Date(endDate) : undefined,
                },
                ...(studentId && {
                    feeCalculation: {
                        studentId: studentId,
                    },
                }),
            },
            include: {
                invoice: true,
                feeCalculation: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                studentNumber: true,
                                firstNameAr: true,
                                lastNameAr: true,
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: [
                { paymentDate: 'desc' },
                { createdAt: 'desc' },
            ],
        });
    },

    // Get payment by ID
    async getById(id: string) {
        return await prisma.payment.findUnique({
            where: { id },
            include: {
                feeCalculation: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                        email: true,
                                        phone: true
                                    }
                                }
                            }
                        }
                    },
                },
                installment: true,
                invoice: true
            },
        });
    },

    // Generate unique receipt number
    async generateReceiptNumber(client?: any): Promise<string> {
        const db = client || prisma;
        const lastPayment = await db.payment.findFirst({
            where: {
                receiptNumber: {
                    startsWith: 'REC-',
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        let nextNumber = 1;
        if (lastPayment && lastPayment.receiptNumber) {
            const parts = lastPayment.receiptNumber.split('-');
            if (parts.length >= 2) {
                const lastNum = parseInt(parts[1]);
                if (!isNaN(lastNum)) {
                    nextNumber = lastNum + 1;
                }
            }
        }

        return `REC-${nextNumber.toString().padStart(6, '0')}`;
    },
};
