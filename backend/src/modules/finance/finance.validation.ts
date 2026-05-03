import { z } from 'zod';

// ============================================
// FEE TEMPLATE SCHEMAS
// ============================================

export const createFeeItemSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    nameAr: z.string().min(1, 'Arabic name is required'),
    type: z.enum(['TUITION', 'REGISTRATION', 'FIRST_PAYMENT', 'CERTIFICATE', 'SHIPPING', 'SERVICE', 'CUSTOM', 'OTHER']),
    amount: z.number().nonnegative('Amount must be zero or positive'),
    isIncludedInTuition: z.boolean().optional().default(false),
    isOptional: z.boolean().optional().default(false),
    isTaxable: z.boolean().optional().default(false),
    description: z.string().optional(),
    displayOrder: z.number().int().optional().default(0),
});

export const createFeeTemplateSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    nameAr: z.string().min(1, 'Arabic name is required'),
    programId: z.string().uuid().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
    description: z.string().optional(),
    currency: z.string().default('SAR'),
    isDefault: z.boolean().optional().default(false),
    feeItems: z.array(createFeeItemSchema).optional().default([]),
});

export const updateFeeTemplateSchema = createFeeTemplateSchema.partial();

export type CreateFeeTemplateInput = z.infer<typeof createFeeTemplateSchema>;
export type UpdateFeeTemplateInput = z.infer<typeof updateFeeTemplateSchema>;
export type CreateFeeItemInput = z.infer<typeof createFeeItemSchema>;

// ============================================
// STUDENT FEE CALCULATION SCHEMAS
// ============================================

export const createFeeCalculationItemSchema = z.object({
    feeItemId: z.string().uuid().optional(),
    name: z.string().min(1, 'Name is required'),
    nameAr: z.string().min(1, 'Arabic name is required'),
    type: z.enum(['TUITION', 'REGISTRATION', 'FIRST_PAYMENT', 'CERTIFICATE', 'SHIPPING', 'SERVICE', 'CUSTOM', 'OTHER']),
    amount: z.number().nonnegative('Amount must be zero or positive'),
    isIncludedInTuition: z.boolean().optional().default(false),
    isTaxable: z.boolean().optional().default(false),
    displayOrder: z.number().int().optional().default(0),
});

export const createFeeCalculationDiscountSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    nameAr: z.string().min(1, 'Arabic name is required'),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'SCHOLARSHIP']),
    percentage: z.number().min(0).max(100).optional(),
    fixedAmount: z.number().nonnegative().optional(),
    isScholarship: z.boolean().optional().default(false),
    description: z.string().optional(),
});

export const createStudentFeeCalculationSchema = z.object({
    studentId: z.string().uuid('Invalid student ID'),
    templateId: z.string().uuid().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
    programId: z.string().uuid().optional().or(z.literal('')).transform(val => val === '' ? undefined : val),
    title: z.string().min(1, 'Title is required'),
    currency: z.string().default('SAR'),
    dueDate: z.string().optional(), // ISO date string
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
    feeItems: z.array(createFeeCalculationItemSchema).min(1, 'At least one fee item is required'),
    discounts: z.array(createFeeCalculationDiscountSchema).optional().default([]),
});

export const updateStudentFeeCalculationSchema = createStudentFeeCalculationSchema.partial().extend({
    status: z.enum(['PENDING', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED']).optional(),
});

export type CreateStudentFeeCalculationInput = z.infer<typeof createStudentFeeCalculationSchema>;
export type UpdateStudentFeeCalculationInput = z.infer<typeof updateStudentFeeCalculationSchema>;
export type CreateFeeCalculationItemInput = z.infer<typeof createFeeCalculationItemSchema>;
export type CreateFeeCalculationDiscountInput = z.infer<typeof createFeeCalculationDiscountSchema>;

// ============================================
// INSTALLMENT PLAN SCHEMAS
// ============================================

export const createInstallmentPlanSchema = z.object({
    calculationId: z.string().uuid('Invalid calculation ID'),
    name: z.string().min(1, 'Name is required'),
    nameAr: z.string().min(1, 'Arabic name is required'),
    numberOfMonths: z.number().int().min(1, 'Must be at least 1 month').max(60, 'Maximum 60 months'),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
    dayOfMonth: z.number().int().min(1).max(28).optional().default(1),
    notes: z.string().optional(),
});

export type CreateInstallmentPlanInput = z.infer<typeof createInstallmentPlanSchema>;

// ============================================
// DISCOUNT SCHEMAS
// ============================================

export const createDiscountSchema = z.object({
    code: z.string().min(1, 'Code is required'),
    name: z.string().min(1, 'Name is required'),
    nameAr: z.string().min(1, 'Arabic name is required'),
    type: z.enum(['PERCENTAGE', 'FIXED_AMOUNT', 'SCHOLARSHIP']),
    percentage: z.number().min(0).max(100).optional(),
    fixedAmount: z.number().nonnegative().optional(),
    isScholarship: z.boolean().optional().default(false),
    sponsorName: z.string().optional(),
    validFrom: z.string().optional(), // ISO date string
    validUntil: z.string().optional(), // ISO date string
    maxUses: z.number().int().positive().optional(),
    description: z.string().optional(),
});

export const updateDiscountSchema = createDiscountSchema.partial();

export type CreateDiscountInput = z.infer<typeof createDiscountSchema>;
export type UpdateDiscountInput = z.infer<typeof updateDiscountSchema>;

// ============================================
// PAYMENT SCHEMAS
// ============================================

export const createPaymentSchema = z.object({
    calculationId: z.string().uuid('Invalid calculation ID'),
    installmentId: z.string().optional().nullable().transform(val => (val === '' || val === null) ? undefined : val).pipe(z.string().uuid('Invalid installment ID').optional()),
    amount: z.coerce.number().nonnegative('Amount must be zero or positive'),
    lateFee: z.coerce.number().nonnegative('Late fee must be zero or positive').optional().default(0),
    discount: z.coerce.number().nonnegative('Discount must be zero or positive').optional().default(0),
    method: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'POS']),
    referenceNo: z.string().optional().nullable().transform(val => val === '' ? undefined : val),
    receiptNumber: z.string().optional().nullable().transform(val => val === '' ? undefined : val),
    paymentDate: z.string().optional().nullable().transform(val => val === '' ? undefined : val), // ISO date string
    notes: z.string().optional().nullable().transform(val => val === '' ? undefined : val),
});

export type CreatePaymentInput = z.infer<typeof createPaymentSchema>;
