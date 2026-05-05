import { Request, Response } from 'express';
import prisma from '../../common/db/prisma';
import fs from 'fs';
import path from 'path';
import { AuthRequest } from '../../common/utils/jwt';
import {
    createClassSchema,
    updateClassSchema,
    assignInstructorSchema,
    enrollStudentSchema,
    interruptionSchema,
    transferStudentSchema,
} from './academic.validation';
import { generateLectureSchedule, calculateExpectedEndDate } from './scheduling.service';
import { handleLectureInterruption } from './dynamic_scheduling.service';
import { suggestNextUnit } from './suggestion.service';
import { ProgressService } from './progress.service';

// Create Class with Auto-Scheduling
export const createClass = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = createClassSchema.parse(req.body);

        // Check if code already exists
        const existing = await prisma.class.findUnique({
            where: { code: validatedData.code },
        });

        if (existing) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'CLASS_EXISTS',
                    message: 'Class with this code already exists',
                },
            });
            return;
        }

        // Get program with units
        const program = await prisma.program.findUnique({
            where: { id: validatedData.programId },
            include: {
                programUnits: {
                    include: {
                        unit: true,
                    },
                    orderBy: {
                        sequenceOrder: 'asc',
                    },
                },
            },
        });

        if (!program) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'PROGRAM_NOT_FOUND',
                    message: 'Program not found',
                },
            });
            return;
        }

        if (program.programUnits.length === 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'PROGRAM_NO_UNITS',
                    message: 'Program has no units assigned',
                },
            });
            return;
        }

        // Calculate total lectures
        const totalLectures = program.programUnits.reduce(
            (sum, pu) => sum + pu.unit.totalLectures,
            0
        );

        // Calculate initial expected end date
        const startDate = new Date(`${validatedData.startDate}T00:00:00Z`);
        const initialExpectedEndDate = calculateExpectedEndDate({
            startDate,
            studyDays: validatedData.studyDays,
            totalLectures,
        });

        // Create class
        const newClass = await prisma.class.create({
            data: {
                code: validatedData.code,
                name: validatedData.name,
                programId: validatedData.programId,
                startDate,
                durationMonths: validatedData.durationMonths,
                expectedEndDate: initialExpectedEndDate,
                studyDays: validatedData.studyDays || [],
                studyDaysPerWeek: validatedData.studyDays ? validatedData.studyDays.length : 0,
                lectureStartTime: validatedData.lectureStartTime ? new Date(`1970-01-01T${validatedData.lectureStartTime}:00Z`) : null,
                lectureEndTime: validatedData.lectureEndTime ? new Date(`1970-01-01T${validatedData.lectureEndTime}:00Z`) : null,
                defaultRoom: validatedData.defaultRoom,
                maxStudents: validatedData.maxStudents,
                status: 'active',
                studyMode: validatedData.studyMode,
                studyLanguage: validatedData.studyLanguage,
                classroom: validatedData.classroom,
                building: validatedData.building,
                defaultZoomLink: validatedData.defaultZoomLink,
            },
        });

        // Handle Scheduling based on Mode
        if (validatedData.studyMode === 'SELF_PACED') {
            // ==========================================
            // SELF-PACED LOGIC (Timeline)
            // ==========================================
            const totalDurationDays = validatedData.durationMonths * 30; // Approximate
            const unitsToSchedule = program.programUnits.map(pu => pu.unit);

            // Calculate total weight (credits)
            const totalCredits = unitsToSchedule.reduce((sum, u) => sum + (u.creditHours || 0), 0);
            const useWeights = totalCredits > 0;

            let currentStartDate = new Date(startDate);
            const unitSchedules = [];

            for (const unit of unitsToSchedule) {
                let unitDurationDays;
                if (useWeights) {
                    unitDurationDays = Math.ceil(((unit.creditHours || 0) / totalCredits) * totalDurationDays);
                } else {
                    unitDurationDays = Math.ceil(totalDurationDays / unitsToSchedule.length);
                }

                // Minimum 1 day
                if (unitDurationDays < 1) unitDurationDays = 1;

                const unitEndDate = new Date(currentStartDate);
                unitEndDate.setDate(unitEndDate.getDate() + unitDurationDays);

                unitSchedules.push({
                    classId: newClass.id,
                    unitId: unit.id,
                    startDate: new Date(currentStartDate),
                    endDate: new Date(unitEndDate),
                    status: 'upcoming'
                });

                // Next unit starts the day after this one ends
                currentStartDate = new Date(unitEndDate);
                currentStartDate.setDate(currentStartDate.getDate() + 1);
            }

            if (unitSchedules.length > 0) {
                // Bulk insert using separate queries (Prisma createsMany is efficient)
                await prisma.classUnitSchedule.createMany({
                    data: unitSchedules
                });

                // Update expected end date to the last unit's end date
                const finalEndDate = unitSchedules[unitSchedules.length - 1].endDate;
                await prisma.class.update({
                    where: { id: newClass.id },
                    data: { expectedEndDate: finalEndDate }
                });
            }

        } else {
            // ==========================================
            // LECTURE LOGIC (In-Person / Online)
            // ==========================================

            // Generate lecture schedule
            const { unitSelections, unitInstructors } = validatedData;
            const selectedUnitIds = unitSelections && unitSelections.length > 0
                ? unitSelections.map(us => us.unitId)
                : (validatedData.unitIds && validatedData.unitIds.length > 0 ? validatedData.unitIds : program.programUnits.map(pu => pu.unitId));

            const filteredUnits = program.programUnits
                .filter(pu => selectedUnitIds.includes(pu.unitId))
                .map((pu) => {
                    const selection = unitSelections?.find(us => us.unitId === pu.unitId);
                    return {
                        id: pu.unit.id,
                        totalLectures: selection ? selection.totalLectures : pu.unit.totalLectures,
                        sequenceOrder: pu.sequenceOrder || 0,
                    };
                });

            const schedule = generateLectureSchedule({
                startDate,
                durationMonths: validatedData.durationMonths,
                studyDays: validatedData.studyDays || [],
                lectureStartTime: validatedData.lectureStartTime || '09:00',
                lectureEndTime: validatedData.lectureEndTime || '12:00',
                units: filteredUnits,
                forceAllUnits: true,
            });

            // Calculate actual expected end date from schedule
            let actualExpectedEndDate = initialExpectedEndDate;
            if (schedule.length > 0) {
                actualExpectedEndDate = schedule[schedule.length - 1].scheduledDate;
            }

            // Create lectures in database
            await Promise.all(
                schedule.map((lecture) => {
                    const instructorAssignment = unitInstructors?.find(ui => ui.unitId === lecture.unitId);
                    return prisma.lecture.create({
                        data: {
                            classId: newClass.id,
                            unitId: lecture.unitId,
                            sequenceNumber: lecture.sequenceNumber,
                            scheduledDate: lecture.scheduledDate,
                            scheduledStartTime: lecture.scheduledStartTime,
                            scheduledEndTime: lecture.scheduledEndTime,
                            room: validatedData.defaultRoom,
                            status: 'scheduled',
                            instructorId: instructorAssignment?.instructorId || null
                        },
                    });
                })
            );

            // Update class with actual expected end date
            if (actualExpectedEndDate.getTime() !== initialExpectedEndDate.getTime()) {
                await prisma.class.update({
                    where: { id: newClass.id },
                    data: { expectedEndDate: actualExpectedEndDate }
                });
            }
        }

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'CLASS_CREATED',
                    resourceType: 'Class',
                    resourceId: newClass.id,
                    afterData: JSON.stringify({
                        code: newClass.code,
                        name: newClass.name,
                        studyMode: validatedData.studyMode,
                    }),
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        // Fetch complete class with lectures
        const completeClass = await prisma.class.findUnique({
            where: { id: newClass.id },
            include: {
                program: {
                    select: {
                        id: true,
                        code: true,
                        nameEn: true,
                        nameAr: true,
                    },
                },
                lectures: {
                    include: {
                        unit: {
                            select: {
                                id: true,
                                code: true,
                                nameEn: true,
                                nameAr: true,
                            },
                        },
                        instructor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                    orderBy: [{ scheduledDate: 'asc' }, { sequenceNumber: 'asc' }],
                    take: 10, // Return first 10 lectures
                },
                _count: {
                    select: {
                        lectures: true,
                        studentEnrollments: true,
                    },
                },
            },
        });

        res.status(201).json({
            success: true,
            data: {
                class: completeClass,
                message: `Class created successfully`,
            },
        });
    } catch (error: any) {
        console.error('Create class error:', error.message || error);

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
                message: 'An error occurred while creating the class',
            },
        });
    }
};

