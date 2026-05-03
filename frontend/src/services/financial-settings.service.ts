import { apiClient } from './api';

export interface FinancialSettings {
    id: string;
    companyNameAr: string;
    companyNameEn: string;
    trn: string;
    vatRate: number;
    currency: string;
    bankName?: string | null;
    iban?: string | null;
    swiftCode?: string | null;
    bankAddress?: string | null;
    defaultCashAccountId?: string | null;
    defaultBankAccountId?: string | null;
    defaultVatAccountId?: string | null;
    defaultIncomeAccountId?: string | null;
    defaultBankSuspenseAccountId?: string | null;
    defaultStudentReceivableAccountId?: string | null;
    defaultSalesDiscountAccountId?: string | null;
    defaultPayrollExpenseAccountId?: string | null;
    defaultPayrollPayableAccountId?: string | null;
    defaultSupplierPayableAccountId?: string | null;
    updatedAt: string;
}

export interface UpdateFinancialSettingsData {
    companyNameAr: string;
    companyNameEn: string;
    trn: string;
    vatRate: number;
    currency: string;
    bankName?: string | null;
    iban?: string | null;
    swiftCode?: string | null;
    bankAddress?: string | null;
    defaultCashAccountId?: string | null;
    defaultBankAccountId?: string | null;
    defaultVatAccountId?: string | null;
    defaultIncomeAccountId?: string | null;
    defaultBankSuspenseAccountId?: string | null;
    defaultStudentReceivableAccountId?: string | null;
    defaultSalesDiscountAccountId?: string | null;
    defaultPayrollExpenseAccountId?: string | null;
    defaultPayrollPayableAccountId?: string | null;
    defaultSupplierPayableAccountId?: string | null;
}

class FinancialSettingsService {
    private readonly BASE_PATH = '/accounting/settings';

    /**
     * Get financial settings
     */
    async getSettings(): Promise<FinancialSettings> {
        const response = await apiClient.get(this.BASE_PATH);
        return response.data;
    }

    /**
     * Update financial settings
     */
    async updateSettings(data: UpdateFinancialSettingsData): Promise<FinancialSettings> {
        const response = await apiClient.put(this.BASE_PATH, data);
        return response.data;
    }
}

export default new FinancialSettingsService();
