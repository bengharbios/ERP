import { apiClient, ApiResponse } from './api';

// ============================================
// TYPE DEFINITIONS
// ============================================

export enum FeeType {
    TUITION = 'TUITION',
    REGISTRATION = 'REGISTRATION',
    FIRST_PAYMENT = 'FIRST_PAYMENT',
    CERTIFICATE = 'CERTIFICATE',
    SHIPPING = 'SHIPPING',
    SERVICE = 'SERVICE',
    CUSTOM = 'CUSTOM',
    OTHER = 'OTHER'
}

export enum DiscountType {
    PERCENTAGE = 'PERCENTAGE',
    FIXED_AMOUNT = 'FIXED_AMOUNT',
    SCHOLARSHIP = 'SCHOLARSHIP'
}

export enum PaymentStatus {
    PENDING = 'PENDING',
    IN_PAYMENT = 'IN_PAYMENT',
    PARTIAL = 'PARTIAL',
    PAID = 'PAID',
    OVERDUE = 'OVERDUE',
    CANCELLED = 'CANCELLED'
}

// Fee Template
export interface FeeTemplate {
    id: string;
    name: string;
    nameAr: string;
    programId?: string;
    description?: string;
    currency: string;
    totalAmount: number;
    tuitionAmount: number;
    isActive: boolean;
    isDefault: boolean;
    incomeAccountId?: string;
    createdAt: Date;
    updatedAt: Date;
    feeItems?: FeeItem[];
}

export interface CreateFeeTemplateRequest {
    name: string;
    nameAr: string;
    programId?: string;
    description?: string;
    currency?: string;
    totalAmount: number;
    tuitionAmount: number;
    isDefault?: boolean;
    incomeAccountId?: string;
    feeItems?: CreateFeeItemRequest[];
}

// Fee Item
export interface FeeItem {
    id: string;
    templateId: string;
    name: string;
    nameAr: string;
    type: FeeType;
    amount: number;
    isIncludedInTuition: boolean;
    isOptional: boolean;
    isTaxable: boolean;
    description?: string;
    displayOrder: number;
    incomeAccountId?: string;
}

export interface CreateFeeItemRequest {
    name: string;
    nameAr: string;
    type: FeeType;
    amount: number;
    isIncludedInTuition?: boolean;
    isOptional?: boolean;
    isTaxable?: boolean;
    description?: string;
    displayOrder?: number;
    incomeAccountId?: string;
}

// Student Fee Calculation
export interface StudentFeeCalculation {
    id: string;
    studentId: string;
    templateId?: string;
    programId?: string;
    calculationNumber: string;
    title: string;
    subtotal: number;
    discountAmount: number;
    scholarshipAmount: number;
    taxAmount: number;
    totalAmount: number;
    paidAmount: number;
    balance: number;
    currency: string;
    status: PaymentStatus;
    issueDate: Date;
    dueDate?: Date;
    notes?: string;
    internalNotes?: string;
    createdBy?: string;
    createdAt: Date;
    updatedAt: Date;
    feeItems?: FeeCalculationItem[];
    discounts?: FeeCalculationDiscount[];
    installmentPlans?: InstallmentPlan[];
    student?: any;
    template?: FeeTemplate;
}

export interface CreateStudentFeeCalculationRequest {
    studentId: string;
    templateId?: string;
    programId?: string;
    title: string;
    currency?: string;
    dueDate?: string;
    notes?: string;
    feeItems: CreateFeeCalculationItemRequest[];
    discounts?: CreateFeeCalculationDiscountRequest[];
}

// Fee Calculation Item
export interface FeeCalculationItem {
    id: string;
    calculationId: string;
    feeItemId?: string;
    name: string;
    nameAr: string;
    type: FeeType;
    amount: number;
    isIncludedInTuition: boolean;
    displayOrder: number;
    incomeAccountId?: string;
}

export interface CreateFeeCalculationItemRequest {
    feeItemId?: string;
    name: string;
    nameAr: string;
    type: FeeType;
    amount: number;
    isIncludedInTuition?: boolean;
    displayOrder?: number;
    incomeAccountId?: string;
}

// Fee Calculation Discount
export interface FeeCalculationDiscount {
    id: string;
    calculationId: string;
    name: string;
    nameAr: string;
    type: DiscountType;
    percentage?: number;
    fixedAmount?: number;
    calculatedAmount: number;
    isScholarship: boolean;
    description?: string;
}

