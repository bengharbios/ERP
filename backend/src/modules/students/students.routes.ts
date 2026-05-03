import { Router } from 'express';
import { authenticateToken } from '../../common/utils/jwt';
import { checkPermission } from '../../common/middleware/rbac';
import * as studentsController from './students.controller';
import * as enrollmentController from './enrollment.controller';
import * as parentsController from './parents.controller';
import * as excelController from './students.excel.controller';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// STUDENTS ROUTES
// ============================================

router.get('/', studentsController.getStudents);
router.get('/export/excel', excelController.exportStudentsToExcel);
router.post('/import/excel', upload.single('file'), excelController.importStudentsFromExcel);
// ACADEMIC RECORD (MASTERMIND LOGIC)
router.get('/:id/academic-record', studentsController.getStudentAcademicRecord);
router.patch('/:id/status', studentsController.updateStudentStatus);
router.put('/:id/academic-record/unit', studentsController.updateStudentUnitStatus);

router.get('/:id', studentsController.getStudentById);

// TEMPORARY: Removed permission check for testing
router.post(
    '/',
    // checkPermission({ resource: 'students', action: 'create' }),
    studentsController.createStudent
);

router.put(
    '/:id',
    // checkPermission({ resource: 'students', action: 'update' }),
    studentsController.updateStudent
);

router.delete(
    '/:id',
    checkPermission({ resource: 'students', action: 'delete' }),
    studentsController.deleteStudent
);

// ============================================
// ENROLLMENT ROUTES
// ============================================

router.post(
    '/enrollments',
    checkPermission({ resource: 'students', action: 'enroll' }),
    enrollmentController.enrollStudent
);

router.get('/:studentId/enrollments', enrollmentController.getStudentEnrollments);
router.get('/classes/:classId/enrollments', enrollmentController.getClassEnrollments);

router.put(
    '/enrollments/:id',
    checkPermission({ resource: 'students', action: 'update' }),
    enrollmentController.updateEnrollment
);

router.post(
    '/enrollments/:id/drop',
    checkPermission({ resource: 'students', action: 'update' }),
    enrollmentController.dropEnrollment
);

// ============================================
// PARENTS/GUARDIANS ROUTES
// ============================================

router.get('/:studentId/parents', parentsController.getStudentParents);

router.post(
    '/parents',
    checkPermission({ resource: 'students', action: 'update' }),
    parentsController.addParent
);

router.put(
    '/parents/:id',
    checkPermission({ resource: 'students', action: 'update' }),
    parentsController.updateParent
);

router.delete(
    '/parents/:id',
    checkPermission({ resource: 'students', action: 'update' }),
    parentsController.deleteParent
);

export default router;
