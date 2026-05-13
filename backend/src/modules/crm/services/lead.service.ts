import prisma from '../../../common/db/prisma';

/**
 * Normalize phone number for duplicate detection
 * Removes: spaces, dashes, parentheses, +, leading zeros, country codes
 */
export function normalizePhone(phone: string | null | undefined): string | null {
    if (!phone) return null;

    // Remove all non-digits
    let normalized = phone.replace(/\D/g, '');

    if (!normalized) return null;

    // Remove leading zeros
    normalized = normalized.replace(/^0+/, '');

    // Remove common country codes (UAE, Saudi, Kuwait, Oman, Bahrain, Qatar, Egypt, Jordan, Syria)
    const countryCodes = ['971', '966', '965', '968', '973', '974', '20', '962', '963'];
    for (const code of countryCodes) {
        if (normalized.startsWith(code)) {
            normalized = normalized.substring(code.length);
            break;
        }
    }

    return normalized || null;
}

/**
 * Check for duplicate leads based on normalized phone numbers and email
 */
export async function checkDuplicates(leadId: string | null, phone?: string, mobile?: string, email?: string) {
    const phoneNormalized = normalizePhone(phone);
    const mobileNormalized = normalizePhone(mobile);

    if (!phoneNormalized && !mobileNormalized && !email) {
        return [];
    }

    const conditions: any[] = [];

    if (phoneNormalized) {
        conditions.push(
            { phoneNormalized },
            { mobileNormalized: phoneNormalized }
        );
    }

    if (mobileNormalized && mobileNormalized !== phoneNormalized) {
        conditions.push(
            { phoneNormalized: mobileNormalized },
            { mobileNormalized }
        );
    }

    if (email) {
        conditions.push({ emailFrom: { equals: email, mode: 'insensitive' } });
    }

    const duplicates = await prisma.crmLead.findMany({
        where: {
            AND: [
                { id: { not: leadId || undefined } },
                { OR: conditions }
            ]
        },
        select: {
            id: true,
            name: true,
            type: true,
            contactName: true,
            phone: true,
            mobile: true,
            emailFrom: true,
            createdAt: true,
            stage: {
                select: {
                    id: true,
                    name: true
                }
            }
        },
        orderBy: { type: 'asc' }, // usually 'customer' comes before 'lead' alphabetically or we can sort later
        take: 10
    });

    return duplicates;
}

/**
 * Get all leads with optional filters
 */
export async function getLeads(filters: {
    type?: 'lead' | 'opportunity' | 'customer';
    teamId?: string;
    salespersonId?: string;
    stageId?: string;
    isDuplicate?: boolean;
    search?: string;
}) {
    const where: any = { active: true };

    if (filters.type) {
        where.type = filters.type;
    } else {
        // By default, if no type, show leads and opportunities (standard behavior)
        // or let it be flexible. Usually we want to filter explicitly.
        // For the new pages, we'll pass the type.
    }
    if (filters.teamId) where.teamId = filters.teamId;
    if (filters.salespersonId) where.salespersonId = filters.salespersonId;
    if (filters.stageId) where.stageId = filters.stageId;
    if (filters.isDuplicate !== undefined) where.isDuplicate = filters.isDuplicate;

    if (filters.search) {
        where.OR = [
            { name: { contains: filters.search, mode: 'insensitive' } },
            { contactName: { contains: filters.search, mode: 'insensitive' } },
            { emailFrom: { contains: filters.search, mode: 'insensitive' } },
            { phone: { contains: filters.search } },
            { mobile: { contains: filters.search } }
        ];
    }

    const leads = await prisma.crmLead.findMany({
        where,
        include: {
            stage: true,
            salesperson: {
                select: {
                    id: true,
                    username: true
                }
            },
            team: {
                select: {
                    id: true,
                    name: true
                }
            },
            notes: {
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                }
            },
            activities: {
                where: {
                    status: 'PLANNED'
                },
                orderBy: {
                    dateDeadline: 'asc'
                },
                take: 1,
                include: {
                    type: true
                }
            }
        },
        orderBy: {
            updatedAt: 'desc'
        }
    });

    // Calculate activity pulse for each lead
    const now = new Date();
    const enrichedLeads = leads.map(lead => {
        let activityPulse = 'none';

        if (lead.activities.length > 0) {
            const nextActivity = lead.activities[0];
            const deadline = new Date(nextActivity.dateDeadline);
            const diffDays = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

            if (diffDays < 0) activityPulse = 'overdue';
            else if (diffDays === 0) activityPulse = 'today';
            else activityPulse = 'planned';
        }

        return {
            ...lead,
            activityPulse,
            nextActivity: lead.activities[0] || null
        };
    });

    return enrichedLeads;
}

