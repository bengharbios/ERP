import { z } from 'zod';
import { PaymentMethod, ReceiptStatus } from '@prisma/client';

export const createReceiptSchema = z.object({
    studentId: z.string().uuid({ message: "Invalid student ID" }),
    amount: z.number().positive({ message: "Amount must be greater than zero" }),
    paymentMethod: z.nativeEnum(PaymentMethod),
    amountInWords: z.string().optional(),

    // Financial linking
    financialAccountId: z.string().uuid({ message: "Invalid financial account ID" }).optional(),

    referenceNo: z.string().optional(),
    receivedDate: z.string().datetime().optional().default(() => new Date().toISOString()),

    notes: z.string().optional(),
    purpose: z.string().optional()
});

export const updateReceiptSchema = z.object({
    studentId: z.string().uuid().optional(),
    amount: z.number().positive().optional(),
    paymentMethod: z.nativeEnum(PaymentMethod).optional(),
    amountInWords: z.string().optional(),
    financialAccountId: z.string().uuid().optional(),
    referenceNo: z.string().optional(),
    receivedDate: z.string().datetime().optional(),
    notes: z.string().optional(),
    purpose: z.string().optional()
});

export const receiptQuerySchema = z.object({
    status: z.nativeEnum(ReceiptStatus).optional(),
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
