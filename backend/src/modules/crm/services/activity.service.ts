import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Get all activities with optional filters
 */
export async function getActivities(filters: {
    userId?: string;
    leadId?: string;
    teamId?: string;
    status?: string;
    filter?: 'all' | 'overdue' | 'today' | 'planned';
}) {
    const where: any = {};

    if (filters.userId) where.userId = filters.userId;
    if (filters.leadId) where.resId = filters.leadId;
    if (filters.teamId) where.teamId = filters.teamId;
    if (filters.status) where.status = filters.status;

    // Add date filters
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (filters.filter === 'overdue') {
        where.dateDeadline = { lt: today };
        where.status = 'PLANNED';
    } else if (filters.filter === 'today') {
        where.dateDeadline = { gte: today, lt: tomorrow };
        where.status = 'PLANNED';
    } else if (filters.filter === 'planned') {
        where.dateDeadline = { gte: tomorrow };
        where.status = 'PLANNED';
    }

    const activities = await prisma.crmActivity.findMany({
        where,
        include: {
            type: true,
            user: {
                select: {
                    id: true,
                    username: true
                }
            },
            lead: {
                select: {
                    id: true,
                    name: true,
                    contactName: true
                }
            }
        },
        orderBy: {
            dateDeadline: 'asc'
        }
    });

    // Calculate status for each activity
    return activities.map(activity => {
        const deadline = new Date(activity.dateDeadline);
        let calculatedStatus = activity.status;

        if (activity.status === 'PLANNED') {
            if (deadline < today) {
                calculatedStatus = 'overdue';
            } else if (deadline >= today && deadline < tomorrow) {
                calculatedStatus = 'today';
            } else {
                calculatedStatus = 'planned';
            }
        }

        return {
            ...activity,
            calculatedStatus
        };
    });
}

/**
 * Get a single activity by ID
 */
export async function getActivityById(id: string) {
    return await prisma.crmActivity.findUnique({
        where: { id },
        include: {
            type: true,
            user: {
                select: {
                    id: true,
                    username: true
                }
            },
            lead: {
                select: {
                    id: true,
                    name: true,
                    contactName: true
                }
            }
        }
    });
}

/**
 * Create a new activity
 */
