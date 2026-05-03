import { z } from 'zod';

// Assignment Schemas
export const createAssignmentSchema = z.object({
    unitId: z.string(),
    title: z.string().min(3),
    description: z.string().optional(),
    instructions: z.string().optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/), // YYYY-MM-DD
    maxScore: z.number().int().min(0).optional(),
    passThreshold: z.number().min(0).optional(),
    meritThreshold: z.number().min(0).optional(),
    distinctionThreshold: z.number().min(0).optional(),
    passCriteria: z.string().optional(),
    meritCriteria: z.string().optional(),
    distinctionCriteria: z.string().optional(),
    learningOutcomes: z.array(z.string()).optional(),
    attachments: z.array(z.string()).optional(),
});

export const updateAssignmentSchema = z.object({
    title: z.string().min(3).optional(),
    description: z.string().optional(),
    instructions: z.string().optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/).optional(),
    maxScore: z.number().int().min(0).optional(),
    passThreshold: z.number().min(0).optional(),
    meritThreshold: z.number().min(0).optional(),
    distinctionThreshold: z.number().min(0).optional(),
    passCriteria: z.string().optional(),
    meritCriteria: z.string().optional(),
    distinctionCriteria: z.string().optional(),
    learningOutcomes: z.array(z.string()).optional(),
    attachments: z.array(z.string()).optional(),
});

// Submission Schemas
export const createSubmissionSchema = z.object({
    assignmentId: z.string(),
    studentEnrollmentId: z.string(),
    content: z.string().optional(), // Text content
    attachments: z.array(z.string()).optional(), // URLs or file paths
    remarks: z.string().optional(),
});

export const updateSubmissionSchema = z.object({
    content: z.string().optional(),
    attachments: z.array(z.string()).optional(),
    remarks: z.string().optional(),
});

export const gradeSubmissionSchema = z.object({
    grade: z.enum(['pass', 'merit', 'distinction', 'refer', 'not_graded']),
    score: z.number().min(0).optional(),
    feedback: z.string().optional(),
    gradedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/).optional(), // ISO datetime
});

export type CreateAssignmentInput = z.infer<typeof createAssignmentSchema>;
export type UpdateAssignmentInput = z.infer<typeof updateAssignmentSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type UpdateSubmissionInput = z.infer<typeof updateSubmissionSchema>;
export type GradeSubmissionInput = z.infer<typeof gradeSubmissionSchema>;
