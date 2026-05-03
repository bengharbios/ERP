import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../db/prisma';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        username: string;
        email: string;
    };
}

export interface TokenPayload {
    userId: string;
    username: string;
    email: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateAccessToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN as any,
    });
};

export const generateRefreshToken = (payload: TokenPayload): string => {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_REFRESH_EXPIRES_IN as any,
    });
};

export const verifyToken = (token: string): TokenPayload => {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

export const authenticateToken = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
): Promise<void> => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'NO_TOKEN',
                    message: 'Access token is required',
                },
            });
            return;
        }

        const payload = verifyToken(token);

        // Optional: Check if user exists in DB to prevent zombie tokens
        // We do this to avoid foreign key violations in audit logs if user was deleted
        const userExists = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { id: true, username: true, email: true, isActive: true }
        });

        if (!userExists || !userExists.isActive) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User account no longer exists or is inactive',
                },
            });
            return;
        }

        req.user = {
            id: userExists.id,
            username: userExists.username,
            email: userExists.email,
        };

        next();
    } catch (error) {
        res.status(401).json({
            success: false,
            error: {
                code: 'INVALID_TOKEN',
                message: 'Invalid or expired token',
            },
        });
    }
};
