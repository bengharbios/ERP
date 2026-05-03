import { apiClient, ApiResponse } from './api';

// ============================================
// PROGRAM LEVELS
// ============================================

export interface ProgramLevel {
    id: string;
    nameAr: string;
    nameEn: string;
    order: number;
    isActive: boolean;
    _count?: {
        programs: number;
    };
}

export interface CreateProgramLevelRequest {
    nameAr: string;
    nameEn: string;
    order?: number;
    isActive?: boolean;
}

// ============================================
// AWARDING BODIES
// ============================================

export interface AwardingBody {
    id: string;
    code?: string;
    nameAr: string;
    nameEn: string;
    description?: string;
    website?: string;
    isActive: boolean;
    _count?: {
        programs: number;
    };
}

export interface CreateAwardingBodyRequest {
    code?: string;
    nameAr: string;
    nameEn: string;
    description?: string;
    website?: string;
    isActive?: boolean;
}

// ============================================
// SERVICES
// ============================================

export const settingsService = {
    // Program Levels
    async getProgramLevels(isActive?: boolean): Promise<ApiResponse<{ levels: ProgramLevel[]; total: number }>> {
        const params = isActive !== undefined ? { isActive: isActive.toString() } : {};
        return apiClient.get('/academic/levels', params);
    },

    async createProgramLevel(data: CreateProgramLevelRequest): Promise<ApiResponse<{ level: ProgramLevel }>> {
        return apiClient.post('/academic/levels', data);
    },

    async updateProgramLevel(id: string, data: Partial<CreateProgramLevelRequest>): Promise<ApiResponse<{ level: ProgramLevel }>> {
        return apiClient.put(`/academic/levels/${id}`, data);
    },

    async deleteProgramLevel(id: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`/academic/levels/${id}`);
    },

    // Awarding Bodies
    async getAwardingBodies(isActive?: boolean): Promise<ApiResponse<{ bodies: AwardingBody[]; total: number }>> {
        const params = isActive !== undefined ? { isActive: isActive.toString() } : {};
        return apiClient.get('/academic/awarding-bodies', params);
    },

    async createAwardingBody(data: CreateAwardingBodyRequest): Promise<ApiResponse<{ body: AwardingBody }>> {
        return apiClient.post('/academic/awarding-bodies', data);
    },

    async updateAwardingBody(id: string, data: Partial<CreateAwardingBodyRequest>): Promise<ApiResponse<{ body: AwardingBody }>> {
        return apiClient.put(`/academic/awarding-bodies/${id}`, data);
    },

    async deleteAwardingBody(id: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`/academic/awarding-bodies/${id}`);
    },

    // ============================================
    // SYSTEM SETTINGS
    // ============================================

    async getSystemSettings(): Promise<ApiResponse<{ settings: SystemSettings }>> {
        return apiClient.get('/settings');
    },

    async updateSystemSettings(data: UpdateSystemSettingsRequest): Promise<ApiResponse<{ settings: SystemSettings }>> {
        return apiClient.put('/settings', data);
    },

    async getNetworkInfo(): Promise<ApiResponse<{ ips: string[]; port: number }>> {
        return apiClient.get('/settings/network');
    },

    // Aliases for compatibility
    async getSettings(): Promise<ApiResponse<{ settings: SystemSettings }>> {
        return this.getSystemSettings();
    },

    async updateSettings(data: UpdateSystemSettingsRequest): Promise<ApiResponse<{ settings: SystemSettings }>> {
        return this.updateSystemSettings(data);
    },
};

// ============================================
// SYSTEM SETTINGS INTERFACES
// ============================================

export interface SystemSettings {
    id: string;

    // Institute Info
    instituteName: string;
    instituteNameAr: string;
    instituteNameEn: string;
    instituteLogo?: string;
    instituteEmail?: string;
    institutePhone?: string;
    instituteAddress?: string;
    instituteWebsite?: string;

    // UAE Financial Info
    trn?: string;
    bankName?: string;
    bankAccountName?: string;
    bankIban?: string;
    bankSwift?: string;
    bankCurrency?: string;

    // Awarding Bodies (JSON)
    awardingBodies: AwardingBodyConfig[];

