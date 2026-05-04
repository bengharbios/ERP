import { Router } from 'express';
import { authenticateToken } from '../../common/utils/jwt';
import { checkPermission } from '../../common/middleware/rbac';
import * as programsController from './programs.controller';
import * as unitsController from './units.controller';
import * as classesController from './classes.controller';
import * as settingsController from './settings.controller';
import * as lecturesController from './lectures.controller';
import * as attendanceController from './attendance.controller';
import * as reportsController from './reports.controller';
import * as aiController from './ai.controller';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// ============================================
// PROGRAMS ROUTES
// ============================================

router.get('/programs', programsController.getPrograms);
router.get('/programs/:id', programsController.getProgramById);

router.post(
    '/programs',
    checkPermission({ resource: 'programs', action: 'create' }),
    programsController.createProgram
);

router.put(
    '/programs/:id',
    checkPermission({ resource: 'programs', action: 'update' }),
    programsController.updateProgram
);

router.delete(
    '/programs/:id',
    checkPermission({ resource: 'programs', action: 'delete' }),
    programsController.deleteProgram
);

router.post(
    '/programs/:id/units',
    checkPermission({ resource: 'programs', action: 'update' }),
    programsController.addUnitsToProgram
);

// ============================================
// UNITS ROUTES
// ============================================

router.get('/units', unitsController.getUnits);
router.get('/units/:id', unitsController.getUnitById);

router.post(
    '/units',
    checkPermission({ resource: 'units', action: 'create' }),
    unitsController.createUnit
);

router.put(
    '/units/:id',
    checkPermission({ resource: 'units', action: 'update' }),
    unitsController.updateUnit
);

router.delete(
    '/units/:id',
    checkPermission({ resource: 'units', action: 'delete' }),
    unitsController.deleteUnit
);

// Get students enrolled in a unit
router.get('/units/:unitId/students', unitsController.getUnitStudents);


// ============================================
// CLASSES ROUTES
// ============================================

router.get('/classes', classesController.getClasses);
router.get('/classes/:id', classesController.getClassById);

router.post(
    '/classes',
    checkPermission({ resource: 'classes', action: 'create' }),
    classesController.createClass
);

router.put(
    '/classes/:id',
    checkPermission({ resource: 'classes', action: 'update' }),
    classesController.updateClass
);

router.delete(
    '/classes/:id',
    checkPermission({ resource: 'classes', action: 'delete' }),
    classesController.deleteClass
);

router.post(
    '/classes/assign-instructor',
    checkPermission({ resource: 'classes', action: 'update' }),
    classesController.assignInstructor
);

// Student Enrollment Routes
router.get('/classes/:id/students', classesController.getClassStudents);

router.post(
    '/classes/:id/students',
    checkPermission({ resource: 'classes', action: 'update' }),
    classesController.enrollStudent
);

router.delete(
    '/classes/:id/students/:studentId',
    checkPermission({ resource: 'classes', action: 'update' }),
    classesController.removeStudent
);

// Auto-Schedule Route
router.post(
    '/classes/:id/schedule',
    checkPermission({ resource: 'classes', action: 'update' }),
    classesController.autoScheduleClass
);

// Modular Delivery & Smart Suggestions
router.get(
    '/classes/:id/suggestions',
    checkPermission({ resource: 'classes', action: 'read' }),
    classesController.getUnitSuggestions
);

router.post(
    '/classes/:id/interruption',
    checkPermission({ resource: 'classes', action: 'update' }),
    classesController.handleInterruption
);

router.post(
    '/classes/transfer',
    checkPermission({ resource: 'classes', action: 'update' }),
    classesController.transferStudent
);

router.post(
    '/classes/:id/sync-progress',
    checkPermission({ resource: 'classes', action: 'update' }),
    classesController.syncClassProgress
);

// ============================================
// LECTURES ROUTES
// ============================================

router.get('/lectures', lecturesController.getLectures);
router.get('/lectures/:id', lecturesController.getLectureById);
router.get('/lectures/:id/details', lecturesController.getLectureDetails);

router.put(
    '/lectures/:id',
    checkPermission({ resource: 'classes', action: 'update' }),
    lecturesController.updateLecture
);

router.post(
    '/lectures/:id/cancel',
    checkPermission({ resource: 'classes', action: 'update' }),
    lecturesController.cancelLecture
);

// Undo cancel
router.post(
    '/lectures/:id/undo-cancel',
    checkPermission({ resource: 'classes', action: 'update' }),
    lecturesController.undoCancelLecture
);

router.post(
    '/lectures/:id/postpone',
    checkPermission({ resource: 'classes', action: 'update' }),
    lecturesController.postponeLecture
);

// Undo postpone
router.post(
    '/lectures/:id/undo-postpone',
    checkPermission({ resource: 'classes', action: 'update' }),
    lecturesController.undoPostponeLecture
);

// ============================================
// PROGRAM LEVELS ROUTES
// ============================================

router.get('/levels', settingsController.getProgramLevels);

router.post(
    '/levels',
    checkPermission({ resource: 'programs', action: 'create' }),
    settingsController.createProgramLevel
);

router.put(
    '/levels/:id',
    checkPermission({ resource: 'programs', action: 'update' }),
    settingsController.updateProgramLevel
);

router.delete(
    '/levels/:id',
    checkPermission({ resource: 'programs', action: 'delete' }),
    settingsController.deleteProgramLevel
);

// ============================================
// AWARDING BODIES ROUTES
// ============================================

router.get('/awarding-bodies', settingsController.getAwardingBodies);

router.post(
    '/awarding-bodies',
    checkPermission({ resource: 'programs', action: 'create' }),
    settingsController.createAwardingBody
);

router.put(
    '/awarding-bodies/:id',
    checkPermission({ resource: 'programs', action: 'update' }),
    settingsController.updateAwardingBody
);

router.delete(
    '/awarding-bodies/:id',
    checkPermission({ resource: 'programs', action: 'delete' }),
    settingsController.deleteAwardingBody
);

// ============================================
// ATTENDANCE ROUTES
// ============================================

router.get(
    '/lectures/:lectureId/attendance',
    checkPermission({ resource: 'classes', action: 'read' }),
    attendanceController.getLectureAttendance
);

router.post(
    '/lectures/:lectureId/attendance',
    checkPermission({ resource: 'classes', action: 'update' }),
    attendanceController.recordAttendance
);

// ============================================
// REPORTS ROUTES
// ============================================

// ============================================
// AI ACADEMIC ASSESSOR ROUTES
// ============================================

router.post(
    '/ai/analyze',
    aiController.analyzeAssignment
);

export default router;