// Get All Classes
export const getClasses = async (req: Request, res: Response): Promise<void> => {
    try {
        const { status, programId } = req.query;

        const where: any = {};
        if (status) where.status = status;
        if (programId) where.programId = programId;

        const classes = await prisma.class.findMany({
            where,
            include: {
                program: {
                    include: {
                        programLevel: true,
                        awardingBody: true,
                        programUnits: {
                            include: {
                                unit: {
                                    select: {
                                        id: true,
                                        code: true,
                                        nameAr: true,
                                        nameEn: true,
                                        creditHours: true,
                                        totalLectures: true,
                                    },
                                },
                            },
                            orderBy: {
                                sequenceOrder: 'asc',
                            },
                        },
                    },
                },
                lectures: {
                    select: {
                        unitId: true,
                        instructorId: true,
                        instructor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            }
                        }
                    },
                },
                _count: {
                    select: {
                        lectures: true,
                        studentEnrollments: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        res.json({
            success: true,
            data: {
                classes,
                total: classes.length,
            },
        });
    } catch (error: any) {
        console.error('Get classes error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching classes',
            },
        });
    }
};

// Get Class by ID
export const getClassById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const classData = await prisma.class.findUnique({
            where: { id },
            include: {
                program: {
                    include: {
                        programLevel: true,
                        awardingBody: true,
                        programUnits: {
                            include: {
                                unit: true,
                            },
                            orderBy: {
                                sequenceOrder: 'asc',
                            },
                        },
                    },
                },
                lectures: {
                    include: {
                        unit: {
                            select: {
                                id: true,
                                code: true,
                                nameEn: true,
                                nameAr: true,
                            },
                        },
                        instructor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            },
                        },
                        _count: {
                            select: {
                                attendanceRecords: true,
                            },
                        },
                    },
                    orderBy: [{ scheduledDate: 'asc' }, { sequenceNumber: 'asc' }],
                },
                studentEnrollments: {
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
                unitSchedules: {
                    include: {
                        unit: {
                            select: {
                                id: true,
                                code: true,
                                nameEn: true,
                                nameAr: true,
                            }
                        }
                    },
                    orderBy: {
                        startDate: 'asc'
                    }
                },
                _count: {
                    select: {
                        lectures: true,
                        studentEnrollments: true,
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

        res.json({
            success: true,
            data: { class: classData },
        });
    } catch (error: any) {
        console.error('Get class error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching the class',
            },
        });
    }
};


// Helper for safe time comparison
const formatTimeForCompare = (date: Date | null | undefined): string | null => {
    if (!date) return null;
    try {
        return date.getUTCHours().toString().padStart(2, '0') + ':' +
            date.getUTCMinutes().toString().padStart(2, '0');
    } catch (e) {
        return null;
    }
};

// Update Class
export const updateClass = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = updateClassSchema.parse(req.body);

        const existing = await prisma.class.findUnique({
            where: { id },
            include: { lectures: true }
        });

        if (!existing) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'CLASS_NOT_FOUND',
                    message: 'Class not found',
                },
            });
            return;
        }

        // Check if code is being changed and already exists
        if (validatedData.code && validatedData.code !== existing.code) {
            const codeExists = await prisma.class.findUnique({
                where: { code: validatedData.code },
            });

            if (codeExists) {
                res.status(409).json({
                    success: false,
                    error: {
                        code: 'CODE_EXISTS',
                        message: 'Class code already exists',
                    },
                });
                return;
            }
        }

        // Prepare update data
        const updateData: any = { ...validatedData };
        if (validatedData.lectureStartTime) {
            updateData.lectureStartTime = new Date(`1970-01-01T${validatedData.lectureStartTime}:00Z`);
        } else if (validatedData.lectureStartTime === '') {
            updateData.lectureStartTime = null;
        }

        if (validatedData.lectureEndTime) {
            updateData.lectureEndTime = new Date(`1970-01-01T${validatedData.lectureEndTime}:00Z`);
        } else if (validatedData.lectureEndTime === '') {
            updateData.lectureEndTime = null;
        }
        if (validatedData.startDate) {
            updateData.startDate = new Date(`${validatedData.startDate}T00:00:00Z`);
        }
        if (validatedData.studyDays) {
            updateData.studyDaysPerWeek = validatedData.studyDays.length;
        }

        // Extract unitIds and forceRegenerate for re-scheduling
        const { unitIds, unitSelections, unitInstructors, forceRegenerate } = validatedData;
        delete updateData.unitIds;
        delete updateData.unitSelections;
        delete updateData.unitInstructors;
        delete updateData.forceRegenerate;

        const classData = await prisma.class.update({
            where: { id },
            data: updateData,
            include: {
                program: {
                    include: {
                        programUnits: { include: { unit: true } }
                    }
                },
                lectures: true,
            },
        });

        if (unitIds || unitSelections || validatedData.startDate || validatedData.studyDays || validatedData.durationMonths ||
            validatedData.lectureStartTime || validatedData.lectureEndTime || forceRegenerate) {
            const currentUnitIds = (existing?.lectures || []).map(l => l.unitId);
            const currentUniqueIds = [...new Set(currentUnitIds)];

            const isUnitsChanged = (unitIds !== undefined || unitSelections !== undefined) && (
                // Simplified check: if selections or ids provided, or if counts changed
                true
            );

            const isParamsChanged =
                (validatedData.startDate && validatedData.startDate !== existing?.startDate.toISOString().split('T')[0]) ||
                (validatedData.durationMonths && validatedData.durationMonths !== existing?.durationMonths) ||
                (validatedData.studyDays && JSON.stringify(validatedData.studyDays) !== JSON.stringify(existing?.studyDays)) ||
                (validatedData.lectureStartTime && validatedData.lectureStartTime !== formatTimeForCompare(existing?.lectureStartTime)) ||
                (validatedData.lectureEndTime && validatedData.lectureEndTime !== formatTimeForCompare(existing?.lectureEndTime)) ||
                forceRegenerate === true;

            if (isUnitsChanged || isParamsChanged) {
                // Delete existing lectures
                await prisma.lecture.deleteMany({ where: { classId: id } });

                // Prepare units for generator
                const finalUnitIds = unitSelections ? unitSelections.map(us => us.unitId) : (unitIds !== undefined ? unitIds : currentUniqueIds);

                const filteredUnits = classData.program.programUnits
                    .filter((pu: any) => finalUnitIds.includes(pu.unitId))
                    .map((pu: any) => {
                        const selection = unitSelections?.find(us => us.unitId === pu.unitId);
                        return {
                            id: pu.unit.id,
                            totalLectures: selection ? selection.totalLectures : pu.unit.totalLectures,
                            sequenceOrder: pu.sequenceOrder || 0,
                        };
                    });

                // Re-generate schedule
                const schedule = generateLectureSchedule({
                    startDate: classData.startDate,
                    durationMonths: classData.durationMonths,
                    studyDays: classData.studyDays,
                    lectureStartTime: classData.lectureStartTime ?
                        classData.lectureStartTime.getUTCHours().toString().padStart(2, '0') + ':' +
                        classData.lectureStartTime.getUTCMinutes().toString().padStart(2, '0') :
                        '09:00',
                    lectureEndTime: classData.lectureEndTime ?
                        classData.lectureEndTime.getUTCHours().toString().padStart(2, '0') + ':' +
                        classData.lectureEndTime.getUTCMinutes().toString().padStart(2, '0') :
                        '12:00',
                    units: filteredUnits,
                    forceAllUnits: true,
                });

                // Create new lectures
                if (schedule.length > 0) {
                    await prisma.lecture.createMany({
                        data: schedule.map(lecture => {
                            const instructorAssignment = unitInstructors?.find(ui => ui.unitId === lecture.unitId);
                            return {
                                classId: id,
                                unitId: lecture.unitId,
                                sequenceNumber: lecture.sequenceNumber,
                                scheduledDate: lecture.scheduledDate,
                                scheduledStartTime: lecture.scheduledStartTime,
                                scheduledEndTime: lecture.scheduledEndTime,
                                status: 'scheduled',
                                instructorId: instructorAssignment?.instructorId || null
                            };
                        }),
                    });

                    // Update class with expected end date if possible
                    const lastLecture = schedule[schedule.length - 1];
                    if (lastLecture) {
                        await prisma.class.update({
                            where: { id },
                            data: { expectedEndDate: lastLecture.scheduledDate }
                        });
                    }
                }
            } else if (unitInstructors) {
                // Schedule not regenerated, but instructors might have changed
                await Promise.all(
                    unitInstructors.map(ui =>
                        prisma.lecture.updateMany({
                            where: {
                                classId: id,
                                unitId: ui.unitId
                            },
                            data: { instructorId: ui.instructorId || null }
                        })
                    )
                );
            }
        } else if (unitInstructors) {
            // Neither units nor major params provided, but unitInstructors might be
            await Promise.all(
                unitInstructors.map(ui =>
                    prisma.lecture.updateMany({
                        where: {
                            classId: id,
                            unitId: ui.unitId
                        },
                        data: { instructorId: ui.instructorId || null }
                    })
                )
            );
        }

        // Re-fetch final data to include updated lectures
        const finalClassData = await prisma.class.findUnique({
            where: { id },
            include: {
                program: {
                    include: {
                        programLevel: true,
                        awardingBody: true,
                        programUnits: { include: { unit: true } }
                    }
                },
                lectures: {
                    select: {
                        unitId: true,
                        instructorId: true,
                        instructor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            }
                        }
                    },
                },
                _count: {
                    select: {
                        lectures: true,
                        studentEnrollments: true,
                    },
                },
            },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'CLASS_UPDATED',
                    resourceType: 'Class',
                    resourceId: classData.id,
                    beforeData: JSON.stringify(existing),
                    afterData: JSON.stringify(finalClassData),
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { class: finalClassData },
        });
    } catch (error: any) {
        console.error('Update class error occurred.');
        // Avoid console.error(error) as it crashes on some objects in this context
        if (error instanceof Error) {
            console.error('Error Message:', error.message);
            console.error('Error Stack:', error.stack);
        } else {
            console.error('Unknown error type:', String(error));
        }

        try {
            const logPath = path.join(process.cwd(), 'debug_errors.log');
            const logEntry = `\n[${new Date().toISOString()}] UPDATE CLASS ERROR:\n${error?.stack || error}\nRequest Body: ${JSON.stringify(req.body)}\n-------------------\n`;
            fs.appendFileSync(logPath, logEntry);
        } catch (logError) {
            console.error('Failed to write to log file:', logError);
        }

        // Handle Prisma Unique Constraint Violation
        if (error.code === 'P2002') {
            res.status(409).json({
                success: false,
                error: {
                    code: 'CONFLICT',
                    message: 'Class code or name already exists',
                },
            });
            return;
        }

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
                message: 'An error occurred while updating the class',
            },
        });
    }
};

