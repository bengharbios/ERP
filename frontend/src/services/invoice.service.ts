import { apiClient } from './api';

export interface InvoiceItem {
    id: string;
    description: string;
    quantity: number;
    unitPrice: number;
    taxableAmount: number;
    vatAmount: number;
    totalAmount: number;
}

export interface Invoice {
    id: string;
    invoiceNumber: string;
    studentId: string | null;
    date: string;
    dueDate: string | null;
    subtotal: number;
    vatAmount: number;
    totalAmount: number;
    status: 'DRAFT' | 'ISSUED' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED' | 'OVERDUE';
    trnSnapshot: string | null;
    vatRateSnapshot: number | null;
    createdAt: string;
    items: InvoiceItem[];
    student?: {
        studentNumber: string;
        firstNameAr: string;
        lastNameAr: string;
        firstNameEn: string;
        lastNameEn: string;
    };
}

export interface CreateInvoiceData {
    studentId?: string;
    dueDate?: string;
    items: {
        description: string;
        quantity: number;
        unitPrice: number;
    }[];
}

class InvoiceService {
    private readonly BASE_PATH = '/accounting/invoices';

    /**
     * Get all invoices
     */
    async getAllInvoices(): Promise<Invoice[]> {
        const response = await apiClient.get(this.BASE_PATH);
        return response.data;
    }

    /**
     * Get invoice by ID
     */
    async getInvoiceById(id: string): Promise<Invoice> {
        const response = await apiClient.get(`${this.BASE_PATH}/${id}`);
        return response.data;
    }

    /**
     * Create new invoice
     */
    async createInvoice(data: CreateInvoiceData): Promise<Invoice> {
        const response = await apiClient.post(this.BASE_PATH, data);
        return response.data;
    }

    /**
     * Update invoice status
     */
    async updateStatus(id: string, status: string): Promise<Invoice> {
        const response = await apiClient.put(`${this.BASE_PATH}/${id}/status`, { status });
        return response.data;
    }

    /**
     * Alias for updateStatus
     */
    async updateInvoiceStatus(id: string, status: string): Promise<Invoice> {
        return this.updateStatus(id, status);
    }
}

export default new InvoiceService();
