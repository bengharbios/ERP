import { apiClient, ApiResponse } from './api';

export interface ExpenseCategory {
    id: string;
    name: string;
    nameAr: string;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Expense {
    id: string;
    expenseNumber?: string;
    categoryId: string;
    amount: number;
    taxRate?: number;
    taxAmount?: number;
    totalAmount?: number;
    currency: string;
    description: string;
    paidTo?: string;
    expenseDate: string;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE' | 'POS';
    referenceNo?: string;
    receiptImage?: string;
    recordedBy?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
    category?: ExpenseCategory;
}

export interface ExpenseStats {
    totalAllTime: number;
    totalThisMonth: number;
    categoryBreakdown: {
        categoryId: string;
        categoryName: string;
        categoryNameAr: string;
        total: number;
    }[];
}

export const expenseService = {
    // Categories
    async getCategories(): Promise<ApiResponse<{ categories: ExpenseCategory[] }>> {
        return apiClient.get('/expenses/categories');
    },

    async createCategory(data: Partial<ExpenseCategory>): Promise<ApiResponse<{ category: ExpenseCategory }>> {
        return apiClient.post('/expenses/categories', data);
    },

    async updateCategory(id: string, data: Partial<ExpenseCategory>): Promise<ApiResponse<{ category: ExpenseCategory }>> {
        return apiClient.put(`/expenses/categories/${id}`, data);
    },

    async deleteCategory(id: string): Promise<ApiResponse<void>> {
        return apiClient.delete(`/expenses/categories/${id}`);
    },

    // Expenses
    async getExpenses(filters: { categoryId?: string; startDate?: string; endDate?: string } = {}): Promise<ApiResponse<{ expenses: Expense[] }>> {
        const params = new URLSearchParams();
        if (filters.categoryId) params.append('categoryId', filters.categoryId);
        if (filters.startDate) params.append('startDate', filters.startDate);
        if (filters.endDate) params.append('endDate', filters.endDate);

        return apiClient.get(`/expenses?${params.toString()}`);
    },

    async getExpenseById(id: string): Promise<ApiResponse<{ expense: Expense }>> {
        return apiClient.get(`/expenses/${id}`);
    },

    async createExpense(data: Partial<Expense>): Promise<ApiResponse<{ expense: Expense }>> {
        return apiClient.post('/expenses', data);
    },

    async updateExpense(id: string, data: Partial<Expense>): Promise<ApiResponse<{ expense: Expense }>> {
        return apiClient.put(`/expenses/${id}`, data);
    },

    async deleteExpense(id: string): Promise<ApiResponse<void>> {
        return apiClient.delete(`/expenses/${id}`);
    },

    async getStats(): Promise<ApiResponse<{ stats: ExpenseStats }>> {
        return apiClient.get('/expenses/stats');
    }
};
