import prisma from '../common/db/prisma';
import { UpdateFinancialSettingsInput } from '../validation/financial-settings.validation';

export class FinancialSettingsService {
    /**
     * Get the singleton financial settings
     */
    async getSettings() {
        let settings = await prisma.financialSettings.findFirst();

        // If no settings exist, create defaults (fallback)
        if (!settings) {
            settings = await prisma.financialSettings.create({
                data: {
                    companyNameAr: 'المعهد',
                    companyNameEn: 'The Institute',
                    trn: '000000000000000',
                    vatRate: 5.0,
                    currency: 'AED'
                }
            });
        }

        return settings;
    }

    /**
     * Update the financial settings
     */
    async updateSettings(data: UpdateFinancialSettingsInput) {
        const settings = await this.getSettings();

        return await prisma.financialSettings.update({
            where: { id: settings.id },
            data
        });
    }
}

export default new FinancialSettingsService();
