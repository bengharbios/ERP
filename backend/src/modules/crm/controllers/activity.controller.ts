import { Request, Response } from 'express';
import * as activityService from '../services/activity.service';

export async function getActivities(req: Request, res: Response) {
    try {
        const filters = {
            userId: req.query.userId as string,
            leadId: req.query.leadId as string,
            teamId: req.query.teamId as string,
            status: req.query.status as string,
            filter: req.query.filter as 'all' | 'overdue' | 'today' | 'planned'
        };

        const activities = await activityService.getActivities(filters);
        res.json({ success: true, data: activities });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function getActivityById(req: Request, res: Response) {
    try {
        const activity = await activityService.getActivityById(req.params.id);

        if (!activity) {
            return res.status(404).json({ success: false, error: { message: 'Activity not found' } });
        }

        res.json({ success: true, data: activity });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function createActivity(req: Request, res: Response) {
    try {
        const user = (req as any).user;
        const data = {
            ...req.body,
            userId: req.body.userId || user?.id,
        };
        const activity = await activityService.createActivity(data);
        res.status(201).json({ success: true, data: activity });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function updateActivity(req: Request, res: Response) {
    try {
        const activity = await activityService.updateActivity(req.params.id, req.body);
        res.json({ success: true, data: activity });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function markAsDone(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const activity = await activityService.markAsDone(req.params.id, userId, req.body);
        res.json({ success: true, data: activity });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function deleteActivity(req: Request, res: Response) {
    try {
        await activityService.deleteActivity(req.params.id);
        res.json({ success: true, data: { message: 'Activity deleted successfully' } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function getActivityTypes(req: Request, res: Response) {
    try {
        const types = await activityService.getActivityTypes();
        res.json({ success: true, data: types });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function createActivityType(req: Request, res: Response) {
    try {
        const type = await activityService.createActivityType(req.body);
        res.status(201).json({ success: true, data: type });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function updateActivityType(req: Request, res: Response) {
    try {
        const type = await activityService.updateActivityType(req.params.id, req.body);
        res.json({ success: true, data: type });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function deleteActivityType(req: Request, res: Response) {
    try {
        await activityService.deleteActivityType(req.params.id);
        res.json({ success: true, data: { message: 'Activity type deleted' } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

// ─── Activity Plans ───────────────────────────────────────
export async function getActivityPlans(req: Request, res: Response) {
    try {
        const plans = await activityService.getActivityPlans();
        res.json({ success: true, data: plans });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function createActivityPlan(req: Request, res: Response) {
    try {
        const plan = await activityService.createActivityPlan(req.body);
        res.status(201).json({ success: true, data: plan });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function updateActivityPlan(req: Request, res: Response) {
    try {
        const plan = await activityService.updateActivityPlan(req.params.id, req.body);
        res.json({ success: true, data: plan });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

export async function deleteActivityPlan(req: Request, res: Response) {
    try {
        await activityService.deleteActivityPlan(req.params.id);
        res.json({ success: true, data: { message: 'Activity plan deleted' } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
}

