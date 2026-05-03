import { z } from 'zod';

const PaymentMethodEnum = z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE', 'CARD', 'ONLINE']);
const ReceiptStatusEnum = z.enum(['DRAFT', 'POSTED', 'CANCELLED']);

export const createReceiptSchema = z.object({
    studentId: z.string().uuid({ message: "Invalid student ID" }),
    amount: z.number().positive({ message: "Amount must be greater than zero" }),
    paymentMethod: PaymentMethodEnum,
    amountInWords: z.string().optional(),
    financialAccountId: z.string().uuid({ message: "Invalid financial account ID" }).optional(),
    referenceNo: z.string().optional(),
    receivedDate: z.string().datetime().optional().default(() => new Date().toISOString()),
    notes: z.string().optional(),
    purpose: z.string().optional()
});

export const updateReceiptSchema = z.object({
    studentId: z.string().uuid().optional(),
    amount: z.number().positive().optional(),
    paymentMethod: PaymentMethodEnum.optional(),
    amountInWords: z.string().optional(),
    financialAccountId: z.string().uuid().optional(),
    referenceNo: z.string().optional(),
    receivedDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    purpose: z.string().optional()
});

export const receiptQuerySchema = z.object({
    status: ReceiptStatusEnum.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    studentId: z.string().uuid().optional(),
    search: z.string().optional(),
    page: z.string().transform(Number).optional().default("1"),
    limit: z.string().transform(Number).optional().default("10")
});

export type CreateReceiptInput = z.infer<typeof createReceiptSchema>;
export type UpdateReceiptInput = z.infer<typeof updateReceiptSchema>;
export type ReceiptQueryParams = z.infer<typeof receiptQuerySchema>;
