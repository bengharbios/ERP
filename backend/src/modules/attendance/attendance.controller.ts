import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import { AuthRequest } from '../../common/utils/jwt';
import {
    recordAttendanceSchema,
    bulkAttendanceSchema,
    updateAttendanceSchema,
    studentAttendanceReportSchema,
} from './attendance.validation';

// Record Single Attendance
export const recordAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = recordAttendanceSchema.parse(req.body);

        // Check if lecture exists
        const lecture = await prisma.lecture.findUnique({
            where: { id: validatedData.lectureId },
        });

        if (!lecture) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'LECTURE_NOT_FOUND',
                    message: 'Lecture not found',
                },
            });
            return;
        }

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

        // Check if attendance already recorded
        const existing = await prisma.attendanceRecord.findFirst({
            where: {
                lectureId: validatedData.lectureId,
                studentId: validatedData.studentId,
            },
        });

        if (existing) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'ATTENDANCE_ALREADY_RECORDED',
                    message: 'Attendance already recorded for this student in this lecture',
                },
            });
            return;
        }

        const recordData: any = {
            lectureId: validatedData.lectureId,
            studentId: validatedData.studentId,
            status: validatedData.status,
            notes: validatedData.notes,
        };

        if (validatedData.recordedAt) {
            recordData.recordedAt = new Date(validatedData.recordedAt);
        }

        const attendance = await prisma.attendanceRecord.create({
            data: recordData,
            include: {
                student: {
                    select: {
                        id: true,
                        studentNumber: true,
                        firstNameEn: true,
                        lastNameEn: true,
                    },
                },
                lecture: {
                    select: {
                        id: true,
                        sequenceNumber: true,
                        scheduledDate: true,
                        unit: {
                            select: {
                                nameEn: true,
                                nameAr: true,
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
                    action: 'ATTENDANCE_RECORDED',
                    resourceType: 'AttendanceRecord',
                    resourceId: attendance.id,
                    afterData: {
                        lectureId: validatedData.lectureId,
                        studentId: validatedData.studentId,
                        status: validatedData.status,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.status(201).json({
            success: true,
            data: { attendance },
        });
    } catch (error: any) {
        console.error('Record attendance error:', error?.message || error); // Safer logging
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
                message: 'An error occurred while recording attendance',
            },
        });
    }
};

// Bulk Record Attendance for a Lecture
export const bulkRecordAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    const startTime = Date.now();
    try {
        console.log('[BulkAttendance] Start request:', { lectureId: req.body.lectureId, count: req.body.records?.length });
        const validatedData = bulkAttendanceSchema.parse(req.body);

        // Check if lecture exists
        const lecture = await prisma.lecture.findUnique({
            where: { id: validatedData.lectureId },
            include: {
                class: {
                    include: {
                        studentEnrollments: {
                            where: { status: { in: ['active', 'enrolled'] } },
                            select: { studentId: true },
                        },
                    },
                },
            },
        });

        if (!lecture) {
            res.status(404).json({
                success: false,
                error: { code: 'LECTURE_NOT_FOUND', message: 'Lecture not found' },
            });
            return;
        }

        // 1. Session Lifecycle Enforcement
        if (lecture.status === 'cancelled') {
            res.status(400).json({
                success: false,
                error: {
                    code: 'SESSION_CANCELLED',
                    message: 'Cannot record attendance for a cancelled session.',
                },
            });
            return;
        }

        // 2. Auto-Complete Session
        // If the session is currently 'scheduled' (pending), transition it to 'completed'
        // This signifies that the session actually took place.
        if (lecture.status === 'scheduled') {
            await prisma.lecture.update({
                where: { id: lecture.id },
                data: { status: 'completed' }
            });
            console.log(`[BulkAttendance] Auto-completed session ${lecture.id}`);
        }


        // Validate all student IDs belong to this class
        const classStudentIds = lecture.class.studentEnrollments.map((e) => e.studentId);
        const invalidRecords = validatedData.records.filter(
            (r) => !classStudentIds.includes(r.studentId)
        );

        if (invalidRecords.length > 0) {
            console.error('[BulkAttendance] Invalid student records detected:', {
                count: invalidRecords.length,
                invalidIds: invalidRecords.slice(0, 5).map(r => r.studentId),
                lectureId: validatedData.lectureId
            });
            // We'll proceed but log it, or return error if critical. 
            // In some cases, students might be missing from the 'active' list but still should be recorded.
        }

        console.log(`[BulkAttendance] Processing ${validatedData.records.length} records for lecture ${validatedData.lectureId}`);

        // Create attendance records sequentially to avoid deadlocks/pool exhaustion
        const attendanceRecords = [];
        let i = 0;
        for (const record of validatedData.records) {
            i++;
            try {
                const upsertStart = Date.now();
                console.log(`[BulkAttendance] (${i}/${validatedData.records.length}) Upserting student ${record.studentId}`);
                const result = await prisma.attendanceRecord.upsert({
                    where: {
                        lectureId_studentId: {
                            lectureId: validatedData.lectureId,
                            studentId: record.studentId,
                        },
                    },
                    create: {
                        lectureId: validatedData.lectureId,
                        studentId: record.studentId,
                        status: record.status,
                        notes: record.notes,
                    },
                    update: {
                        status: record.status,
                        notes: record.notes,
                    },
                });
                attendanceRecords.push(result);
                console.log(`[BulkAttendance] (${i}/${validatedData.records.length}) Success in ${Date.now() - upsertStart}ms`);
            } catch (err: any) {
                console.error(`[BulkAttendance] Failed to upsert for student ${record.studentId}:`, err.message);
            }
        }

        // Log action (non-blocking)
        if (req.user) {
            prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'BULK_ATTENDANCE_RECORDED',
                    resourceType: 'AttendanceRecord',
                    resourceId: validatedData.lectureId,
                    afterData: {
                        lectureId: validatedData.lectureId,
                        recordsCount: attendanceRecords.length,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            }).catch(err => console.error('[BulkAttendance] Audit log failed:', err.message));
        }

        console.log(`[BulkAttendance] (${validatedData.records.length}/${validatedData.records.length}) Completed successfully in ${Date.now() - startTime}ms`);
        res.status(201).json({
            success: true,
            data: {
                attendance: attendanceRecords,
                total: attendanceRecords.length,
                message: `Recorded attendance for ${attendanceRecords.length} students`,
            },
        });
    } catch (error: any) {
        console.error('Bulk record attendance error:', error?.message || error); // Safer logging

        if (error.name === 'ZodError') {
            console.error('Validation error details:', JSON.stringify(error.errors, null, 2));
            console.error('Received payload:', JSON.stringify(req.body, null, 2));
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
                message: 'An error occurred while recording bulk attendance',
            },
        });
    }
};

