import { Response, NextFunction } from 'express';
import prisma from '../db/prisma';
import { AuthRequest } from '../utils/jwt';

export interface PermissionCheckOptions {
    resource: string;
    action: string;
    scopeType?: 'global' | 'branch' | 'program' | 'class' | 'unit';
    scopeId?: string;
}

export const authorize = (resource: string, action: string) => {
    return checkPermission({ resource, action });
};

export const checkPermission = (options: PermissionCheckOptions) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            console.log(`[RBAC] Checking permission: ${options.resource}:${options.action} for user: ${req.user?.id}`);
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
                return;
            }

            // Get user roles with permissions
            const userRoles = await prisma.userRole.findMany({
                where: {
                    userId: req.user.id,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gte: new Date() } },
                    ],
                },
            });

            // Fetch full roles with permissions
            const roleIds = userRoles.map(ur => ur.roleId);
            const fullRoles = await prisma.role.findMany({
                where: { id: { in: roleIds } },
                include: {
                    rolePermissions: {
                        include: { permission: true }
                    }
                }
            });

            // Check if user has the required permission
            let hasPermission = false;

            for (const userRole of userRoles) {
                // Check scope first
                const scopeMatches =
                    userRole.scopeType === 'global' ||
                    !options.scopeType ||
                    (userRole.scopeType === options.scopeType && userRole.scopeId === options.scopeId);

                if (!scopeMatches) {
                    continue;
                }

                // Find full role
                const fullRole = fullRoles.find(r => r.id === userRole.roleId);
                if (!fullRole) continue;

                // Check if role is Super Admin (Full Bypass)
                if (fullRole.name.toLowerCase() === 'super admin' || fullRole.name.toLowerCase() === 'superadmin') {
                    hasPermission = true;
                    break;
                }

                // Check permission
                const rolePermissions = fullRole.rolePermissions;
                const hasRequiredPermission = rolePermissions.some(
                    (rp) =>
                        rp.permission?.resource === options.resource &&
                        (rp.permission?.action === options.action || rp.permission?.action === 'manage')
                );

                if (hasRequiredPermission) {
                    hasPermission = true;
                    break;
                }
            }

            if (!hasPermission) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: `You do not have permission to ${options.action} ${options.resource}`,
                        debug: {
                            userId: req.user.id,
                            required: options,
                            roles: fullRoles.map(r => r.name),
                            permissions: fullRoles.flatMap(r => r.rolePermissions.map(rp => `${rp.permission.resource}:${rp.permission.action}`))
                        }
                    },
                });
                return;
            }

            next();
        } catch (error: any) {
            console.error('[RBAC] Permission check error:', error.message || error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An error occurred while checking permissions',
                },
            });
        }
    };
};

export const requireRole = (roleNames: string[]) => {
    return async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
        try {
            if (!req.user) {
                res.status(401).json({
                    success: false,
                    error: {
                        code: 'UNAUTHORIZED',
                        message: 'Authentication required',
                    },
                });
                return;
            }

            const userRoles = await prisma.userRole.findMany({
                where: {
                    userId: req.user.id,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gte: new Date() } },
                    ],
                },
                include: {
                    role: true,
                },
            });

            const hasRequiredRole = userRoles.some((ur) => roleNames.includes(ur.role.name));

            if (!hasRequiredRole) {
                res.status(403).json({
                    success: false,
                    error: {
                        code: 'FORBIDDEN',
                        message: `This action requires one of the following roles: ${roleNames.join(', ')}`,
                    },
                });
                return;
            }

            next();
        } catch (error) {
            console.error('Role check error:', error);
            res.status(500).json({
                success: false,
                error: {
                    code: 'INTERNAL_ERROR',
                    message: 'An error occurred while checking roles',
                },
            });
        }
    };
};
