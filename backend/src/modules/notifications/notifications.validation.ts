import { z } from 'zod';

// Notification Schemas
export const createNotificationSchema = z.object({
    userId: z.string(),
    title: z.string().min(1),
    message: z.string().min(1),
    type: z.enum(['info', 'success', 'warning', 'error']),
    link: z.string().optional(),
    metadata: z.record(z.any()).optional(),
});

export const updateNotificationSchema = z.object({
    isRead: z.boolean().optional(),
});

// Report Request Schemas
export const studentProgressReportSchema = z.object({
    studentId: z.string(),
    classId: z.string().optional(),
});

export const attendanceReportSchema = z.object({
    classId: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
});

export const classPerformanceReportSchema = z.object({
    classId: z.string(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;
export type UpdateNotificationInput = z.infer<typeof updateNotificationSchema>;
export type StudentProgressReportInput = z.infer<typeof studentProgressReportSchema>;
export type AttendanceReportInput = z.infer<typeof attendanceReportSchema>;
export type ClassPerformanceReportInput = z.infer<typeof classPerformanceReportSchema>;
