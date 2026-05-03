import { Router } from 'express';
import * as hrmsController from './hrms.controller';
import { authenticateToken as authenticate } from '../../common/utils/jwt';

const router = Router();

router.use(authenticate);

// Recruitment
router.get('/jobs', hrmsController.getJobs);
router.post('/jobs', hrmsController.createJob);
router.get('/applications', hrmsController.getApplications);
router.post('/applications', hrmsController.createApplication);
router.patch('/applications/:id/status', hrmsController.updateApplicationStatus);

// Employee Actions
router.get('/awards', hrmsController.getAwards);
router.post('/awards', hrmsController.createAward);
router.get('/warnings', hrmsController.getWarnings);
router.post('/warnings', hrmsController.createWarning);
router.get('/complaints', hrmsController.getComplaints);
router.post('/complaints', hrmsController.createComplaint);
router.post('/promotions', hrmsController.processPromotion);
router.post('/transfers', hrmsController.processTransfer);
router.post('/resignations', hrmsController.processResignation);
router.post('/terminations', hrmsController.processTermination);

// Communication
router.get('/announcements', hrmsController.getAnnouncements);
router.post('/announcements', hrmsController.createAnnouncement);
router.get('/meetings', hrmsController.getMeetings);
router.post('/meetings', hrmsController.createMeeting);
router.get('/events', hrmsController.getEvents);
router.post('/events', hrmsController.createEvent);

// Analytics
router.get('/dashboard', hrmsController.getHRDashboard);

// Shifts
router.get('/shifts', hrmsController.getShifts);
router.post('/shifts', hrmsController.createShift);
router.patch('/shifts/:id', hrmsController.updateShift);
router.delete('/shifts/:id', hrmsController.deleteShift);

export default router;
