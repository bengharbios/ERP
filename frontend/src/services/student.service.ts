import { apiClient, ApiResponse } from './api';

// Base path for the student service
const BASE_PATH = '/students';

export interface Student {
    id: string;
    userId: string;
    studentNumber: string;

    // === PEARSON & ALSALAM REGISTRATION ===
    registrationNumberPearson?: string;
    enrolmentNumberAlsalam?: string;
    registrationDateAlsalam?: string;

    // === NAMES (Multiple formats) ===
    firstNameAr?: string;
    lastNameAr?: string;
    firstNameEn?: string;
    lastNameEn?: string;
    fullNameId?: string;            // Candidate Full Name (ID)
    fullNamePassport?: string;      // Candidate Full Name (Passport)
    certificateName?: string;       // Name as you want on certificate

    // === BASIC INFO ===
    dateOfBirth?: string;
    gender?: string;
    nationality?: string;

    // === IDENTITY DOCUMENTS ===
    nationalId?: string;            // ID Number
    passportNumber?: string;        // Passport Number

    // === CONTACT INFO ===
    phone?: string;                 // Mobile N. (1)
    phone2?: string;                // Mobile N. (2)
    email?: string;
    address?: string;
    city?: string;
    country?: string;

    // === EMERGENCY CONTACT ===
    emergencyContactName?: string;
    emergencyContactPhone?: string;

    // === ACADEMIC INFORMATION ===
    specialization?: string;
    certificateCourseTitle?: string;
    notificationCourseTitle?: string;
    qualificationLevel?: string;
    awardType?: 'Academic' | 'Vocational' | string;
    yearOfAward?: string;

    // === ENROLLMENT & STATUS ===
    enrollmentDate?: string;
    status: string;

    // === ONLINE LEARNING ===
    platformUsername?: string;
    platformPassword?: string;
    isTaxExempt?: boolean;

    // === METADATA ===
    createdAt?: string;
    updatedAt?: string;

    // === RELATIONS ===
    user?: {
        firstName: string;
        lastName: string;
        email?: string;
        phone?: string;
    };
    _count?: {
        enrollments: number;
        attendanceRecords: number;
    };
    enrollments?: Array<{
        id: string;
        class: {
            id: string;
            name: string;
            code: string;
            program: {
                id: string;
                code: string;
                nameAr: string;
                nameEn: string;
            };
        };
        status: string;
    }>;
    feeCalculations?: any[];
}

export interface CreateStudentInput {
    // Student Number
    studentNumber?: string;

    // === PEARSON & ALSALAM REGISTRATION ===
    registrationNumberPearson?: string;
    enrolmentNumberAlsalam?: string;
    registrationDateAlsalam?: string;

    // === NAMES ===
    username?: string; // Auto-generated for backend validation
    firstNameEn: string;
    secondNameEn?: string; // Added
    lastNameEn: string;
    firstNameAr: string;
    secondNameAr?: string; // Added
    thirdNameAr?: string;  // Added
    lastNameAr: string;
    fullNameId?: string;
    fullNamePassport?: string;
    certificateName?: string;

    // === BASIC INFO ===
    dateOfBirth: string;
    gender: string;
    nationality?: string;

    // === IDENTITY DOCUMENTS ===
    nationalId?: string;
    passportNumber?: string;
    passportExpiryDate?: string;

    // === CONTACT INFO ===
    email?: string;
    phone?: string;
    phone2?: string;
    address?: string;
    city?: string;
    country?: string;

    // === EMERGENCY CONTACT ===
    emergencyContactName?: string;
    emergencyContactPhone?: string;

    // === ACADEMIC INFO ===
    specialization?: string;
    certificateCourseTitle?: string;
    notificationCourseTitle?: string;
    qualificationLevel?: string;
    awardType?: 'Academic' | 'Vocational';
    yearOfAward?: string;

    // === ENROLLMENT & STATUS ===
    admissionDate: string;
    enrollmentDate?: string;
    status?: string;
    programId?: string; // Added
    classId?: string;   // Added

    // === ONLINE LEARNING ===
    platformUsername?: string;
    platformPassword?: string;

    // === FINANCIAL INFO (New) ===
    registrationFee?: number;
    initialPayment?: number;
    tuitionFee?: number;
    installmentCount?: number;
    firstInstallmentDate?: string;
    registrationFeeDate?: string;
    discountType?: 'percentage' | 'fixed';
    discountValue?: number;
    includeRegistrationInInstallments?: boolean;
    deductInitialPaymentFromInstallments?: boolean;
    isTaxExempt?: boolean;
}

export interface AcademicRecordUnit {
    unitId: string;
    unitCode: string;
    unitNameAr: string;
    unitNameEn: string;
    creditHours: number;
    status: 'completed' | 'exempted' | 'in_progress' | 'not_started' | 'scheduled' | 'missing';
    grade?: string | null;
    completionDate?: string | null;
    startDate?: string | null;
    isTransferCredit?: boolean;
    isCurrent?: boolean;
    className?: string | null;
    classCode?: string | null;
}

export interface AcademicRecord {
    studentId: string;
    studentName: string;
    programId: string;
    programName: string;
    programCode: string;
    currentClass?: string | null;
    academicRecord: AcademicRecordUnit[];
    statistics: {
        totalUnits: number;
        completedUnits: number;
        exemptedUnits: number;
        inProgressUnits: number;
        scheduledUnits: number;
        missingUnits: number;
        remainingUnits: number;
        progressPercentage: number;
    };
}

export interface UpdateUnitProgressRequest {
    status: 'completed' | 'exempted' | 'in_progress' | 'not_started' | 'scheduled' | 'missing';
    grade?: string;
    completionDate?: string;
}

export interface StudentFilters {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    programId?: string;
    classId?: string;
}

export const studentService = {
    async getStudents(filters?: StudentFilters): Promise<ApiResponse<{ students: Student[]; total: number }>> {
        return apiClient.get('/students', { params: filters });
    },

    async getStudent(id: string) {
        return apiClient.get(`${BASE_PATH}/${id}`);
    },

    async createStudent(data: CreateStudentInput) {
        return apiClient.post(`${BASE_PATH}`, data);
    },

    async updateStudent(id: string, data: Partial<CreateStudentInput>) {
        return apiClient.put(`${BASE_PATH}/${id}`, data);
    },

    async deleteStudent(id: string) {
        return apiClient.delete(`${BASE_PATH}/${id}`);
    },

    async enrollStudent(studentId: string, data: { classId: string; programId: string }) {
        return apiClient.post(`${BASE_PATH}/enrollments`, { ...data, studentId });
    },

    async updateStatus(studentId: string, status: string) {
        return apiClient.patch(`${BASE_PATH}/${studentId}/status`, { status });
    },

    async downloadExcel() {
        return apiClient.get(`${BASE_PATH}/export/excel`, {
            responseType: 'blob'
        });
    },

    async uploadExcel(file: File) {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.post(`${BASE_PATH}/import/excel`, formData);
    },

    async getAcademicRecord(id: string, programId?: string) {
        const timestamp = new Date().getTime();
        const url = programId
            ? `${BASE_PATH}/${id}/academic-record?programId=${programId}&t=${timestamp}`
            : `${BASE_PATH}/${id}/academic-record?t=${timestamp}`;
        return apiClient.get(url);
    },

    async updateUnitStatus(id: string, data: { unitId: string; status: string; grade?: string; notes?: string }) {
        return apiClient.put(`${BASE_PATH}/${id}/academic-record/unit`, data);
    },
};
