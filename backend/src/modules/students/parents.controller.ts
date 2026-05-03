import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { AuthRequest } from '../../common/utils/jwt';
import {
    addParentSchema,
    updateParentSchema,
} from './students.validation';

// Add Parent/Guardian
export const addParent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = addParentSchema.parse(req.body);

        // Check if student exists
        const student = await prisma.student.findUnique({
            where: { id: validatedData.studentId },
        });

        if (!student) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'STUDENT_NOT_FOUND',
                    message: 'Student not found',
                },
            });
            return;
        }

        // Create parent
        const { studentId, ...parentData } = validatedData;
        const parent = await prisma.parent.create({
            data: {
                ...parentData,
                studentParents: {
                    create: {
                        studentId: studentId,
                        isPrimary: true,
                    },
                },
            },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PARENT_ADDED',
                    resourceType: 'ParentGuardian',
                    resourceId: parent.id,
                    afterData: {
                        studentId: validatedData.studentId,
                        name: parent.nameEn,
                        relationship: parent.relationship,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.status(201).json({
            success: true,
            data: { parent },
        });
    } catch (error: any) {
        console.error('Add parent error:', error);

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
                message: 'An error occurred while adding the parent',
            },
        });
    }
};

// Get Parents for a Student
export const getStudentParents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;

        const parents = await prisma.parent.findMany({
            where: {
                studentParents: {
                    some: { studentId },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });

        res.json({
            success: true,
            data: {
                parents,
                total: parents.length,
            },
        });
    } catch (error) {
        console.error('Get parents error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching parents',
            },
        });
    }
};

// Update Parent
export const updateParent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateParentSchema.parse(req.body);

        const existing = await prisma.parent.findUnique({
            where: { id },
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'PARENT_NOT_FOUND',
                    message: 'Parent not found',
                },
            });
            return;
        }

        const parent = await prisma.parent.update({
            where: { id },
            data: validatedData,
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PARENT_UPDATED',
                    resourceType: 'ParentGuardian',
                    resourceId: parent.id,
                    beforeData: existing,
                    afterData: parent,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { parent },
        });
    } catch (error: any) {
        console.error('Update parent error:', error);

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
                message: 'An error occurred while updating the parent',
            },
        });
    }
};

// Delete Parent
export const deleteParent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const parent = await prisma.parent.findUnique({
            where: { id },
        });

        if (!parent) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'PARENT_NOT_FOUND',
                    message: 'Parent not found',
                },
            });
            return;
        }

        await prisma.parent.delete({
            where: { id },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'PARENT_DELETED',
                    resourceType: 'ParentGuardian',
                    resourceId: id,
                    beforeData: parent,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Parent deleted successfully' },
        });
    } catch (error) {
        console.error('Delete parent error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting the parent',
            },
        });
    }
};
