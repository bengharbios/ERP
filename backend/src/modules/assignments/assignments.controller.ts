import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { AuthRequest } from '../../common/utils/jwt';
import {
    createAssignmentSchema,
    updateAssignmentSchema,
} from './assignments.validation';

// Create Assignment
export const createAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createAssignmentSchema.parse(req.body);

        // Check if unit exists
        const unit = await prisma.unit.findUnique({
            where: { id: validatedData.unitId },
        });

        if (!unit) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'UNIT_NOT_FOUND',
                    message: 'Unit not found',
                },
            });
            return;
        }

        // Create assignment
        const assignment = await prisma.assignment.create({
            data: {
                unitId: validatedData.unitId,
                title: validatedData.title,
                description: `${validatedData.description || ''}\n\n${validatedData.instructions || ''}`.trim(),
                submissionDeadline: new Date(validatedData.dueDate),
                totalMarks: validatedData.maxScore,
                passThreshold: validatedData.passThreshold,
                meritThreshold: validatedData.meritThreshold,
                distinctionThreshold: validatedData.distinctionThreshold,
                learningOutcomes: validatedData.learningOutcomes || [],
                attachments: validatedData.attachments || [],
            },
            include: {
                unit: {
                    select: {
                        id: true,
                        code: true,
                        nameEn: true,
                        nameAr: true,
                    },
                },
            },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'ASSIGNMENT_CREATED',
                    resourceType: 'Assignment',
                    resourceId: assignment.id,
                    afterData: {
                        title: assignment.title,
                        unitId: assignment.unitId,
                        submissionDeadline: assignment.submissionDeadline,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.status(201).json({
            success: true,
            data: { assignment },
        });
    } catch (error: any) {
        console.error('Create assignment error:', error.message || error);

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
                message: 'An error occurred while creating assignment',
            },
        });
    }
};

// Get All Assignments
export const getAssignments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { unitId, classId } = req.query;

        const where: any = {};

        if (unitId) {
            where.unitId = unitId;
        }

        if (classId) {
            // Get assignments for all units in the class's program
            const classData = await prisma.class.findUnique({
                where: { id: classId as string },
                include: {
                    program: {
                        include: {
                            programUnits: {
                                select: { unitId: true },
                            },
                        },
                    },
                },
            });

            if (classData) {
                const unitIds = classData.program.programUnits.map((pu) => pu.unitId);
                where.unitId = { in: unitIds };
            }
        }

        const assignments = await prisma.assignment.findMany({
            where,
            include: {
                unit: {
                    select: {
                        id: true,
                        code: true,
                        nameEn: true,
                        nameAr: true,
                    },
                },
                _count: {
                    select: {
                        studentAssignments: true,
                    },
                },
            },
            orderBy: {
                submissionDeadline: 'desc',
            },
        });

        res.json({
            success: true,
            data: {
                assignments,
                total: assignments.length,
            },
        });
    } catch (error: any) {
        console.error('Get assignments error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching assignments',
            },
        });
    }
};

// Get Assignment by ID
export const getAssignmentById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: {
                unit: {
                    select: {
                        id: true,
                        code: true,
                        nameEn: true,
                        nameAr: true,
                    },
                },
                studentAssignments: {
                    include: {
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
                },
            },
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

        res.json({
            success: true,
            data: { assignment },
        });
    } catch (error: any) {
        console.error('Get assignment error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching assignment',
            },
        });
    }
};

// Update Assignment
export const updateAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateAssignmentSchema.parse(req.body);

        const existing = await prisma.assignment.findUnique({
            where: { id },
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ASSIGNMENT_NOT_FOUND',
                    message: 'Assignment not found',
                },
            });
            return;
        }

        const updateData: any = {
            title: validatedData.title,
            description: validatedData.description,
            instructions: validatedData.instructions,
            totalMarks: validatedData.maxScore,
            passThreshold: validatedData.passThreshold,
            meritThreshold: validatedData.meritThreshold,
            distinctionThreshold: validatedData.distinctionThreshold,
            learningOutcomes: validatedData.learningOutcomes,
            attachments: validatedData.attachments,
            status: validatedData.status, // Allow status update if in schema
        };
        if (validatedData.dueDate) {
            updateData.submissionDeadline = new Date(validatedData.dueDate);
        }

        const assignment = await prisma.assignment.update({
            where: { id },
            data: updateData,
            include: {
                unit: {
                    select: {
                        id: true,
                        code: true,
                        nameEn: true,
                        nameAr: true,
                    },
                },
            },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'ASSIGNMENT_UPDATED',
                    resourceType: 'Assignment',
                    resourceId: assignment.id,
                    beforeData: existing,
                    afterData: assignment,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { assignment },
        });
    } catch (error: any) {
        console.error('Update assignment error:', error.message || error);

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
                message: 'An error occurred while updating assignment',
            },
        });
    }
};

// Delete Assignment
export const deleteAssignment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        studentAssignments: true,
                    },
                },
            },
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

        // Prevent deletion if there are submissions
        if (assignment._count.studentAssignments > 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'ASSIGNMENT_HAS_SUBMISSIONS',
                    message: 'Cannot delete assignment with existing submissions',
                },
            });
            return;
        }

        await prisma.assignment.delete({
            where: { id },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'ASSIGNMENT_DELETED',
                    resourceType: 'Assignment',
                    resourceId: id,
                    beforeData: assignment,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Assignment deleted successfully' },
        });
    } catch (error: any) {
        console.error('Delete assignment error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting assignment',
            },
        });
    }
};

// Get Assignment Statistics
export const getAssignmentStatistics = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const assignment = await prisma.assignment.findUnique({
            where: { id },
            include: {
                studentAssignments: {
                    select: {
                        grade: true,
                        submissionDate: true,
                    },
                },
            },
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

        const stats = {
            totalSubmissions: assignment.studentAssignments.length,
            graded: assignment.studentAssignments.filter((s) => s.grade && s.grade !== 'not_graded').length,
            notGraded: assignment.studentAssignments.filter((s) => !s.grade || s.grade === 'not_graded').length,
            pass: assignment.studentAssignments.filter((s) => s.grade === 'Pass').length,
            merit: assignment.studentAssignments.filter((s) => s.grade === 'Merit').length,
            distinction: assignment.studentAssignments.filter((s) => s.grade === 'Distinction').length,
            refer: assignment.studentAssignments.filter((s) => s.grade === 'Fail').length, // Assuming Fail maps to refer
            onTime: assignment.studentAssignments.filter(
                (s) => s.submissionDate && new Date(s.submissionDate) <= assignment.submissionDeadline
            ).length,
            late: assignment.studentAssignments.filter(
                (s) => s.submissionDate && new Date(s.submissionDate) > assignment.submissionDeadline
            ).length,
        };

        res.json({
            success: true,
            data: { stats },
        });
    } catch (error: any) {
        console.error('Get assignment statistics error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching assignment statistics',
            },
        });
    }
};
