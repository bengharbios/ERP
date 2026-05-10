import { z } from 'zod';

// ============================================
// USER SCHEMAS
// ============================================

export const createUserSchema = z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    phone: z.string().optional(),
    telegramUserId: z.string().optional().nullable(),
    telegramUsername: z.string().optional().nullable(),
    profilePicture: z.string().url().optional(),
    isActive: z.boolean().optional().default(true),
    roles: z.array(z.object({
        roleId: z.string(),
        scopeType: z.enum(['global', 'branch', 'program', 'class']).optional(),
        scopeId: z.string().optional(),
        expiresAt: z.string().optional(), // ISO date string
    })).optional(),
});

export const updateUserSchema = z.object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    firstName: z.string().min(2).optional(),
    lastName: z.string().min(2).optional(),
    phone: z.string().optional(),
    telegramUserId: z.string().optional().nullable(),
    telegramUsername: z.string().optional().nullable(),
    profilePicture: z.string().url().optional(),
    isActive: z.boolean().optional(),
});

export const assignRoleSchema = z.object({
    roleId: z.string(),
    scopeType: z.enum(['global', 'branch', 'program', 'class']).optional(),
    scopeId: z.string().optional(),
    expiresAt: z.string().optional(), // ISO date string
});

export const revokeRoleSchema = z.object({
    roleId: z.string(),
});

// ============================================
// ROLE SCHEMAS
// ============================================

export const createRoleSchema = z.object({
    name: z.string().min(2).max(50),
    description: z.string().optional(),
    permissionIds: z.array(z.string()).optional(),
});

export const updateRoleSchema = z.object({
    name: z.string().min(2).max(50).optional(),
    description: z.string().optional(),
});

export const assignPermissionsSchema = z.object({
    permissionIds: z.array(z.string()).min(1),
});

export const revokePermissionsSchema = z.object({
    permissionIds: z.array(z.string()).min(1),
});

// ============================================
// PERMISSION SCHEMAS
// ============================================

export const createPermissionSchema = z.object({
    resource: z.string().min(2).max(50),
    action: z.string().min(2).max(50),
    description: z.string().optional(),
});

export const updatePermissionSchema = z.object({
    description: z.string().optional(),
});

// ============================================
// TYPE EXPORTS
// ============================================

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type AssignRoleInput = z.infer<typeof assignRoleSchema>;
export type RevokeRoleInput = z.infer<typeof revokeRoleSchema>;
export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
export type AssignPermissionsInput = z.infer<typeof assignPermissionsSchema>;
export type RevokePermissionsInput = z.infer<typeof revokePermissionsSchema>;
export type CreatePermissionInput = z.infer<typeof createPermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof updatePermissionSchema>;
