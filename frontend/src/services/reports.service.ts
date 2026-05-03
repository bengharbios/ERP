import { apiClient as api } from './api';

export interface DashboardSummary {
    summary: {
        totalStudents: number;
        totalClasses: number;
        totalInstructors: number;
        avgPerformance: number;
        avgAttendance: number;
    };
    matrix: {
        id: string;
        name: string;
        photo: string | null;
        program: string;
        attendance: number;
        grades: number;
        riskScore: number;
        category: 'star' | 'at_risk' | 'average';
    }[];
    reports: {
        students: any[];
        classes: any[];
        programs: any[];
    };
    statisticalInsights: {
        riskDensity: number;
        topDensity: number;
    };
}

export const reportsService = {
    getDashboardSummary: () => api.get<{ success: boolean; data: DashboardSummary }>('/academic/dashboard-summary')
};