export interface CreateFeeCalculationDiscountRequest {
    name: string;
    nameAr: string;
    type: DiscountType;
    percentage?: number;
    fixedAmount?: number;
    isScholarship?: boolean;
    description?: string;
}

// Installment Plan
export interface InstallmentPlan {
    id: string;
    calculationId: string;
    name: string;
    nameAr: string;
    totalAmount: number;
    numberOfMonths: number;
    installmentAmount: number;
    startDate: Date;
    endDate: Date;
    dayOfMonth: number;
    isActive: boolean;
    notes?: string;
    installments?: Installment[];
}

export interface CreateInstallmentPlanRequest {
    calculationId: string;
    name: string;
    nameAr: string;
    numberOfMonths: number;
    startDate: string; // YYYY-MM-DD
    dayOfMonth?: number;
    notes?: string;
}

// Installment
export interface Installment {
    id: string;
    planId: string;
    installmentNumber: number;
    amount: number;
    dueDate: Date;
    paidAmount: number;
    balance: number;
    status: PaymentStatus;
    paidDate?: Date;
    notes?: string;
}

// Discount (Global)
export interface Discount {
    id: string;
    code: string;
    name: string;
    nameAr: string;
    type: DiscountType;
    percentage?: number;
    fixedAmount?: number;
    isScholarship: boolean;
    sponsorName?: string;
    validFrom?: Date;
    validUntil?: Date;
    maxUses?: number;
    currentUses: number;
    isActive: boolean;
    description?: string;
}

export interface CreateDiscountRequest {
    code: string;
    name: string;
    nameAr: string;
    type: DiscountType;
    percentage?: number;
    fixedAmount?: number;
    isScholarship?: boolean;
    sponsorName?: string;
    validFrom?: string;
    validUntil?: string;
    maxUses?: number;
    description?: string;
}

export interface Payment {
    id: string;
    calculationId: string;
    installmentId?: string;
    amount: number;
    lateFee: number;
    discount: number;
    method: string;
    referenceNo?: string;
    receiptNumber?: string;
    paymentDate: Date;
    recordedBy?: string;
    notes?: string;
    invoice?: any;
    reconciliationStatus: 'PENDING' | 'RECONCILED' | 'FAILED';
    createdAt: Date;
}

export interface CreatePaymentRequest {
    calculationId: string;
    installmentId?: string;
    amount: number;
    lateFee?: number;
    discount?: number;
    method: string;
    referenceNo?: string;
    receiptNumber?: string;
    paymentDate?: string;
    notes?: string;
}

// ============================================
// API SERVICE
// ============================================

// Base path for the fees service
const BASE_PATH = '/fees';

