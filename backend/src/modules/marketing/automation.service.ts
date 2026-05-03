import prisma from '../../common/db/prisma';

// --- Action Result Interface ---
interface ActionResult {
    success: boolean;
    message: string;
    shouldPause?: boolean;
}

export class ActionExecutor {
    // Execute a single action
    async execute(actionType: string, actionConfig: any, leadId: string, _context: any = {}): Promise<ActionResult> {
        console.log(`Executing action: ${actionType} for lead: ${leadId}`);

        try {
            switch (actionType) {
                case 'SEND_EMAIL':
                    return await this.sendEmail(leadId, actionConfig);

                case 'SEND_WHATSAPP':
                    return await this.sendWhatsApp(leadId, actionConfig);

                case 'UPDATE_STATUS':
                    return await this.updateStatus(leadId, actionConfig);

                case 'UPDATE_SCORE':
                    return await this.updateScore(leadId, actionConfig);

                case 'ASSIGN_TO_USER':
                    return await this.assignToUser(leadId, actionConfig);

                case 'ADD_TO_CAMPAIGN':
                    return await this.addToCampaign(leadId, actionConfig);

                case 'CREATE_TASK':
                    return await this.createTask(leadId, actionConfig);

                case 'WAIT':
                    return await this.wait(actionConfig);

                case 'ADD_TAG':
                    return await this.addTag(leadId, actionConfig);

                default:
                    throw new Error(`Unknown action type: ${actionType}`);
            }
        } catch (error: any) {
            console.error(`Action execution failed: ${error.message}`);
            throw error;
        }
    }

    // --- Action Implementations ---

    private async sendEmail(leadId: string, config: any) {
        const lead = await prisma.marketingLead.findUnique({ where: { id: leadId } });
        if (!lead || !lead.email) {
            throw new Error('Lead email not found');
        }

        // In a real system, this would integrate with email service (SendGrid, etc.)
        // For now, we'll log it
        console.log(`📧 Sending email to ${lead.email}: ${config.subject}`);

        // Track activity
        await prisma.leadActivity.create({
            data: {
                leadId,
                activityType: 'email_sent',
                channel: 'Email',
                metadata: { subject: config.subject, template: config.template }
            }
        });

        return { success: true, message: `Email sent to ${lead.email}` };
    }

    private async sendWhatsApp(leadId: string, config: any) {
        const lead = await prisma.marketingLead.findUnique({ where: { id: leadId } });
        if (!lead || !lead.phone) {
            throw new Error('Lead phone not found');
        }

        console.log(`📱 Sending WhatsApp to ${lead.phone}: ${config.message}`);

        await prisma.leadActivity.create({
            data: {
                leadId,
                activityType: 'whatsapp_sent',
                channel: 'WhatsApp',
                metadata: { message: config.message }
            }
        });

        return { success: true, message: `WhatsApp sent to ${lead.phone}` };
    }

    private async updateStatus(leadId: string, config: any): Promise<ActionResult> {
        await prisma.marketingLead.update({
            where: { id: leadId },
            data: { status: config.status }
        });

        return { success: true, message: `Status updated to ${config.status}` };
    }

    private async updateScore(leadId: string, config: any) {
        const scoring = await prisma.leadScoring.findUnique({ where: { leadId } });

        if (scoring) {
            const newScore = scoring.totalScore + (config.adjustment || 0);
            await prisma.leadScoring.update({
                where: { leadId },
                data: { totalScore: Math.max(0, Math.min(100, newScore)) }
            });
        }

        return { success: true, message: `Score adjusted by ${config.adjustment}` };
    }

    private async assignToUser(leadId: string, config: any) {
        // In a real system, this would assign to a sales rep
        console.log(`👤 Assigning lead ${leadId} to user ${config.userId}`);

        await prisma.leadActivity.create({
            data: {
                leadId,
                activityType: 'assigned',
                metadata: { userId: config.userId }
            }
        });

        return { success: true, message: `Lead assigned to user ${config.userId}` };
    }

    private async addToCampaign(leadId: string, config: any) {
        await prisma.marketingLead.update({
            where: { id: leadId },
            data: { campaignId: config.campaignId }
        });

        return { success: true, message: `Added to campaign ${config.campaignId}` };
    }

    private async createTask(leadId: string, config: any) {
        console.log(`✅ Creating task for lead ${leadId}: ${config.title}`);

        await prisma.leadActivity.create({
            data: {
                leadId,
                activityType: 'task_created',
                metadata: { title: config.title, dueDate: config.dueDate }
            }
        });

        return { success: true, message: `Task created: ${config.title}` };
    }

    private async wait(config: any) {
        const waitMs = config.duration || 0; // Duration in milliseconds
        console.log(`⏳ Waiting for ${waitMs}ms`);

        // In a real system, this would use a job queue
        // For now, we'll just return immediately
        return { success: true, message: `Wait scheduled for ${waitMs}ms`, shouldPause: true };
    }

    private async addTag(leadId: string, config: any) {
        console.log(`🏷️ Adding tag "${config.tag}" to lead ${leadId}`);

        await prisma.leadActivity.create({
            data: {
                leadId,
                activityType: 'tag_added',
                metadata: { tag: config.tag }
            }
        });

        return { success: true, message: `Tag added: ${config.tag}` };
    }
}

