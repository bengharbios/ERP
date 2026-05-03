import { Request, Response } from 'express';
import financialYearService from '../services/financial-year.service';
import { createFinancialYearSchema, updateFinancialYearSchema } from '../validation/financial-year.validation';

class FinancialYearController {

    // GET /api/accounting/financial-years
    async getAllYears(req: Request, res: Response) {
        try {
            const years = await financialYearService.getAllYears();
            res.json({ success: true, data: years });
        } catch (error: any) {
            console.error('[FinancialYearController] Error in getAllYears:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch financial years' });
        }
    }

    // GET /api/accounting/financial-years/current
    async getCurrentYear(req: Request, res: Response) {
        try {
            const year = await financialYearService.getCurrentYear();
            if (!year) return res.status(404).json({ success: false, error: 'No active financial year found' });
            res.json({ success: true, data: year });
        } catch (error: any) {
            console.error('[FinancialYearController] Error in getCurrentYear:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch current financial year' });
        }
    }

    // POST /api/accounting/financial-years
    async createFinancialYear(req: Request, res: Response) {
        try {
            const data = createFinancialYearSchema.parse(req.body);
            const year = await financialYearService.createFinancialYear(data);
            res.status(201).json({ success: true, data: year, message: 'Financial year created successfully' });
        } catch (error: any) {
            console.error(error);
            if (error.errors) return res.status(400).json({ success: false, errors: error.errors });
            res.status(500).json({ success: false, error: 'Failed to create financial year' });
        }
    }

    // PUT /api/accounting/financial-years/:id
    async updateFinancialYear(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = updateFinancialYearSchema.parse(req.body);
            const year = await financialYearService.updateFinancialYear(id, data);
            res.json({ success: true, data: year, message: 'Financial year updated successfully' });
        } catch (error: any) {
            console.error(error);
            if (error.errors) return res.status(400).json({ success: false, errors: error.errors });
            res.status(500).json({ success: false, error: 'Failed to update financial year' });
        }
    }

    // PUT /api/accounting/financial-years/:id/close
    async closeFinancialYear(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const year = await financialYearService.closeFinancialYear(id);
            res.json({ success: true, data: year, message: 'Financial year closed successfully' });
        } catch (error: any) {
            console.error('[FinancialYearController] Error in closeFinancialYear:', error);
            res.status(500).json({ success: false, error: 'Failed to close financial year' });
        }
    }

    // DELETE /api/accounting/financial-years/:id
    async deleteFinancialYear(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await financialYearService.deleteFinancialYear(id);
            res.json({ success: true, message: 'Financial year deleted successfully' });
        } catch (error: any) {
            res.status(500).json({ success: false, error: 'Failed to delete financial year' });
        }
    }
}

export default new FinancialYearController();
