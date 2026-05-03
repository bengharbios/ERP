import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { AuthRequest } from '../../common/utils/jwt';
import {
    createSubmissionSchema,
    updateSubmissionSchema,
    gradeSubmissionSchema,
} from './assignments.validation';

// Create Submission
export const createSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createSubmissionSchema.parse(req.body);

        // Check if assignment exists
        const assignment = await prisma.assignment.findUnique({
            where: { id: validatedData.assignmentId },
        });

        if (!assignment) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ASSIGNMENT_NOT_FOUND',
                    message: 'Assignment not found',
                },
            });
            return;
        }

        // Check if enrollment exists
        const enrollment = await prisma.studentEnrollment.findUnique({
            where: { id: validatedData.studentEnrollmentId },
        });

        if (!enrollment) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ENROLLMENT_NOT_FOUND',
                    message: 'Student enrollment not found',
                },
            });
            return;
        }

        // Check if submission already exists
        const existing = await prisma.studentAssignment.findFirst({
            where: {
                assignmentId: validatedData.assignmentId,
                studentEnrollmentId: validatedData.studentEnrollmentId,
            },
        });

        if (existing) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'SUBMISSION_ALREADY_EXISTS',
                    message: 'Submission already exists for this student',
                },
            });
            return;
        }

        // Create submission
        const submission = await prisma.studentAssignment.create({
            data: {
                assignmentId: validatedData.assignmentId,
                studentId: enrollment.studentId,
                studentEnrollmentId: validatedData.studentEnrollmentId,
                content: validatedData.content,
                attachments: validatedData.attachments || [],
                remarks: validatedData.remarks,
                submittedAt: new Date(),
                finalStatus: 'submitted',
            },
            include: {
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        submissionDeadline: true,
                    },
                },
                studentEnrollment: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                studentNumber: true,
                                firstNameEn: true,
                                lastNameEn: true,
                            },
                        },
                    },
                },
            },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'SUBMISSION_CREATED',
                    resourceType: 'AssignmentSubmission',
                    resourceId: submission.id,
                    afterData: {
                        assignmentId: submission.assignmentId,
                        studentId: enrollment.studentId,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.status(201).json({
            success: true,
            data: { submission },
        });
    } catch (error: any) {
        console.error('Create submission error:', error);

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors,
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while creating submission',
            },
        });
    }
};

// Get Submissions for Assignment
export const getAssignmentSubmissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { assignmentId } = req.params;
        const { status, grade } = req.query;

        const where: any = { assignmentId };

        if (status) {
            where.status = status;
        }

        if (grade) {
            where.grade = grade;
        }

        const submissions = await prisma.studentAssignment.findMany({
            where,
            include: {
                studentEnrollment: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                studentNumber: true,
                                firstNameEn: true,
                                lastNameEn: true,
                                firstNameAr: true,
                                lastNameAr: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                submittedAt: 'desc',
            },
        });

        res.json({
            success: true,
            data: {
                submissions,
                total: submissions.length,
            },
        });
    } catch (error) {
        console.error('Get submissions error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching submissions',
            },
        });
    }
};

// Get Student Submissions
export const getStudentSubmissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const { classId } = req.query;

        const where: any = {
            studentEnrollment: {
                studentId,
            },
        };

        if (classId) {
            where.studentEnrollment.classId = classId;
        }

        const submissions = await prisma.studentAssignment.findMany({
            where,
            include: {
                assignment: {
                    include: {
                        unit: {
                            select: {
                                code: true,
                                nameEn: true,
                                nameAr: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                submittedAt: 'desc',
            },
        });

        res.json({
            success: true,
            data: {
                submissions,
                total: submissions.length,
            },
        });
    } catch (error) {
        console.error('Get student submissions error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching student submissions',
            },
        });
    }
};

// Update Submission
export const updateSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateSubmissionSchema.parse(req.body);

        const existing = await prisma.studentAssignment.findUnique({
            where: { id },
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'SUBMISSION_NOT_FOUND',
                    message: 'Submission not found',
                },
            });
            return;
        }

        // Don't allow updates if already graded
        if (existing.grade && existing.grade !== 'not_graded') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'SUBMISSION_ALREADY_GRADED',
                    message: 'Cannot update a graded submission',
                },
            });
            return;
        }

        const submission = await prisma.studentAssignment.update({
            where: { id },
            data: validatedData,
            include: {
                assignment: {
                    select: {
                        title: true,
                    },
                },
                studentEnrollment: {
                    include: {
                        student: {
                            select: {
                                firstNameEn: true,
                                lastNameEn: true,
                            },
                        },
                    },
                },
            },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'SUBMISSION_UPDATED',
                    resourceType: 'AssignmentSubmission',
                    resourceId: submission.id,
                    beforeData: existing,
                    afterData: submission,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { submission },
        });
    } catch (error: any) {
        console.error('Update submission error:', error);

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors,
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while updating submission',
            },
        });
    }
};

// Grade Submission
export const gradeSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = gradeSubmissionSchema.parse(req.body);

        const existing = await prisma.studentAssignment.findUnique({
            where: { id },
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'SUBMISSION_NOT_FOUND',
                    message: 'Submission not found',
                },
            });
            return;
        }

        const updateData: any = {
            grade: validatedData.grade,
            score: validatedData.score,
            feedback: validatedData.feedback,
            status: 'graded',
        };

        if (validatedData.gradedAt) {
            updateData.gradedAt = new Date(validatedData.gradedAt);
        } else {
            updateData.gradedAt = new Date();
        }

        const submission = await prisma.studentAssignment.update({
            where: { id },
            data: updateData,
            include: {
                assignment: {
                    select: {
                        title: true,
                    },
                },
                studentEnrollment: {
                    include: {
                        student: {
                            select: {
                                firstNameEn: true,
                                lastNameEn: true,
                            },
                        },
                    },
                },
            },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'SUBMISSION_GRADED',
                    resourceType: 'AssignmentSubmission',
                    resourceId: submission.id,
                    beforeData: existing,
                    afterData: submission,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { submission, message: 'Submission graded successfully' },
        });
    } catch (error: any) {
        console.error('Grade submission error:', error);

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors,
                },
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while grading submission',
            },
        });
    }
};

// Delete Submission
export const deleteSubmission = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const submission = await prisma.studentAssignment.findUnique({
            where: { id },
        });

        if (!submission) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'SUBMISSION_NOT_FOUND',
                    message: 'Submission not found',
                },
            });
            return;
        }

        await prisma.studentAssignment.delete({
            where: { id },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'SUBMISSION_DELETED',
                    resourceType: 'AssignmentSubmission',
                    resourceId: id,
                    beforeData: submission,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Submission deleted successfully' },
        });
    } catch (error) {
        console.error('Delete submission error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting submission',
            },
        });
    }
};
