import { z } from 'zod';

// Journal Line Schema
export const journalLineSchema = z.object({
    accountId: z.string().uuid('Invalid account ID'),
    description: z.string().max(500).optional(),
    debit: z.number().min(0, 'Debit amount must be positive'),
    credit: z.number().min(0, 'Credit amount must be positive'),
    reference: z.string().max(100).optional()
}).refine(data => {
    // Line cannot be both debit and credit (one must be 0)
    // Or at least one is non-zero
    if (data.debit > 0 && data.credit > 0) return false;
    if (data.debit === 0 && data.credit === 0) return false;
    return true;
}, {
    message: "Line must have either debit or credit amount, but not both",
    path: ["debit"]
});

// Create Journal Entry Schema Base
export const createJournalEntryBaseSchema = z.object({
    date: z.string().datetime(),
    description: z.string().min(1, 'Description is required').max(1000),
    journalId: z.string().uuid().optional(),
    reference: z.string().max(100).optional(),
    lines: z.array(journalLineSchema).min(2, 'Journal entry must have at least 2 lines')
});

export const createJournalEntrySchema = createJournalEntryBaseSchema.refine(data => {
    // Validate total debit equals total credit
    const totalDebit = data.lines.reduce((sum, line) => sum + line.debit, 0);
    const totalCredit = data.lines.reduce((sum, line) => sum + line.credit, 0);

    // Use a small epsilon for floating point comparison if needed, 
    // but strict equality is usually preferred for financial systems 
    // unless we're dealing with very complex calculations.
    return Math.abs(totalDebit - totalCredit) < 0.001;
}, {
    message: "Journal entry is not balanced (Total Debit must equal Total Credit)",
    path: ["lines"]
});

// Update Journal Entry Schema (Only for draft entries)
export const updateJournalEntrySchema = createJournalEntryBaseSchema.partial();

// Get Journal Entries Query Schema
export const getJournalEntriesQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    minAmount: z.string().transform(Number).optional(),
    maxAmount: z.string().transform(Number).optional(),
    isPosted: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    search: z.string().optional(),
    page: z.string().transform(Number).default('1'),
    limit: z.string().transform(Number).default('20')
});

export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
export type UpdateJournalEntryInput = z.infer<typeof updateJournalEntrySchema>;
export type GetJournalEntriesQuery = z.infer<typeof getJournalEntriesQuerySchema>;
export type JournalLineInput = z.infer<typeof journalLineSchema>;
