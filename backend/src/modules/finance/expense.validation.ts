import { z } from 'zod';

// ============================================
// EXPENSE CATEGORY SCHEMAS
// ============================================

export const createExpenseCategorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    nameAr: z.string().min(2, 'Arabic name must be at least 2 characters'),
    description: z.string().optional(),
    isActive: z.boolean().optional().default(true),
});

export const updateExpenseCategorySchema = createExpenseCategorySchema.partial();

// ============================================
// EXPENSE SCHEMAS
// ============================================

export const createExpenseSchema = z.object({
    categoryId: z.string().uuid('Invalid category ID'),
    amount: z.coerce.number().positive('Amount must be positive'),
    taxRate: z.coerce.number().min(0).max(100).optional().default(0),
    currency: z.string().optional().default('SAR'),
    description: z.string().min(3, 'Description must be at least 3 characters'),
    paidTo: z.string().optional().nullable(),
    expenseDate: z.string().optional(), // Expected as ISO string, handled in service
    paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'POS']).default('CASH'),
    referenceNo: z.string().optional().nullable().transform(val => val === '' ? undefined : val),
    receiptImage: z.string().optional().nullable().transform(val => val === '' ? undefined : val),
    notes: z.string().optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

export type CreateExpenseCategoryInput = z.infer<typeof createExpenseCategorySchema>;
export type UpdateExpenseCategoryInput = z.infer<typeof updateExpenseCategorySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
