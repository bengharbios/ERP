import { Router } from 'express';
import { crmController } from './crm.controller';

const router = Router();

// Telegram Webhook
router.post('/telegram/webhook', crmController.handleTelegramWebhook);

// Utility to setup webhook (protected or one-time use)
router.get('/telegram/setup', crmController.setupWebhook);

export default router;
