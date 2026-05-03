import { Response, NextFunction } from 'express';
import prisma from '../common/db/prisma';
import { AuthRequest } from '../common/utils/jwt';

/**
 * Middleware to check if user has specific permission
 */
export const requirePermission = (permissionCode: string) => {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            if (!req.user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not authenticated'
                });
            }

            // 1. Get user with roles and permissions
            const user = await prisma.user.findUnique({
                where: { id: req.user.id },
                include: {
                    userRoles: {
                        include: {
                            role: {
                                include: {
                                    permissions: {
                                        include: {
                                            permission: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (!user) {
                return res.status(401).json({
                    success: false,
                    error: 'User not found'
                });
            }

            // 2. Check if user is Super Admin (bypass all checks)
            const isSuperAdmin = user.userRoles.some(
                (ur: any) => ur.role.name === 'Super Admin' || ur.role.name === 'Admin'
            );
            if (isSuperAdmin) {
                return next();
            }

            // 3. Check if user has the specific permission
            // Permission code is constructed as "{action}_{resource}"
            // e.g. resource='financial_receipts', action='view' => 'view_financial_receipts'
            const userPermissions = user.userRoles.flatMap((ur: any) =>
                ur.role.permissions.map((rp: any) => {
                    const p = rp.permission;
                    // Support both: a 'code' field (if exists) OR construct from action+resource
                    return p.code || `${p.action}_${p.resource}`;
                })
            );

            const hasPermission = userPermissions.includes(permissionCode);

            if (!hasPermission) {
                return res.status(403).json({
                    success: false,
                    error: `Access denied. Requires permission: ${permissionCode}`
                });
            }

            next();
        } catch (error) {
            console.error('Permission check error:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error checking permissions'
            });
        }
    };
};