// Delete Class
export const deleteClass = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        // Fetch class with enrollments to check if it can be deleted
        const classItem = await prisma.class.findUnique({
            where: { id },
            include: {
                _count: {
                    select: { studentEnrollments: true }
                }
            }
        });

        if (!classItem) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'CLASS_NOT_FOUND',
                    message: 'Class not found',
                },
            });
            return;
        }

        // Block deletion if there are enrolled students
        if (classItem._count.studentEnrollments > 0) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'CLASS_HAS_ENROLLMENTS',
                    message: 'لا يمكن حذف الفصل لوجود طلاب مسجلين فيه. يرجى إلغاء تسجيل الطلاب أولاً.',
                },
            });
            return;
        }

        // Delete associated lectures first
        await prisma.lecture.deleteMany({
            where: { classId: id }
        });

        // Delete the class
        await prisma.class.delete({
            where: { id }
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'CLASS_DELETED',
                    resourceType: 'Class',
                    resourceId: id,
                    beforeData: JSON.stringify(classItem),
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            message: 'تم حذف الفصل الدراسي بنجاح',
        });
    } catch (error: any) {
        console.error('Delete Class Error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'DELETE_ERROR',
                message: 'حدث خطأ أثناء حذف الفصل الدراسي',
            },
        });
    }
};

