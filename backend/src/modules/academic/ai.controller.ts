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
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Error processing AI assessment. ' + error.message
            }
        });
    }
};
