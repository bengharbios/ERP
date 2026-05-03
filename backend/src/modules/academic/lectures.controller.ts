import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { AuthRequest } from '../../common/utils/jwt';
import { updateLectureSchema } from './academic.validation';

// Get all lectures with filtering
export const getLectures = async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId, instructorId, studentId, startDate, endDate, status, includeAttendance } = req.query;

        const where: any = {};

        if (classId) {
            where.classId = classId as string;
        }

        if (instructorId) {
            where.instructorId = instructorId as string;
        }

        if (status) {
            where.status = status as string;
        }

        if (startDate || endDate) {
            where.scheduledDate = {};
            if (startDate) {
                where.scheduledDate.gte = new Date(startDate as string);
            }
            if (endDate) {
                where.scheduledDate.lte = new Date(endDate as string);
            }
        }

        if (studentId) {
            where.class = {
                studentEnrollments: {
                    some: {
                        studentId: studentId as string,
                        status: 'active'
                    }
                }
            };
        }

        // Prepare include object
        const include: any = {
            unit: {
                select: {
                    id: true,
                    code: true,
                    nameAr: true,
                    nameEn: true,
                    totalLectures: true, // Keep for reference, but we'll override
                }
            },
            class: {
                select: {
                    id: true,
                    name: true,
                    code: true,
                    _count: {
                        select: {
                            studentEnrollments: true
                        }
                    }
                }
            },
            instructor: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                }
            },
            _count: {
                select: {
                    attendanceRecords: true
                }
            }
        };

        // Conditionally include attendance records for Matrix View
        if (includeAttendance === 'true') {
            include.attendanceRecords = {
                select: {
                    studentId: true,
                    status: true
                }
            };
        }

        const lectures = await prisma.lecture.findMany({
            where,
            include,
            orderBy: {
                scheduledDate: 'asc',
            }
        });

        // Calculate ACTUAL totalLectures per unit per class dynamically
        // This allows flexible lecture counts per class
        const unitLectureCounts: { [key: string]: number } = {};

        for (const lecture of lectures) {
            if (lecture.unitId && lecture.classId) {
                const key = `${lecture.classId}_${lecture.unitId}`;

                // Count all scheduled/rescheduled lectures for this unit in this class
                // Exclude postponed and cancelled lectures from the count
                if (!unitLectureCounts[key]) {
                    const count = await prisma.lecture.count({
                        where: {
                            classId: lecture.classId,
                            unitId: lecture.unitId,
                            status: { in: ['scheduled', 'rescheduled'] }
                        }
                    });
                    unitLectureCounts[key] = count;
                }
            }
        }

        // Attach the ACTUAL totalLectures to each lecture's unit data
        const lecturesWithActualTotals = lectures.map(lecture => {
            if (lecture.unit && lecture.classId && lecture.unitId) {
                const key = `${lecture.classId}_${lecture.unitId}`;
                return {
                    ...lecture,
                    unit: {
                        ...lecture.unit,
                        totalLectures: unitLectureCounts[key] || (lecture as any).unit?.totalLectures
                    }
                };
            }
            return lecture;
        });

        res.json({
            success: true,
            data: {
                lectures: lecturesWithActualTotals,
                total: lecturesWithActualTotals.length
            }
        });
    } catch (error: any) {
        console.error('Get lectures error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching lectures'
            }
        });
    }
};

// Get single lecture by ID
export const getLectureById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const lecture = await prisma.lecture.findUnique({
            where: { id },
            include: {
                unit: true,
                class: {
                    include: {
                        program: true
                    }
                },
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                },
                attendanceRecords: {
                    include: {
                        student: {
                            include: {
                                user: true
                            }
                        }
                    }
                }
            }
        });

        if (!lecture) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'LECTURE_NOT_FOUND',
                    message: 'Lecture not found'
                }
            });
            return;
        }

        res.json({
            success: true,
            data: { lecture }
        });
    } catch (error: any) {
        console.error('Get lecture error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching the lecture'
            }
        });
    }
};

// Get lecture details with students list
export const getLectureDetails = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const lecture = await prisma.lecture.findUnique({
            where: { id },
            include: {
                unit: {
                    select: {
                        id: true,
                        code: true,
                        nameAr: true,
                        nameEn: true,
                        totalLectures: true,
                        description: true
                    }
                },
                class: {
                    include: {
                        program: {
                            select: {
                                id: true,
                                nameAr: true,
                                nameEn: true,
                                code: true
                            }
                        },
                        studentEnrollments: {
                            where: {
                                status: 'active'
                            },
                            include: {
                                student: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                firstName: true,
                                                lastName: true,
                                                email: true,
                                                phone: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                },
                attendanceRecords: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!lecture) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'LECTURE_NOT_FOUND',
                    message: 'Lecture not found'
                }
            });
            return;
        }

        // Get count of lectures for this unit in this class to determine sequence
        const lectureCount = await prisma.lecture.count({
            where: {
                classId: lecture.classId,
                unitId: lecture.unitId,
                sequenceNumber: {
                    lte: lecture.sequenceNumber
                }
            }
        });

        res.json({
            success: true,
            data: {
                lecture,
                sequenceInfo: {
                    current: lectureCount,
                    total: lecture.unit.totalLectures
                },
                students: lecture.class.studentEnrollments.map(enrollment => ({
                    id: enrollment.student.id,
                    studentNumber: enrollment.student.studentNumber,
                    name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
                    email: enrollment.student.user.email,
                    phone: enrollment.student.user.phone,
                    hasAttended: lecture.attendanceRecords.some(
                        record => record.studentId === enrollment.student.id
                    ),
                    attendanceStatus: lecture.attendanceRecords.find(
                        record => record.studentId === enrollment.student.id
                    )?.status
                }))
            }
        });
    } catch (error: any) {
        console.error('Get lecture details error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching lecture details'
            }
        });
    }
};