// Assign Instructor to Lecture
export const assignInstructor = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = assignInstructorSchema.parse(req.body);

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

        const updatedLecture = await prisma.lecture.update({
            where: { id: validatedData.lectureId },
            data: {
                instructorId: validatedData.instructorId,
            },
            include: {
                unit: true,
                class: true,
            },
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'INSTRUCTOR_ASSIGNED',
                    resourceType: 'Lecture',
                    resourceId: updatedLecture.id,
                    afterData: JSON.stringify({ instructorId: validatedData.instructorId }),
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: {
                lecture: updatedLecture,
                message: 'Instructor assigned successfully',
            },
        });
    } catch (error: any) {
        console.error('Assign instructor error:', error.message || error);

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
                message: 'An error occurred while assigning instructor',
            },
        });
    }
};

// Enroll Student in Class
export const enrollStudent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id: classId } = req.params;
        const validatedData = enrollStudentSchema.parse(req.body);

        console.log('🔍 Enrolling student - Class ID:', classId);
        console.log('🔍 Student ID:', validatedData.studentId);

        // Check if class exists
        const classExists = await prisma.class.findUnique({
            where: { id: classId },
            include: { _count: { select: { studentEnrollments: true } }, },
        });

        console.log('🔍 Class found:', classExists ? 'Yes' : 'No');

        if (!classExists) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'CLASS_NOT_FOUND',
                    message: 'Class not found',
                },
            });
            return;
        }

        // Check if student exists
        const studentExists = await prisma.student.findUnique({
            where: { id: validatedData.studentId },
        });

        if (!studentExists) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'STUDENT_NOT_FOUND',
                    message: 'Student not found',
                },
            });
            return;
        }

        // Check if already enrolled
        const existingEnrollment = await prisma.studentEnrollment.findUnique({
            where: {
                studentId_classId: {
                    studentId: validatedData.studentId,
                    classId,
                },
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

        // Check if student is enrolled in other active classes
        const otherEnrollments = await prisma.studentEnrollment.findMany({
            where: {
                studentId: validatedData.studentId,
                class: {
                    status: 'active',
                },
                NOT: {
                    classId: classId,
                },
            },
            include: {
                class: {
                    select: {
                        name: true,
                        code: true,
                        status: true,
                    },
                },
            },
        });

        if (otherEnrollments.length > 0) {
            res.status(409).json({
                success: false,
                error: {
                    code: 'ENROLLED_IN_OTHER_CLASS',
                    message: `Student is already enrolled in ${otherEnrollments.length} other active class(es)`,
                    details: {
                        otherClasses: otherEnrollments.map(e => ({
                            classId: e.classId,
                            className: e.class.name,
                            classCode: e.class.code,
                        })),
                    },
                },
            });
            return;
        }

        // Check class capacity
        if (classExists.maxStudents && classExists._count.studentEnrollments >= classExists.maxStudents) {
            res.status(400).json({
                success: false,
                error: {
                    code: 'CLASS_FULL',
                    message: 'Class has reached maximum capacity',
                },
            });
            return;
        }

        // Create enrollment
        const enrollment = await prisma.studentEnrollment.create({
            data: {
                studentId: validatedData.studentId,
                classId,
                status: validatedData.status || 'active',
                enrollmentDate: validatedData.enrollmentDate ? new Date(validatedData.enrollmentDate) : new Date(),
            },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        // Initialize student progress for the class
        await ProgressService.initializeProgress(enrollment.studentId, enrollment.id, classId);

        // Audit log
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'STUDENT_ENROLLED',
                    resourceType: 'StudentEnrollment',
                    resourceId: enrollment.id,
                    afterData: JSON.stringify({ studentId: validatedData.studentId, classId }),
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        // Re-fetch the final class data with all details
        const finalClass = await prisma.class.findUnique({
            where: { id: classId },
            include: {
                program: {
                    include: {
                        programLevel: true,
                        awardingBody: true,
                        programUnits: {
                            include: { unit: true },
                            orderBy: { sequenceOrder: 'asc' }
                        }
                    }
                },
                lectures: {
                    include: {
                        instructor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            }
                        }
                    }
                },
                _count: {
                    select: {
                        lectures: true,
                        studentEnrollments: true,
                    },
                },
            }
        });

        res.status(201).json({
            success: true,
            data: { class: finalClass },
        });
    } catch (error: any) {
        console.error('Enroll student error:', error.message || error);

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
                message: 'An error occurred while enrolling student',
            },
        });
    }
};

