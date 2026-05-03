import { Router } from 'express';
import { authenticateToken } from '../../common/utils/jwt';
import * as leadController from './controllers/lead.controller';
import * as activityController from './controllers/activity.controller';
import * as teamController from './controllers/team.controller';

const router = Router();

// Lead Routes
router.get('/leads', authenticateToken, leadController.getLeads);
router.get('/leads/:id', authenticateToken, leadController.getLeadById);
router.post('/leads', authenticateToken, leadController.createLead);
router.put('/leads/:id', authenticateToken, leadController.updateLead);
router.delete('/leads/:id', authenticateToken, leadController.deleteLead);

// Duplicate Detection & Merging
router.get('/leads/:id/duplicates', authenticateToken, leadController.checkDuplicates);
router.post('/leads/merge', authenticateToken, leadController.mergeLeads);

// Convert Lead to Opportunity/Customer
router.post('/leads/:id/convert', authenticateToken, leadController.convertToOpportunity);
router.post('/leads/:id/convert-customer', authenticateToken, leadController.convertToCustomer);

// Activity Routes
router.get('/activities', authenticateToken, activityController.getActivities);
router.get('/activities/:id', authenticateToken, activityController.getActivityById);
router.post('/activities', authenticateToken, activityController.createActivity);
router.put('/activities/:id', authenticateToken, activityController.updateActivity);
router.put('/activities/:id/done', authenticateToken, activityController.markAsDone);
router.delete('/activities/:id', authenticateToken, activityController.deleteActivity);

// Team Routes
router.get('/teams', authenticateToken, teamController.getTeams);
router.get('/teams/:id', authenticateToken, teamController.getTeamById);
router.post('/teams', authenticateToken, teamController.createTeam);
router.put('/teams/:id', authenticateToken, teamController.updateTeam);
router.delete('/teams/:id', authenticateToken, teamController.deleteTeam);

// Stage Routes
router.get('/stages', authenticateToken, leadController.getStages);
router.post('/stages', authenticateToken, leadController.createStage);
router.put('/stages/:id', authenticateToken, leadController.updateStage);
router.delete('/stages/:id', authenticateToken, leadController.deleteStage);

// Activity Types — full CRUD
router.get('/activity-types', authenticateToken, activityController.getActivityTypes);
router.post('/activity-types', authenticateToken, activityController.createActivityType);
router.put('/activity-types/:id', authenticateToken, activityController.updateActivityType);
router.delete('/activity-types/:id', authenticateToken, activityController.deleteActivityType);

// Activity Plans — full CRUD
router.get('/activity-plans', authenticateToken, activityController.getActivityPlans);
router.post('/activity-plans', authenticateToken, activityController.createActivityPlan);
router.put('/activity-plans/:id', authenticateToken, activityController.updateActivityPlan);
router.delete('/activity-plans/:id', authenticateToken, activityController.deleteActivityPlan);

export default router;

