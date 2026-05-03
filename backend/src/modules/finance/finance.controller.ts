import { Request, Response } from 'express';
import { AuthRequest } from '../../common/utils/jwt';
import {
    feeTemplateService,
    studentFeeCalculationService,
    installmentPlanService,
    discountService,
    paymentService,
} from './finance.service';
import {
    createFeeTemplateSchema,
    updateFeeTemplateSchema,
    createStudentFeeCalculationSchema,
    updateStudentFeeCalculationSchema,
    createInstallmentPlanSchema,
    createDiscountSchema,
    updateDiscountSchema,
    createPaymentSchema,
} from './finance.validation';
import prisma from '../../common/db/prisma';

// ============================================
// FEE TEMPLATE CONTROLLERS
// ============================================

export const getFeeTemplates = async (req: Request, res: Response): Promise<void> => {
    try {
        const { programId } = req.query;
        const templates = await feeTemplateService.getAll((programId as string) || undefined);

        res.json({
            success: true,
            data: {
                templates,
                total: templates.length,
            },
        });
    } catch (error: any) {
        console.error('Get fee templates error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching fee templates',
            },
        });
    }
};

export const getFeeTemplateById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const template = await feeTemplateService.getById(id);

        if (!template) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'TEMPLATE_NOT_FOUND',
                    message: 'Fee template not found',
                },
            });
            return;
        }

        res.json({
            success: true,
            data: { template },
        });
    } catch (error: any) {
        console.error('Get fee template error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching the fee template',
            },
        });
    }
};

export const createFeeTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createFeeTemplateSchema.parse(req.body);
        const template = await feeTemplateService.create(validatedData);

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'FEE_TEMPLATE_CREATED',
                    resourceType: 'FeeTemplate',
                    resourceId: template.id,
                    afterData: { name: template.name, nameAr: template.nameAr },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.status(201).json({
            success: true,
            data: { template },
        });
    } catch (error: any) {
        console.error('Create fee template error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);

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
                message: error.message || 'An error occurred while creating the fee template',
                details: error,
            },
        });
    }
};

export const updateFeeTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateFeeTemplateSchema.parse(req.body);

        const existing = await feeTemplateService.getById(id);
        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'TEMPLATE_NOT_FOUND',
                    message: 'Fee template not found',
                },
            });
            return;
        }

        const template = await feeTemplateService.update(id, validatedData);

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'FEE_TEMPLATE_UPDATED',
                    resourceType: 'FeeTemplate',
                    resourceId: template.id,
                    beforeData: existing,
                    afterData: template,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { template },
        });
    } catch (error: any) {
        console.error('Update fee template error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);

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
                message: 'An error occurred while updating the fee template',
            },
        });
    }
};

export const deleteFeeTemplate = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const template = await feeTemplateService.getById(id);
        if (!template) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'TEMPLATE_NOT_FOUND',
                    message: 'Fee template not found',
                },
            });
            return;
        }

        await feeTemplateService.delete(id);

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'FEE_TEMPLATE_DELETED',
                    resourceType: 'FeeTemplate',
                    resourceId: id,
                    beforeData: template,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Fee template deleted successfully' },
        });
    } catch (error: any) {
        console.error('Delete fee template error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting the fee template',
            },
        });
    }
};

// ============================================
// STUDENT FEE CALCULATION CONTROLLERS
// ============================================

export const getStudentFeeCalculations = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, status } = req.query;
        const calculations = await studentFeeCalculationService.getAll(
            studentId as string,
            status as string
        );

        res.json({
            success: true,
            data: {
                calculations,
                total: calculations.length,
            },
        });
    } catch (error: any) {
        console.error('Get fee calculations error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching fee calculations',
            },
        });
    }
};

export const getStudentFeeCalculationById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const calculation = await studentFeeCalculationService.getById(id);

        if (!calculation) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'CALCULATION_NOT_FOUND',
                    message: 'Fee calculation not found',
                },
            });
            return;
        }

        res.json({
            success: true,
            data: { calculation },
        });
    } catch (error: any) {
        console.error('Get fee calculation error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching the fee calculation',
            },
        });
    }
};