// Remove Student from Class
export const removeStudent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id: classId, studentId } = req.params;

        // Find enrollment
        const enrollment = await prisma.studentEnrollment.findUnique({
            where: {
                studentId_classId: {
                    studentId,
                    classId,
                },
            },
        });

        if (!enrollment) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'ENROLLMENT_NOT_FOUND',
                    message: 'Student is not enrolled in this class',
                },
            });
            return;
        }

        // Delete enrollment
        await prisma.studentEnrollment.delete({
            where: {
                studentId_classId: {
                    studentId,
                    classId,
                },
            },
        });

        // Audit log
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'STUDENT_UNENROLLED',
                    resourceType: 'StudentEnrollment',
                    resourceId: enrollment.id,
                    beforeData: JSON.stringify({ studentId, classId }),
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({
            success: true,
            data: { message: 'Student removed from class successfully' },
        });
    } catch (error: any) {
        console.error('Remove student error:', error.message || error);

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while removing student',
            },
        });
    }
};

// Get All Students in a Class
export const getClassStudents = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id: classId } = req.params;
        const { status } = req.query;

        // Check if class exists
        const classExists = await prisma.class.findUnique({
            where: { id: classId },
        });

        if (!classExists) {
            res.status(404).json({
                success: false,
                error: {
                    code: 'CLASS_NOT_FOUND',
                    message: 'Class not found',
                },
            });
            return;
        }

        const where: any = { classId };
        if (status) where.status = status;

        const enrollments = await prisma.studentEnrollment.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                                email: true,
                                phone: true,
                            },
                        },
                    },
                },
                studentUnitProgress: true,
            },
            orderBy: {
                enrollmentDate: 'asc',
            },
        });

        res.json({
            success: true,
            data: {
                students: enrollments.map(e => ({
                    ...e.student,
                    enrollmentId: e.id,
                    enrollmentDate: e.enrollmentDate,
                    status: e.status,
                    // Include enrollment structure for frontend compatibility (Achievement Page)
                    studentEnrollments: [{
                        id: e.id,
                        classId: e.classId,
                        studentUnitProgress: e.studentUnitProgress
                    }]
                })),
                count: enrollments.length,
            },
        });
    } catch (error: any) {
        console.error('Get class students error:', error.message || error);

        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while fetching students',
            },
        });
    }
};

