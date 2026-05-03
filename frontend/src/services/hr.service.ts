import { apiClient as api } from './api';

export interface Department {
    id: string;
    nameAr: string;
    nameEn: string;
    description?: string;
    isActive: boolean;
    _count?: {
        employees: number;
    };
}

export interface Shift {
    id: string;
    nameAr: string;
    nameEn?: string;
    startTime: string;
    endTime: string;
    type: string;
    isSplit: boolean;
    startTime2?: string;
    endTime2?: string;
    breakDuration?: number;
    totalHours?: number;
}

export interface EmployeeCommissionTier {
    id: string;
    targetNumber: number;
    targetThreshold: number;
    commissionAmount: number;
}

export interface EmployeeDocument {
    id: string;
    title: string;
    fileUrl: string;
    docType: string;
    expiryDate?: string;
}

export interface EmployeeAsset {
    id: string;
    assetName: string;
    serialNumber?: string;
    category: string;
    status: string;
    assignmentDate: string;
    returnDate?: string;
}

export interface PerformanceReview {
    id: string;
    reviewerId: string;
    reviewDate: string;
    period: string;
    rating: number;
    feedback: string;
    goals?: string;
    reviewer?: {
        firstName: string;
        lastName: string;
    };
}

export interface EmployeeTraining {
    id: string;
    courseName: string;
    provider?: string;
    completionDate?: string;
    expiryDate?: string;
    certificateUrl?: string;
    status: string;
}

export interface Employee {
    id: string;
    userId: string;
    departmentId?: string;
    employeeCode: string;
    jobTitleAr?: string;
    jobTitleEn?: string;
    hiringDate?: string;
    joiningDate?: string;
    biometricId?: string;

    // Personal & Identity
    nationality?: string;
    gender?: 'male' | 'female';
    dateOfBirth?: string;
    maritalStatus?: string;

    passportNumber?: string;
    passportExpiry?: string;
    nationalId?: string;
    idExpiry?: string;
    visaNumber?: string;
    visaExpiry?: string;
    laborCardNumber?: string;
    laborCardExpiry?: string;

    // Bank Details
    bankName?: string;
    iban?: string;
    swiftCode?: string;

    // Emergency Contact
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    emergencyContactRelation?: string;

    // Contract Details
    probationPeriod?: number;
    noticePeriod?: number;

    // Salary Config
    salaryType: 'FIXED' | 'SALARY_COMMISSION' | 'COMMISSION_ONLY' | 'HOURLY';
    salary: number;
    housingAllowance: number;
    transportAllowance: number;
    otherAllowances: number;
    totalDeductions: number;

    // Commission/Target Config
    targetType?: 'TRANSACTIONS' | 'AMOUNT';
    targetValue?: number;
    commissionRate?: number;
    isCommissionPercentage: boolean;
    commissionLogic?: 'POSITIVE' | 'NEGATIVE';
    minimumSalaryFloor?: number;

    // Hourly Config
    hourlyRate?: number;
    hourlyUnit?: number;

    status: 'active' | 'on_leave' | 'terminated' | 'resigned' | 'deceased' | 'suspended' | 'inactive';
    statusChangeDate?: string;
    lastWorkingDate?: string;
    contractType?: 'full_time' | 'part_time' | 'contractor';
    shiftId?: string;
    shift?: Shift;
    personalEmail?: string;
    currency: string;

    user?: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
        profilePicture?: string;
    };
    department?: Department;
    commissionTiers?: EmployeeCommissionTier[];
    documents?: EmployeeDocument[];
    assets?: EmployeeAsset[];
    performances?: PerformanceReview[];
    trainings?: EmployeeTraining[];
}

export interface StaffAttendance {
    id: string;
    employeeId: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    firstCheckIn?: string;
    lastCheckOut?: string;
    totalBreakMinutes?: number;
    totalWorkMinutes?: number;
    targetWorkHours?: number;
    targetBreakMinutes?: number;
    status: 'present' | 'absent' | 'late' | 'half_day';
    lateMinutes?: number;
    notes?: string;
    employee?: Employee;
}

export interface LeaveRequest {
    id: string;
    employeeId: string;
    type: 'annual' | 'sick' | 'unpaid' | 'emergency';
    startDate: string;
    endDate: string;
    reason?: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    actionDate?: string;
    comment?: string;
    employee?: Employee;
}

export interface Payroll {
    id: string;
    employeeId: string;
    month: number;
    year: number;
    basicSalary: number;
    housingAllowance: number;
    transportAllowance: number;
    otherAllowances: number;
    deductions: number;
    commission: number;
    netSalary: number;
    achievedTarget?: number;
    hoursWorked?: number;
    paymentDate?: string;
    status: 'draft' | 'processed' | 'paid';
    notes?: string;
    employee?: Employee;
}

export const hrService = {
    // Departments
    getDepartments: async () => {
        return api.get('/hr/departments');
    },
    createDepartment: async (data: any) => {
        return api.post('/hr/departments', data);
    },

    // Employees
    getEmployees: async (params?: any) => {
        return api.get('/hr/employees', params);
    },
    getEmployeeById: async (id: string) => {
        return api.get(`/hr/employees/${id}`);
    },
    createEmployee: async (data: any) => {
        return api.post('/hr/employees', data);
    },
    updateEmployee: async (id: string, data: any) => {
        return api.put(`/hr/employees/${id}`, data);
    },

    // Attendance
    getAttendance: async (params?: any) => {
        return api.get('/hr/attendance', params);
    },
    markAttendance: async (data: any) => {
        return api.post('/hr/attendance', data);
    },
    syncBiometric: async () => {
        return api.post('/hr/biometric/sync-all');
    },

    // Leaves
    getLeaves: async (params?: any) => {
        return api.get('/hr/leaves', params);
    },
    createLeave: async (data: any) => {
        return api.post('/hr/leaves', data);
    },
    updateLeaveStatus: async (id: string, status: string, comment?: string) => {
        return api.patch(`/hr/leaves/${id}/status`, { status, comment });
    },

    // Payroll
    getPayroll: async (params?: any) => {
        return api.get('/hr/payroll', params);
    },
    processPayroll: async (data: any) => {
        return api.post('/hr/payroll', data);
    }
};
