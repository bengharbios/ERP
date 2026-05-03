import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { whatsappService } from './whatsapp.service';
import { localAiService } from './localAi.service';
import {
    CreateCampaignSchema,
    CreateAudienceSchema,
    CreateLeadSchema,
    UpdateCampaignStatusSchema,
    UpdateLeadStatusSchema
} from './marketing.validation';
import { marketingService } from './marketing.service';

export const marketingController = {
    // --- CAMPAIGNS ---
    async getCampaigns(_req: Request, res: Response) {
        const campaigns = await marketingService.getCampaigns();
        res.json({ success: true, data: campaigns });
    },

    async getCampaignById(req: Request, res: Response) {
        const campaign = await marketingService.getCampaignById(req.params.id);
        if (!campaign) {
            return res.status(404).json({ success: false, message: 'Campaign not found' });
        }
        return res.json({ success: true, data: campaign });
    },

    async createCampaign(req: Request, res: Response) {
        const validated = CreateCampaignSchema.parse(req.body);
        const campaign = await marketingService.createCampaign(validated);
        res.status(201).json({ success: true, data: campaign });
    },

    async updateCampaign(req: Request, res: Response) {
        const campaign = await marketingService.updateCampaign(req.params.id, req.body);
        res.json({ success: true, data: campaign });
    },

    async updateCampaignStatus(req: Request, res: Response) {
        const { status } = UpdateCampaignStatusSchema.parse(req.body);
        const campaign = await marketingService.updateCampaign(req.params.id, { status });
        res.json({ success: true, data: campaign });
    },

    // --- AUDIENCES ---
    async getAudiences(_req: Request, res: Response) {
        const audiences = await marketingService.getAudiences();
        res.json({ success: true, data: audiences });
    },

    async createAudience(req: Request, res: Response) {
        const validated = CreateAudienceSchema.parse(req.body);
        const audience = await marketingService.createAudience(validated);
        res.status(201).json({ success: true, data: audience });
    },

    // --- LEADS ---
    async getLeads(req: Request, res: Response) {
        const leads = await marketingService.getLeads(req.query);
        res.json({ success: true, data: leads });
    },

    async createLead(req: Request, res: Response) {
        const validated = CreateLeadSchema.parse(req.body);
        const lead = await marketingService.createLead(validated);
        res.status(201).json({ success: true, data: lead });
    },

    async updateLeadStatus(req: Request, res: Response) {
        const { status } = UpdateLeadStatusSchema.parse(req.body);
        const lead = await marketingService.updateLeadStatus(req.params.id, status);
        res.json({ success: true, data: lead });
    },

    // --- DASHBOARD ---
    async getStats(_req: Request, res: Response) {
        const stats = await marketingService.getDashboardStats();
        res.json({ success: true, data: stats });
    },

    // --- ADVANCED ANALYTICS ---
    async getFunnelAnalytics(req: Request, res: Response) {
        const { advancedMarketingService } = await import('./marketing.service');
        const funnel = await advancedMarketingService.getFunnelAnalytics(req.params.campaignId);
        res.json({ success: true, data: funnel });
    },

    async calculateLeadScore(req: Request, res: Response) {
        const { advancedMarketingService } = await import('./marketing.service');
        const score = await advancedMarketingService.calculateLeadScore(req.params.leadId);
        res.json({ success: true, data: score });
    },

    async getCampaignROI(req: Request, res: Response) {
        const { advancedMarketingService } = await import('./marketing.service');
        const roi = await advancedMarketingService.calculateCampaignROI(req.params.campaignId);
        res.json({ success: true, data: roi });
    },

    async getLeadsWithScoring(req: Request, res: Response) {
        const { advancedMarketingService } = await import('./marketing.service');
        const leads = await advancedMarketingService.getLeadsWithScoring(req.query);
        res.json({ success: true, data: leads });
    },

    async trackLeadActivity(req: Request, res: Response) {
        const { advancedMarketingService } = await import('./marketing.service');
        const { leadId, activityType, channel, metadata } = req.body;
        await advancedMarketingService.trackLeadActivity(leadId, activityType, channel, metadata);
        res.json({ success: true, message: 'Activity tracked successfully' });
    },

    // --- A/B TESTING ---
    async createVariants(req: Request, res: Response) {
        const { abTestingService } = await import('./marketing.service');
        const { campaignId, variants } = req.body;
        const created = await abTestingService.createVariants(campaignId, variants);
        res.json({ success: true, data: created });
    },

    async updateVariantMetrics(req: Request, res: Response) {
        const { abTestingService } = await import('./marketing.service');
        const { variantId } = req.params;
        const { impressions, clicks, conversions } = req.body;
        const updated = await abTestingService.updateVariantMetrics(variantId, impressions, clicks, conversions);
        res.json({ success: true, data: updated });
    },

    async getTestResults(req: Request, res: Response) {
        const { abTestingService } = await import('./marketing.service');
        const results = await abTestingService.getTestResults(req.params.campaignId);
        res.json({ success: true, data: results });
    },


    async declareWinner(req: Request, res: Response) {
        const { abTestingService } = await import('./marketing.service');
        const { campaignId } = req.params;
        const { winnerVariantId, declaredBy } = req.body;
        const result = await abTestingService.declareWinner(campaignId, winnerVariantId, declaredBy);
        res.json({ success: true, data: result });
    },

    async getWinner(req: Request, res: Response) {
        const { abTestingService } = await import('./marketing.service');
        const winner = await abTestingService.getWinner(req.params.campaignId);
        res.json({ success: true, data: winner });
    },

    // --- CUSTOMER JOURNEY ---
    async getJourney(req: Request, res: Response) {
        const { customerJourneyService } = await import('./marketing.service');
        const journey = await customerJourneyService.getJourney(req.params.leadId);
        res.json({ success: true, data: journey });
    },

    async addTouchpoint(req: Request, res: Response) {
        const { customerJourneyService } = await import('./marketing.service');
        const { leadId, type, stage, channel, campaignId, description, engagementScore } = req.body;
        const touchpoint = await customerJourneyService.addTouchpoint(
            leadId, type, stage, channel, campaignId, description, engagementScore
        );
        res.json({ success: true, data: touchpoint });
    },

    async markJourneyConverted(req: Request, res: Response) {
        const { customerJourneyService } = await import('./marketing.service');
        const { leadId } = req.params;
        const { conversionValue } = req.body;
        const result = await customerJourneyService.markAsConverted(leadId, conversionValue);
        res.json({ success: true, data: result });
    },

    async getJourneyAnalytics(_req: Request, res: Response) {
        const { customerJourneyService } = await import('./marketing.service');
        const analytics = await customerJourneyService.getJourneyAnalytics();
        res.json({ success: true, data: analytics });
    },

    // --- WHATSAPP INTEGRATION ---
    async getWhatsAppStatus(_req: Request, res: Response) {
        // const { whatsappService } = await import('./whatsapp.service'); // Removed dynamic import
        res.json({ success: true, data: whatsappService.getStatus() });
    },

    async connectWhatsApp(_req: Request, res: Response) {
        // const { whatsappService } = await import('./whatsapp.service'); // Removed dynamic import
        await whatsappService.initializeClient();
        res.json({ success: true, message: 'Initialization started' });
    },

    async logoutWhatsApp(_req: Request, res: Response) {
        const { whatsappService } = await import('./whatsapp.service');
        await whatsappService.logout();
        res.json({ success: true, message: 'Logged out successfully' });
    },

    async getWhatsAppStats(_req: Request, res: Response) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const [totalMessages, newLeads, activities, avgScoreData, topLeads] = await Promise.all([
            prisma.leadActivity.count({
                where: {
                    channel: 'WhatsApp',
                    timestamp: { gte: today }
                }
            }),
            prisma.marketingLead.count({
                where: {
                    source: 'WhatsApp',
                    createdAt: { gte: today }
                }
            }),
            prisma.leadActivity.findMany({
                where: { channel: 'WhatsApp' },
                include: { lead: true },
                orderBy: { timestamp: 'desc' },
                take: 15
            }),
            prisma.marketingLead.aggregate({
                where: { source: 'WhatsApp' },
                _avg: { interestScore: true }
            }),
            prisma.marketingLead.findMany({
                where: { source: 'WhatsApp' },
                orderBy: { interestScore: 'desc' },
                take: 10
            })
        ]);

        // Intent Distribution from last 100 activities
        const recentIntents = await prisma.leadActivity.findMany({
            where: { channel: 'WhatsApp' },
            select: { metadata: true },
            take: 100
        });

        const intentCounts: Record<string, number> = {};
        recentIntents.forEach(a => {
            const intent = (a.metadata as any)?.intent || 'general';
            intentCounts[intent] = (intentCounts[intent] || 0) + 1;
        });

        const intentDistribution = Object.entries(intentCounts).map(([tag, count]) => ({ tag, count }));

        // Fetch AI Settings
        const settings = await prisma.settings.findUnique({ where: { id: 'singleton' } }) as any;
        const aiConfig = {
            enabled: settings?.externalAiEnabled || false,
            provider: settings?.externalAiProvider || 'openai',
            apiKey: settings?.externalAiApiKey || undefined
        };

        // Retroactive AI Analysis for display
        const enrichedActivities = await Promise.all(activities.map(async activity => {
            const meta = (activity.metadata as any) || {};

            // Force re-analysis if summary is missing OR if it's in English
            const isEnglish = meta.summary && /^[A-Za-z]/.test(meta.summary);

            if ((!meta.summary || isEnglish) && meta.message) {
                const analysis = await localAiService.analyzeAsync(meta.message, aiConfig);
                return {
                    ...activity,
                    metadata: {
                        ...meta,
                        ...analysis,
                        retroactive: true
                    }
                };
            }
            return activity;
        }));

        res.json({
            success: true,
            data: {
                totalMessages,
                newLeads,
                conversionProbability: Math.round(avgScoreData._avg.interestScore || 0),
                intentDistribution,
                recentActivities: enrichedActivities,
                topLeads: topLeads.map(l => ({
                    ...l,
                    aiFollowUpNotes: l.aiFollowUpNotes || 'تحليل جاري لحالة العميل...'
                }))
            }
        });
    }
};
