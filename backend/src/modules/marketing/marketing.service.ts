import prisma from '../../common/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

export class MarketingService {
    // --- CAMPAIGNS ---
    async getCampaigns() {
        return await prisma.marketingCampaign.findMany({
            include: {
                audience: true,
                _count: {
                    select: { leads: true }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getCampaignById(id: string) {
        return await prisma.marketingCampaign.findUnique({
            where: { id },
            include: {
                audience: true,
                leads: {
                    orderBy: { createdAt: 'desc' },
                    take: 50
                },
                analytics: {
                    orderBy: { date: 'desc' },
                    take: 30
                }
            }
        });
    }

    async createCampaign(data: any) {
        return await prisma.marketingCampaign.create({
            data: {
                ...data,
                budget: data.budget ? new Decimal(data.budget) : null,
                startDate: data.startDate ? new Date(data.startDate) : null,
                endDate: data.endDate ? new Date(data.endDate) : null,
            }
        });
    }

    async updateCampaign(id: string, data: any) {
        return await prisma.marketingCampaign.update({
            where: { id },
            data: {
                ...data,
                budget: data.budget ? new Decimal(data.budget) : undefined,
                startDate: data.startDate ? new Date(data.startDate) : undefined,
                endDate: data.endDate ? new Date(data.endDate) : undefined,
            }
        });
    }

    // --- AUDIENCES ---
    async getAudiences() {
        return await prisma.marketingAudience.findMany({
            include: {
                _count: {
                    select: { campaigns: true }
                }
            }
        });
    }

    async createAudience(data: any) {
        return await prisma.marketingAudience.create({
            data
        });
    }

    // --- LEADS ---
    async getLeads(filters: any = {}) {
        return await prisma.marketingLead.findMany({
            where: filters,
            include: {
                campaign: true
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async createLead(data: any) {
        // Basic AI scoring logic for 2026: 
        // Higher score if they came from an active campaign with AI optimization
        let interestScore = 50;
        if (data.campaignId) {
            const campaign = await prisma.marketingCampaign.findUnique({
                where: { id: data.campaignId }
            });
            if (campaign?.aiOptimization) interestScore += 20;
        }

        return await prisma.marketingLead.create({
            data: {
                ...data,
                interestScore
            }
        });
    }

    async updateLeadStatus(id: string, status: any) {
        return await prisma.marketingLead.update({
            where: { id },
            data: { status }
        });
    }

    // --- ANALYTICS ---
    async getDashboardStats() {
        const totalLeads = await prisma.marketingLead.count();
        const activeCampaigns = await prisma.marketingCampaign.count({
            where: { status: 'ACTIVE' }
        });

        // Aggregate analytics for the last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const analytics = await prisma.marketingAnalytic.aggregate({
            where: {
                date: { gte: thirtyDaysAgo }
            },
            _sum: {
                reach: true,
                clicks: true,
                conversions: true,
                revenue: true
            }
        });

        return {
            overview: {
                totalLeads,
                activeCampaigns,
                totalReach: analytics._sum.reach || 0,
                totalConversions: analytics._sum.conversions || 0,
                conversionRate: analytics._sum.reach ? ((analytics._sum.conversions || 0) / analytics._sum.reach * 100).toFixed(2) : 0
            }
        };
    }
}

export const marketingService = new MarketingService();

// ============================================
// ADVANCED MARKETING ANALYTICS
// ============================================

export class AdvancedMarketingService {
    // --- FUNNEL ANALYTICS ---
    async getFunnelAnalytics(campaignId: string) {
        const funnel = await prisma.marketingFunnel.groupBy({
            by: ['stage'],
            where: { campaignId },
            _sum: { count: true }
        });

        const stages = ['AWARENESS', 'INTEREST', 'CONSIDERATION', 'INTENT', 'PURCHASE'];
        const funnelData = stages.map(stage => {
            const data = funnel.find(f => f.stage === stage);
            return {
                stage,
                count: data?._sum.count || 0
            };
        });

        // Calculate conversion rates between stages
        const withRates = funnelData.map((item, index) => {
            if (index === 0) return { ...item, conversionRate: 100, dropOffRate: 0 };
            const prevCount = funnelData[index - 1].count;
            const conversionRate = prevCount > 0 ? (item.count / prevCount * 100) : 0;
            const dropOffRate = 100 - conversionRate;
            return { ...item, conversionRate, dropOffRate };
        });

        return withRates;
    }

    async updateFunnelStage(campaignId: string, stage: string, count: number) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return await prisma.marketingFunnel.upsert({
            where: {
                campaignId_stage_date: {
                    campaignId,
                    stage: stage as any,
                    date: today
                }
            },
            create: {
                campaignId,
                stage: stage as any,
                count,
                date: today
            },
            update: {
                count: { increment: count }
            }
        });
    }

    // --- LEAD SCORING ---
    async calculateLeadScore(leadId: string) {
        const lead = await prisma.marketingLead.findUnique({
            where: { id: leadId }
        });

        if (!lead) return null;

        // Get lead activities
        const activities = await prisma.leadActivity.findMany({
            where: { leadId },
            orderBy: { timestamp: 'desc' }
        });

        // 1. Demographic Score (0-100)
        let demographicScore = 50; // Base score
        if (lead.email) demographicScore += 15;
        if (lead.phone) demographicScore += 15;
        if (lead.firstName && lead.lastName) demographicScore += 20;

        // 2. Engagement Score (0-100) - based on activities
        let engagementScore = 0;
        const emailOpens = activities.filter(a => a.activityType === 'email_open').length;
        const linkClicks = activities.filter(a => a.activityType === 'link_click').length;
        const formFills = activities.filter(a => a.activityType === 'form_fill').length;

        engagementScore += Math.min(emailOpens * 10, 30);
        engagementScore += Math.min(linkClicks * 15, 40);
        engagementScore += Math.min(formFills * 20, 30);

        // 3. Behavior Score (0-100) - recency and frequency
        let behaviorScore = 50;
        if (lead.lastActivity) {
            const daysSinceActivity = Math.floor(
                (Date.now() - new Date(lead.lastActivity).getTime()) / (1000 * 60 * 60 * 24)
            );
            if (daysSinceActivity < 1) behaviorScore += 30;
            else if (daysSinceActivity < 3) behaviorScore += 20;
            else if (daysSinceActivity < 7) behaviorScore += 10;
            else behaviorScore -= 10;
        }

        // Total Score (average of components)
        const totalScore = Math.round((demographicScore + engagementScore + behaviorScore) / 3);

        // Determine quality
        let quality: 'HOT' | 'WARM' | 'COLD' = 'COLD';
        if (totalScore >= 80) quality = 'HOT';
        else if (totalScore >= 50) quality = 'WARM';

        // AI Recommendation
        let recommendedAction = '';
        if (quality === 'HOT') recommendedAction = 'تواصل فوري - احتمالية تحويل عالية';
        else if (quality === 'WARM') recommendedAction = 'رعاية بمحتوى إضافي';
        else recommendedAction = 'إعادة استهداف أو تأجيل';

        // Conversion probability (simple model)
        const conversionProb = totalScore * 0.8; // 80% max conversion at perfect score

        // Save or update scoring
        await prisma.leadScoring.upsert({
            where: { leadId },
            create: {
                leadId,
                demographicScore,
                engagementScore,
                behaviorScore,
                totalScore,
                quality,
                conversionProb: new Decimal(conversionProb),
                recommendedAction
            },
            update: {
                demographicScore,
                engagementScore,
                behaviorScore,
                totalScore,
                quality,
                conversionProb: new Decimal(conversionProb),
                recommendedAction,
                lastCalculated: new Date()
            }
        });

        return {
            totalScore,
            quality,
            conversionProb,
            recommendedAction,
            breakdown: { demographicScore, engagementScore, behaviorScore }
        };
    }

    // --- ROI CALCULATOR ---
    async calculateCampaignROI(campaignId: string) {
        const campaign = await prisma.marketingCampaign.findUnique({
            where: { id: campaignId },
            include: {
                leads: true,
                analytics: true
            }
        });

        if (!campaign) return null;

        const totalSpent = Number(campaign.spent || 0);
        const setupCost = totalSpent * 0.1; // 10% setup overhead
        const mediaCost = totalSpent * 0.9;

        // Revenue calculation (mock for now - would integrate with actual sales)
        const convertedLeads = campaign.leads.filter(l => l.status === 'CONVERTED').length;
        const avgLeadValue = 500; // Average value per converted lead (configurable)
        const totalRevenue = convertedLeads * avgLeadValue;

        // Metrics
        const totalLeads = campaign.leads.length;
        const costPerLead = totalLeads > 0 ? totalSpent / totalLeads : 0;
        const costPerAcq = convertedLeads > 0 ? totalSpent / convertedLeads : 0;
        const roi = totalSpent > 0 ? ((totalRevenue - totalSpent) / totalSpent) * 100 : 0;
        const roas = totalSpent > 0 ? (totalRevenue / totalSpent) : 0;

        // Save ROI data
        await prisma.campaignROI.upsert({
            where: { campaignId },
            create: {
                campaignId,
                totalSpent: new Decimal(totalSpent),
                setupCost: new Decimal(setupCost),
                mediaCost: new Decimal(mediaCost),
                totalRevenue: new Decimal(totalRevenue),
                costPerLead: new Decimal(costPerLead),
                costPerAcq: new Decimal(costPerAcq),
                roi: new Decimal(roi),
                roas: new Decimal(roas)
            },
            update: {
                totalSpent: new Decimal(totalSpent),
                setupCost: new Decimal(setupCost),
                mediaCost: new Decimal(mediaCost),
                totalRevenue: new Decimal(totalRevenue),
                costPerLead: new Decimal(costPerLead),
                costPerAcq: new Decimal(costPerAcq),
                roi: new Decimal(roi),
                roas: new Decimal(roas)
            }
        });

        return {
            totalSpent,
            totalRevenue,
            totalLeads,
            convertedLeads,
            costPerLead: costPerLead.toFixed(2),
            costPerAcq: costPerAcq.toFixed(2),
            roi: roi.toFixed(2),
            roas: roas.toFixed(2),
            profitability: totalRevenue > totalSpent ? 'profitable' : 'loss'
        };
    }

    // --- LEAD ACTIVITY TRACKING ---
    async trackLeadActivity(leadId: string, activityType: string, channel?: string, metadata?: any) {
        // Update last activity on lead
        await prisma.marketingLead.update({
            where: { id: leadId },
            data: { lastActivity: new Date() }
        });

        // Create activity record
        await prisma.leadActivity.create({
            data: {
                leadId,
                activityType,
                channel,
                metadata
            }
        });

        // Recalculate lead score
        await this.calculateLeadScore(leadId);
    }

    // --- GET LEADS WITH SCORES ---
    async getLeadsWithScoring(filters: any = {}) {
        const leads = await prisma.marketingLead.findMany({
            where: filters,
            include: {
                campaign: true
            }
        });

        const leadsWithScores = await Promise.all(
            leads.map(async (lead) => {
                const scoring = await prisma.leadScoring.findUnique({
                    where: { leadId: lead.id }
                });
                return { ...lead, scoring };
            })
        );

        // Sort by score (HOT first)
        return leadsWithScores.sort((a, b) => {
            const scoreA = a.scoring?.totalScore || 0;
            const scoreB = b.scoring?.totalScore || 0;
            return scoreB - scoreA;
        });
    }
}

export const advancedMarketingService = new AdvancedMarketingService();

// ============================================
// A/B TESTING ENGINE
// ============================================

interface SignificanceResult {
    isSignificant: boolean;
    pValue: string;
    confidence: string;
    improvementRate: string;
    message: string;
}

export class ABTestingService {
    // Create campaign variants for A/B testing
    async createVariants(campaignId: string, variants: Array<{ name: string; content: any; trafficSplit: number }>) {
        const createdVariants = [];

        for (const variant of variants) {
            const created = await prisma.campaignVariant.create({
                data: {
                    campaignId,
                    name: variant.name,
                    content: variant.content,
                    trafficSplit: new Decimal(variant.trafficSplit)
                }
            });
            createdVariants.push(created);
        }

        return createdVariants;
    }

    // Update variant performance metrics
    async updateVariantMetrics(variantId: string, impressions: number, clicks: number, conversions: number) {
        return await prisma.campaignVariant.update({
            where: { id: variantId },
            data: {
                impressions: { increment: impressions },
                clicks: { increment: clicks },
                conversions: { increment: conversions }
            }
        });
    }

    // Set variant status
    async updateVariantStatus(variantId: string, status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED') {
        return await prisma.campaignVariant.update({
            where: { id: variantId },
            data: { status }
        });
    }

    // Calculate statistical significance between two variants
    calculateSignificance(variant1: any, variant2: any): SignificanceResult {
        // Conversion rates
        const cr1 = variant1.impressions > 0 ? variant1.conversions / variant1.impressions : 0;
        const cr2 = variant2.impressions > 0 ? variant2.conversions / variant2.impressions : 0;

        const n1 = variant1.impressions;
        const n2 = variant2.impressions;

        // Need minimum sample size
        if (n1 < 30 || n2 < 30) {
            return {
                isSignificant: false,
                pValue: '0',
                confidence: '0',
                improvementRate: '0',
                message: 'Sample size too small (minimum 30 per variant)'
            };
        }

        // Pooled conversion rate
        const pPooled = (variant1.conversions + variant2.conversions) / (n1 + n2);

        // Standard error
        const se = Math.sqrt(pPooled * (1 - pPooled) * (1 / n1 + 1 / n2));

        if (se === 0) {
            return {
                isSignificant: false,
                pValue: '0',
                confidence: '0',
                improvementRate: '0',
                message: 'No variance in data'
            };
        }

        // Z-score
        const z = (cr1 - cr2) / se;

        // Calculate p-value (two-tailed test)
        // Simplified approximation
        const pValue = 2 * (1 - this.normalCDF(Math.abs(z)));

        // Confidence level (1 - p-value) * 100
        const confidence = (1 - pValue) * 100;

        // Significant if p-value < 0.05 (95% confidence)
        const isSignificant = pValue < 0.05;

        return {
            isSignificant,
            pValue: pValue.toFixed(4),
            confidence: confidence.toFixed(2),
            improvementRate: ((cr1 - cr2) / cr2 * 100).toFixed(2),
            message: isSignificant
                ? `Variant 1 is statistically different with ${confidence.toFixed(0)}% confidence`
                : 'No significant difference detected'
        };
    }

    // Normal Cumulative Distribution Function (CDF)
    // Approximation for p-value calculation
    private normalCDF(x: number): number {
        const t = 1 / (1 + 0.2316419 * Math.abs(x));
        const d = 0.3989423 * Math.exp(-x * x / 2);
        const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return x > 0 ? 1 - prob : prob;
    }

    // Get test results for all variants in a campaign
    async getTestResults(campaignId: string) {
        const variants = await prisma.campaignVariant.findMany({
            where: { campaignId },
            include: { testResults: true }
        });

        // Calculate metrics for each variant
        const variantsWithMetrics = variants.map(v => {
            const conversionRate = v.impressions > 0 ? (v.conversions / v.impressions * 100) : 0;
            const clickThroughRate = v.impressions > 0 ? (v.clicks / v.impressions * 100) : 0;

            return {
                ...v,
                conversionRate: conversionRate.toFixed(2),
                clickThroughRate: clickThroughRate.toFixed(2)
            };
        });

        // If we have 2+ variants, calculate significance
        if (variants.length >= 2) {
            const control = variants[0]; // First variant is control
            const testVariants = variants.slice(1);

            const comparisons = testVariants.map(testVar => {
                const sig = this.calculateSignificance(testVar, control);
                return {
                    variantId: testVar.id,
                    variantName: testVar.name,
                    ...sig
                };
            });

            return {
                variants: variantsWithMetrics,
                comparisons,
                hasWinner: comparisons.some(c => c.isSignificant)
            };
        }

        return {
            variants: variantsWithMetrics,
            comparisons: [],
            hasWinner: false
        };
    }

    // Declare a winner
    async declareWinner(campaignId: string, winnerVariantId: string, declaredBy?: string) {
        const variants = await prisma.campaignVariant.findMany({
            where: { campaignId }
        });

        const winner = variants.find(v => v.id === winnerVariantId);
        const control = variants.find(v => v.id !== winnerVariantId); // Simplified: assumes 2 variants

        if (!winner || !control) {
            throw new Error('Invalid variant selection');
        }

        const significance = this.calculateSignificance(winner, control);

        if (!significance.isSignificant) {
            throw new Error('Cannot declare winner: No statistical significance detected');
        }

        // Save winner
        await prisma.aBTestWinner.create({
            data: {
                campaignId,
                winnerVariantId,
                improvementRate: new Decimal(significance.improvementRate),
                confidenceLevel: new Decimal(significance.confidence),
                declaredBy,
                notes: significance.message
            }
        });

        // Mark all variants as completed
        await prisma.campaignVariant.updateMany({
            where: { campaignId },
            data: { status: 'COMPLETED' }
        });

        return {
            success: true,
            winner: winner.name,
            improvement: `${significance.improvementRate}% `,
            confidence: `${significance.confidence}% `
        };
    }

    // Get winner for a campaign
    async getWinner(campaignId: string) {
        return await prisma.aBTestWinner.findUnique({
            where: { campaignId }
        });
    }
}

export const abTestingService = new ABTestingService();

// ============================================
// CUSTOMER JOURNEY MAPPER
// ============================================

export class CustomerJourneyService {
    // Create or get journey for a lead
    async getOrCreateJourney(leadId: string) {
        let journey = await prisma.customerJourney.findFirst({
            where: { leadId },
            include: { touchpoints: { orderBy: { timestamp: 'asc' } } }
        });

        if (!journey) {
            journey = await prisma.customerJourney.create({
                data: { leadId },
                include: { touchpoints: true }
            });
        }

        return journey;
    }

    // Add touchpoint to customer journey
    async addTouchpoint(
        leadId: string,
        type: string,
        stage: string,
        channel?: string,
        campaignId?: string,
        description?: string,
        engagementScore?: number
    ) {
        const journey = await this.getOrCreateJourney(leadId);

        // Create touchpoint
        const touchpoint = await prisma.journeyTouchpoint.create({
            data: {
                journeyId: journey.id,
                type: type as any,
                stage: stage as any,
                channel,
                campaignId,
                description,
                engagementScore
            }
        });

        // Update journey metrics
        await prisma.customerJourney.update({
            where: { id: journey.id },
            data: {
                touchpointCount: { increment: 1 },
                currentStage: stage as any
            }
        });

        return touchpoint;
    }

    // Mark journey as converted
    async markAsConverted(leadId: string, conversionValue?: number) {
        const journey = await this.getOrCreateJourney(leadId);

        const startDate = new Date(journey.startedAt);
        const convertDate = new Date();
        const durationDays = Math.floor((convertDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

        await prisma.customerJourney.update({
            where: { id: journey.id },
            data: {
                isConverted: true,
                convertedAt: convertDate,
                conversionValue: conversionValue ? new Decimal(conversionValue) : null,
                durationDays,
                currentStage: 'DECISION'
            }
        });

        return { success: true, durationDays };
    }

    // Get complete journey for a lead
    async getJourney(leadId: string) {
        const journey = await prisma.customerJourney.findFirst({
            where: { leadId },
            include: {
                touchpoints: {
                    orderBy: { timestamp: 'asc' }
                }
            }
        });

        if (!journey) return null;

        // Group touchpoints by stage
        const touchpointsByStage = {
            AWARENESS: journey.touchpoints.filter(t => t.stage === 'AWARENESS'),
            CONSIDERATION: journey.touchpoints.filter(t => t.stage === 'CONSIDERATION'),
            DECISION: journey.touchpoints.filter(t => t.stage === 'DECISION'),
            RETENTION: journey.touchpoints.filter(t => t.stage === 'RETENTION'),
            ADVOCACY: journey.touchpoints.filter(t => t.stage === 'ADVOCACY')
        };

        // Calculate average engagement
        const avgEngagement = journey.touchpoints.length > 0
            ? journey.touchpoints.reduce((sum, t) => sum + (t.engagementScore || 0), 0) / journey.touchpoints.length
            : 0;

        return {
            ...journey,
            touchpointsByStage,
            avgEngagement: avgEngagement.toFixed(0),
            timeline: journey.touchpoints.map(t => ({
                date: t.timestamp,
                type: t.type,
                stage: t.stage,
                description: t.description,
                channel: t.channel
            }))
        };
    }

    // Get journey analytics for all leads
    async getJourneyAnalytics() {
        const allJourneys = await prisma.customerJourney.findMany({
            include: {
                touchpoints: true
            }
        });

        const totalJourneys = allJourneys.length;
        const convertedJourneys = allJourneys.filter(j => j.isConverted).length;
        const conversionRate = totalJourneys > 0 ? (convertedJourneys / totalJourneys * 100) : 0;

        const avgTouchpoints = totalJourneys > 0
            ? allJourneys.reduce((sum, j) => sum + j.touchpointCount, 0) / totalJourneys
            : 0;

        const avgDuration = allJourneys
            .filter(j => j.durationDays !== null)
            .reduce((sum, j, _, arr) => sum + (j.durationDays || 0) / arr.length, 0);

        // Most common touchpoint types
        const allTouchpoints = allJourneys.flatMap(j => j.touchpoints);
        const touchpointTypes = allTouchpoints.reduce((acc, t) => {
            acc[t.type] = (acc[t.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalJourneys,
            convertedJourneys,
            conversionRate: conversionRate.toFixed(2),
            avgTouchpoints: avgTouchpoints.toFixed(1),
            avgDurationDays: avgDuration.toFixed(0),
            topTouchpoints: Object.entries(touchpointTypes)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([type, count]) => ({ type, count }))
        };
    }
}

export const customerJourneyService = new CustomerJourneyService();