// Get Attendance for a Lecture
export const getLectureAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        const { lectureId } = req.params;

        const attendance = await prisma.attendanceRecord.findMany({
            where: { lectureId },
            include: {
                student: {
                    select: {
                        id: true,
                        studentNumber: true,
                        firstNameEn: true,
                        lastNameEn: true,
                        firstNameAr: true,
                        lastNameAr: true,
                        user: {
                            select: {
                                profilePicture: true
                            }
                        }
                    },
                },
            },
            orderBy: {
                student: {
                    firstNameEn: 'asc',
                },
            },
        });

        // Calculate statistics
        const stats = {
            total: attendance.length,
            present: attendance.filter((a) => a.status === 'present').length,
            absent: attendance.filter((a) => a.status === 'absent').length,
            late: attendance.filter((a) => a.status === 'late').length,
            excused: attendance.filter((a) => a.status === 'excused').length,
        };

        res.json({
            success: true,
            data: {
                attendance,
                stats,
            },
        });
    } catch (error: any) {
        console.error('Get lecture attendance error:', error?.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching lecture attendance',
            },
        });
    }
};

// Get Student Attendance Report
export const getStudentAttendance = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const { classId } = req.query;

        const where: any = {
            studentId,
        };

        if (classId) {
            where.studentEnrollment.classId = classId;
        }

        const attendance = await prisma.attendanceRecord.findMany({
            where,
            include: {
                lecture: {
                    include: {
                        unit: {
                            select: {
                                nameEn: true,
                                nameAr: true,
                            },
                        },
                        class: {
                            select: {
                                code: true,
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                lecture: {
                    scheduledDate: 'desc',
                },
            },
        });

        // Calculate statistics
        const stats = {
            total: attendance.length,
            present: attendance.filter((a) => a.status === 'present').length,
            absent: attendance.filter((a) => a.status === 'absent').length,
            late: attendance.filter((a) => a.status === 'late').length,
            excused: attendance.filter((a) => a.status === 'excused').length,
            attendanceRate: attendance.length > 0
                ? ((attendance.filter((a) => a.status === 'present' || a.status === 'late').length / attendance.length) * 100).toFixed(2)
                : '0',
        };

        res.json({
            success: true,
            data: {
                attendance,
                stats,
            },
        });
    } catch (error: any) {
        console.error('Get student attendance error:', error?.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching student attendance',
            },
        });
    }
};