// Auto-Schedule Class Lectures
export const autoScheduleClass = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id: classId } = req.params;

        // Get class with program and units
        const classData = await prisma.class.findUnique({
            where: { id: classId },
            include: {
                program: {
                    include: {
                        programUnits: {
                            include: {
                                unit: true,
                            },
                            orderBy: {
                                sequenceOrder: 'asc',
                            },
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

        // Delete existing lectures if any (including postponed, cancelled, rescheduled)
        const deletedCount = await prisma.lecture.deleteMany({
            where: { classId },
        });

        console.log(`🗑️ Deleted ${deletedCount.count} existing lectures for class ${classId}`);

        // Generate schedule
        const schedule = generateLectureSchedule({
            startDate: classData.startDate,
            durationMonths: classData.durationMonths,
            studyDays: classData.studyDays,
            lectureStartTime: classData.lectureStartTime ?
                classData.lectureStartTime.getUTCHours().toString().padStart(2, '0') + ':' +
                classData.lectureStartTime.getUTCMinutes().toString().padStart(2, '0') :
                '09:00',
            lectureEndTime: classData.lectureEndTime ?
                classData.lectureEndTime.getUTCHours().toString().padStart(2, '0') + ':' +
                classData.lectureEndTime.getUTCMinutes().toString().padStart(2, '0') :
                '12:00',
            units: classData.program.programUnits.map(pu => ({
                id: pu.unit.id,
                totalLectures: pu.unit.totalLectures,
                sequenceOrder: pu.sequenceOrder || 0,
            })),
        });

        // Create all lectures in database
        const createdLectures = await prisma.lecture.createMany({
            data: schedule.map(lecture => ({
                classId,
                unitId: lecture.unitId,
                sequenceNumber: lecture.sequenceNumber,
                scheduledDate: lecture.scheduledDate,
                scheduledStartTime: lecture.scheduledStartTime,
                scheduledEndTime: lecture.scheduledEndTime,
                status: 'scheduled',
            })),
        });

        res.status(200).json({
            success: true,
            data: {
                lecturesCount: createdLectures.count,
                message: `Successfully scheduled ${createdLectures.count} lectures`,
            },
        });
    } catch (error: any) {
        console.error('Auto-schedule error:', error.message || error);

        res.status(500).json({
            success: false,
            error: {
                code: 'SCHEDULE_ERROR',
                message: 'An error occurred while scheduling lectures',
            },
        });
    }
};

// Get Unit Suggestions for Class
export const getUnitSuggestions = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const suggestions = await suggestNextUnit(id);
        res.json({ success: true, data: { suggestions } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

// Handle Class Interruption (Postpone or Skip)
export const handleInterruption = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const validatedData = interruptionSchema.parse(req.body);

        const result = await handleLectureInterruption({
            classId: id,
            interruptionDate: new Date(validatedData.date),
            mode: validatedData.mode,
            reason: validatedData.reason
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'CLASS_INTERRUPTION',
                    resourceType: 'Class',
                    resourceId: id,
                    afterData: JSON.stringify({ ...validatedData, result }),
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({ success: true, data: result });
    } catch (error: any) {
        console.error('Interruption error:', error.message || error);
        res.status(error.name === 'ZodError' ? 400 : 500).json({
            success: false,
            error: { message: error.message || 'Error handling interruption' }
        });
    }
};

// Transfer Student between Classes
export const transferStudent = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const validatedData = transferStudentSchema.parse(req.body);
        const { studentId, sourceClassId, targetClassId } = validatedData;

        // 1. Verify existence
        const [sourceEnrollment, targetClass] = await Promise.all([
            prisma.studentEnrollment.findUnique({
                where: { studentId_classId: { studentId, classId: sourceClassId } },
                include: { studentUnitProgress: true }
            }),
            prisma.class.findUnique({ where: { id: targetClassId } })
        ]);

        if (!sourceEnrollment) throw new Error('Source enrollment not found');
        if (!targetClass) throw new Error('Target class not found');

        // 2. Perform Transfer in Transaction
        await prisma.$transaction(async (tx) => {
            // Update old enrollment status
            await tx.studentEnrollment.update({
                where: { id: sourceEnrollment.id },
                data: { status: 'withdrawn', completionDate: new Date() }
            });

            // Create new enrollment
            const newEnrollment = await tx.studentEnrollment.create({
                data: {
                    studentId,
                    classId: targetClassId,
                    enrollmentDate: new Date(),
                    status: 'active'
                }
            });

            // Carry over progress records (Cloning them for the new enrollment context)
            if (sourceEnrollment.studentUnitProgress.length > 0) {
                await tx.studentUnitProgress.createMany({
                    data: sourceEnrollment.studentUnitProgress.map(p => ({
                        studentId: p.studentId,
                        enrollmentId: newEnrollment.id,
                        unitId: p.unitId,
                        status: p.status,
                        startDate: p.startDate,
                        completionDate: p.completionDate,
                        grade: p.grade
                    }))
                });
            }
        });

        // Log action
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'STUDENT_TRANSFER',
                    resourceType: 'Student',
                    resourceId: studentId,
                    afterData: JSON.stringify(validatedData),
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        res.json({ success: true, data: { message: 'Student transferred successfully' } });
    } catch (error: any) {
        res.status(500).json({ success: false, error: { message: error.message } });
    }
};

// Sync all student progress for a class
export const syncClassProgress = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;

        const enrollments = await prisma.studentEnrollment.findMany({
            where: { classId: id, status: 'active' }
        });

        console.log(`[SyncProgress] Syncing ${enrollments.length} enrollments for class ${id}`);

        for (const enrollment of enrollments) {
            await ProgressService.initializeProgress(enrollment.studentId, enrollment.id, id);
        }

        res.json({
            success: true,
            message: `Successfully synced progress for ${enrollments.length} students.`
        });
    } catch (error: any) {
        console.error('Sync progress error:', error.message || error);
        res.status(500).json({
            success: false,
            error: {
                code: 'INTERNAL_ERROR',
                message: 'An error occurred while syncing class progress',
            },
        });
    }
};
