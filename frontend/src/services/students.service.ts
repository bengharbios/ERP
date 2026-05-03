import { apiClient, ApiResponse } from './api';

// Students
export interface Student {
    id: string;
    studentNumber: string;
    firstNameEn: string;
    lastNameEn: string;
    firstNameAr: string;
    lastNameAr: string;
    dateOfBirth: Date;
    gender: string;
    nationality?: string;
    nationalId?: string;
    email?: string;
    phone?: string;
    address?: string;
    emergencyContact?: string;
    admissionDate: Date;
    status: string;
    profilePicture?: string;
    enrollments?: any[];
    parents?: any[];
    _count?: {
        enrollments: number;
        attendanceRecords: number;
        parents: number;
    };
}

export interface CreateStudentRequest {
    studentNumber: string;
    firstNameEn: string;
    lastNameEn: string;
    firstNameAr: string;
    lastNameAr: string;
    dateOfBirth: string; // YYYY-MM-DD
    gender: 'male' | 'female';
    nationality?: string;
    nationalId?: string;
    email?: string;
    phone?: string;
    address?: string;
    emergencyContact?: string;
    admissionDate: string;
    status?: 'active' | 'suspended' | 'graduated' | 'withdrawn';
    profilePicture?: string;
}

// Enrollment
export interface Enrollment {
    id: string;
    studentId: string;
    classId: string;
    enrollmentDate: Date;
    status: string;
    completionDate?: Date;
    grade?: string;
    remarks?: string;
    student?: Partial<Student>;
    class?: any;
}

export interface EnrollStudentRequest {
    studentId: string;
    classId: string;
    enrollmentDate: string;
    status?: 'enrolled' | 'completed' | 'dropped';
}

// Parent/Guardian
export interface Parent {
    id: string;
    studentId: string;
    nameEn: string;
    nameAr: string;
    relationship: string;
    phone: string;
    email?: string;
    nationalId?: string;
    occupation?: string;
    address?: string;
}

export interface AddParentRequest {
    studentId: string;
    nameEn: string;
    nameAr: string;
    relationship: 'father' | 'mother' | 'guardian' | 'other';
    phone: string;
    email?: string;
    nationalId?: string;
    occupation?: string;
    address?: string;
}

export const studentsService = {
    // Students
    async getStudents(status?: string, search?: string, classId?: string): Promise<ApiResponse<{ students: Student[]; total: number }>> {
        const params: any = {};
        if (status) params.status = status;
        if (search) params.search = search;
        if (classId) params.classId = classId;
        return apiClient.get('/students/students', params);
    },

    async getStudentById(id: string): Promise<ApiResponse<{ student: Student }>> {
        return apiClient.get(`/students/students/${id}`);
    },

    async createStudent(data: CreateStudentRequest): Promise<ApiResponse<{ student: Student }>> {
        return apiClient.post('/students/students', data);
    },

    async updateStudent(id: string, data: Partial<CreateStudentRequest>): Promise<ApiResponse<{ student: Student }>> {
        return apiClient.put(`/students/students/${id}`, data);
    },

    async deleteStudent(id: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`/students/students/${id}`);
    },

    // Enrollment
    async enrollStudent(data: EnrollStudentRequest): Promise<ApiResponse<{ enrollment: Enrollment; message: string }>> {
        return apiClient.post('/students/enrollments', data);
    },

    async getStudentEnrollments(studentId: string): Promise<ApiResponse<{ enrollments: Enrollment[]; total: number }>> {
        return apiClient.get(`/students/students/${studentId}/enrollments`);
    },

    async getClassEnrollments(classId: string, status?: string): Promise<ApiResponse<{ enrollments: Enrollment[]; total: number }>> {
        const params: any = {};
        if (status) params.status = status;
        return apiClient.get(`/students/classes/${classId}/enrollments`, params);
    },

    async dropEnrollment(id: string): Promise<ApiResponse<{ enrollment: Enrollment; message: string }>> {
        return apiClient.post(`/students/enrollments/${id}/drop`, {});
    },

    // Parents
    async getStudentParents(studentId: string): Promise<ApiResponse<{ parents: Parent[]; total: number }>> {
        return apiClient.get(`/students/students/${studentId}/parents`);
    },

    async addParent(data: AddParentRequest): Promise<ApiResponse<{ parent: Parent }>> {
        return apiClient.post('/students/parents', data);
    },

    async updateParent(id: string, data: Partial<AddParentRequest>): Promise<ApiResponse<{ parent: Parent }>> {
        return apiClient.put(`/students/parents/${id}`, data);
    },

    async deleteParent(id: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`/students/parents/${id}`);
    },
};
