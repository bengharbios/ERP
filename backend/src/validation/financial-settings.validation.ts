import { z } from 'zod';

export const updateFinancialSettingsSchema = z.object({
    companyNameAr: z.string().min(1, 'Arabic name is required'),
    companyNameEn: z.string().min(1, 'English name is required'),
    trn: z.string().length(15, 'TRN must be exactly 15 digits'),
    vatRate: z.coerce.number().min(0).max(100),
    currency: z.string().length(3),
    bankName: z.string().optional().nullable(),
    iban: z.string().optional().nullable(),
    swiftCode: z.string().optional().nullable(),
    bankAddress: z.string().optional().nullable(),
    defaultCashAccountId: z.string().uuid().or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
    defaultBankAccountId: z.string().uuid().or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
    defaultVatAccountId: z.string().uuid().or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
    defaultIncomeAccountId: z.string().uuid().or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
    defaultBankSuspenseAccountId: z.string().uuid().or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
    defaultStudentReceivableAccountId: z.string().uuid().or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
    defaultSalesDiscountAccountId: z.string().uuid().or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
    defaultPayrollExpenseAccountId: z.string().uuid().or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
    defaultPayrollPayableAccountId: z.string().uuid().or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
    defaultSupplierPayableAccountId: z.string().uuid().or(z.literal('')).optional().nullable().transform(val => val === '' ? null : val),
});

export type UpdateFinancialSettingsInput = z.infer<typeof updateFinancialSettingsSchema>;
