import { Router } from 'express';
import { authenticateToken } from '../../common/utils/jwt';
import { checkPermission } from '../../common/middleware/rbac';
import * as notificationsController from './notifications.controller';
import * as reportsController from './reports.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// NOTIFICATIONS ROUTES
// ============================================

// Create notification (admin only)
router.post(
    '/notifications',
    checkPermission({ resource: 'notifications', action: 'create' }),
    notificationsController.createNotification
);

// Get user's notifications
router.get('/notifications', notificationsController.getUserNotifications);

// Mark notification as read
router.put('/notifications/:id/read', notificationsController.markAsRead);

// Mark all as read
router.put('/notifications/read-all', notificationsController.markAllAsRead);

// Delete notification
router.delete('/notifications/:id', notificationsController.deleteNotification);

// ============================================
// REPORTS ROUTES
// ============================================

// Student progress report
router.get(
    '/reports/student-progress',
    checkPermission({ resource: 'reports', action: 'view' }),
    reportsController.getStudentProgressReport
);

// Attendance report
router.get(
    '/reports/attendance',
    checkPermission({ resource: 'reports', action: 'view' }),
    reportsController.getAttendanceReport
);

// Class performance report
router.get(
    '/reports/class-performance',
    checkPermission({ resource: 'reports', action: 'view' }),
    reportsController.getClassPerformanceReport
);

export default router;
