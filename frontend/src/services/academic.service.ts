import { apiClient, ApiResponse } from './api';

// Programs
export interface Program {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    description?: string;
    level?: string;
    durationMonths: number;
    totalUnits?: number;
    isActive: boolean;
    programUnits?: any[];
    classes?: any[];
    _count?: {
        classes: number;
    };
}

export interface CreateProgramRequest {
    code: string;
    nameAr: string;
    nameEn: string;
    description?: string;
    level?: 'diploma' | 'bachelor' | 'master';
    durationMonths: number;
    totalUnits?: number;
    unitIds?: string[];
}

// Units
export interface Unit {
    id: string;
    code: string;
    nameAr: string;
    nameEn: string;
    description?: string;
    creditHours?: number;
    totalLectures: number;
    learningOutcomes: string[];
    isActive: boolean;
    programUnits?: Array<{
        program: {
            id: string;
            code: string;
            nameEn: string;
            nameAr: string;
        };
    }>;
    _count?: {
        programUnits: number;
        lectures: number;
        assignments: number;
    };
}

export interface CreateUnitRequest {
    code: string;
    nameAr: string;
    nameEn: string;
    description?: string;
    creditHours?: number;
    totalLectures: number;
    learningOutcomes?: string[];
    programIds?: string[]; // Programs this unit belongs to
}

// Classes
export interface Class {
    id: string;
    code: string;
    name: string;
    programId: string;
    startDate: string; // API returns string
    durationMonths: number;
    expectedEndDate?: string;
    studyDays: string[];
    lectureStartTime?: string | Date; // Might be needed if we transform it
    lectureEndTime?: string | Date;
    defaultRoom?: string; // Legacy?
    maxStudents?: number;
    status: string;

    // New Fields
    studyMode: 'IN_PERSON' | 'ONLINE' | 'SELF_PACED';
    studyLanguage: string;
    classroom?: string;
    building?: string;
    defaultZoomLink?: string;

    program?: Partial<Program>;
    lectures?: any[];
    _count?: {
        lectures: number;
        studentEnrollments: number;
    };
}

export interface CreateClassRequest {
    code: string;
    name: string;
    programId: string;
    startDate: string; // YYYY-MM-DD
    durationMonths: number;
    studyDays: string[];
    lectureStartTime: string; // HH:MM
    lectureEndTime: string; // HH:MM
    defaultRoom?: string; // Use classroom/building
    maxStudents?: number;

    // New Fields
    studyMode: 'IN_PERSON' | 'ONLINE' | 'SELF_PACED';
    studyLanguage: string;
    classroom?: string;
    building?: string;
    defaultZoomLink?: string;

    // Unit Selection (Optional)
    unitIds?: string[];
    unitSelections?: Array<{ unitId: string; totalLectures: number }>;
    unitInstructors?: Array<{ unitId: string; instructorId: string }>;
}

export const academicService = {
    // Programs
    async getPrograms(isActive?: boolean): Promise<ApiResponse<{ programs: Program[]; total: number }>> {
        return apiClient.get('/academic/programs', isActive !== undefined ? { isActive } : undefined);
    },

    async getProgramById(id: string): Promise<ApiResponse<{ program: Program }>> {
        return apiClient.get(`/academic/programs/${id}`);
    },

    async createProgram(data: CreateProgramRequest): Promise<ApiResponse<{ program: Program }>> {
        return apiClient.post('/academic/programs', data);
    },

    async updateProgram(id: string, data: Partial<CreateProgramRequest>): Promise<ApiResponse<{ program: Program }>> {
        return apiClient.put(`/academic/programs/${id}`, data);
    },

    async deleteProgram(id: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`/academic/programs/${id}`);
    },

    // Units
    async getUnits(isActive?: boolean): Promise<ApiResponse<{ units: Unit[]; total: number }>> {
        return apiClient.get('/academic/units', isActive !== undefined ? { isActive } : undefined);
    },

    async getUnitById(id: string): Promise<ApiResponse<{ unit: Unit }>> {
        return apiClient.get(`/academic/units/${id}`);
    },

    async createUnit(data: CreateUnitRequest): Promise<ApiResponse<{ unit: Unit }>> {
        return apiClient.post('/academic/units', data);
    },

    async updateUnit(id: string, data: Partial<CreateUnitRequest>): Promise<ApiResponse<{ unit: Unit }>> {
        return apiClient.put(`/academic/units/${id}`, data);
    },

    async deleteUnit(id: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`/academic/units/${id}`);
    },

    // Classes
    async getClasses(status?: string, programId?: string): Promise<ApiResponse<{ classes: Class[]; total: number }>> {
        const params: any = {};
        if (status) params.status = status;
        if (programId) params.programId = programId;
        return apiClient.get('/academic/classes', params);
    },

    async getClassById(id: string): Promise<ApiResponse<{ class: Class }>> {
        return apiClient.get(`/academic/classes/${id}`);
    },

    async createClass(data: CreateClassRequest): Promise<ApiResponse<{ class: Class; message: string }>> {
        return apiClient.post('/academic/classes', data);
    },

    async updateClass(id: string, data: Partial<CreateClassRequest>): Promise<ApiResponse<{ class: Class }>> {
        return apiClient.put(`/academic/classes/${id}`, data);
    },

    async getUnitSuggestions(classId: string): Promise<ApiResponse<{ suggestions: any[] }>> {
        return apiClient.get(`/academic/classes/${classId}/suggestions`);
    },

    async handleInterruption(classId: string, data: { date: string; mode: 'SHIFT_POSTPONE' | 'CANCEL_SKIP'; reason?: string }): Promise<ApiResponse<any>> {
        return apiClient.post(`/academic/classes/${classId}/interruption`, data);
    },

    async transferStudent(data: { studentId: string; sourceClassId: string; targetClassId: string }): Promise<ApiResponse<any>> {
        return apiClient.post('/academic/classes/transfer', data);
    },

    async getClassStudents(classId: string): Promise<ApiResponse<{ students: any[] }>> {
        return apiClient.get(`/academic/classes/${classId}/students`);
    },

    async syncClassProgress(classId: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.post(`/academic/classes/${classId}/sync-progress`);
    },

    // Units - Students
    async getUnitStudents(unitId: string): Promise<ApiResponse<{ enrollments: any[]; total: number }>> {
        return apiClient.get(`/academic/units/${unitId}/students`);
    },

    // AI Assessor
    async analyzeAssignment(data: { assignment: string; rubric: string; options: any; apiKey?: string }): Promise<ApiResponse<{ report: any }>> {
        return apiClient.post('/academic/ai/analyze', data);
    }
};