// Update lecture
export const updateLecture = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateLectureSchema.parse(req.body);

        const existing = await prisma.lecture.findUnique({
            where: { id }
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'LECTURE_NOT_FOUND',
                    message: 'Lecture not found'
                }
            });
            return;
        }

        // Prepare update data
        const updateData: any = { ...validatedData };

        if (validatedData.scheduledDate) {
            updateData.scheduledDate = new Date(validatedData.scheduledDate);
        }

        if (validatedData.scheduledStartTime) {
            const [hours, minutes] = validatedData.scheduledStartTime.split(':').map(Number);
            const date = new Date(existing.scheduledStartTime);
            date.setUTCHours(hours, minutes, 0, 0);
            updateData.scheduledStartTime = date;
        }

        if (validatedData.scheduledEndTime) {
            const [hours, minutes] = validatedData.scheduledEndTime.split(':').map(Number);
            const date = new Date(existing.scheduledEndTime);
            date.setUTCHours(hours, minutes, 0, 0);
            updateData.scheduledEndTime = date;
        }

        const lecture = await prisma.lecture.update({
            where: { id },
            data: updateData,
            include: {
                unit: true,
                class: true,
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        // Audit Log
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'LECTURE_UPDATED',
                    resourceType: 'Lecture',
                    resourceId: id,
                    beforeData: existing,
                    afterData: lecture,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                }
            });
        }

        res.json({
            success: true,
            data: {
                lecture,
                message: 'Lecture updated successfully'
            }
        });
    } catch (error: any) {
        console.error('Update lecture error:', error.message || error);

        if (error.name === 'ZodError') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: 'Invalid input data',
                    details: error.errors
                }
            });
            return;
        }

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while updating the lecture'
            }
        });
    }
};

// Cancel Lecture
export const cancelLecture = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const lecture = await prisma.lecture.update({
            where: { id },
            data: {
                status: 'cancelled',
                cancellationReason: reason,
            }
        });

        // Audit Log
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'LECTURE_CANCELLED',
                    resourceType: 'Lecture',
                    resourceId: id,
                    afterData: lecture,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                }
            });
        }

        res.json({
            success: true,
            data: { lecture, message: 'Lecture cancelled successfully' }
        });
    } catch (error: any) {
        console.error('Cancel lecture error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to cancel lecture'
            }
        });
    }
};


// Postpone Lecture (and shift subsequent)
export const postponeLecture = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const targetLecture = await prisma.lecture.findUnique({
            where: { id },
            include: { class: true }
        });

        if (!targetLecture) {
            res.status(404).json({ success: false, error: { message: 'Lecture not found' } });
            return;
        }

        console.log('📅 Attempting to postpone lecture:', {
            id,
            classId: targetLecture.classId,
            scheduledDate: targetLecture.scheduledDate,
            scheduledDateType: typeof targetLecture.scheduledDate,
            status: targetLecture.status,
            studyDays: targetLecture.class.studyDays
        });

        // Use the dynamic scheduling service which properly handles postpone
        // This keeps the original lecture with status='postponed' and creates a clone
        const { handleLectureInterruption } = await import('./dynamic_scheduling.service');

        const result = await handleLectureInterruption({
            classId: targetLecture.classId,
            interruptionDate: targetLecture.scheduledDate,
            mode: 'SHIFT_POSTPONE',
            reason: reason || 'Lecture postponed by instructor'
        });

        console.log('✅ Postpone result:', result);

        // Audit Log
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'LECTURE_POSTPONED',
                    resourceType: 'Lecture',
                    resourceId: id,
                    afterData: { result }
                }
            });
        }

        res.status(200).json({
            success: true,
            data: { message: result.message }
        });
    } catch (error: any) {
        console.error('Postpone lecture error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'POSTPONE_FAILED',
                message: 'Failed to postpone lecture'
            }
        });
    }
};

// Undo cancelled lecture
export const undoCancelLecture = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { undoCancelLecture: undoCancel } = await import('./undo_scheduling.service');
        const result = await undoCancel(id);

        // Audit Log
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'LECTURE_CANCEL_UNDONE',
                    resourceType: 'Lecture',
                    resourceId: id,
                    afterData: { result }
                }
            });
        }

        res.status(200).json({
            success: true,
            data: { message: result.message }
        });
    } catch (error: any) {
        console.error('Undo cancel lecture error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UNDO_CANCEL_FAILED',
                message: error.message || 'Failed to undo cancelled lecture'
            }
        });
    }
};

// Undo postponed lecture
export const undoPostponeLecture = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const { undoPostponeLecture: undoPostpone } = await import('./undo_scheduling.service');
        const result = await undoPostpone(id);

        // Audit Log
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'LECTURE_POSTPONE_UNDONE',
                    resourceType: 'Lecture',
                    resourceId: id,
                    afterData: { result }
                }
            });
        }

        res.status(200).json({
            success: true,
            data: { message: result.message }
        });
    } catch (error: any) {
        console.error('Undo postpone lecture error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'UNDO_POSTPONE_FAILED',
                message: error.message || 'Failed to undo postponed lecture'
            }
        });
    }
};