export async function createActivity(data: any) {
    return await prisma.crmActivity.create({
        data,
        include: {
            type: true,
            user: {
                select: {
                    id: true,
                    username: true
                }
            },
            lead: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
}

/**
 * Update an activity
 */
export async function updateActivity(id: string, data: any) {
    return await prisma.crmActivity.update({
        where: { id },
        data,
        include: {
            type: true,
            user: {
                select: {
                    id: true,
                    username: true
                }
            },
            lead: {
                select: {
                    id: true,
                    name: true
                }
            }
        }
    });
}

/**
 * Mark activity as done
 */
export async function markAsDone(id: string, userId: string, feedback?: { note?: string, nextStageId?: string, isClosed?: boolean }) {
    const activity = await prisma.crmActivity.update({
        where: { id },
        data: { status: 'DONE' },
        include: {
            lead: true
        }
    });

    // Add a note to the lead
    if (activity.lead) {
        let noteContent = `✅ تم إنجاز النشاط: ${activity.summary || 'نشاط غير مسمى'}`;
        if (feedback?.note) {
            noteContent += `\n📝 ملاحظة: ${feedback.note}`;
        }

        await prisma.crmNote.create({
            data: {
                leadId: activity.resId,
                userId,
                content: noteContent,
                type: feedback?.note ? 'note' : 'system_log' // make it a real note if text is provided
            }
        });

        // Update stage if provided
        if (feedback?.nextStageId || feedback?.isClosed) {
            const updateData: any = {};
            if (feedback.nextStageId) updateData.stageId = feedback.nextStageId;
            if (feedback.isClosed) updateData.active = false;

            await prisma.crmLead.update({
                where: { id: activity.resId },
                data: updateData
            });
        }
    }

    return activity;
}

/**
 * Delete an activity
 */
export async function deleteActivity(id: string) {
    await prisma.crmActivity.delete({
        where: { id }
    });

    return { success: true };
}

/**
 * Get all activity types
 */
export async function getActivityTypes() {
    return await prisma.crmActivityType.findMany({
        orderBy: { name: 'asc' }
    });
}

/**
 * Create default activity types
 */
export async function createDefaultActivityTypes() {
    const types = [
        { name: 'مكالمة هاتفية', icon: 'fa-phone', color: '#22c55e', action: 'phonecall', daysDelay: 0 },
        { name: 'اجتماع', icon: 'fa-users', color: '#3b82f6', action: 'meeting', daysDelay: 1 },
        { name: 'بريد إلكتروني', icon: 'fa-envelope', color: '#f59e0b', action: 'email', daysDelay: 0 },
        { name: 'مهمة', icon: 'fa-check-circle', color: '#8b5cf6', action: 'todo', daysDelay: 0 },
        { name: 'رفع مستند', icon: 'fa-file-upload', color: '#06b6d4', action: 'upload_document', daysDelay: 0 },
        { name: 'متابعة', icon: 'fa-clock', color: '#f97316', action: 'none', daysDelay: 3 },
    ];

    for (const type of types) {
        const existing = await (prisma.crmActivityType as any).findFirst({ where: { name: type.name } });
        if (!existing) {
            await prisma.crmActivityType.create({ data: type as any });
        }
    }
}

// ═══════════════════════════════════
//  ACTIVITY TYPE CRUD
// ═══════════════════════════════════

export async function createActivityType(data: any) {
    return await prisma.crmActivityType.create({ data });
}

export async function updateActivityType(id: string, data: any) {
    return await prisma.crmActivityType.update({ where: { id }, data });
}

export async function deleteActivityType(id: string) {
    await prisma.crmActivityType.delete({ where: { id } });
    return { success: true };
}

// ═══════════════════════════════════
//  ACTIVITY PLAN CRUD
// ═══════════════════════════════════

export async function getActivityPlans() {
    return await (prisma as any).crmActivityPlan.findMany({
        include: {
            steps: {
                include: {
                    activityType: true,
                    assignedTo: { select: { id: true, username: true } }
                },
                orderBy: { sequence: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
}

export async function getActivityPlanById(id: string) {
    return await (prisma as any).crmActivityPlan.findUnique({
        where: { id },
        include: {
            steps: {
                include: {
                    activityType: true,
                    assignedTo: { select: { id: true, username: true } }
                },
                orderBy: { sequence: 'asc' }
            }
        }
    });
}

export async function createActivityPlan(data: {
    name: string;
    description?: string;
    steps: Array<{
        activityTypeId: string;
        summary?: string;
        assignment: string;
        assignedToId?: string;
        interval: number;
        intervalUnit: string;
        trigger: string;
        sequence: number;
    }>;
}) {
    const { steps, ...planData } = data;
    return await (prisma as any).crmActivityPlan.create({
        data: {
            ...planData,
            steps: {
                create: steps
            }
        },
        include: {
            steps: {
                include: { activityType: true },
                orderBy: { sequence: 'asc' }
            }
        }
    });
}

export async function updateActivityPlan(id: string, data: {
    name?: string;
    description?: string;
    isActive?: boolean;
    steps?: Array<{
        activityTypeId: string;
        summary?: string;
        assignment: string;
        assignedToId?: string;
        interval: number;
        intervalUnit: string;
        trigger: string;
        sequence: number;
    }>;
}) {
    const { steps, ...planData } = data;

    // Delete existing steps and recreate (simplest approach)
    await (prisma as any).crmActivityPlanStep.deleteMany({ where: { planId: id } });

    return await (prisma as any).crmActivityPlan.update({
        where: { id },
        data: {
            ...planData,
            ...(steps ? {
                steps: { create: steps }
            } : {})
        },
        include: {
            steps: {
                include: { activityType: true },
                orderBy: { sequence: 'asc' }
            }
        }
    });
}

export async function deleteActivityPlan(id: string) {
    await (prisma as any).crmActivityPlan.delete({ where: { id } });
    return { success: true };
}

