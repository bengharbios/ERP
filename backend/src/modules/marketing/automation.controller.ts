import { Request, Response } from 'express';
import { workflowService } from './automation.service';

export const automationController = {
    // --- Workflow CRUD ---
    async createWorkflow(req: Request, res: Response) {
        const workflow = await workflowService.createWorkflow(req.body);
        res.status(201).json({ success: true, data: workflow });
    },

    async getWorkflows(req: Request, res: Response) {
        const workflows = await workflowService.getWorkflows(req.query as any);
        res.json({ success: true, data: workflows });
    },

    async getWorkflowById(req: Request, res: Response) {
        const workflow = await workflowService.getWorkflowById(req.params.id);
        if (!workflow) {
            return res.status(404).json({ success: false, message: 'Workflow not found' });
        }
        return res.json({ success: true, data: workflow });
    },

    async updateWorkflowStatus(req: Request, res: Response) {
        const { status } = req.body;
        const workflow = await workflowService.updateWorkflowStatus(req.params.id, status);
        res.json({ success: true, data: workflow });
    },

    async deleteWorkflow(req: Request, res: Response) {
        await workflowService.deleteWorkflow(req.params.id);
        res.json({ success: true, message: 'Workflow deleted successfully' });
    },

    // --- Execution ---
    async triggerWorkflow(req: Request, res: Response) {
        const { workflowId, leadId } = req.body;
        const execution = await workflowService.triggerWorkflow(workflowId, leadId);
        res.json({ success: true, data: execution });
    },

    async getExecutions(req: Request, res: Response) {
        const executions = await workflowService.getExecutions(req.query.workflowId as string);
        res.json({ success: true, data: executions });
    }
};
