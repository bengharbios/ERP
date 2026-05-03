import { z } from 'zod';

export const CampaignStatusSchema = z.enum(['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED']);
export const CampaignTypeSchema = z.enum(['WHATSAPP', 'LANDING_PAGE', 'SOCIAL_MEDIA', 'EMAIL', 'SMS']);
export const AudienceTypeSchema = z.enum(['CORE', 'CUSTOM', 'LOOKALIKE', 'AI_PREDICTIVE']);
export const LeadStatusSchema = z.enum(['NEW', 'CONTACTED', 'QUALIFIED', 'CONVERTED', 'LOST', 'SPAM']);

export const CreateAudienceSchema = z.object({
    name: z.string().min(3),
    description: z.string().optional(),
    type: AudienceTypeSchema,
    rules: z.any().optional(),
});

export const CreateCampaignSchema = z.object({
    name: z.string().min(3),
    type: CampaignTypeSchema,
    audienceId: z.string().uuid().optional().nullable(),
    startDate: z.string().datetime().optional().nullable(),
    endDate: z.string().datetime().optional().nullable(),
    budget: z.number().min(0).optional(),
    content: z.any().optional(),
    aiOptimization: z.boolean().optional(),
});

export const UpdateCampaignStatusSchema = z.object({
    status: CampaignStatusSchema,
});

export const CreateLeadSchema = z.object({
    campaignId: z.string().uuid().optional().nullable(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    source: z.string().optional(),
});

export const UpdateLeadStatusSchema = z.object({
    status: LeadStatusSchema,
});
