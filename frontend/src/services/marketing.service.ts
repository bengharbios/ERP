import { apiClient, ApiResponse } from './api';

// ============================================
// INTERFACES
// ============================================

export type CampaignType = 'WHATSAPP' | 'LANDING_PAGE' | 'SOCIAL_MEDIA' | 'EMAIL' | 'SMS';
export type CampaignStatus = 'DRAFT' | 'SCHEDULED' | 'ACTIVE' | 'PAUSED' | 'COMPLETED' | 'ARCHIVED';
export type AudienceType = 'CORE' | 'CUSTOM' | 'LOOKALIKE' | 'AI_PREDICTIVE';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST' | 'SPAM';

export interface MarketingAudience {
    id: string;
    name: string;
    description?: string;
    type: AudienceType;
    rules?: any;
    sourceCount: number;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    _count?: { campaigns: number };
}

export interface MarketingCampaign {
    id: string;
    name: string;
    type: CampaignType;
    status: CampaignStatus;
    audienceId?: string;
    content?: any;
    startDate?: string;
    endDate?: string;
    budget?: number;
    spent?: number;
    aiScore?: number;
    aiOptimization: boolean;
    createdAt: string;
    updatedAt: string;
    audience?: MarketingAudience;
    leads?: MarketingLead[];
    _count?: { leads: number };
}

export interface MarketingLead {
    id: string;
    campaignId?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    source?: string;
    status: LeadStatus;
    interestScore?: number;
    aiFollowUpNotes?: string;
    lastActivity?: string;
    createdAt: string;
    updatedAt: string;
    campaign?: MarketingCampaign;
}

export interface MarketingStats {
    overview: {
        totalLeads: number;
        activeCampaigns: number;
        totalReach: number;
        totalConversions: number;
        conversionRate: string;
    };
}

// ============================================
// API SERVICES
// ============================================

export const marketingService = {
    // Campaigns
    async getCampaigns(): Promise<ApiResponse<MarketingCampaign[]>> {
        return apiClient.get('/marketing/campaigns');
    },

    async getCampaignById(id: string): Promise<ApiResponse<MarketingCampaign>> {
        return apiClient.get(`/marketing/campaigns/${id}`);
    },

    async createCampaign(data: any): Promise<ApiResponse<MarketingCampaign>> {
        return apiClient.post('/marketing/campaigns', data);
    },

    async updateCampaign(id: string, data: any): Promise<ApiResponse<MarketingCampaign>> {
        return apiClient.put(`/marketing/campaigns/${id}`, data);
    },

    async updateCampaignStatus(id: string, status: CampaignStatus): Promise<ApiResponse<MarketingCampaign>> {
        return apiClient.patch(`/marketing/campaigns/${id}/status`, { status });
    },

    // Audiences
    async getAudiences(): Promise<ApiResponse<MarketingAudience[]>> {
        return apiClient.get('/marketing/audiences');
    },

    async createAudience(data: any): Promise<ApiResponse<MarketingAudience>> {
        return apiClient.post('/marketing/audiences', data);
    },

    // Leads
    async getLeads(filters?: any): Promise<ApiResponse<MarketingLead[]>> {
        return apiClient.get('/marketing/leads', filters);
    },

    async createLead(data: any): Promise<ApiResponse<MarketingLead>> {
        return apiClient.post('/marketing/leads', data);
    },

    async updateLeadStatus(id: string, status: LeadStatus): Promise<ApiResponse<MarketingLead>> {
        return apiClient.patch(`/marketing/leads/${id}/status`, { status });
    },

    // Stats
    async getStats(): Promise<ApiResponse<MarketingStats>> {
        return apiClient.get('/marketing/stats');
    },

    // === ADVANCED ANALYTICS ===
    async getFunnelAnalytics(campaignId: string): Promise<ApiResponse<any>> {
        return apiClient.get(`/marketing/campaigns/${campaignId}/funnel`);
    },

    async getCampaignROI(campaignId: string): Promise<ApiResponse<any>> {
        return apiClient.get(`/marketing/campaigns/${campaignId}/roi`);
    },

    async getLeadScore(leadId: string): Promise<ApiResponse<any>> {
        return apiClient.get(`/marketing/leads/${leadId}/score`);
    },

    async getLeadsWithScoring(filters?: any): Promise<ApiResponse<any>> {
        return apiClient.get('/marketing/leads/scored', filters);
    },

    async trackLeadActivity(data: any): Promise<ApiResponse<any>> {
        return apiClient.post('/marketing/leads/activity', data);
    },

    async getTestResults(campaignId: string): Promise<ApiResponse<any>> {
        return apiClient.get(`/marketing/campaigns/${campaignId}/test-results`);
    },

    async declareWinner(campaignId: string, variantId: string): Promise<ApiResponse<any>> {
        return apiClient.post(`/marketing/campaigns/${campaignId}/declare-winner`, { variantId });
    }
};