    // Academic Settings
    defaultAcademicYear?: string;
    gradePassingPercentage: number;
    attendanceThreshold: number;

    // System Settings
    defaultLanguage: string;
    timezone: string;
    country: string;
    dateFormat: string;
    currency: string;

    // Registration Settings
    studentNumberPrefix: string;
    studentNumberLength: number;
    autoGenerateStudentNumber: boolean;

    // Financial Settings
    lateFeeAmount: number;
    lateFeeGraceDays: number;
    fullPaymentDiscountPercentage: number;
    fullPaymentDiscountAmount: number;
    taxEnabled: boolean;
    taxRate: number;

    // Advanced Financial Routing
    defaultIncomeAccountId?: string;
    defaultSalesDiscountAccountId?: string;
    defaultPayrollExpenseAccountId?: string;
    defaultPayrollPayableAccountId?: string;
    defaultSupplierPayableAccountId?: string;
    defaultVatAccountId?: string;
    defaultCashAccountId?: string;
    defaultBankAccountId?: string;
    defaultStudentReceivableAccountId?: string;

    // Email/SMS Settings
    emailEnabled: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;

    smsEnabled: boolean;
    smsProvider?: string;
    smsApiKey?: string;

    // External AI Settings
    externalAiEnabled: boolean;
    externalAiProvider?: string;
    externalAiApiKey?: string;

    // HR Settings
    hrWorkingDays?: string[] | string;
    hrWorkStartTime?: string;
    hrWorkEndTime?: string;
    hrLateGracePeriod?: number;
    hrAbsenceThreshold?: number;
    hrLateHourDeduction?: number;
    hrShiftEnabled?: boolean;
    activeTemplate: string;
    announcementTicker?: string;

    createdAt: string;
    updatedAt: string;
}

export interface AwardingBodyConfig {
    id: string;
    name: string;
    nameAr: string;
    nameEn: string;
    code: string;
    isActive: boolean;
    registrationPrefix: string;
}

export interface UpdateSystemSettingsRequest {
    instituteName?: string;
    instituteNameAr?: string;
    instituteNameEn?: string;
    instituteLogo?: string;
    instituteEmail?: string;
    institutePhone?: string;
    instituteAddress?: string;
    instituteWebsite?: string;

    trn?: string;
    bankName?: string;
    bankAccountName?: string;
    bankIban?: string;
    bankSwift?: string;
    bankCurrency?: string;

    awardingBodies?: AwardingBodyConfig[];

    defaultAcademicYear?: string;
    gradePassingPercentage?: number;
    attendanceThreshold?: number;

    defaultLanguage?: string;
    timezone?: string;
    country?: string;
    dateFormat?: string;
    currency?: string;

    studentNumberPrefix?: string;
    studentNumberLength?: number;
    autoGenerateStudentNumber?: boolean;

    // Financial Settings
    lateFeeAmount?: number;
    lateFeeGraceDays?: number;
    fullPaymentDiscountPercentage?: number;
    fullPaymentDiscountAmount?: number;
    taxEnabled?: boolean;
    taxRate?: number;

    // Advanced Financial Routing
    defaultIncomeAccountId?: string;
    defaultSalesDiscountAccountId?: string;
    defaultPayrollExpenseAccountId?: string;
    defaultPayrollPayableAccountId?: string;
    defaultSupplierPayableAccountId?: string;
    defaultVatAccountId?: string;
    defaultCashAccountId?: string;
    defaultBankAccountId?: string;
    defaultStudentReceivableAccountId?: string;

    emailEnabled?: boolean;
    smtpHost?: string;
    smtpPort?: number;
    smtpUsername?: string;
    smtpPassword?: string;

    smsEnabled?: boolean;
    smsProvider?: string;
    smsApiKey?: string;

    externalAiEnabled?: boolean;
    externalAiProvider?: string;
    externalAiApiKey?: string;

    // HR Settings
    hrWorkingDays?: string[] | string;
    hrWorkStartTime?: string;
    hrWorkEndTime?: string;
    hrLateGracePeriod?: number;
    hrAbsenceThreshold?: number;
    hrLateHourDeduction?: number;
    hrShiftEnabled?: boolean;
    activeTemplate?: string;
    announcementTicker?: string;
}
