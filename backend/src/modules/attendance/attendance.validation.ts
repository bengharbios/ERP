import { z } from 'zod';

// Attendance Record Schemas
export const recordAttendanceSchema = z.object({
    lectureId: z.string(),
    studentId: z.string(),
    status: z.enum(['present', 'absent', 'late', 'excused']),
    notes: z.string().optional(),
    recordedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/).optional(), // ISO datetime
});

export const bulkAttendanceSchema = z.object({
    lectureId: z.string(),
    records: z.array(z.object({
        studentId: z.string(),
        status: z.enum(['present', 'absent', 'late', 'excused']),
        notes: z.string().optional(),
    })),
});

export const updateAttendanceSchema = z.object({
    status: z.enum(['present', 'absent', 'late', 'excused']),
    notes: z.string().optional(),
});

export const studentAttendanceReportSchema = z.object({
    programId: z.string().optional(),
    classId: z.string().optional(),
    unitId: z.string().optional(),
    month: z.string().optional(), // 1-12
    year: z.string().optional(),
});

export type RecordAttendanceInput = z.infer<typeof recordAttendanceSchema>;
export type BulkAttendanceInput = z.infer<typeof bulkAttendanceSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