export const feesService = {
    // Fee Templates
    async getFeeTemplates(programId?: string): Promise<ApiResponse<{ templates: FeeTemplate[]; total: number }>> {
        return apiClient.get(`${BASE_PATH}/templates`, programId ? { programId } : undefined);
    },

    async getFeeTemplateById(id: string): Promise<ApiResponse<{ template: FeeTemplate }>> {
        return apiClient.get(`${BASE_PATH}/templates/${id}`);
    },

    async createFeeTemplate(data: CreateFeeTemplateRequest): Promise<ApiResponse<{ template: FeeTemplate }>> {
        return apiClient.post(`${BASE_PATH}/templates`, data);
    },

    async updateFeeTemplate(id: string, data: Partial<CreateFeeTemplateRequest>): Promise<ApiResponse<{ template: FeeTemplate }>> {
        return apiClient.put(`${BASE_PATH}/templates/${id}`, data);
    },

    async deleteFeeTemplate(id: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`${BASE_PATH}/templates/${id}`);
    },

    // Student Fee Calculations
    async getStudentFeeCalculations(studentId?: string, status?: PaymentStatus): Promise<ApiResponse<{ calculations: StudentFeeCalculation[]; total: number }>> {
        const params: any = {};
        if (studentId) params.studentId = studentId;
        if (status) params.status = status;
        return apiClient.get(`${BASE_PATH}/calculations`, params);
    },

    async getStudentFeeCalculationById(id: string): Promise<ApiResponse<{ calculation: StudentFeeCalculation }>> {
        return apiClient.get(`${BASE_PATH}/calculations/${id}`);
    },

    async createStudentFeeCalculation(data: CreateStudentFeeCalculationRequest): Promise<ApiResponse<{ calculation: StudentFeeCalculation }>> {
        return apiClient.post(`${BASE_PATH}/calculations`, data);
    },

    async updateStudentFeeCalculation(id: string, data: Partial<CreateStudentFeeCalculationRequest>): Promise<ApiResponse<{ calculation: StudentFeeCalculation }>> {
        return apiClient.put(`${BASE_PATH}/calculations/${id}`, data);
    },

    async deleteStudentFeeCalculation(id: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`${BASE_PATH}/calculations/${id}`);
    },

    // Installment Plans
    async createInstallmentPlan(data: CreateInstallmentPlanRequest): Promise<ApiResponse<{ plan: InstallmentPlan }>> {
        return apiClient.post(`${BASE_PATH}/installments`, data);
    },

    async getInstallmentPlan(id: string): Promise<ApiResponse<{ plan: InstallmentPlan }>> {
        return apiClient.get(`${BASE_PATH}/installments/${id}`);
    },

    async getInstallmentsByCalculation(calculationId: string): Promise<ApiResponse<{ plans: InstallmentPlan[] }>> {
        return apiClient.get(`${BASE_PATH}/calculations/${calculationId}/installments`);
    },

    // Discounts
    async getDiscounts(isActive?: boolean): Promise<ApiResponse<{ discounts: Discount[]; total: number }>> {
        return apiClient.get(`${BASE_PATH}/discounts`, isActive !== undefined ? { isActive } : undefined);
    },

    async createDiscount(data: CreateDiscountRequest): Promise<ApiResponse<{ discount: Discount }>> {
        return apiClient.post(`${BASE_PATH}/discounts`, data);
    },

    async updateDiscount(id: string, data: Partial<CreateDiscountRequest>): Promise<ApiResponse<{ discount: Discount }>> {
        return apiClient.put(`${BASE_PATH}/discounts/${id}`, data);
    },

    async deleteDiscount(id: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`${BASE_PATH}/discounts/${id}`);
    },

    // Payments
    async getPayments(params: any = {}): Promise<ApiResponse<{ payments: Payment[]; total: number }>> {
        return apiClient.get(`${BASE_PATH}/payments`, params);
    },

    async getPaymentById(id: string): Promise<ApiResponse<{ payment: Payment }>> {
        return apiClient.get(`${BASE_PATH}/payments/${id}`);
    },

    async createPayment(data: CreatePaymentRequest): Promise<ApiResponse<{ payment: Payment }>> {
        return apiClient.post(`${BASE_PATH}/payments`, data);
    },

    async reconcilePayment(paymentId: string, status: 'RECONCILED' | 'FAILED' = 'RECONCILED'): Promise<ApiResponse<{ payment: Payment }>> {
        return apiClient.post(`${BASE_PATH}/payments/${paymentId}/reconcile`, { status });
    },

    // Utility Functions
    calculateDiscount(subtotal: number, discountType: DiscountType, percentage?: number, fixedAmount?: number): number {
        if (discountType === DiscountType.PERCENTAGE && percentage) {
            return (subtotal * percentage) / 100;
        } else if (discountType === DiscountType.FIXED_AMOUNT && fixedAmount) {
            return Math.min(fixedAmount, subtotal);
        }
        return 0;
    },

    calculateInstallmentAmount(totalAmount: number, numberOfMonths: number): number {
        return Math.ceil((totalAmount / numberOfMonths) * 100) / 100; // Round up to 2 decimals
    },

    generateInstallmentDates(startDate: Date, numberOfMonths: number, dayOfMonth: number = 1): Date[] {
        const dates: Date[] = [];
        const current = new Date(startDate);

        for (let i = 0; i < numberOfMonths; i++) {
            const installmentDate = new Date(current);
            installmentDate.setDate(Math.min(dayOfMonth, 28)); // Max day 28 to avoid month overflow
            dates.push(new Date(installmentDate));
            current.setMonth(current.getMonth() + 1);
        }

        return dates;
    },

    formatCurrency(amount: number, currency: string = 'SAR'): string {
        const currencySymbols: { [key: string]: string } = {
            'SAR': 'ر.س',
            'AED': 'د.إ',
            'EGP': 'ج.م',
            'USD': '$',
            'EUR': '€'
        };

        const symbol = currencySymbols[currency] || currency;
        return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${symbol}`;
    }
};