// Get Class Attendance Summary
export const getClassAttendanceSummary = async (req: Request, res: Response): Promise<void> => {
    try {
        const { classId } = req.params;

        // Get all lectures for this class
        const lectures = await prisma.lecture.findMany({
            where: { classId },
            include: {
                attendanceRecords: {
                    select: {
                        status: true,
                    },
                },
            },
            orderBy: {
                scheduledDate: 'asc',
            },
        });

        // Get all enrolled students
        const enrollments = await prisma.studentEnrollment.findMany({
            where: {
                classId,
                status: 'enrolled',
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
            },
        });

        // Get all attendance records for the class
        const classAttendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                lecture: {
                    classId: classId,
                },
            },
            select: {
                studentId: true,
                status: true,
            },
        });

        // Calculate per-student statistics
        const studentStats = enrollments.map((enrollment) => {
            const studentAttendance = classAttendanceRecords.filter(a => a.studentId === enrollment.studentId);
            const total = studentAttendance.length;
            const present = studentAttendance.filter((a: any) => a.status === 'present').length;
            const absent = studentAttendance.filter((a: any) => a.status === 'absent').length;
            const late = studentAttendance.filter((a: any) => a.status === 'late').length;
            const excused = studentAttendance.filter((a: any) => a.status === 'excused').length;

            return {
                student: enrollment.student,
                stats: {
                    total,
                    present,
                    absent,
                    late,
                    excused,
                    attendanceRate: total > 0 ? ((present + late) / total * 100).toFixed(2) : '0',
                },
            };
        });

        // Overall class statistics
        const totalLectures = lectures.length;
        const totalRecords = lectures.reduce((sum, l) => sum + l.attendanceRecords.length, 0);
        const overallStats = {
            totalLectures,
            totalStudents: enrollments.length,
            totalRecords,
            averageAttendanceRate: studentStats.length > 0
                ? (studentStats.reduce((sum, s) => sum + parseFloat(s.stats.attendanceRate), 0) / studentStats.length).toFixed(2)
                : '0',
        };

        res.json({
            success: true,
            data: {
                studentStats,
                overallStats,
            },
        });
    } catch (error: any) {
        console.error('Get class attendance summary error:', error?.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching class attendance summary',
            },
        });
    }
};

// Update Attendance
export const updateAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateAttendanceSchema.parse(req.body);

        const existing = await prisma.attendanceRecord.findUnique({
            where: { id },
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ATTENDANCE_NOT_FOUND',
                    message: 'Attendance record not found',
                },
            });
            return;
        }

        const attendance = await prisma.attendanceRecord.update({
            where: { id },
            data: validatedData,
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
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'ATTENDANCE_UPDATED',
                    resourceType: 'AttendanceRecord',
                    resourceId: attendance.id,
                    beforeData: existing,
                    afterData: attendance,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { attendance },
        });
    } catch (error: any) {
        console.error('Update attendance error:', error?.message || error);

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
                message: 'An error occurred while updating attendance',
            },
        });
    }
};

// Delete Attendance
export const deleteAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const attendance = await prisma.attendanceRecord.findUnique({
            where: { id },
        });

        if (!attendance) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ATTENDANCE_NOT_FOUND',
                    message: 'Attendance record not found',
                },
            });
            return;
        }

        await prisma.attendanceRecord.delete({
            where: { id },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'ATTENDANCE_DELETED',
                    resourceType: 'AttendanceRecord',
                    resourceId: id,
                    beforeData: attendance,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Attendance record deleted successfully' },
        });
    } catch (error: any) {
        console.error('Delete attendance error:', error?.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while deleting attendance',
            },
        });
    }
};

