import { apiClient } from './api';


export interface Lecture {
    id: string;
    classId: string;
    unitId: string;
    instructorId?: string;
    sequenceNumber: number;
    scheduledDate: string;
    scheduledStartTime: string;
    scheduledEndTime: string;
    room?: string;
    topic?: string;
    status: string;
    unit?: {
        id: string;
        nameAr: string;
        nameEn: string;
        code: string;
        totalLectures?: number; // Added for sequence display
    };
    instructor?: {
        id: string;
        firstName: string;
        lastName: string;
    };
    class?: {
        id: string;
        name: string;
        code: string;
        _count?: {
            studentEnrollments: number;
        };
    };
    _count?: {
        attendanceRecords: number;
    };
    attendanceRecords?: {
        studentId: string;
        status: string;
    }[];
}

export interface LectureDetails extends Lecture {
    sequenceInfo: {
        current: number;
        total: number;
    };
    students: Array<{
        id: string;
        studentNumber: string;
        name: string;
        email: string;
        phone?: string;
        hasAttended: boolean;
        attendanceStatus?: string;
    }>;
}

export interface AutoScheduleInput {
    classId: string;
    programId: string;
    startDate: string;
    studyDays: string[];
    lectureStartTime: string;
    lectureEndTime: string;
}

export const scheduleService = {
    async getLectures(params?: {
        classId?: string;
        instructorId?: string;
        startDate?: string;
        endDate?: string;
        status?: string;
        includeAttendance?: boolean;
    }): Promise<{ data: Lecture[] }> {
        // Add timestamp to prevent caching
        const queryParams = new URLSearchParams({
            ...params as any,
            _t: Date.now().toString()
        });
        return apiClient.get(`/academic/lectures?${queryParams.toString()}`);
    },

    async getLecture(id: string) {
        return apiClient.get(`/academic/lectures/${id}`);
    },

    async getLectureDetails(id: string) {
        return apiClient.get<LectureDetails>(`/academic/lectures/${id}/details`);
    },

    async updateLecture(id: string, data: any) {
        return apiClient.put(`/academic/lectures/${id}`, data);
    },

    async cancelLecture(id: string, reason?: string) {
        return apiClient.post(`/academic/lectures/${id}/cancel`, { reason });
    },

    async postponeLecture(id: string, reason?: string) {
        return apiClient.post(`/academic/lectures/${id}/postpone`, { reason });
    },

    // Undo operations
    async undoCancelLecture(id: string) {
        return apiClient.post(`/academic/lectures/${id}/undo-cancel`);
    },

    async undoPostponeLecture(id: string) {
        return apiClient.post(`/academic/lectures/${id}/undo-postpone`);
    },

    async autoSchedule(classId: string) {
        return apiClient.post(`/academic/classes/${classId}/schedule`);
    },

    // Attendance operations
    async getLectureAttendance(lectureId: string) {
        return apiClient.get(`/academic/lectures/${lectureId}/attendance`);
    },

    async recordAttendance(lectureId: string, records: { studentId: string; status: string; notes?: string }[]) {
        return apiClient.post(`/academic/lectures/${lectureId}/attendance`, { records });
    }
};
