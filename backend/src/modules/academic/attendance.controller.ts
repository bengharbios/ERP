import { Response, Request } from 'express';
import prisma from '../../common/db/prisma';

// Define AuthRequest type locally or import from correct location
interface AuthRequest extends Request {
    user?: {
        id: string;
        email: string;
        role: string;
    };
}

/**
 * Get all students enrolled in a class for a specific lecture
 */
export const getLectureAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { lectureId } = req.params;

        // Get lecture with class info
        console.log(`🔍 Fetching attendance for lecture: ${lectureId}`);

        const lecture = await prisma.lecture.findUnique({
            where: { id: lectureId },
            include: {
                class: {
                    include: {
                        studentEnrollments: {
                            // Removing strict 'active' filter temporarily to debug
                            include: {
                                student: {
                                    include: {
                                        user: {
                                            select: {
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
                attendanceRecords: true
            }
        });

        if (!lecture) {
            console.log(`❌ Lecture not found: ${lectureId}`);
            res.status(404).json({
                success: false,
                error: {
                    code: 'LECTURE_NOT_FOUND',
                    message: 'Lecture not found'
                }
            });
            return;
        }

        console.log(`✅ Class found: ${lecture.class.name} (ID: ${lecture.classId})`);
        console.log(`👥 Total enrollments found: ${lecture.class.studentEnrollments.length}`);

        // Build attendance list with existing records
        const attendanceList = lecture.class.studentEnrollments.map(enrollment => {
            const existingRecord = lecture.attendanceRecords.find(
                record => record.studentId === enrollment.studentId
            );

            return {
                studentId: enrollment.studentId,
                studentNumber: enrollment.student.studentNumber,
                studentName: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
                email: enrollment.student.user.email,
                phone: enrollment.student.user.phone,
                enrollmentId: enrollment.id,
                attendanceStatus: existingRecord?.status || 'not_recorded',
                attendanceRecordId: existingRecord?.id || null,
                checkInTime: existingRecord?.checkInTime || null,
                notes: existingRecord?.notes || null
            };
        });

        res.json({
            success: true,
            data: {
                lecture: {
                    id: lecture.id,
                    date: lecture.scheduledDate,
                    startTime: lecture.scheduledStartTime,
                    endTime: lecture.scheduledEndTime,
                    status: lecture.status
                },
                students: attendanceList,
                totalStudents: attendanceList.length,
                presentCount: attendanceList.filter(s => s.attendanceStatus === 'present').length,
                absentCount: attendanceList.filter(s => s.attendanceStatus === 'absent').length,
                lateCount: attendanceList.filter(s => s.attendanceStatus === 'late').length
            }
        });
    } catch (error: any) {
        console.error('Get lecture attendance error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to fetch lecture attendance'
            }
        });
    }
};

/**
 * Record or update attendance for multiple students in a lecture
 */
export const recordAttendance = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { lectureId } = req.params;
        const { records } = req.body; // Array of { studentId, status, notes }

        if (!records || !Array.isArray(records)) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'INVALID_INPUT',
                    message: 'Records must be an array'
                }
            });
            return;
        }

        // Verify lecture exists
        const lecture = await prisma.lecture.findUnique({
            where: { id: lectureId },
            include: {
                class: {
                    include: {
                        studentEnrollments: {
                            where: { status: 'active' }
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

        // Get valid student IDs for this class
        const validStudentIds = lecture.class.studentEnrollments.map(e => e.studentId);

        // Process each record
        const results = [];
        for (const record of records) {
            const { studentId, status, notes } = record;

            // Validate student is in this class
            if (!validStudentIds.includes(studentId)) {
                results.push({
                    studentId,
                    success: false,
                    error: 'Student not enrolled in this class'
                });
                continue;
            }

            // Validate status
            const validStatuses = ['present', 'absent', 'late', 'excused', 'not_studied'];
            if (!validStatuses.includes(status)) {
                results.push({
                    studentId,
                    success: false,
                    error: 'Invalid attendance status'
                });
                continue;
            }

            // Find enrollment
            const enrollment = lecture.class.studentEnrollments.find(
                e => e.studentId === studentId
            );

            try {
                // Upsert attendance record
                const attendanceRecord = await prisma.attendanceRecord.upsert({
                    where: {
                        lectureId_studentId: {
                            lectureId,
                            studentId
                        }
                    },
                    update: {
                        status,
                        notes,
                        checkInTime: status === 'present' || status === 'late' ? new Date() : null,
                        checkInMethod: 'manual',
                        recordedBy: req.user?.id
                    },
                    create: {
                        lectureId,
                        studentId,
                        studentEnrollmentId: enrollment?.id,
                        status,
                        notes,
                        checkInTime: status === 'present' || status === 'late' ? new Date() : null,
                        checkInMethod: 'manual',
                        recordedBy: req.user?.id
                    }
                });

                results.push({
                    studentId,
                    success: true,
                    recordId: attendanceRecord.id
                });
            } catch (error: any) {
                results.push({
                    studentId,
                    success: false,
                    error: error.message
                });
            }
        }

        // Audit log
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'ATTENDANCE_RECORDED',
                    resourceType: 'Lecture',
                    resourceId: lectureId,
                    afterData: { results }
                }
            });
        }

        res.json({
            success: true,
            data: {
                message: 'Attendance records processed',
                results,
                totalProcessed: results.length,
                successCount: results.filter(r => r.success).length,
                failureCount: results.filter(r => !r.success).length
            }
        });
    } catch (error: any) {
        console.error('Record attendance error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Failed to record attendance'
            }
        });
    }
};
