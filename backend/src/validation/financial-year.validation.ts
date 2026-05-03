import { z } from 'zod';

export const createFinancialYearSchema = z.object({
    yearName: z.string().min(4, 'Year name must be at least 4 characters (e.g., 2026)'),
    startDate: z.string().datetime(),
    endDate: z.string().datetime(),
    isCurrent: z.boolean().default(false)
}).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end > start;
}, {
    message: "End date must be after start date",
    path: ["endDate"]
});

export const updateFinancialYearSchema = z.object({
    yearName: z.string().min(4).optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    isClosed: z.boolean().optional(),
    isCurrent: z.boolean().optional()
});

export type CreateFinancialYearInput = z.infer<typeof createFinancialYearSchema>;
export type UpdateFinancialYearInput = z.infer<typeof updateFinancialYearSchema>;
