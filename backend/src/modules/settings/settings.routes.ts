import { Router } from 'express';
import * as settingsController from './settings.controller';

const router = Router();

// System Settings
router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);
router.get('/network', settingsController.getNetworkInfo);

// Student Registrations
router.get('/students/:studentId', settingsController.getStudentRegistrations);
router.post('/students/:studentId', settingsController.upsertStudentRegistration);

export default router;
