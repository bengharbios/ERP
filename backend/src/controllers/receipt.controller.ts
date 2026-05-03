import { Request, Response } from 'express';
import receiptService from '../services/receipt.service';
import { createReceiptSchema, updateReceiptSchema, receiptQuerySchema } from '../validation/receipt.validation';

class ReceiptController {

    // GET /api/accounting/receipts
    async getReceipts(req: Request, res: Response) {
        try {
            const query = receiptQuerySchema.parse(req.query);
            const result = await receiptService.getReceipts(query);
            return res.json({ success: true, ...result });
        } catch (error: any) {
            console.error(error);
            if (error.errors) return res.status(400).json({ success: false, errors: error.errors });
            return res.status(500).json({ success: false, error: 'Failed to fetch receipts' });
        }
    }

    // GET /api/accounting/receipts/:id
    async getReceiptById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const receipt = await receiptService.getReceiptById(id);
            return res.json({ success: true, data: receipt });
        } catch (error: any) {
            if (error.message === 'Receipt not found') return res.status(404).json({ success: false, error: 'Receipt not found' });
            return res.status(500).json({ success: false, error: 'Failed to fetch receipt' });
        }
    }

    // POST /api/accounting/receipts
    async createReceipt(req: Request, res: Response) {
        try {
            const data = createReceiptSchema.parse(req.body);
            const receipt = await receiptService.createReceipt({
                ...data,
                receivedBy: (req as any).user?.userId // From auth middleware
            });
            return res.status(201).json({ success: true, data: receipt, message: 'Receipt draft created successfully' });
        } catch (error: any) {
            console.error(error);
            if (error.errors) return res.status(400).json({ success: false, errors: error.errors });
            return res.status(500).json({ success: false, error: 'Failed to create receipt' });
        }
    }

    // PUT /api/accounting/receipts/:id
    async updateReceipt(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = updateReceiptSchema.parse(req.body);
            const receipt = await receiptService.updateReceipt(id, data);
            return res.json({ success: true, data: receipt, message: 'Receipt updated successfully' });
        } catch (error: any) {
            console.error(error);
            if (error.errors) return res.status(400).json({ success: false, errors: error.errors });
            return res.status(500).json({ success: false, error: 'Failed to update receipt' });
        }
    }

    // PUT /api/accounting/receipts/:id/post
    async postReceipt(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const userId = (req as any).user?.userId;
            const receipt = await receiptService.postReceipt(id, userId);
            return res.json({ success: true, data: receipt, message: 'Receipt posted successfully' });
        } catch (error: any) {
            console.error(error);
            return res.status(400).json({ success: false, error: error.message || 'Failed to post receipt' });
        }
    }

    // DELETE /api/accounting/receipts/:id
    async deleteReceipt(req: Request, res: Response) {
        try {
            const { id } = req.params;
            await receiptService.deleteReceipt(id);
            return res.json({ success: true, message: 'Receipt deleted successfully' });
        } catch (error: any) {
            return res.status(500).json({ success: false, error: error.message || 'Failed to delete receipt' });
        }
    }
}

export default new ReceiptController();
