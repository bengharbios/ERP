import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { hashPassword, comparePassword, validatePassword } from '../../common/utils/password';
import { generateAccessToken, generateRefreshToken, verifyToken, AuthRequest } from '../../common/utils/jwt';
import {
    registerSchema,
    loginSchema,
    refreshTokenSchema,
    changePasswordSchema,
} from './auth.validation';

export const register = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate input
        const validatedData = registerSchema.parse(req.body);

        // Validate password strength
        const passwordValidation = validatePassword(validatedData.password);
        if (!passwordValidation.valid) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PASSWORD',
                    message: passwordValidation.message,
                },
            });
            return;
        }

        // Check if user already exists
        const existingUser = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: validatedData.username },
                    { email: validatedData.email },
                ],
            },
        });

        if (existingUser) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'USER_EXISTS',
                    message: existingUser.username === validatedData.username
                        ? 'Username already exists'
                        : 'Email already exists',
                },
            });
            return;
        }

        // Hash password
        const passwordHash = await hashPassword(validatedData.password);

        // Create user
        const user = await prisma.user.create({
            data: {
                username: validatedData.username,
                email: validatedData.email,
                passwordHash,
                firstName: validatedData.firstName,
                lastName: validatedData.lastName,
                phone: validatedData.phone,
            },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                createdAt: true,
            },
        });

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'USER_REGISTERED',
                resourceType: 'User',
                resourceId: user.id,
                afterData: { username: user.username, email: user.email },
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            },
        });

        res.status(201).json({
            success: true,
            data: {
                user,
                message: 'User registered successfully',
            },
        });
    } catch (error: any) {
        console.error('Registration error:', error);

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
                message: 'An error occurred during registration',
            },
        });
    }
};

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        // Validate input
        const validatedData = loginSchema.parse(req.body);

        // Find user
        const user = await prisma.user.findFirst({
            where: {
                OR: [
                    { username: validatedData.username },
                    { email: validatedData.username }, // Allow login with email too
                ],
            },
        });

        if (!user) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid username or password',
                },
            });
            return;
        }

        // Check if user is active
        if (!user.isActive) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'ACCOUNT_DISABLED',
                    message: 'Your account has been disabled',
                },
            });
            return;
        }

        // Verify password
        const isPasswordValid = await comparePassword(
            validatedData.password,
            user.passwordHash
        );

        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_CREDENTIALS',
                    message: 'Invalid username or password',
                },
            });
            return;
        }

        // Generate tokens
        const tokenPayload = {
            userId: user.id,
            username: user.username,
            email: user.email,
        };

        const accessToken = generateAccessToken(tokenPayload);
        const refreshToken = generateRefreshToken(tokenPayload);

        // Update last login
        await prisma.user.update({
            where: { id: user.id },
            data: { lastLogin: new Date() },
        });

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'USER_LOGIN',
                resourceType: 'User',
                resourceId: user.id,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            },
        });

        // Load roles and permissions
        const userWithRoles = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
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

        const roles = userWithRoles?.userRoles.map((ur) => ur.role.name) || [];
        const permissions = userWithRoles?.userRoles.flatMap((ur) =>
            ur.role.rolePermissions.map((rp) => `${rp.permission.action}_${rp.permission.resource}`)
        ) || [];

        res.json({
            success: true,
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    roles,
                    permissions,
                },
                accessToken,
                refreshToken,
                expiresIn: process.env.JWT_EXPIRES_IN || '15m',
            },
        });
    } catch (error: any) {
        if (error instanceof Error) {
            console.error('Login error:', error.message);
            console.error(error.stack);
        } else {
            console.error('Login error (unknown):', error);
        }

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
                message: 'An error occurred during login',
            },
        });
    }
};

export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = refreshTokenSchema.parse(req.body);

        // Verify refresh token
        const payload = verifyToken(validatedData.refreshToken);

        // Generate new access token
        const accessToken = generateAccessToken({
            userId: payload.userId,
            username: payload.username,
            email: payload.email,
        });

        res.json({
            success: true,
            data: {
                accessToken,
                expiresIn: process.env.JWT_EXPIRES_IN || '15m',
            },
        });
    } catch (error) {
        res.status(403).json({
            success: false,
            error: {
                code: 'INVALID_REFRESH_TOKEN',
                message: 'Invalid or expired refresh token',
            },
        });
    }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
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

        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                profilePicture: true,
                isActive: true,
                emailVerified: true,
                lastLogin: true,
                createdAt: true,
            },
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found',
                },
            });
            return;
        }

        // Fetch user roles and permissions
        const userWithRoles = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                userRoles: {
                    include: {
                        role: {
                            include: {
                                rolePermissions: {
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

        const roles = userWithRoles?.userRoles.map((ur) => ur.role.name) || [];
        const permissions = userWithRoles?.userRoles.flatMap((ur) =>
            ur.role.rolePermissions.map((rp) => `${rp.permission.action}_${rp.permission.resource}`)
        ) || [];

        res.json({
            success: true,
            data: { 
                user: {
                    ...user,
                    roles,
                    permissions
                }
            },
        });
    } catch (error) {
        console.error('Get me error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred',
            },
        });
    }
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (!req.user) {
            res.status(401).json({
                success: false,
                error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
            });
            return;
        }

        const validatedData = changePasswordSchema.parse(req.body);

        // Validate new password strength
        const passwordValidation = validatePassword(validatedData.newPassword);
        if (!passwordValidation.valid) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_PASSWORD',
                    message: passwordValidation.message,
                },
            });
            return;
        }

        // Get current user
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
        });

        if (!user) {
            res.status(404).json({
                success: false,
                error: { code: 'USER_NOT_FOUND', message: 'User not found' },
            });
            return;
        }

        // Verify current password
        const isPasswordValid = await comparePassword(
            validatedData.currentPassword,
            user.passwordHash
        );

        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'INVALID_PASSWORD',
                    message: 'Current password is incorrect',
                },
            });
            return;
        }

        // Hash new password
        const newPasswordHash = await hashPassword(validatedData.newPassword);

        // Update password
        await prisma.user.update({
            where: { id: user.id },
            data: { passwordHash: newPasswordHash },
        });

        // Log the action
        await prisma.auditLog.create({
            data: {
                userId: user.id,
                action: 'PASSWORD_CHANGED',
                resourceType: 'User',
                resourceId: user.id,
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            },
        });

        res.json({
            success: true,
            data: { message: 'Password changed successfully' },
        });
    } catch (error: any) {
        console.error('Change password error:', error);

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
                message: 'An error occurred',
            },
        });
    }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        if (req.user) {
            // Log the action
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'USER_LOGOUT',
                    resourceType: 'User',
                    resourceId: req.user.id,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Logged out successfully' },
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred',
            },
        });
    }
};
