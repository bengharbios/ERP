import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { AuthRequest } from '../../common/utils/jwt';
import {
    createPermissionSchema,
    updatePermissionSchema,
} from './users.validation';

// ============================================
// GET PERMISSIONS
// ============================================

export const getPermissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { groupBy = 'resource' } = req.query;

        const permissions = await prisma.permission.findMany({
            include: {
                _count: {
                    select: {
                        rolePermissions: true,
                    },
                },
            },
            orderBy: [
                { resource: 'asc' },
                { action: 'asc' },
            ],
        });

        // Group by resource if requested
        if (groupBy === 'resource') {
            const grouped = permissions.reduce((acc, permission) => {
                if (!acc[permission.resource]) {
                    acc[permission.resource] = [];
                }
                acc[permission.resource].push(permission);
                return acc;
            }, {} as Record<string, typeof permissions>);

            res.json({
                success: true,
                data: { permissions: grouped },
            });
        } else {
            res.json({
                success: true,
                data: { permissions },
            });
        }
    } catch (error) {
        console.error('Get permissions error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching permissions',
            },
        });
    }
};

// ============================================
// GET PERMISSION BY ID
// ============================================

export const getPermissionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const permission = await prisma.permission.findUnique({
            where: { id },
            include: {
                rolePermissions: {
                    include: {
                        role: true,
                    },
                },
                _count: {
                    select: {
                        rolePermissions: true,
                    },
                },
            },
        });

        if (!permission) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'PERMISSION_NOT_FOUND',
                    message: 'Permission not found',
                },
            });
            return;
        }

        res.json({
            success: true,
            data: { permission },
        });
    } catch (error) {
        console.error('Get permission by ID error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching permission',
            },
        });
    }
};

// ============================================
// CREATE PERMISSION
// ============================================

export const createPermission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createPermissionSchema.parse(req.body);

        // Check if permission already exists
        const existing = await prisma.permission.findUnique({
            where: {
                resource_action: {
                    resource: validatedData.resource,
                    action: validatedData.action,
                },
            },
        });

        if (existing) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'PERMISSION_EXISTS',
                    message: 'Permission already exists',
                },
            });
            return;
        }

        const permission = await prisma.permission.create({
            data: validatedData,
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PERMISSION_CREATED',
                    resourceType: 'Permission',
                    resourceId: permission.id,
                    afterData: { resource: permission.resource, action: permission.action },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.status(201).json({
            success: true,
            data: { permission },
        });
    } catch (error: any) {
        console.error('Create permission error:', error);

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors,
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while creating permission',
            },
        });
    }
};

// ============================================
// UPDATE PERMISSION
// ============================================

export const updatePermission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updatePermissionSchema.parse(req.body);

        const existing = await prisma.permission.findUnique({ where: { id } });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'PERMISSION_NOT_FOUND',
                    message: 'Permission not found',
                },
            });
            return;
        }

        const permission = await prisma.permission.update({
            where: { id },
            data: validatedData,
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PERMISSION_UPDATED',
                    resourceType: 'Permission',
                    resourceId: permission.id,
                    beforeData: JSON.parse(JSON.stringify(existing)),
                    afterData: JSON.parse(JSON.stringify(permission)),
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { permission },
        });
    } catch (error: any) {
        console.error('Update permission error:', error);

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors,
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while updating permission',
            },
        });
    }
};

// ============================================
// DELETE PERMISSION
// ============================================

export const deletePermission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const permission = await prisma.permission.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { rolePermissions: true },
                },
            },
        });

        if (!permission) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'PERMISSION_NOT_FOUND',
                    message: 'Permission not found',
                },
            });
            return;
        }

        // Check if permission is assigned to roles
        if (permission._count.rolePermissions > 0) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'PERMISSION_IN_USE',
                    message: `Cannot delete permission assigned to ${permission._count.rolePermissions} role(s)`,
                },
            });
            return;
        }

        await prisma.permission.delete({ where: { id } });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PERMISSION_DELETED',
                    resourceType: 'Permission',
                    resourceId: id,
                    beforeData: { resource: permission.resource, action: permission.action },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Permission deleted successfully' },
        });
    } catch (error) {
        console.error('Delete permission error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting permission',
            },
        });
    }
};

// ============================================
// GET RESOURCES (UNIQUE LIST)
// ============================================

export const getResources = async (_req: Request, res: Response): Promise<void> => {
    try {
        const permissions = await prisma.permission.findMany({
            select: {
                resource: true,
            },
            distinct: ['resource'],
            orderBy: {
                resource: 'asc',
            },
        });

        const resources = permissions.map((p) => p.resource);

        res.json({
            success: true,
            data: { resources },
        });
    } catch (error) {
        console.error('Get resources error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching resources',
            },
        });
    }
};
