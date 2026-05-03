import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { AuthRequest } from '../../common/utils/jwt';
import {
    enrollStudentSchema,
    updateEnrollmentSchema,
} from './students.validation';
import { ProgressService } from '../academic/progress.service';

// Enroll Student in Class
export const enrollStudent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = enrollStudentSchema.parse(req.body);

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

        // Check if class exists and has capacity
        const classData = await prisma.class.findUnique({
            where: { id: validatedData.classId },
            include: {
                _count: {
                    select: {
                        studentEnrollments: {
                            where: { status: 'enrolled' },
                        },
                    },
                },
            },
        });

        if (!classData) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'CLASS_NOT_FOUND',
                    message: 'Class not found',
                },
            });
            return;
        }

        // Check class capacity
        if (classData.maxStudents && classData._count.studentEnrollments >= classData.maxStudents) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'CLASS_FULL',
                    message: 'Class has reached maximum capacity',
                },
            });
            return;
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.studentEnrollment.findFirst({
            where: {
                studentId: validatedData.studentId,
                classId: validatedData.classId,
                status: 'enrolled',
            },
        });

        if (existingEnrollment) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'ALREADY_ENROLLED',
                    message: 'Student is already enrolled in this class',
                },
            });
            return;
        }

        const enrollment = await prisma.studentEnrollment.create({
            // ... existing include
            data: {
                studentId: validatedData.studentId,
                classId: validatedData.classId,
                enrollmentDate: new Date(validatedData.enrollmentDate),
                status: validatedData.status || 'enrolled',
            },
            include: {
                student: {
                    select: {
                        id: true,
                        studentNumber: true,
                        firstNameEn: true,
                        lastNameEn: true,
                    },
                },
                class: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        program: {
                            select: {
                                nameEn: true,
                                nameAr: true,
                            },
                        },
                    },
                },
            },
        });

        // Initialize unit progress
        await ProgressService.initializeProgress(validatedData.studentId, enrollment.id, validatedData.classId);

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'STUDENT_ENROLLED',
                    resourceType: 'StudentEnrollment',
                    resourceId: enrollment.id,
                    afterData: {
                        studentId: validatedData.studentId,
                        classId: validatedData.classId,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.status(201).json({
            success: true,
            data: {
                enrollment,
                message: 'Student enrolled successfully',
            },
        });
    } catch (error: any) {
        console.error('Enroll student error:', error);

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
                message: 'An error occurred while enrolling the student',
            },
        });
    }
};

// Get Enrollments for a Student
export const getStudentEnrollments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;

        const enrollments = await prisma.studentEnrollment.findMany({
            where: { studentId },
            include: {
                class: {
                    include: {
                        program: {
                            select: {
                                id: true,
                                code: true,
                                nameEn: true,
                                nameAr: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                enrollmentDate: 'desc',
            },
        });

        res.json({
            success: true,
            data: {
                enrollments,
                total: enrollments.length,
            },
        });
    } catch (error) {
        console.error('Get enrollments error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching enrollments',
            },
        });
    }
};

// Get Students Enrolled in a Class
export const getClassEnrollments = async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId } = req.params;
        const { status } = req.query;

        const where: any = { classId };
        if (status) where.status = status;

        const enrollments = await prisma.studentEnrollment.findMany({
            where,
            include: {
                student: true,
            },
            orderBy: {
                enrollmentDate: 'asc',
            },
        });

        res.json({
            success: true,
            data: {
                enrollments,
                total: enrollments.length,
            },
        });
    } catch (error) {
        console.error('Get class enrollments error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching class enrollments',
            },
        });
    }
};

// Update Enrollment
export const updateEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateEnrollmentSchema.parse(req.body);

        const existing = await prisma.studentEnrollment.findUnique({
            where: { id },
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ENROLLMENT_NOT_FOUND',
                    message: 'Enrollment not found',
                },
            });
            return;
        }

        // Prepare update data
        const updateData: any = { ...validatedData };
        if (validatedData.completionDate) {
            updateData.completionDate = new Date(validatedData.completionDate);
        }

        const enrollment = await prisma.studentEnrollment.update({
            where: { id },
            data: updateData,
            include: {
                student: {
                    select: {
                        id: true,
                        studentNumber: true,
                        firstNameEn: true,
                        lastNameEn: true,
                    },
                },
                class: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                    },
                },
            },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'ENROLLMENT_UPDATED',
                    resourceType: 'StudentEnrollment',
                    resourceId: enrollment.id,
                    beforeData: existing,
                    afterData: enrollment,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { enrollment },
        });
    } catch (error: any) {
        console.error('Update enrollment error:', error);

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
                message: 'An error occurred while updating the enrollment',
            },
        });
    }
};

// Drop/Unenroll Student
export const dropEnrollment = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const enrollment = await prisma.studentEnrollment.findUnique({
            where: { id },
        });

        if (!enrollment) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ENROLLMENT_NOT_FOUND',
                    message: 'Enrollment not found',
                },
            });
            return;
        }

        const updated = await prisma.studentEnrollment.update({
            where: { id },
            data: {
                status: 'dropped',
                completionDate: new Date(),
            },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'STUDENT_DROPPED',
                    resourceType: 'StudentEnrollment',
                    resourceId: id,
                    beforeData: enrollment,
                    afterData: updated,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: {
                enrollment: updated,
                message: 'Student dropped successfully',
            },
        });
    } catch (error) {
        console.error('Drop enrollment error:', error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while dropping the student',
            },
        });
    }
};
