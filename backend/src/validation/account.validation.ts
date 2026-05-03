import { z } from 'zod';

// Account Type Enum
export const accountTypeSchema = z.enum(['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE']);

// Create Account Schema
export const createAccountSchema = z.object({
    code: z.string()
        .min(3, 'Account code must be at least 3 characters')
        .max(10, 'Account code must not exceed 10 characters')
        .regex(/^[0-9]+$/, 'Account code must contain only numbers'),
    name: z.string().min(1, 'Account name is required').max(255),
    nameAr: z.string().min(1, 'Arabic name is required').max(255),
    type: accountTypeSchema,
    parentId: z.string().uuid().optional().nullable(),
    balance: z.number().default(0),
    isActive: z.boolean().default(true),
    description: z.string().max(500).optional().nullable()
});

// Update Account Schema
export const updateAccountSchema = createAccountSchema.partial();

// Get Accounts Query Schema
export const getAccountsQuerySchema = z.object({
    type: accountTypeSchema.optional(),
    isActive: z.enum(['true', 'false']).transform(val => val === 'true').optional(),
    search: z.string().optional(),
    parentId: z.string().uuid().optional().nullable(),
    includeBalance: z.enum(['true', 'false']).transform(val => val === 'true').optional()
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type GetAccountsQuery = z.infer<typeof getAccountsQuerySchema>;
export type AccountType = z.infer<typeof accountTypeSchema>;