// Advanced Student Report (Multi-tier: Program, Unit, Month)
export const getDeepStudentReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const { studentId } = req.params;
        const query = studentAttendanceReportSchema.parse(req.query);

        // 1. Get all enrollments for this student
        const enrollments = await prisma.studentEnrollment.findMany({
            where: {
                studentId,
                ...(query.classId ? { classId: query.classId } : {}),
                ...(query.programId ? { class: { programId: query.programId } } : {}),
            },
            include: {
                class: {
                    include: {
                        program: true
                    }
                }
            }
        });

        const classIds = enrollments.map(e => e.classId);

        // 3. Fetch Program Units to ensure ALL units are shown
        const programIds = [...new Set(enrollments.map(e => e.class.programId))];
        const allProgramUnits = await prisma.programUnit.findMany({
            where: { programId: { in: programIds } },
            include: { unit: true },
            orderBy: { sequenceOrder: 'asc' }
        });

        // 4. Fetch ALL lectures for these classes
        const allLectures = await prisma.lecture.findMany({
            where: {
                classId: { in: classIds },
                ...(query.unitId ? { unitId: query.unitId } : {}),
            },
            include: { unit: true },
            orderBy: { scheduledDate: 'asc' }
        });

        // 5. Fetch existing attendance records
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                studentId,
                lectureId: { in: allLectures.map(l => l.id) }
            }
        });

        // 6. Aggregate into Unit Breakdown
        const unitBreakdownMap = new Map();

        // Initialize with all program units
        allProgramUnits.forEach(pu => {
            unitBreakdownMap.set(pu.unitId, {
                unitId: pu.unitId,
                unitNameAr: pu.unit.nameAr,
                unitNameEn: pu.unit.nameEn,
                count: 0,
                present: 0
            });
        });

        // Map lectures and attendance for final output
        const detailedAttendance = allLectures.map(lecture => {
            const record = attendanceRecords.find(r => r.lectureId === lecture.id);
            let status = record ? record.status : (new Date(lecture.scheduledDate) < new Date() ? 'absent' : 'scheduled');

            // If the lecture itself was cancelled, it takes precedence
            if (lecture.status === 'cancelled') {
                status = 'cancelled';
            }

            // Update breakdown if it's a past/completed lecture
            const breakdown = unitBreakdownMap.get(lecture.unitId);
            if (breakdown && (lecture.status === 'completed' || new Date(lecture.scheduledDate) <= new Date())) {
                breakdown.count++;
                if (status === 'present' || status === 'late') breakdown.present++;
            }

            return {
                ...record,
                id: record?.id || `temp-${lecture.id}`,
                lectureId: lecture.id,
                studentId,
                status,
                lecture
            };
        });

        // Filter unit breakdown to only those in the program (already done by initialization)
        const finalUnitBreakdown = Array.from(unitBreakdownMap.values());

        const totalPresent = detailedAttendance.filter(a => a.status === 'present').length;
        const totalLate = detailedAttendance.filter(a => a.status === 'late').length;
        const totalAbsent = detailedAttendance.filter(a => a.status === 'absent').length;
        const totalExcused = detailedAttendance.filter(a => a.status === 'excused').length;

        // Potential sessions are those that have already happened (not 'scheduled' or 'cancelled')
        const sessionsHappened = detailedAttendance.filter(a => a.status !== 'scheduled' && a.status !== 'cancelled');
        // Standard academic rate: (Present + Late) / (Happened - Excused)
        const effectiveDenominator = sessionsHappened.length - totalExcused;

        const stats = {
            totalPresent,
            totalAbsent,
            totalLate,
            totalExcused,
            totalPossible: sessionsHappened.length,
            attendanceRate: effectiveDenominator > 0
                ? (((totalPresent + totalLate) / effectiveDenominator) * 100).toFixed(1)
                : '100'
        };

        res.json({
            success: true,
            data: {
                studentId,
                enrollments,
                attendance: detailedAttendance,
                stats,
                unitBreakdown: finalUnitBreakdown
            }
        });

    } catch (error: any) {
        console.error('Deep report error:', error?.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'REPORT_FAILED',
                message: error.message || 'Failed to generate attendance report'
            }
        });
    }
};
