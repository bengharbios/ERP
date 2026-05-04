import { Router } from 'express';
import * as leadController from './controllers/lead.controller';
import * as activityController from './controllers/activity.controller';
import * as teamController from './controllers/team.controller';
import { crmController } from './crm.controller';

const router = Router();

// --- Telegram & Bot Routes ---
router.post('/telegram/webhook', crmController.handleTelegramWebhook);
router.get('/telegram/setup', crmController.setupWebhook);

// --- Lead Routes ---
router.get('/leads', leadController.getLeads);
router.get('/leads/:id', leadController.getLeadById);
router.post('/leads', leadController.createLead);
router.put('/leads/:id', leadController.updateLead);
router.delete('/leads/:id', leadController.deleteLead);
router.get('/leads/:id/duplicates', leadController.checkDuplicates);
router.post('/leads/merge', leadController.mergeLeads);
router.post('/leads/:id/convert', leadController.convertToOpportunity);
router.post('/leads/:id/convert-customer', leadController.convertToCustomer);

// --- Stage Routes ---
router.get('/stages', leadController.getStages);
router.post('/stages', leadController.createStage);
router.put('/stages/:id', leadController.updateStage);
router.delete('/stages/:id', leadController.deleteStage);

// --- Activity Routes ---
router.get('/activities', activityController.getActivities);
router.get('/activities/:id', activityController.getActivityById);
router.post('/activities', activityController.createActivity);
router.put('/activities/:id', activityController.updateActivity);
router.put('/activities/:id/done', activityController.markAsDone);
router.delete('/activities/:id', activityController.deleteActivity);
router.get('/activity-types', activityController.getActivityTypes);
router.post('/activity-types', activityController.createActivityType);
router.put('/activity-types/:id', activityController.updateActivityType);
router.delete('/activity-types/:id', activityController.deleteActivityType);

// --- Activity Plan Routes ---
router.get('/activity-plans', activityController.getActivityPlans);
router.post('/activity-plans', activityController.createActivityPlan);
router.put('/activity-plans/:id', activityController.updateActivityPlan);
router.delete('/activity-plans/:id', activityController.deleteActivityPlan);

// --- Team Routes ---
router.get('/teams', teamController.getTeams);
router.get('/teams/:id', teamController.getTeamById);
router.post('/teams', teamController.createTeam);
router.put('/teams/:id', teamController.updateTeam);
router.delete('/teams/:id', teamController.deleteTeam);

export default router;
