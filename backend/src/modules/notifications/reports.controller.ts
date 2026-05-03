import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import {
    studentProgressReportSchema,
    attendanceReportSchema,
    classPerformanceReportSchema,
} from './notifications.validation';

// Student Progress Report
export const getStudentProgressReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = studentProgressReportSchema.parse(req.query);

        const student = await prisma.student.findUnique({
            where: { id: validatedData.studentId },
            include: {
                user: {
                    select: {
                        email: true,
                        username: true,
                    },
                },
            },
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

        // Get enrollments
        const enrollmentWhere: any = { studentId: validatedData.studentId };
        if (validatedData.classId) {
            enrollmentWhere.classId = validatedData.classId;
        }

        const enrollments = await prisma.studentEnrollment.findMany({
            where: enrollmentWhere,
            include: {
                class: {
                    include: {
                        program: {
                            select: {
                                code: true,
                                nameEn: true,
                                nameAr: true,
                            },
                        },
                    },
                },
            },
        });

        // Get submissions with grades
        const submissions = await prisma.studentAssignment.findMany({
            where: {
                studentEnrollment: {
                    studentId: validatedData.studentId,
                },
            },
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
        });

        // Calculate BTEC grades summary
        const gradeSummary = {
            total: submissions.length,
            pass: submissions.filter((s) => s.grade === 'pass').length,
            merit: submissions.filter((s) => s.grade === 'merit').length,
            distinction: submissions.filter((s) => s.grade === 'distinction').length,
            refer: submissions.filter((s) => s.grade === 'refer').length,
            notGraded: submissions.filter((s) => !s.grade || s.grade === 'not_graded').length,
        };

        // Get attendance records
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                studentEnrollment: {
                    studentId: validatedData.studentId,
                },
            },
        });

        const attendanceSummary = {
            total: attendanceRecords.length,
            present: attendanceRecords.filter((a) => a.status === 'present').length,
            absent: attendanceRecords.filter((a) => a.status === 'absent').length,
            late: attendanceRecords.filter((a) => a.status === 'late').length,
            excused: attendanceRecords.filter((a) => a.status === 'excused').length,
            attendanceRate:
                attendanceRecords.length > 0
                    ? (
                        (attendanceRecords.filter((a) => a.status === 'present' || a.status === 'late')
                            .length /
                            attendanceRecords.length) *
                        100
                    ).toFixed(2)
                    : '0.00',
        };

        res.json({
            success: true,
            data: {
                student: {
                    id: student.id,
                    studentNumber: student.studentNumber,
                    firstNameEn: student.firstNameEn,
                    lastNameEn: student.lastNameEn,
                    firstNameAr: student.firstNameAr,
                    lastNameAr: student.lastNameAr,
                    email: student.user?.email,
                },
                enrollments,
                gradeSummary,
                attendanceSummary,
                submissions,
                generatedAt: new Date(),
            },
        });
    } catch (error: any) {
        console.error('Student progress report error:', error);

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
                message: 'An error occurred while generating report',
            },
        });
    }
};

// Attendance Report
export const getAttendanceReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = attendanceReportSchema.parse(req.query);

        const classData = await prisma.class.findUnique({
            where: { id: validatedData.classId },
            include: {
                program: {
                    select: {
                        code: true,
                        nameEn: true,
                        nameAr: true,
                    },
                },
                academicYear: {
                    select: {
                        name: true,
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

        // Get all enrollments
        const enrollments = await prisma.studentEnrollment.findMany({
            where: { classId: validatedData.classId },
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
        });

        // Get attendance records with date filter
        const where: any = {
            studentEnrollment: {
                classId: validatedData.classId,
            },
        };

        if (validatedData.startDate || validatedData.endDate) {
            where.recordedAt = {};
            if (validatedData.startDate) {
                where.recordedAt.gte = new Date(validatedData.startDate);
            }
            if (validatedData.endDate) {
                where.recordedAt.lte = new Date(validatedData.endDate);
            }
        }

        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where,
            include: {
                lecture: {
                    select: {
                        scheduledDate: true,
                        scheduledStartTime: true,
                        scheduledEndTime: true,
                    },
                },
                studentEnrollment: {
                    select: {
                        studentId: true,
                    },
                },
            },
        });

        // Calculate per-student statistics
        const studentStats = enrollments.map((enrollment) => {
            const studentRecords = attendanceRecords.filter(
                (r) => r.studentEnrollment?.studentId === enrollment.student.id
            );

            const total = studentRecords.length;
            const present = studentRecords.filter((r) => r.status === 'present').length;
            const absent = studentRecords.filter((r) => r.status === 'absent').length;
            const late = studentRecords.filter((r) => r.status === 'late').length;
            const excused = studentRecords.filter((r) => r.status === 'excused').length;

            return {
                student: enrollment.student,
                stats: {
                    total,
                    present,
                    absent,
                    late,
                    excused,
                    attendanceRate: total > 0 ? (((present + late) / total) * 100).toFixed(2) : '0.00',
                },
            };
        });

        // Overall statistics
        const overallStats = {
            totalLectures: await prisma.lecture.count({
                where: { classId: validatedData.classId },
            }),
            totalStudents: enrollments.length,
            totalRecords: attendanceRecords.length,
            averageAttendanceRate:
                studentStats.length > 0
                    ? (
                        studentStats.reduce((sum, s) => sum + parseFloat(s.stats.attendanceRate), 0) /
                        studentStats.length
                    ).toFixed(2)
                    : '0.00',
        };

        res.json({
            success: true,
            data: {
                class: classData,
                studentStats,
                overallStats,
                dateRange: {
                    startDate: validatedData.startDate,
                    endDate: validatedData.endDate,
                },
                generatedAt: new Date(),
            },
        });
    } catch (error: any) {
        console.error('Attendance report error:', error);

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
                message: 'An error occurred while generating report',
            },
        });
    }
};

