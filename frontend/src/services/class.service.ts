import { apiClient } from './api';

// Base path for the class service
const ACADEMIC_PATH = '/academic/classes';
const USERS_PATH = '/users/users';

export interface Class {
    id: string;
    code: string;
    name: string;
    programId: string;
    startDate: string;
    durationMonths: number;
    expectedEndDate?: string;
    actualEndDate?: string;
    studyDays: string[];
    lectureStartTime?: string;
    lectureEndTime?: string;
    maxStudents?: number;
    status: string;
    program?: {
        id: string;
        code: string;
        nameAr: string;
        nameEn: string;
        programLevel?: { nameAr: string; nameEn: string };
        awardingBody?: { nameAr: string; nameEn: string };
        programUnits?: Array<{
            unit: {
                id: string;
                code: string;
                nameAr: string;
                nameEn: string;
                creditHours?: number;
            };
        }>;
    };
    studentEnrollments?: Array<{
        id: string;
        student: {
            id: string;
            studentNumber: string;
            user: {
                firstName: string;
                lastName: string;
            };
        };
    }>;
    _count?: {
        studentEnrollments: number;
        lectures: number;
    };
    // Study Mode fields
    studyMode?: string;
    studyLanguage?: string;
    classroom?: string;
    building?: string;
    defaultZoomLink?: string;
    lectures?: Array<{
        unitId: string;
        instructorId?: string;
        instructor?: {
            id: string;
            firstName: string;
            lastName: string;
        };
    }>;
    unitSchedules?: Array<{
        id: string;
        unitId: string;
        startDate: string;
        endDate: string;
        status: string;
        unit: {
            id: string;
            code: string;
            nameAr: string;
            nameEn: string;
        };
    }>;
}

export interface CreateClassInput {
    code: string;
    name: string;
    programId: string;
    startDate: string;
    durationMonths: number;
    studyDays: string[];
    lectureStartTime?: string;
    lectureEndTime?: string;
    maxStudents?: number;
    studyMode?: string;
    studyLanguage?: string;
    classroom?: string;
    building?: string;
    defaultZoomLink?: string;
    unitIds?: string[];
    unitSelections?: Array<{ unitId: string; totalLectures: number }>;
    unitInstructors?: Array<{ unitId: string; instructorId: string }>;
    forceRegenerate?: boolean;
}

export const classService = {
    async getClasses() {
        return apiClient.get(`${ACADEMIC_PATH}`);
    },

    async getClass(id: string) {
        return apiClient.get(`${ACADEMIC_PATH}/${id}`);
    },

    async createClass(data: CreateClassInput) {
        return apiClient.post(`${ACADEMIC_PATH}`, data);
    },

    async updateClass(id: string, data: Partial<CreateClassInput>) {
        return apiClient.put(`${ACADEMIC_PATH}/${id}`, data);
    },

    async deleteClass(id: string) {
        return apiClient.delete(`${ACADEMIC_PATH}/${id}`);
    },

    async autoSchedule(classId: string) {
        return apiClient.post(`${ACADEMIC_PATH}/${classId}/schedule`);
    },

    // Student Enrollment Methods
    async getClassStudents(classId: string, status?: string) {
        const params: any = {};
        if (status) params.status = status;
        return apiClient.get(`${ACADEMIC_PATH}/${classId}/students`, params);
    },

    async enrollStudent(classId: string, studentId: string) {
        return apiClient.post(`${ACADEMIC_PATH}/${classId}/students`, { studentId });
    },

    async removeStudent(classId: string, studentId: string) {
        return apiClient.delete(`${ACADEMIC_PATH}/${classId}/students/${studentId}`);
    },

    async getInstructors() {
        return apiClient.get(`${USERS_PATH}`, { roleSearch: 'Instructor' });
    }
};