// ============================================
// WORKFLOW SERVICE - Manages automation workflows
// ============================================

export class WorkflowService {
    private actionExecutor: ActionExecutor;

    constructor() {
        this.actionExecutor = new ActionExecutor();
    }

    // --- CRUD Operations ---

    async createWorkflow(data: {
        name: string;
        description?: string;
        triggerType: string;
        triggerConfig?: any;
        steps: Array<{ stepOrder: number; actionType: string; actionConfig: any; conditions?: any }>;
    }) {
        const workflow = await prisma.automationWorkflow.create({
            data: {
                name: data.name,
                description: data.description,
                triggerType: data.triggerType as any,
                triggerConfig: data.triggerConfig,
                steps: {
                    create: data.steps.map(step => ({
                        stepOrder: step.stepOrder,
                        actionType: step.actionType as any,
                        actionConfig: step.actionConfig,
                        conditions: step.conditions
                    }))
                }
            },
            include: { steps: { orderBy: { stepOrder: 'asc' } } }
        });

        return workflow;
    }

    async getWorkflows(filters?: { status?: string }) {
        return await prisma.automationWorkflow.findMany({
            where: filters?.status ? { status: filters.status as any } : {},
            include: {
                steps: { orderBy: { stepOrder: 'asc' } },
                _count: { select: { executions: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getWorkflowById(id: string) {
        return await prisma.automationWorkflow.findUnique({
            where: { id },
            include: {
                steps: { orderBy: { stepOrder: 'asc' } },
                executions: { take: 10, orderBy: { startedAt: 'desc' } }
            }
        });
    }

    async updateWorkflowStatus(id: string, status: string) {
        return await prisma.automationWorkflow.update({
            where: { id },
            data: { status: status as any }
        });
    }

    async deleteWorkflow(id: string) {
        await prisma.automationWorkflow.delete({ where: { id } });
        return { success: true, message: 'Workflow deleted' };
    }

    // --- Execution Engine ---

    async triggerWorkflow(workflowId: string, leadId: string) {
        const workflow = await this.getWorkflowById(workflowId);
        if (!workflow) {
            throw new Error('Workflow not found');
        }

        if (workflow.status !== 'ACTIVE') {
            throw new Error('Workflow is not active');
        }

        // Create execution record
        const execution = await prisma.workflowExecution.create({
            data: {
                workflowId,
                leadId,
                currentStep: 1
            }
        });

        // Start executing steps
        this.executeWorkflow(execution.id).catch(err => {
            console.error('Workflow execution error:', err);
        });

        return execution;
    }

    private async executeWorkflow(executionId: string) {
        const execution = await prisma.workflowExecution.findUnique({
            where: { id: executionId },
            include: {
                workflow: {
                    include: { steps: { orderBy: { stepOrder: 'asc' } } }
                }
            }
        });

        if (!execution) return;

        try {
            for (const step of execution.workflow.steps) {
                // Check if execution was paused/stopped
                const currentExec = await prisma.workflowExecution.findUnique({
                    where: { id: executionId }
                });

                if (currentExec?.status !== 'running') break;

                // Execute step
                try {
                    const result: ActionResult = await this.actionExecutor.execute(
                        step.actionType,
                        step.actionConfig,
                        execution.leadId
                    );

                    // Log success
                    await prisma.executionLog.create({
                        data: {
                            executionId,
                            stepOrder: step.stepOrder,
                            actionType: step.actionType,
                            actionData: step.actionConfig as any,
                            status: 'success',
                            message: result.message
                        }
                    });

                    // Update current step
                    await prisma.workflowExecution.update({
                        where: { id: executionId },
                        data: { currentStep: step.stepOrder }
                    });

                    // Handle WAIT action
                    if (result.shouldPause) {
                        await prisma.workflowExecution.update({
                            where: { id: executionId },
                            data: { status: 'paused' }
                        });
                        break; // Pause execution, will resume later
                    }

                } catch (error: any) {
                    // Log failure
                    await prisma.executionLog.create({
                        data: {
                            executionId,
                            stepOrder: step.stepOrder,
                            actionType: step.actionType,
                            status: 'failed',
                            message: error.message
                        }
                    });

                    // Update execution with error
                    await prisma.workflowExecution.update({
                        where: { id: executionId },
                        data: {
                            status: 'failed',
                            errorMessage: error.message,
                            retryCount: { increment: 1 }
                        }
                    });

                    throw error;
                }
            }

            // Mark as completed
            await prisma.workflowExecution.update({
                where: { id: executionId },
                data: {
                    status: 'completed',
                    completedAt: new Date()
                }
            });

            // Update workflow stats
            await prisma.automationWorkflow.update({
                where: { id: execution.workflowId },
                data: {
                    totalExecutions: { increment: 1 },
                    successfulRuns: { increment: 1 }
                }
            });

        } catch (error) {
            console.error('Workflow execution failed:', error);
        }
    }

    // Get execution history
    async getExecutions(workflowId?: string) {
        return await prisma.workflowExecution.findMany({
            where: workflowId ? { workflowId } : {},
            include: {
                workflow: { select: { name: true } },
                logs: { orderBy: { timestamp: 'asc' } }
            },
            orderBy: { startedAt: 'desc' },
            take: 50
        });
    }
}

export const workflowService = new WorkflowService();
