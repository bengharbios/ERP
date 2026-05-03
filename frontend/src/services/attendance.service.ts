import { apiClient } from './api';



export interface AttendanceRecord {
    id: string;
    lectureId: string;
    studentId: string;
    status: 'present' | 'absent' | 'late' | 'excused';
    checkInTime?: string;
    notes?: string;
    lecture?: {
        id: string;
        scheduledDate: string;
        unit?: {
            nameEn: string;
            nameAr: string;
        };
    };
    student?: {
        studentNumber: string;
        firstNameAr?: string;
        lastNameAr?: string;
        firstNameEn?: string;
        lastNameEn?: string;
    };
}

export interface AttendanceStats {
    total: number;
    present: number;
    absent: number;
    late: number;
    excused: number;
    attendanceRate: string;
}

export interface DeepAttendanceReport {
    student: {
        id: string;
        studentNumber: string;
        firstNameEn: string;
        lastNameEn: string;
        firstNameAr: string;
        lastNameAr: string;
    };
    summary: {
        totalPossibleLectures: number;
        totalAttended: number; // present + late
        overallAttendanceRate: string;
    };
    programReports: Array<{
        programId: string;
        programNameEn: string;
        programNameAr: string;
        durationMonths: number;
        totalPossible: number;
        attended: number;
        rate: string;
        unitReports: Array<{
            unitId: string;
            unitNameEn: string;
            unitNameAr: string;
            totalPossible: number;
            attended: number;
            rate: string;
            monthlyStats: Array<{
                month: string; // YYYY-MM
                possible: number;
                attended: number;
                rate: string;
            }>;
            attendanceDetails: AttendanceRecord[];
        }>;
    }>;
}

export interface AttendanceInput {
    lectureId: string;
    records: {
        studentId: string;
        status: 'present' | 'absent' | 'late' | 'excused';
        notes?: string;
    }[];
}

export const attendanceService = {
    async getAttendanceByLecture(lectureId: string) {
        return apiClient.get(`/attendance/lecture/${lectureId}`);
    },

    async getAttendanceByStudent(studentId: string) {
        return apiClient.get(`/attendance/student/${studentId}`);
    },

    async getDeepStudentReport(studentId: string, params?: { programId?: string; unitId?: string; month?: string; year?: string; classId?: string }) {
        return apiClient.get(`/attendance/student/${studentId}/deep-report`, params);
    },

    async recordAttendance(data: any) {
        return apiClient.post(`/attendance/record`, data);
    },

    async bulkRecordAttendance(lectureId: string, records: any[]) {
        return apiClient.post(`/attendance/bulk-record`, { lectureId, records });
    },

    async getAttendanceStats(classId?: string, startDate?: string, endDate?: string) {
        return apiClient.get(`/attendance/stats`, { classId, startDate, endDate });
    },

    async getClassSummary(classId: string) {
        return apiClient.get(`/attendance/class/${classId}/summary`);
    },
};
