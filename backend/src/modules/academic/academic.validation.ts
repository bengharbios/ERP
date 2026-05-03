import { z } from 'zod';

// Program Schemas
export const createProgramSchema = z.object({
    code: z.string().min(2).max(20),
    nameAr: z.string().min(3),
    nameEn: z.string().min(3),
    description: z.string().optional(),
    level: z.enum(['diploma', 'bachelor', 'master']).optional(),
    levelId: z.string().optional(),
    awardingBodyId: z.string().optional(),
    durationMonths: z.number().int().min(1).max(120),
    totalUnits: z.number().int().min(1).optional(),
    unitIds: z.array(z.string()).optional(), // Array of unit IDs to add
});

export const updateProgramSchema = z.object({
    code: z.string().min(2).max(20).optional(),
    nameAr: z.string().min(3).optional(),
    nameEn: z.string().min(3).optional(),
    description: z.string().optional(),
    level: z.enum(['diploma', 'bachelor', 'master']).optional(),
    levelId: z.string().optional(),
    awardingBodyId: z.string().optional(),
    durationMonths: z.number().int().min(1).max(120).optional(),
    totalUnits: z.number().int().min(1).optional(),
    unitIds: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
});

export const addUnitsToProgram = z.object({
    unitIds: z.array(z.string()).min(1),
});

// Unit Schemas
export const createUnitSchema = z.object({
    code: z.string().min(2).max(20),
    nameAr: z.string().min(3),
    nameEn: z.string().min(3),
    description: z.string().optional(),
    creditHours: z.number().int().min(1).max(20).optional(),
    totalLectures: z.number().int().min(1).max(100),
    defaultInstructorId: z.string().optional(),
    learningOutcomes: z.array(z.string()).optional(),
    programIds: z.array(z.string()).optional(), // Programs this unit belongs to
});

export const updateUnitSchema = z.object({
    code: z.string().min(2).max(20).optional(),
    nameAr: z.string().min(3).optional(),
    nameEn: z.string().min(3).optional(),
    description: z.string().optional(),
    creditHours: z.number().int().min(1).max(20).optional(),
    totalLectures: z.number().int().min(1).max(100).optional(),
    defaultInstructorId: z.string().optional(),
    learningOutcomes: z.array(z.string()).optional(),
    programIds: z.array(z.string()).optional(), // Update program associations
    isActive: z.boolean().optional(),
});

// Class Schemas
export const createClassSchema = z.object({
    code: z.string().min(2).max(20),
    name: z.string().min(3),
    programId: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
    durationMonths: z.number().int().min(1).max(120),
    studyDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional().default([]),
    lectureStartTime: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')).optional(), // HH:MM
    lectureEndTime: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')).optional(), // HH:MM
    defaultRoom: z.string().optional(),
    maxStudents: z.number().int().min(1).optional(),

    // Study Mode & Language
    studyMode: z.enum(['IN_PERSON', 'ONLINE', 'SELF_PACED']).default('IN_PERSON'),
    studyLanguage: z.string().default('Arabic'),

    // In-Person fields
    classroom: z.string().nullable().optional(),
    building: z.string().nullable().optional(),

    // Online fields
    defaultZoomLink: z.string().url().or(z.literal('')).nullable().optional(),

    // Manual Unit Selection
    unitIds: z.array(z.string()).optional(),
    unitSelections: z.array(z.object({
        unitId: z.string(),
        totalLectures: z.number().int().min(1)
    })).optional(),

    // Unit Instructors
    unitInstructors: z.array(z.object({
        unitId: z.string(),
        instructorId: z.string()
    })).optional(),
});

export const updateClassSchema = z.object({
    code: z.string().min(2).max(20).optional(),
    name: z.string().min(3).optional(),
    programId: z.string().optional(),
    durationMonths: z.number().int().min(1).max(120).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    studyDays: z.array(z.enum(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])).optional(),
    lectureStartTime: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')).optional(),
    lectureEndTime: z.string().regex(/^\d{2}:\d{2}$/).or(z.literal('')).optional(),
    defaultRoom: z.string().optional(),
    maxStudents: z.number().int().min(1).optional(),
    status: z.enum(['active', 'suspended', 'completed']).optional(),

    // Study Mode & Language
    studyMode: z.enum(['IN_PERSON', 'ONLINE', 'SELF_PACED', 'SELF_STUDY']).optional(),
    studyLanguage: z.string().optional(),

    // In-Person fields
    classroom: z.string().nullable().optional(),
    building: z.string().nullable().optional(),

    // Online fields
    defaultZoomLink: z.string().url().or(z.literal('')).nullable().optional(),
    // Manual Unit Selection
    unitIds: z.array(z.string()).optional(),
    unitSelections: z.array(z.object({
        unitId: z.string(),
        totalLectures: z.number().int().min(1)
    })).optional(),

    // Unit Instructors
    unitInstructors: z.array(z.object({
        unitId: z.string(),
        instructorId: z.string()
    })).optional(),
    forceRegenerate: z.boolean().optional(),
});

export const assignInstructorSchema = z.object({
    lectureId: z.string(),
    instructorId: z.string(),
});

// Student Enrollment Schemas
export const enrollStudentSchema = z.object({
    studentId: z.string(),
    enrollmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD, defaults to today
    status: z.enum(['active', 'completed', 'withdrawn']).optional().default('active'),
});

// Lecture Schemas
export const updateLectureSchema = z.object({
    scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    scheduledStartTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    scheduledEndTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
    room: z.string().optional(),
    topic: z.string().optional(),
    status: z.enum(['scheduled', 'completed', 'cancelled', 'rescheduled']).optional(),
    notes: z.string().optional(),
    instructorId: z.string().optional(),
});

export const interruptionSchema = z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    mode: z.enum(['SHIFT_POSTPONE', 'CANCEL_SKIP']),
    reason: z.string().optional(),
});

export const transferStudentSchema = z.object({
    studentId: z.string(),
    sourceClassId: z.string(),
    targetClassId: z.string(),
});

export type CreateProgramInput = z.infer<typeof createProgramSchema>;
export type UpdateProgramInput = z.infer<typeof updateProgramSchema>;
export type AddUnitsToProgramInput = z.infer<typeof addUnitsToProgram>;
export type CreateUnitInput = z.infer<typeof createUnitSchema>;
export type UpdateUnitInput = z.infer<typeof updateUnitSchema>;
export type CreateClassInput = z.infer<typeof createClassSchema>;
export type UpdateClassInput = z.infer<typeof updateClassSchema>;
export type AssignInstructorInput = z.infer<typeof assignInstructorSchema>;
export type EnrollStudentInput = z.infer<typeof enrollStudentSchema>;
export type UpdateLectureInput = z.infer<typeof updateLectureSchema>;