// Class Performance Report
export const getClassPerformanceReport = async (req: Request, res: Response): Promise<void> => {
    try {
        const validatedData = classPerformanceReportSchema.parse(req.query);

        const classData = await prisma.class.findUnique({
            where: { id: validatedData.classId },
            include: {
                program: {
                    select: {
                        code: true,
                        nameEn: true,
                        nameAr: true,
                    },
                },
                academicYear: {
                    select: {
                        name: true,
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

        // Get all submissions for this class
        const submissions = await prisma.studentAssignment.findMany({
            where: {
                studentEnrollment: {
                    classId: validatedData.classId,
                },
            },
            include: {
                assignment: {
                    select: {
                        id: true,
                        title: true,
                        unit: {
                            select: {
                                code: true,
                                nameEn: true,
                            },
                        },
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

        // BTEC Grade Distribution
        const gradeDistribution = {
            pass: submissions.filter((s) => s.grade === 'pass').length,
            merit: submissions.filter((s) => s.grade === 'merit').length,
            distinction: submissions.filter((s) => s.grade === 'distinction').length,
            refer: submissions.filter((s) => s.grade === 'refer').length,
            notGraded: submissions.filter((s) => !s.grade || s.grade === 'not_graded').length,
        };

        // Top performers (students with most distinctions)
        const studentPerformance = new Map<string, any>();

        submissions.forEach((sub) => {
            const studentId = sub.studentEnrollment?.student.id;
            if (!studentId) return;

            if (!studentPerformance.has(studentId)) {
                studentPerformance.set(studentId, {
                    student: sub.studentEnrollment!.student,
                    pass: 0,
                    merit: 0,
                    distinction: 0,
                    refer: 0,
                    total: 0,
                });
            }

            const stats = studentPerformance.get(studentId);
            stats.total++;
            if (sub.grade === 'pass') stats.pass++;
            else if (sub.grade === 'merit') stats.merit++;
            else if (sub.grade === 'distinction') stats.distinction++;
            else if (sub.grade === 'refer') stats.refer++;
        });

        const topPerformers = Array.from(studentPerformance.values())
            .sort((a, b) => b.distinction - a.distinction)
            .slice(0, 5);

        // Attendance summary
        const attendanceRecords = await prisma.attendanceRecord.findMany({
            where: {
                studentEnrollment: {
                    classId: validatedData.classId,
                },
            },
        });

        const attendanceSummary = {
            totalRecords: attendanceRecords.length,
            present: attendanceRecords.filter((a) => a.status === 'present').length,
            absent: attendanceRecords.filter((a) => a.status === 'absent').length,
            late: attendanceRecords.filter((a) => a.status === 'late').length,
            averageRate:
                attendanceRecords.length > 0
                    ? (
                        ((attendanceRecords.filter((a) => a.status === 'present' || a.status === 'late')
                            .length /
                            attendanceRecords.length) *
                            100)
                    ).toFixed(2)
                    : '0.00',
        };

        res.json({
            success: true,
            data: {
                class: classData,
                gradeDistribution,
                topPerformers,
                attendanceSummary,
                totalStudents: await prisma.studentEnrollment.count({
                    where: { classId: validatedData.classId },
                }),
                totalAssignments: await prisma.assignment.count(),
                generatedAt: new Date(),
            },
        });
    } catch (error: any) {
        console.error('Class performance report error:', error);

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
                message: 'An error occurred while generating report',
            },
        });
    }
};
