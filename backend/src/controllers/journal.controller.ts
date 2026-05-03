import { Request, Response } from 'express';
import journalService from '../services/journal.service';
import {
    createJournalEntrySchema,
    updateJournalEntrySchema,
    getJournalEntriesQuerySchema
} from '../validation/journal.validation';

export class JournalController {
    /**
     * GET /api/accounting/journal-entries
     */
    async getJournalEntries(req: Request, res: Response) {
        try {
            const query = getJournalEntriesQuerySchema.parse(req.query);
            const result = await journalService.getJournalEntries(query);

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error: any) {
            console.error('Error fetching journal entries:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch journal entries'
            });
        }
    }

    /**
     * GET /api/accounting/journal-entries/:id
     */
    async getJournalEntryById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const entry = await journalService.getJournalEntryById(id);

            res.json({
                success: true,
                data: entry
            });
        } catch (error: any) {
            console.error('Error fetching journal entry:', error);
            const status = error.message === 'Journal entry not found' ? 404 : 500;
            res.status(status).json({
                success: false,
                error: error.message || 'Failed to fetch journal entry'
            });
        }
    }

    /**
     * POST /api/accounting/journal-entries
     */
    async createJournalEntry(req: Request, res: Response) {
        try {
            // Validate request body
            const data = createJournalEntrySchema.parse(req.body);

            // Get user ID from JWT (assuming authentication middleware adds it)
            const userId = (req as any).user?.id || 'system';

            const entry = await journalService.createJournalEntry(data, userId);

            res.status(201).json({
                success: true,
                data: entry,
                message: 'Journal entry created successfully (Draft)'
            });
        } catch (error: any) {
            console.error('Error creating journal entry:', error);

            // Handle Zod validation errors
            if (error.errors) {
                return res.status(400).json({
                    success: false,
                    error: 'Validation failed',
                    details: error.errors
                });
            }

            const status = error.message.includes('unbalanced') ? 400 : 500;
            res.status(status).json({
                success: false,
                error: error.message || 'Failed to create journal entry'
            });
        }
    }

    /**
     * PUT /api/accounting/journal-entries/:id/post
     * Post a journal entry (Finalize)
     */
    async postJournalEntry(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.id || 'system';

            const entry = await journalService.postJournalEntry(id, userId);

            res.json({
                success: true,
                data: entry,
                message: 'Journal entry posted successfully'
            });
        } catch (error: any) {
            console.error('Error posting journal entry:', error);
            const status = error.message.includes('not found') ? 404 : 400;
            res.status(status).json({
                success: false,
                error: error.message || 'Failed to post journal entry'
            });
        }
    }

    /**
     * DELETE /api/accounting/journal-entries/:id
     */
    async deleteJournalEntry(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await journalService.deleteJournalEntry(id);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error: any) {
            console.error('Error deleting journal entry:', error);
            const status = error.message.includes('not found') ? 404 : 400;
            res.status(status).json({
                success: false,
                error: error.message || 'Failed to delete journal entry'
            });
        }
    }
}

export default new JournalController();
