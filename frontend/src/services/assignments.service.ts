import { apiClient, ApiResponse } from './api';

// Assignment Types
export interface Assignment {
    id: string;
    unitId: string;
    title: string;
    description?: string;
    instructions?: string;
    submissionDeadline: string; // ISO Date String from JSON
    totalMarks?: number;
    passCriteria?: string;
    meritCriteria?: string;
    distinctionCriteria?: string;
    learningOutcomes?: string[];
    attachments?: string[];
    status: 'draft' | 'published' | 'closed';
    unit?: {
        id: string;
        nameAr: string;
        nameEn: string;
        code: string;
    };
    _count?: {
        studentAssignments: number;
    };
    submissions?: number; // Optional alias if we map it manually
}

export interface CreateAssignmentRequest {
    unitId: string;
    title: string;
    description?: string;
    instructions?: string;
    dueDate: string; // YYYY-MM-DD
    maxScore?: number;
    passCriteria?: string;
    meritCriteria?: string;
    distinctionCriteria?: string;
    learningOutcomes?: string[];
    attachments?: string[];
}

// Submission Types
export interface Submission {
    id: string;
    assignmentId: string;
    studentEnrollmentId: string;
    content?: string;
    attachments?: string[];
    remarks?: string;
    submittedAt: Date;
    status: string;
    grade?: 'pass' | 'merit' | 'distinction' | 'refer' | 'not_graded';
    score?: number;
    feedback?: string;
    gradedAt?: Date;
    assignment?: any;
    studentEnrollment?: any;
}

export interface CreateSubmissionRequest {
    assignmentId: string;
    studentEnrollmentId: string;
    content?: string;
    attachments?: string[];
    remarks?: string;
}

export interface GradeSubmissionRequest {
    grade: 'pass' | 'merit' | 'distinction' | 'refer' | 'not_graded';
    score?: number;
    feedback?: string;
    gradedAt?: string;
}

export interface AssignmentStatistics {
    totalSubmissions: number;
    graded: number;
    notGraded: number;
    pass: number;
    merit: number;
    distinction: number;
    refer: number;
    onTime: number;
    late: number;
}

export const assignmentsService = {
    // Assignments
    async getAssignments(unitId?: string, classId?: string): Promise<ApiResponse<{ assignments: Assignment[]; total: number }>> {
        const params: any = {};
        if (unitId) params.unitId = unitId;
        if (classId) params.classId = classId;
        return apiClient.get('/assignments', params);
    },

    async getAssignmentById(id: string): Promise<ApiResponse<{ assignment: Assignment }>> {
        return apiClient.get(`/assignments/${id}`);
    },

    async createAssignment(data: CreateAssignmentRequest): Promise<ApiResponse<{ assignment: Assignment }>> {
        return apiClient.post('/assignments', data);
    },

    async updateAssignment(id: string, data: Partial<CreateAssignmentRequest>): Promise<ApiResponse<{ assignment: Assignment }>> {
        return apiClient.put(`/assignments/${id}`, data);
    },

    async deleteAssignment(id: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`/assignments/${id}`);
    },

    async getAssignmentStatistics(id: string): Promise<ApiResponse<{ stats: AssignmentStatistics }>> {
        return apiClient.get(`/assignments/${id}/statistics`);
    },

    // Submissions
    async createSubmission(data: CreateSubmissionRequest): Promise<ApiResponse<{ submission: Submission }>> {
        return apiClient.post('/assignments/submissions', data);
    },

    async getAssignmentSubmissions(assignmentId: string, status?: string, grade?: string): Promise<ApiResponse<{ submissions: Submission[]; total: number }>> {
        const params: any = {};
        if (status) params.status = status;
        if (grade) params.grade = grade;
        return apiClient.get(`/assignments/${assignmentId}/submissions`, params);
    },

    async getStudentSubmissions(studentId: string, classId?: string): Promise<ApiResponse<{ submissions: Submission[]; total: number }>> {
        const params: any = {};
        if (classId) params.classId = classId;
        return apiClient.get(`/assignments/students/${studentId}/submissions`, params);
    },

    async updateSubmission(id: string, data: { content?: string; attachments?: string[]; remarks?: string }): Promise<ApiResponse<{ submission: Submission }>> {
        return apiClient.put(`/assignments/submissions/${id}`, data);
    },

    async gradeSubmission(id: string, data: GradeSubmissionRequest): Promise<ApiResponse<{ submission: Submission; message: string }>> {
        return apiClient.post(`/assignments/submissions/${id}/grade`, data);
    },

    async deleteSubmission(id: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`/assignments/submissions/${id}`);
    },
};
