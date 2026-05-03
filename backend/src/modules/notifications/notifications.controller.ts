import { Response } from 'express';
import prisma from '../../common/db/prisma';
import { AuthRequest } from '../../common/utils/jwt';
import {
    createNotificationSchema,
} from './notifications.validation';

// Create Notification
export const createNotification = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createNotificationSchema.parse(req.body);

        // Check if user exists
        const user = await prisma.user.findUnique({
            where: { id: validatedData.userId },
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

        const notification = await prisma.notification.create({
            data: {
                userId: validatedData.userId,
                title: validatedData.title,
                message: validatedData.message,
                type: validatedData.type,
                link: validatedData.link,
                data: validatedData.metadata || {},
                isRead: false,
            },
        });

        res.status(201).json({
            success: true,
            data: { notification },
        });
    } catch (error: any) {
        console.error('Create notification error:', error);

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
                message: 'An error occurred while creating notification',
            },
        });
    }
};

// Get User Notifications
export const getUserNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;
        const { read, type, limit = '50' } = req.query;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User not authenticated',
                },
            });
            return;
        }

        const where: any = { userId };

        if (read !== undefined) {
            where.isRead = read === 'true';
        }

        if (type) {
            where.type = type;
        }

        const notifications = await prisma.notification.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
            take: parseInt(limit as string),
        });

        const unreadCount = await prisma.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                total: notifications.length,
            },
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching notifications',
            },
        });
    }
};

// Mark Notification as Read
export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const notification = await prisma.notification.findUnique({
            where: { id },
        });

        if (!notification) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOTIFICATION_NOT_FOUND',
                    message: 'Notification not found',
                },
            });
            return;
        }

        // Verify ownership
        if (notification.userId !== userId) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Cannot update another user\'s notification',
                },
            });
            return;
        }

        const updated = await prisma.notification.update({
            where: { id },
            data: { isRead: true },
        });

        res.json({
            success: true,
            data: { notification: updated },
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while updating notification',
            },
        });
    }
};

// Mark All as Read
export const markAllAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'User not authenticated',
                },
            });
            return;
        }

        await prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
            },
        });

        res.json({
            success: true,
            data: { message: 'All notifications marked as read' },
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while updating notifications',
            },
        });
    }
};

// Delete Notification
export const deleteNotification = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?.id;

        const notification = await prisma.notification.findUnique({
            where: { id },
        });

        if (!notification) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'NOTIFICATION_NOT_FOUND',
                    message: 'Notification not found',
                },
            });
            return;
        }

        // Verify ownership
        if (notification.userId !== userId) {
            res.status(403).json({
                success: false,
                error: {
                    code: 'FORBIDDEN',
                    message: 'Cannot delete another user\'s notification',
                },
            });
            return;
        }

        await prisma.notification.delete({
            where: { id },
        });

        res.json({
            success: true,
            data: { message: 'Notification deleted successfully' },
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting notification',
            },
        });
    }
};

// Helper: Send notification to user
export const sendNotificationToUser = async (
    userId: string,
    title: string,
    message: string,
    type: 'info' | 'success' | 'warning' | 'error',
    link?: string,
    metadata?: any
): Promise<void> => {
    try {
        await prisma.notification.create({
            data: {
                userId,
                title,
                message,
                type,
                link,
                data: metadata || {},
                isRead: false,
            },
        });
    } catch (error) {
        console.error('Send notification error:', error);
    }
};
