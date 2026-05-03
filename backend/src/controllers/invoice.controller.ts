import { Request, Response } from 'express';
import invoiceService from '../services/invoice.service';
import { createInvoiceSchema, updateInvoiceSchema } from '../validation/invoice.validation';

class InvoiceController {
    // GET /api/v1/accounting/invoices
    async getAllInvoices(req: Request, res: Response) {
        try {
            const invoices = await invoiceService.getAllInvoices();
            res.json({ success: true, data: invoices });
        } catch (error: any) {
            console.error('[InvoiceController] Error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
        }
    }

    // GET /api/v1/accounting/invoices/:id
    async getInvoiceById(req: Request, res: Response) {
        try {
            const invoice = await invoiceService.getInvoiceById(req.params.id);
            if (!invoice) {
                return res.status(404).json({ success: false, error: 'Invoice not found' });
            }
            res.json({ success: true, data: invoice });
        } catch (error: any) {
            console.error('[InvoiceController] Error:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
        }
    }

    // POST /api/v1/accounting/invoices
    async createInvoice(req: Request, res: Response) {
        try {
            const validatedData = createInvoiceSchema.parse(req.body);
            const invoice = await invoiceService.createInvoice(validatedData);
            res.status(201).json({ success: true, data: invoice });
        } catch (error: any) {
            console.error('[InvoiceController] Error:', error);
            res.status(400).json({ success: false, error: error.message || 'Validation failed' });
        }
    }

    // PUT /api/v1/accounting/invoices/:id/status
    async updateStatus(req: Request, res: Response) {
        try {
            const { status } = updateInvoiceSchema.parse(req.body);
            const invoice = await invoiceService.updateStatus(req.params.id, status);
            res.json({ success: true, data: invoice });
        } catch (error: any) {
            console.error('[InvoiceController] Error:', error);
            res.status(400).json({ success: false, error: 'Failed to update status' });
        }
    }
}

export default new InvoiceController();