export const createStudentFeeCalculation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createStudentFeeCalculationSchema.parse(req.body);

        // Verify student exists
        const student = await prisma.student.findUnique({
            where: { id: validatedData.studentId },
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

        const calculation = await studentFeeCalculationService.create(
            validatedData,
            req.user?.id
        );

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'FEE_CALCULATION_CREATED',
                    resourceType: 'StudentFeeCalculation',
                    resourceId: calculation.id,
                    afterData: {
                        calculationNumber: calculation.calculationNumber,
                        studentId: calculation.studentId,
                        totalAmount: calculation.totalAmount,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.status(201).json({
            success: true,
            data: { calculation },
        });
    } catch (error: any) {
        console.error('Create fee calculation error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);

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
                message: 'An error occurred while creating the fee calculation',
            },
        });
    }
};

export const updateStudentFeeCalculation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateStudentFeeCalculationSchema.parse(req.body);

        const existing = await studentFeeCalculationService.getById(id);
        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'CALCULATION_NOT_FOUND',
                    message: 'Fee calculation not found',
                },
            });
            return;
        }

        const calculation = await studentFeeCalculationService.update(id, validatedData);

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'FEE_CALCULATION_UPDATED',
                    resourceType: 'StudentFeeCalculation',
                    resourceId: calculation.id,
                    beforeData: existing,
                    afterData: calculation,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { calculation },
        });
    } catch (error: any) {
        console.error('Update fee calculation error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);

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
                message: 'An error occurred while updating the fee calculation',
            },
        });
    }
};

export const deleteStudentFeeCalculation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const calculation = await studentFeeCalculationService.getById(id);
        if (!calculation) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'CALCULATION_NOT_FOUND',
                    message: 'Fee calculation not found',
                },
            });
            return;
        }

        await studentFeeCalculationService.delete(id);

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'FEE_CALCULATION_DELETED',
                    resourceType: 'StudentFeeCalculation',
                    resourceId: id,
                    beforeData: calculation,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Fee calculation deleted successfully' },
        });
    } catch (error: any) {
        console.error('Delete fee calculation error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting the fee calculation',
            },
        });
    }
};

// ============================================
// INSTALLMENT PLAN CONTROLLERS
// ============================================

export const createInstallmentPlan = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createInstallmentPlanSchema.parse(req.body);

        // Verify calculation exists
        const calculation = await studentFeeCalculationService.getById(validatedData.calculationId);
        if (!calculation) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'CALCULATION_NOT_FOUND',
                    message: 'Fee calculation not found',
                },
            });
            return;
        }

        const plan = await installmentPlanService.create(validatedData);

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'INSTALLMENT_PLAN_CREATED',
                    resourceType: 'InstallmentPlan',
                    resourceId: plan.id,
                    afterData: {
                        calculationId: plan.calculationId,
                        numberOfMonths: plan.numberOfMonths,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.status(201).json({
            success: true,
            data: { plan },
        });
    } catch (error: any) {
        console.error('Create installment plan error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);

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
                message: error.message || 'An error occurred while creating the installment plan',
            },
        });
    }
};

export const getInstallmentPlan = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const plan = await installmentPlanService.getById(id);

        if (!plan) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'PLAN_NOT_FOUND',
                    message: 'Installment plan not found',
                },
            });
            return;
        }

        res.json({
            success: true,
            data: { plan },
        });
    } catch (error: any) {
        console.error('Get installment plan error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching the installment plan',
            },
        });
    }
};

export const getInstallmentsByCalculation = async (req: Request, res: Response): Promise<void> => {
    try {
        const { calculationId } = req.params;
        const plans = await installmentPlanService.getByCalculationId(calculationId);

        res.json({
            success: true,
            data: { plans },
        });
    } catch (error: any) {
        console.error('Get installments error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching installments',
            },
        });
    }
};

// ============================================
// DISCOUNT CONTROLLERS
// ============================================

export const getDiscounts = async (req: Request, res: Response): Promise<void> => {
    try {
        const { isActive } = req.query;
        const discounts = await discountService.getAll(
            isActive !== undefined ? isActive === 'true' : undefined
        );

        res.json({
            success: true,
            data: {
                discounts,
                total: discounts.length,
            },
        });
    } catch (error: any) {
        console.error('Get discounts error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching discounts',
            },
        });
    }
};

