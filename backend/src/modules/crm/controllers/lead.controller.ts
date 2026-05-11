import { Request, Response } from 'express';
import * as leadService from '../services/lead.service';
import prisma from '../../../common/db/prisma';

export async function getLeads(req: Request, res: Response) {
    try {
        const filters = {
            type: req.query.type as 'lead' | 'opportunity' | 'customer',
            teamId: req.query.teamId as string,
            salespersonId: req.query.salespersonId as string,
            stageId: req.query.stageId as string,
            isDuplicate: req.query.isDuplicate !== undefined ? req.query.isDuplicate === 'true' : undefined,
            search: req.query.search as string
        };

        const leads = await leadService.getLeads(filters);
        res.json({ success: true, data: leads });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function getLeadById(req: Request, res: Response) {
    try {
        const lead = await leadService.getLeadById(req.params.id);

        if (!lead) {
            return res.status(404).json({ success: false, error: { message: 'Lead not found' } });
        }

        res.json({ success: true, data: lead });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

/**
 * Map frontend-friendly lead fields to CrmLead Prisma schema fields.
 * Supports partial updates by only including provided fields.
 */
function mapFrontendToCrmLead(body: any, isUpdate = false) {
    const result: any = {};
    const mapper: Record<string, string> = {
        email: 'emailFrom',
        assignedToId: 'salespersonId',
        programId: '_programId',
        source: '_source',
        notes: '_notes'
    };

    // Fields that should be passed through if present
    const fields = [
        'name', 'phone', 'mobile', 'contactName', 'emailFrom', 'website',
        'expectedRevenue', 'probability', 'stageId', 'active', 'priority',
        'salespersonId', 'teamId', 'campaignId', 'sourceId', 'mediumId',
        'dateDeadline', 'type', 'customFields',
        'nationality', 'emirate', 'interestedDiploma', 'platform', 'levelOfInterest', 'firstMessageDate'
    ];

    // Map special fields
    Object.entries(mapper).forEach(([from, to]) => {
        if (body[from] !== undefined) result[to] = body[from];
    });

    // Map standard fields
    fields.forEach(f => {
        if (body[f] !== undefined) result[f] = body[f];
    });

    // Default values for creation only
    if (!isUpdate) {
        if (result.name === undefined) result.name = body.name || '';
        if (result.type === undefined) result.type = body.type || 'lead';
        if (result.active === undefined) result.active = true;
        if (result.priority === undefined) result.priority = '1';
        if (result.probability === undefined) result.probability = 10;
    }

    return result;
}

export async function createLead(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const mappedData = mapFrontendToCrmLead(req.body);
        const lead = await leadService.createLead(mappedData, userId);
        res.status(201).json({ success: true, data: lead });
    } catch (error: any) {
        console.error('[CRM] createLead error:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function updateLead(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const mappedData = mapFrontendToCrmLead(req.body, true);
        const lead = await leadService.updateLead(req.params.id, mappedData, userId);
        res.json({ success: true, data: lead });
    } catch (error: any) {
        console.error('[CRM] updateLead error:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function deleteLead(req: Request, res: Response) {
    try {
        await leadService.deleteLead(req.params.id);
        res.json({ success: true, data: { message: 'Lead deleted successfully' } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function checkDuplicates(req: Request, res: Response) {
    try {
        const lead = await leadService.getLeadById(req.params.id);

        if (!lead) {
            return res.status(404).json({ success: false, error: { message: 'Lead not found' } });
        }

        const duplicates = await leadService.checkDuplicates(
            req.params.id,
            lead.phone || undefined,
            lead.mobile || undefined,
            lead.emailFrom || undefined
        );

        res.json({ success: true, data: duplicates });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function mergeLeads(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const result = await leadService.mergeLeads({
            ...req.body,
            userId
        });
        res.json({ success: true, data: result });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function convertToOpportunity(req: Request, res: Response) {
    try {
        const lead = await leadService.convertToOpportunity(req.params.id, req.body.stageId, req.body);
        res.json({ success: true, data: lead });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function convertToCustomer(req: Request, res: Response) {
    try {
        const lead = await leadService.convertToCustomer(req.params.id, req.body);
        res.json({ success: true, data: lead });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function getStages(req: Request, res: Response) {
    try {
        const stages = await leadService.getStages();
        res.json({ success: true, data: stages });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function createStage(req: Request, res: Response) {
    try {
        const stage = await leadService.createStage(req.body);
        res.status(201).json({ success: true, data: stage });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function updateStage(req: Request, res: Response) {
    try {
        const stage = await leadService.updateStage(req.params.id, req.body);
        res.json({ success: true, data: stage });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function deleteStage(req: Request, res: Response) {
    try {
        await leadService.deleteStage(req.params.id);
        res.json({ success: true, data: { message: 'Stage deleted successfully' } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function syncGoogleSheet(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const { spreadsheetUrl, range } = req.body;

        if (!spreadsheetUrl) {
            return res.status(400).json({ success: false, error: { message: 'رابط ملف Google Sheet مطلوب لإتمام المزامنة.' } });
        }

        // Dynamically save the spreadsheet URL to database settings so the Telegram Bot can read it
        try {
            await prisma.systemSetting.upsert({
                where: { key: 'crm_google_sheet_url' },
                update: { value: spreadsheetUrl },
                create: {
                    key: 'crm_google_sheet_url',
                    value: spreadsheetUrl,
                    dataType: 'string',
                    description: 'رابط ملف Google Sheets لمزامنة عملاء البوت تلقائياً'
                }
            });
        } catch (dbErr: any) {
            console.error('[CRM] Failed to save crm_google_sheet_url in settings:', dbErr.message);
        }

        const { GoogleSheetsService } = require('../services/google-sheets.service');
        const result = await GoogleSheetsService.pullFromSheet({
            spreadsheetUrlOrId: spreadsheetUrl,
            range,
            userId
        });

        res.json(result);
    } catch (error: any) {
        console.error('[CRM] syncGoogleSheet error:', error);
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

