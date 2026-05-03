import { z } from 'zod';

export const invoiceItemSchema = z.object({
    description: z.string().min(1, 'Description is required'),
    quantity: z.number().int().positive().default(1),
    unitPrice: z.number().nonnegative(),
});

export const createInvoiceSchema = z.object({
    studentId: z.string().uuid().optional(),
    dueDate: z.string().optional(),
    items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
});

export const updateInvoiceSchema = z.object({
    status: z.enum(['DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'CANCELLED', 'OVERDUE']).optional(),
    dueDate: z.string().optional(),
});

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceInput = z.infer<typeof updateInvoiceSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