export const createDiscount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createDiscountSchema.parse(req.body);
        const discount = await discountService.create(validatedData);

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'DISCOUNT_CREATED',
                    resourceType: 'Discount',
                    resourceId: discount.id,
                    afterData: { code: discount.code, name: discount.name },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.status(201).json({
            success: true,
            data: { discount },
        });
    } catch (error: any) {
        console.error('Create discount error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);

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

        if (error.message === 'Discount code already exists') {
            res.status(409).json({
                success: false,
                error: {
                    code: 'CODE_EXISTS',
                    message: error.message,
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while creating the discount',
            },
        });
    }
};

export const updateDiscount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateDiscountSchema.parse(req.body);

        const existing = await discountService.getById(id);
        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'DISCOUNT_NOT_FOUND',
                    message: 'Discount not found',
                },
            });
            return;
        }

        const discount = await discountService.update(id, validatedData);

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'DISCOUNT_UPDATED',
                    resourceType: 'Discount',
                    resourceId: discount.id,
                    beforeData: existing,
                    afterData: discount,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { discount },
        });
    } catch (error: any) {
        console.error('Update discount error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);

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

        if (error.message === 'Discount code already exists') {
            res.status(409).json({
                success: false,
                error: {
                    code: 'CODE_EXISTS',
                    message: error.message,
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while updating the discount',
            },
        });
    }
};

export const deleteDiscount = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const discount = await discountService.getById(id);
        if (!discount) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'DISCOUNT_NOT_FOUND',
                    message: 'Discount not found',
                },
            });
            return;
        }

        await discountService.delete(id);

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'DISCOUNT_DELETED',
                    resourceType: 'Discount',
                    resourceId: id,
                    beforeData: discount,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Discount deleted successfully' },
        });
    } catch (error: any) {
        console.error('Delete discount error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting the discount',
            },
        });
    }
};

// ============================================
// PAYMENT CONTROLLERS
// ============================================

export const getPayments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId, calculationId, installmentId, startDate, endDate } = req.query;
        const payments = await paymentService.getAll({
            studentId: studentId as string,
            calculationId: calculationId as string,
            installmentId: installmentId as string,
            startDate: startDate as string,
            endDate: endDate as string,
        });

        res.json({
            success: true,
            data: {
                payments,
                total: payments.length,
            },
        });
    } catch (error: any) {
        console.error('Get payments error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) console.error(error.stack);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching payments',
            },
        });
    }
};

export const createPayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createPaymentSchema.parse(req.body);
        const payment = await paymentService.create(validatedData, req.user?.id);

        // Log action
        if (req.user) {
            try {
                await prisma.auditLog.create({
                    data: {
                        userId: req.user.id,
                        action: 'PAYMENT_CREATED',
                        resourceType: 'Payment',
                        resourceId: payment.id,
                        afterData: {
                            amount: payment.amount,
                            calculationId: payment.calculationId,
                            receiptNumber: payment.receiptNumber,
                        },
                        ipAddress: req.ip,
                        userAgent: req.get('user-agent'),
                    },
                });
            } catch (auditError) {
                console.error('Failed to create audit log for payment:', auditError);
            }
        }

        res.status(201).json({
            success: true,
            data: { payment },
        });
    } catch (error: any) {
        console.error('Create payment error:', error instanceof Error ? error.message : error);
        if (error instanceof Error && error.stack) {
            console.error(error.stack);
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
                message: error.message || 'An error occurred while creating the payment',
            },
        });
    }
};

export const reconcilePayment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const payment = await paymentService.reconcilePayment(id, status, req.user?.id);

        res.json({
            success: true,
            data: { payment },
        });
    } catch (error: any) {
        console.error('Reconcile payment error:', error instanceof Error ? error.message : error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: error.message || 'An error occurred during reconciliation',
            },
        });
    }
};

export const getPaymentById = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const payment = await paymentService.getById(id);

        if (!payment) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Payment not found',
                },
            });
            return;
        }

        res.json({
            success: true,
            data: { payment },
        });
    } catch (error: any) {
        console.error('Get payment by ID error:', error instanceof Error ? error.message : error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching the payment',
            },
        });
    }
};
