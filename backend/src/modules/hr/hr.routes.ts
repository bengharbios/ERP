import { Router } from 'express';
import * as hrController from './hr.controller';
import { authenticateToken as authenticate } from '../../common/utils/jwt';

import * as biometricController from './biometric.controller';

const router = Router();

// All HR routes require authentication
router.use(authenticate);

// Biometric Devices
router.get('/biometric/devices', biometricController.getDevices);
router.post('/biometric/devices', biometricController.createDevice);
router.get('/biometric/discover', biometricController.discoverDevices);
router.post('/biometric/sync-all', biometricController.syncAllDevices);
router.put('/biometric/devices/:id', biometricController.updateDevice);
router.delete('/biometric/devices/:id', biometricController.deleteDevice);
router.post('/biometric/devices/:id/test', biometricController.testConnection);
router.post('/biometric/devices/:id/sync', biometricController.syncAttendance);
router.post('/biometric/devices/:id/sync-employees', biometricController.syncEmployees);

// Departments
// Departments
router.get('/departments', hrController.getDepartments);
router.post('/departments', hrController.createDepartment);

// Employees
router.get('/employees', hrController.getEmployees);
router.get('/employees/:id', hrController.getEmployeeById);
router.post('/employees', hrController.createEmployee);
router.put('/employees/:id', hrController.updateEmployee);

// Attendance
router.get('/attendance', hrController.getStaffAttendance);
router.post('/attendance', hrController.markAttendance);

// Leaves
router.get('/leaves', hrController.getLeaveRequests);
router.post('/leaves', hrController.createLeaveRequest);
router.patch('/leaves/:id/status', hrController.updateLeaveStatus);

// Payroll
router.get('/payroll', hrController.getPayroll);
router.post('/payroll', hrController.processPayroll);

export default router;
