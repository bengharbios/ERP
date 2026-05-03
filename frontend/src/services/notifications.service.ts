import { apiClient, ApiResponse } from './api';

const NOTIFICATIONS_PATH = '/notifications/notifications';
const REPORTS_PATH = '/notifications/reports';

// Notification Types
export interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    metadata?: any;
    read: boolean;
    createdAt: Date;
}

export interface CreateNotificationRequest {
    userId: string;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    link?: string;
    metadata?: any;
}

// Report Types
export interface StudentProgressReport {
    student: {
        id: string;
        studentNumber: string;
        firstNameEn: string;
        lastNameEn: string;
        firstNameAr?: string;
        lastNameAr?: string;
        email?: string;
    };
    enrollments: any[];
    gradeSummary: {
        total: number;
        pass: number;
        merit: number;
        distinction: number;
        refer: number;
        notGraded: number;
    };
    attendanceSummary: {
        total: number;
        present: number;
        absent: number;
        late: number;
        excused: number;
        attendanceRate: string;
    };
    submissions: any[];
    generatedAt: Date;
}

export interface AttendanceReport {
    class: any;
    studentStats: Array<{
        student: any;
        stats: {
            total: number;
            present: number;
            absent: number;
            late: number;
            excused: number;
            attendanceRate: string;
        };
    }>;
    overallStats: {
        totalLectures: number;
        totalStudents: number;
        totalRecords: number;
        averageAttendanceRate: string;
    };
    dateRange: {
        startDate?: string;
        endDate?: string;
    };
    generatedAt: Date;
}

export interface ClassPerformanceReport {
    class: any;
    gradeDistribution: {
        pass: number;
        merit: number;
        distinction: number;
        refer: number;
        notGraded: number;
    };
    topPerformers: Array<{
        student: any;
        pass: number;
        merit: number;
        distinction: number;
        refer: number;
        total: number;
    }>;
    attendanceSummary: {
        totalRecords: number;
        present: number;
        absent: number;
        late: number;
        averageRate: string;
    };
    totalStudents: number;
    totalAssignments: number;
    generatedAt: Date;
}

export const notificationsService = {
    // Notifications
    async getNotifications(read?: boolean, type?: string, limit?: number): Promise<ApiResponse<{ notifications: Notification[]; unreadCount: number; total: number }>> {
        const params: any = {};
        if (read !== undefined) params.read = read;
        if (type) params.type = type;
        if (limit) params.limit = limit;
        return apiClient.get(`${NOTIFICATIONS_PATH}`, params);
    },

    async createNotification(data: CreateNotificationRequest): Promise<ApiResponse<{ notification: Notification }>> {
        return apiClient.post(`${NOTIFICATIONS_PATH}`, data);
    },

    async markAsRead(id: string): Promise<ApiResponse<{ notification: Notification }>> {
        return apiClient.put(`${NOTIFICATIONS_PATH}/${id}/read`, {});
    },

    async markAllAsRead(): Promise<ApiResponse<{ message: string }>> {
        return apiClient.put(`${NOTIFICATIONS_PATH}/read-all`, {});
    },

    async deleteNotification(id: string): Promise<ApiResponse<{ message: string }>> {
        return apiClient.delete(`${NOTIFICATIONS_PATH}/${id}`);
    },

    // Reports
    async getStudentProgressReport(studentId: string, classId?: string): Promise<ApiResponse<StudentProgressReport>> {
        const params: any = { studentId };
        if (classId) params.classId = classId;
        return apiClient.get(`${REPORTS_PATH}/student-progress`, params);
    },

    async getAttendanceReport(classId: string, startDate?: string, endDate?: string): Promise<ApiResponse<AttendanceReport>> {
        const params: any = { classId };
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        return apiClient.get(`${REPORTS_PATH}/attendance`, params);
    },

    async getClassPerformanceReport(classId: string): Promise<ApiResponse<ClassPerformanceReport>> {
        const params = { classId };
        return apiClient.get(`${REPORTS_PATH}/class-performance`, params);
    },
};
