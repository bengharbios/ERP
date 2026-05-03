import { apiClient } from './api';

export interface FinancialYear {
    id: string;
    yearName: string;
    startDate: string;
    endDate: string;
    isClosed: boolean;
    isCurrent: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface CreateFinancialYearData {
    yearName: string;
    startDate: string;
    endDate: string;
    isCurrent?: boolean;
}

export interface UpdateFinancialYearData {
    yearName?: string;
    startDate?: string;
    endDate?: string;
    isClosed?: boolean;
    isCurrent?: boolean;
}

class FinancialYearService {
    private readonly BASE_PATH = '/accounting/financial-years';

    /**
     * Get all financial years
     */
    async getAllYears(): Promise<FinancialYear[]> {
        const response = await apiClient.get(this.BASE_PATH);
        return response.data;
    }

    /**
     * Get current financial year
     */
    async getCurrentYear(): Promise<FinancialYear> {
        const response = await apiClient.get(`${this.BASE_PATH}/current`);
        return response.data;
    }

    /**
     * Create new financial year
     */
    async createFinancialYear(data: CreateFinancialYearData): Promise<FinancialYear> {
        const response = await apiClient.post(this.BASE_PATH, data);
        return response.data;
    }

    /**
     * Update financial year
     */
    async updateFinancialYear(id: string, data: UpdateFinancialYearData): Promise<FinancialYear> {
        const response = await apiClient.put(`${this.BASE_PATH}/${id}`, data);
        return response.data;
    }

    /**
     * Close financial year
     */
    async closeFinancialYear(id: string): Promise<FinancialYear> {
        const response = await apiClient.put(`${this.BASE_PATH}/${id}/close`);
        return response.data;
    }

    /**
     * Delete financial year
     */
    async deleteFinancialYear(id: string): Promise<void> {
        await apiClient.delete(`${this.BASE_PATH}/${id}`);
    }
}

export default new FinancialYearService();
