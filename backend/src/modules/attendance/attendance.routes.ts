import { Router } from 'express';
import { authenticateToken } from '../../common/utils/jwt';
import { checkPermission } from '../../common/middleware/rbac';
import * as attendanceController from './attendance.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// ATTENDANCE ROUTES
// ============================================

// Record attendance
router.post(
    '/record',
    checkPermission({ resource: 'attendance', action: 'create' }),
    attendanceController.recordAttendance
);

router.post(
    '/bulk-record',
    checkPermission({ resource: 'attendance', action: 'create' }),
    attendanceController.bulkRecordAttendance
);

// Get attendance
router.get('/lecture/:lectureId', attendanceController.getLectureAttendance);
router.get('/student/:studentId', attendanceController.getStudentAttendance);
router.get('/student/:studentId/deep-report', attendanceController.getDeepStudentReport);
router.get('/class/:classId/summary', attendanceController.getClassAttendanceSummary);

// Update attendance
router.put(
    '/:id',
    checkPermission({ resource: 'attendance', action: 'update' }),
    attendanceController.updateAttendance
);

// Delete attendance
router.delete(
    '/:id',
    checkPermission({ resource: 'attendance', action: 'delete' }),
    attendanceController.deleteAttendance
);

export default router;
