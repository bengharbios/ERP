import { Router } from 'express';
import { superAdminController } from './superadmin.controller';

const router = Router();

// Overview
router.get('/overview', (req, res) => superAdminController.getOverview(req, res));

// Tenants
router.get('/tenants', (req, res) => superAdminController.getTenants(req, res));
router.get('/tenants/:id', (req, res) => superAdminController.getTenantById(req, res));
router.post('/tenants', (req, res) => superAdminController.addTenant(req, res));
router.patch('/tenants/:id', (req, res) => superAdminController.updateTenant(req, res));
router.delete('/tenants/:id', (req, res) => superAdminController.deleteTenant(req, res));
router.post('/tenants/:id/impersonate', (req, res) => superAdminController.impersonateTenant(req, res));

// Subscriptions & Bank Receipts
router.get('/subscriptions', (req, res) => superAdminController.getSubscriptions(req, res));
router.post('/receipts/:id/review', (req, res) => superAdminController.reviewReceipt(req, res));

// Plans
router.get('/plans', (req, res) => superAdminController.getPlans(req, res));
router.put('/plans', (req, res) => superAdminController.updatePlans(req, res));

// Settings (Profile, Platform branding, Payment methods)
router.get('/settings', (req, res) => superAdminController.getSettings(req, res));
router.put('/settings', (req, res) => superAdminController.updateSettings(req, res));

export default router;
