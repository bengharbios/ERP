import { apiClient } from './api';

// Base path for the assignment service
const ASSIGNMENTS_PATH = '/assignments/assignments';
const SUBMISSIONS_PATH = '/assignments/submissions';

export interface Assignment {
    id: string;
    unitId: string;
    title: string;
    description?: string;
    submissionDeadline: string;
    status: string;
    unit?: {
        nameAr: string;
        nameEn: string;
    };
    _count?: {
        studentAssignments: number;
    };
}

export interface CreateAssignmentInput {
    unitId: string;
    title: string;
    description?: string;
    submissionDeadline: string;
    totalMarks?: number;
    passThreshold?: number;
    meritThreshold?: number;
    distinctionThreshold?: number;
}

export const assignmentService = {
    async getAssignments() {
        return apiClient.get(`${ASSIGNMENTS_PATH}`);
    },

    async getAssignment(id: string) {
        return apiClient.get(`${ASSIGNMENTS_PATH}/${id}`);
    },

    async createAssignment(data: CreateAssignmentInput) {
        return apiClient.post(`${ASSIGNMENTS_PATH}`, data);
    },

    async updateAssignment(id: string, data: Partial<CreateAssignmentInput>) {
        return apiClient.put(`${ASSIGNMENTS_PATH}/${id}`, data);
    },

    async deleteAssignment(id: string) {
        return apiClient.delete(`${ASSIGNMENTS_PATH}/${id}`);
    },

    async getStudentSubmissions(assignmentId: string) {
        return apiClient.get(`${ASSIGNMENTS_PATH}/${assignmentId}/submissions`);
    },

    async gradeSubmission(submissionId: string, data: { marks: number; grade: string; feedback: string }) {
        return apiClient.post(`${SUBMISSIONS_PATH}/${submissionId}/grade`, data);
    },
};