/**
 * Get a single lead by ID
 */
export async function getLeadById(id: string) {
    const lead = await prisma.crmLead.findUnique({
        where: { id },
        include: {
            stage: true,
            salesperson: {
                select: {
                    id: true,
                    username: true
                }
            },
            team: {
                select: {
                    id: true,
                    name: true
                }
            },
            activities: {
                orderBy: {
                    dateDeadline: 'asc'
                },
                include: {
                    type: true,
                    user: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                }
            },
            notes: {
                orderBy: {
                    createdAt: 'desc'
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            username: true
                        }
                    }
                }
            }
        }
    });

    if (!lead) return null;

    // Check for duplicates
    const duplicates = await checkDuplicates(id, lead.phone || undefined, lead.mobile || undefined);

    return {
        ...lead,
        duplicates,
        duplicateCount: duplicates.length,
        isDuplicate: duplicates.length > 0
    };
}

/**
 * Create a new lead
 */
export async function createLead(data: any, userId: string) {
    // Extract meta fields that don't belong in CrmLead
    const { _source, _notes, _programId, ...crmData } = data;

    // Normalize phone numbers
    const phoneNormalized = normalizePhone(crmData.phone);
    const mobileNormalized = normalizePhone(crmData.mobile);

    // Check for duplicates
    const duplicates = await checkDuplicates(null, crmData.phone, crmData.mobile, crmData.emailFrom);

    const lead = await prisma.crmLead.create({
        data: {
            ...crmData,
            phoneNormalized,
            mobileNormalized,
            isDuplicate: duplicates.length > 0,
            duplicateCount: duplicates.length,
            salespersonId: crmData.salespersonId || userId,
            probability: crmData.type === 'opportunity' ? (crmData.probability || 10) : 10
        },
        include: {
            stage: true,
            salesperson: {
                select: {
                    id: true,
                    username: true
                }
            },
            team: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });

    // Log a note with source, program interest, and notes if provided
    const noteParts: string[] = [];
    if (_source) noteParts.push(`📌 مصدر العميل: ${_source}`);
    if (_programId) noteParts.push(`🎓 البرنامج المهتم به: ${_programId}`);
    if (_notes) noteParts.push(`📝 ملاحظات: ${_notes}`);

    if (noteParts.length > 0) {
        await prisma.crmNote.create({
            data: {
                leadId: lead.id,
                userId,
                content: noteParts.join('\n'),
                type: 'note'
            }
        });
    }

    // Add a note if there are duplicates
    if (duplicates.length > 0) {
        await prisma.crmNote.create({
            data: {
                leadId: lead.id,
                userId,
                content: `⚠️ Warning: ${duplicates.length} duplicate lead(s) detected with the same phone number.`,
                type: 'system_log'
            }
        });
    }

    // Live Append to Google Sheet asynchronously (non-blocking)
    let googleSheetUrl = process.env.GOOGLE_SHEET_URL || process.env.GOOGLE_SHEET_ID;
    if (!googleSheetUrl) {
        try {
            const setting = await prisma.systemSetting.findUnique({
                where: { key: 'crm_google_sheet_url' }
            });
            googleSheetUrl = setting?.value || '';
        } catch (e) {}
    }
    if (googleSheetUrl) {
        try {
            const { GoogleSheetsService } = require('./google-sheets.service');
            GoogleSheetsService.appendLeadToSheet({
                spreadsheetUrlOrId: googleSheetUrl,
                lead,
                noteContent: _notes
            }).catch((err: any) => console.error('[Google Sheets Sync] Web live export failed:', err));
        } catch (err) {
            console.error('[Google Sheets Sync] Failed to load GoogleSheetsService:', err);
        }
    }

    // Live Instant Telegram notification alert for salesperson assignment
    try {
        const { crmController } = require('../crm.controller');
        crmController.sendInstantLeadAlert(lead.id).catch((err: any) => console.error('[Telegram Alert] Failed:', err));
    } catch (err) {
        console.error('[Telegram Alert] Failed to load crmController:', err);
    }

    return { ...lead, duplicates };
}

/**
 * Update a lead
 */
export async function updateLead(id: string, data: any, _userId: string) {
    // Strip private meta fields that don't belong in CrmLead
    const { _source, _notes, _programId, ...cleanData } = data;

    // Persist new note if provided
    if (_notes && _notes.trim()) {
        await prisma.crmNote.create({
            data: {
                leadId: id,
                userId: _userId,
                content: _notes.trim(),
                type: 'note'
            }
        });
    }

    // Normalize phone numbers if changed
    const updateData: any = { ...cleanData };

    if (cleanData.phone !== undefined) {
        updateData.phoneNormalized = normalizePhone(cleanData.phone);
    }
    if (cleanData.mobile !== undefined) {
        updateData.mobileNormalized = normalizePhone(cleanData.mobile);
    }

    // Check for duplicates if phone or email changed
    if (cleanData.phone !== undefined || cleanData.mobile !== undefined || cleanData.emailFrom !== undefined) {
        const duplicates = await checkDuplicates(id, cleanData.phone, cleanData.mobile, cleanData.emailFrom);
        updateData.isDuplicate = duplicates.length > 0;
        updateData.duplicateCount = duplicates.length;
    }

    // Update stage transition timestamp
    if (cleanData.stageId !== undefined) {
        updateData.dateLastStageUpdate = new Date();
    }

    const lead = await prisma.crmLead.update({
        where: { id },
        data: updateData,
        include: {
            stage: true,
            salesperson: {
                select: {
                    id: true,
                    username: true
                }
            },
            team: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });

    return lead;
}

/**
 * Delete a lead (soft delete by setting active = false)
 */
export async function deleteLead(id: string) {
    await prisma.crmLead.update({
        where: { id },
        data: { active: false }
    });

    return { success: true };
}

/**
 * Merge multiple leads into one master lead
 */
export async function mergeLeads(data: {
    masterLeadId: string;
    duplicateLeadIds: string[];
    mergeOptions: {
        mergeNotes: boolean;
        mergeActivities: boolean;
        archiveDuplicates: boolean;
        useMaxRevenue: boolean;
    };
    userId: string;
}) {
    const { masterLeadId, duplicateLeadIds, mergeOptions, userId } = data;

    const master = await prisma.crmLead.findUnique({
        where: { id: masterLeadId },
        include: { notes: true, activities: true }
    });

    if (!master) throw new Error('Master lead not found');

    const duplicates = await prisma.crmLead.findMany({
        where: { id: { in: duplicateLeadIds } },
        include: { notes: true, activities: true }
    });

    // Merge notes
    if (mergeOptions.mergeNotes) {
        for (const dup of duplicates) {
            if (dup.notes.length > 0) {
                await prisma.crmNote.updateMany({
                    where: { leadId: dup.id },
                    data: { leadId: masterLeadId }
                });
            }
        }
    }

    // Merge activities
    if (mergeOptions.mergeActivities) {
        for (const dup of duplicates) {
            if (dup.activities.length > 0) {
                await prisma.crmActivity.updateMany({
                    where: { resId: dup.id },
                    data: { resId: masterLeadId }
                });
            }
        }
    }

    // Update revenue if using max
    if (mergeOptions.useMaxRevenue) {
        const allRevenues = [master.expectedRevenue, ...duplicates.map(d => d.expectedRevenue)].filter(Boolean);
        if (allRevenues.length > 0) {
            const maxRevenue = Math.max(...allRevenues.map(r => Number(r)));
            await prisma.crmLead.update({
                where: { id: masterLeadId },
                data: { expectedRevenue: maxRevenue }
            });
        }
    }

    // Add merge log
    const mergeMessage = `✅ Merged ${duplicates.length} duplicate lead(s): ${duplicates.map(d => d.name).join(', ')}`;
    await prisma.crmNote.create({
        data: {
            leadId: masterLeadId,
            userId,
            content: mergeMessage,
            type: 'system_log'
        }
    });

    // Archive or delete duplicates
    if (mergeOptions.archiveDuplicates) {
        await prisma.crmLead.updateMany({
            where: { id: { in: duplicateLeadIds } },
            data: { active: false }
        });
    } else {
        await prisma.crmLead.deleteMany({
            where: { id: { in: duplicateLeadIds } }
        });
    }

    // Refresh duplicate count
    const remainingDuplicates = await checkDuplicates(masterLeadId, master.phone || undefined, master.mobile || undefined);
    await prisma.crmLead.update({
        where: { id: masterLeadId },
        data: {
            isDuplicate: remainingDuplicates.length > 0,
            duplicateCount: remainingDuplicates.length
        }
    });

    return getLeadById(masterLeadId);
}

/**
 * Unified Lead Conversion (Transition Strategy): 
 * 1. Creates a Permanent Customer record (type: 'customer')
 * 2. TRANSFORMS the original record into an Opportunity (type: 'opportunity')
 * 3. Links them via partnerId
 */
export async function convertToOpportunity(id: string, stageId?: string, data: any = {}) {
    // 1. Get original lead
    const originalLead = await prisma.crmLead.findUnique({
        where: { id },
        include: { notes: true }
    });

    if (!originalLead) throw new Error('Lead not found');
    if (originalLead.type !== 'lead') throw new Error('Only leads can be converted to opportunities');

    const spId = data.salespersonId || originalLead.salespersonId;
    const existingPartnerId = data.existingPartnerId;

    let targetPartnerId: string;
    let customerRecord: any = null;

    // 2. Handle Partner (Customer) Logic
    if (existingPartnerId) {
        // Use existing customer
        const existingPartner = await prisma.crmLead.findUnique({
            where: { id: existingPartnerId }
        });
        if (!existingPartner) throw new Error('Existing customer not found');
        targetPartnerId = existingPartner.id;
        customerRecord = existingPartner;
    } else {
        // Create the CUSTOMER record (Permanent storage)
        const customerPayload: any = {
            name: data.name || originalLead.name,
            type: 'customer',
            contactName: data.contactName || originalLead.contactName,
            emailFrom: data.emailFrom || originalLead.emailFrom,
            phone: data.phone || originalLead.phone,
            mobile: data.mobile || originalLead.mobile,
            website: data.website || originalLead.website,
            active: true,
            sourceId: data.sourceId || originalLead.sourceId,
            customFields: data.customFields || originalLead.customFields || {},
        };

        if (spId) customerPayload.salesperson = { connect: { id: spId } };

        customerRecord = await prisma.crmLead.create({
            data: customerPayload
        });
        targetPartnerId = customerRecord.id;

        // Duplicate existing lead notes to the NEW Customer record for continuity
        if (originalLead.notes.length > 0) {
            await prisma.crmNote.createMany({
                data: originalLead.notes.map(note => ({
                    content: note.content,
                    type: note.type,
                    userId: note.userId,
                    leadId: targetPartnerId
                }))
            });
        }
    }

    // 3. Determine target stage for Opportunity
    let targetStageId = stageId;
    if (!targetStageId) {
        const defaultStage = await prisma.crmStage.findFirst({
            where: { probability: { gt: 0 } },
            orderBy: { sequence: 'asc' }
        });
        targetStageId = defaultStage?.id;
    }

    const payloadRevenue = data.expectedRevenue !== undefined ? parseFloat(data.expectedRevenue) || 0 : Number(originalLead.expectedRevenue || 0);
    const payloadProb = data.probability !== undefined ? parseFloat(data.probability) || 20 : originalLead.probability;

    // 4. Transform original Lead -> Opportunity
    const updatePayload: any = {
        type: 'opportunity',
        partnerId: targetPartnerId, // Linking
        name: data.name || originalLead.name,
        contactName: data.contactName || originalLead.contactName,
        emailFrom: data.emailFrom || originalLead.emailFrom,
        phone: data.phone || originalLead.phone,
        mobile: data.mobile || originalLead.mobile,
        website: data.website || originalLead.website,
        expectedRevenue: payloadRevenue,
        probability: payloadProb,
        priority: data.priority || originalLead.priority,
        sourceId: data.sourceId || originalLead.sourceId,
        dateDeadline: data.dateDeadline ? new Date(data.dateDeadline) : originalLead.dateDeadline,
        dateOpen: new Date(),
        customFields: data.customFields || originalLead.customFields || {},
    };

    if (targetStageId) updatePayload.stage = { connect: { id: targetStageId } };
    if (spId) updatePayload.salesperson = { connect: { id: spId } };

    const teamId = data.teamId || originalLead.teamId;
    if (teamId) updatePayload.team = { connect: { id: teamId } };

    const updatedOpportunity = await prisma.crmLead.update({
        where: { id },
        data: updatePayload,
        include: {
            stage: true,
            salesperson: { select: { id: true, username: true } },
            team: { select: { id: true, name: true } }
        }
    });

    // 5. Add conversion logs & notes
    if (data.notes) {
        const logNotes = [];
        logNotes.push(prisma.crmNote.create({
            data: { leadId: updatedOpportunity.id, content: data.notes, type: 'note', userId: spId || undefined }
        }));
        // Mirror notes to customer ONLY if it's a new one or requested (stay consistent)
        logNotes.push(prisma.crmNote.create({
            data: { leadId: targetPartnerId, content: data.notes, type: 'note', userId: spId || undefined }
        }));
        await Promise.all(logNotes);
    }

    const finalLogs = [];
    finalLogs.push(prisma.crmNote.create({
        data: {
            leadId: updatedOpportunity.id,
            content: existingPartnerId
                ? `🚀 تم تحويل العميل المحتمل إلى فرصة مبيعات وربطه بالعميل الموجود: ${customerRecord.name}`
                : `🚀 تم تحويل العميل المحتمل إلى فرصة مبيعات وإنشاء سجل عميل جديد له: ${customerRecord.name}`,
            type: 'system_log',
            userId: spId || undefined
        }
    }));

    if (!existingPartnerId) {
        finalLogs.push(prisma.crmNote.create({
            data: {
                leadId: targetPartnerId,
                content: `ℹ️ تم إنشاء هذا السجل كعميل دائم من العميل المحتمل: ${originalLead.name}`,
                type: 'system_log',
                userId: spId || undefined
            }
        }));
    }

    await Promise.all(finalLogs);

    return { opportunity: updatedOpportunity, customer: customerRecord };
}

/**
 * Register Lead as Customer only (Standalone)
 */
export async function convertToCustomer(id: string, data: any = {}) {
    const originalLead = await prisma.crmLead.findUnique({
        where: { id },
        include: { notes: true }
    });

    if (!originalLead) throw new Error('Record not found');

    const spId = data.salespersonId || originalLead.salespersonId;

    const createData: any = {
        name: data.name || originalLead.name,
        type: 'customer',
        contactName: data.contactName || originalLead.contactName,
        emailFrom: data.emailFrom || originalLead.emailFrom,
        phone: data.phone || originalLead.phone,
        mobile: data.mobile || originalLead.mobile,
        website: data.website || originalLead.website,
        active: true,
        customFields: data.customFields || originalLead.customFields || {},
        sourceId: data.sourceId || originalLead.sourceId,
    };

    if (spId) {
        createData.salesperson = { connect: { id: spId } };
    }

    const newCustomer = await prisma.crmLead.create({
        data: createData
    });

    if (originalLead.notes.length > 0) {
        await prisma.crmNote.createMany({
            data: originalLead.notes.map(note => ({
                content: note.content,
                type: note.type,
                userId: note.userId,
                leadId: newCustomer.id
            }))
        });
    }

    await prisma.crmNote.create({
        data: {
            leadId: id,
            content: `✅ تم تسجيل العميل كعميل دائم بنجاح: ${newCustomer.name}`,
            type: 'system_log',
            userId: spId || undefined
        }
    });

    return newCustomer;
}

/**
 * Get all stages
 */
export async function getStages() {
    return await prisma.crmStage.findMany({
        orderBy: { sequence: 'asc' }
    });
}

/**
 * Create a new stage
 */
export async function createStage(data: any) {
    const { active, folded, ...rest } = data;
    return await prisma.crmStage.create({
        data: {
            ...rest,
            isActive: active !== undefined ? active : true,
            isFolded: folded !== undefined ? folded : false
        }
    });
}

/**
 * Update a stage
 */
export async function updateStage(id: string, data: any) {
    const { active, folded, ...rest } = data;
    const updateData: any = { ...rest };

    if (active !== undefined) updateData.isActive = active;
    if (folded !== undefined) updateData.isFolded = folded;

    return await prisma.crmStage.update({
        where: { id },
        data: updateData
    });
}

/**
 * Delete a stage
 */
export async function deleteStage(id: string) {
    // Check if stage has opportunities
    const count = await prisma.crmLead.count({
        where: { stageId: id }
    });

    if (count > 0) {
        throw new Error(`لا يمكن حذف المرحلة لوجود ${count} فرصة مبيعات مرتبطة بها. قم بنقلها أولاً.`);
    }

    return await prisma.crmStage.delete({
        where: { id }
    });
}
