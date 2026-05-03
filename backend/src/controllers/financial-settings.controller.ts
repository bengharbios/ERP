import { Request, Response } from 'express';
import financialSettingsService from '../services/financial-settings.service';
import { updateFinancialSettingsSchema } from '../validation/financial-settings.validation';

export class FinancialSettingsController {
    /**
     * GET /api/v1/accounting/settings
     */
    async getSettings(req: Request, res: Response) {
        try {
            const settings = await financialSettingsService.getSettings();
            res.json({ success: true, data: settings });
        } catch (error: any) {
            console.error('Error fetching financial settings:', error);
            res.status(500).json({ success: false, error: 'Failed to fetch financial settings' });
        }
    }

    /**
     * PUT /api/v1/accounting/settings
     */
    async updateSettings(req: Request, res: Response) {
        try {
            const data = updateFinancialSettingsSchema.parse(req.body);
            const settings = await financialSettingsService.updateSettings(data);
            res.json({ success: true, data: settings, message: 'Financial settings updated successfully' });
        } catch (error: any) {
            // استخدام رسالة الخطأ فقط لتجنب انهيار Node.js عند طباعة كائنات Prisma المعقدة
            console.error('Error updating financial settings:', error?.message || error);

            const errorMessage = error?.name === 'ZodError'
                ? 'بيانات المدخلات غير صالحة'
                : (error?.message || 'Failed to update financial settings');

            res.status(400).json({
                success: false,
                error: errorMessage,
                details: error?.errors // لإظهار تفاصيل Zod إن وجدت
            });
        }
    }
}

export default new FinancialSettingsController();
