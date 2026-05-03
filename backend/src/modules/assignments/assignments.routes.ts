import { Router } from 'express';
import { authenticateToken } from '../../common/utils/jwt';
import { checkPermission } from '../../common/middleware/rbac';
import * as assignmentsController from './assignments.controller';
import * as submissionsController from './submissions.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// ASSIGNMENTS ROUTES
// ============================================

// Create assignment
// Create assignment
router.post(
    '/',
    checkPermission({ resource: 'assignments', action: 'create' }),
    assignmentsController.createAssignment
);

// Get assignments
router.get('/', assignmentsController.getAssignments);
router.get('/:id', assignmentsController.getAssignmentById);
router.get('/:id/statistics', assignmentsController.getAssignmentStatistics);

// Update assignment
// Update assignment
router.put(
    '/:id',
    checkPermission({ resource: 'assignments', action: 'update' }),
    assignmentsController.updateAssignment
);

// Delete assignment
router.delete(
    '/:id',
    checkPermission({ resource: 'assignments', action: 'delete' }),
    assignmentsController.deleteAssignment
);

// ============================================
// SUBMISSIONS ROUTES
// ============================================

// Create submission
router.post(
    '/submissions',
    checkPermission({ resource: 'assignments', action: 'submit' }),
    submissionsController.createSubmission
);

// Get submissions
// Get submissions
router.get('/:assignmentId/submissions', submissionsController.getAssignmentSubmissions);
router.get('/students/:studentId/submissions', submissionsController.getStudentSubmissions);

// Update submission
router.put(
    '/submissions/:id',
    checkPermission({ resource: 'assignments', action: 'submit' }),
    submissionsController.updateSubmission
);

// Grade submission
router.post(
    '/submissions/:id/grade',
    checkPermission({ resource: 'assignments', action: 'grade' }),
    submissionsController.gradeSubmission
);

// Delete submission
router.delete(
    '/submissions/:id',
    checkPermission({ resource: 'assignments', action: 'delete' }),
    submissionsController.deleteSubmission
);

export default router;
