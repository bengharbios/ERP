import { apiClient } from './api';

export interface Receipt {
    id: string;
    receiptNumber: string;
    studentId: string;
    amount: number;
    amountInWords?: string;
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CHEQUE' | 'ONLINE' | 'POS';
    referenceNo?: string;
    receivedDate: string;
    notes?: string;
    purpose?: string;
    status: 'DRAFT' | 'POSTED' | 'CANCELLED';
    financialAccountId?: string;
    student?: {
        id: string;
        studentNumber: string;
        firstNameEn: string;
        lastNameEn: string;
        firstNameAr: string;
        lastNameAr: string;
    };
    financialAccount?: {
        id: string;
        code: string;
        name: string;
        nameAr: string;
    };
    journalEntry?: {
        id: string;
        entryNumber: string;
    };
}

export interface CreateReceiptData {
    studentId: string;
    amount: number;
    paymentMethod: string;
    amountInWords?: string;
    financialAccountId?: string;
    referenceNo?: string;
    receivedDate?: string;
    notes?: string;
    purpose?: string;
}

export interface ReceiptQueryParams {
    status?: string;
    startDate?: string;
    endDate?: string;
    studentId?: string;
    search?: string;
    page?: number;
    limit?: number;
}

class ReceiptService {
    private readonly BASE_PATH = '/accounting/receipts';

    async getReceipts(params?: ReceiptQueryParams) {
        const response = await apiClient.get(this.BASE_PATH, { params });
        return response.data;
    }

    async getReceiptById(id: string): Promise<Receipt> {
        const response = await apiClient.get(`${this.BASE_PATH}/${id}`);
        return response.data.data;
    }

    async createReceipt(data: CreateReceiptData): Promise<Receipt> {
        const response = await apiClient.post(this.BASE_PATH, data);
        return response.data.data;
    }

    async updateReceipt(id: string, data: Partial<CreateReceiptData>): Promise<Receipt> {
        const response = await apiClient.put(`${this.BASE_PATH}/${id}`, data);
        return response.data.data;
    }

    async postReceipt(id: string): Promise<Receipt> {
        const response = await apiClient.put(`${this.BASE_PATH}/${id}/post`);
        return response.data.data;
    }

    async deleteReceipt(id: string): Promise<void> {
        await apiClient.delete(`${this.BASE_PATH}/${id}`);
    }
}

export default new ReceiptService();
