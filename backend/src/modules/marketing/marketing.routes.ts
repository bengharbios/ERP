import { Router } from 'express';
import { marketingController } from './marketing.controller';
import { asyncHandler } from '../../common/utils/asyncHandler';
import { authenticateToken } from '../../common/utils/jwt';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// === CAMPAIGNS ===
router.get('/campaigns', asyncHandler(marketingController.getCampaigns));
router.get('/campaigns/:id', asyncHandler(marketingController.getCampaignById));
router.post('/campaigns', asyncHandler(marketingController.createCampaign));
router.put('/campaigns/:id', asyncHandler(marketingController.updateCampaign));
router.patch('/campaigns/:id/status', asyncHandler(marketingController.updateCampaignStatus));

// === AUDIENCES ===
router.get('/audiences', asyncHandler(marketingController.getAudiences));
router.post('/audiences', asyncHandler(marketingController.createAudience));

// === LEADS ===
router.get('/leads', asyncHandler(marketingController.getLeads));
router.post('/leads', asyncHandler(marketingController.createLead));
router.patch('/leads/:id/status', asyncHandler(marketingController.updateLeadStatus));

// === DASHBOARD ===
router.get('/stats', asyncHandler(marketingController.getStats));

// === ADVANCED ANALYTICS ===
router.get('/campaigns/:campaignId/funnel', asyncHandler(marketingController.getFunnelAnalytics));
router.get('/campaigns/:campaignId/roi', asyncHandler(marketingController.getCampaignROI));
router.get('/leads/:leadId/score', asyncHandler(marketingController.calculateLeadScore));
router.get('/leads/scored', asyncHandler(marketingController.getLeadsWithScoring));
router.post('/leads/activity', asyncHandler(marketingController.trackLeadActivity));

// === A/B TESTING ===
router.post('/ab-tests/variants', asyncHandler(marketingController.createVariants));
router.patch('/ab-tests/variants/:variantId/metrics', asyncHandler(marketingController.updateVariantMetrics));
router.get('/ab-tests/:campaignId/results', asyncHandler(marketingController.getTestResults));
router.post('/ab-tests/:campaignId/declare-winner', asyncHandler(marketingController.declareWinner));
router.get('/ab-tests/:campaignId/winner', asyncHandler(marketingController.getWinner));

// === CUSTOMER JOURNEY ===
router.get('/journeys/:leadId', asyncHandler(marketingController.getJourney));
router.post('/journeys/touchpoints', asyncHandler(marketingController.addTouchpoint));
router.post('/journeys/:leadId/convert', asyncHandler(marketingController.markJourneyConverted));
router.get('/journeys/analytics/overview', asyncHandler(marketingController.getJourneyAnalytics));

// === AUTOMATION WORKFLOWS ===
import { automationController } from './automation.controller';

router.get('/automation/workflows', asyncHandler(automationController.getWorkflows));
router.post('/automation/workflows', asyncHandler(automationController.createWorkflow));
router.get('/automation/workflows/:id', asyncHandler(automationController.getWorkflowById));
router.patch('/automation/workflows/:id/status', asyncHandler(automationController.updateWorkflowStatus));
router.delete('/automation/workflows/:id', asyncHandler(automationController.deleteWorkflow));
router.post('/automation/trigger', asyncHandler(automationController.triggerWorkflow));
router.get('/automation/executions', asyncHandler(automationController.getExecutions));

// === WHATSAPP ===
router.get('/whatsapp/status', asyncHandler(marketingController.getWhatsAppStatus));
router.post('/whatsapp/connect', asyncHandler(marketingController.connectWhatsApp));
router.post('/whatsapp/logout', asyncHandler(marketingController.logoutWhatsApp));
router.get('/whatsapp/stats', asyncHandler(marketingController.getWhatsAppStats));

export default router;
