import { Request, Response } from 'express';
import { aiService } from './ai.service';

export const analyzeAssignment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { assignment, rubric, options, apiKey } = req.body;

        if (!assignment || !rubric) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Assignment and Rubric content are required for evaluation.'
                }
            });
            return;
        }

        const report = await aiService.analyzeAssignment(assignment, rubric, options, apiKey);

        res.json({
            success: true,
            data: { report }
        });
    } catch (error: any) {
        console.error('AI Analysis Controller Error:', error);
        
        const errorMessage = error.response?.data?.error?.message || error.message || 'Unknown AI Error';
        const errorCode = error.response?.data?.error?.code || 'AI_PROVIDER_ERROR';

        // Use 500 to distinguish from RBAC/Auth 403 errors
        res.status(500).json({
            success: false,
            error: {
                code: errorCode,
                message: `AI Engine Error: ${errorMessage}`
            }
        });
    }
};
