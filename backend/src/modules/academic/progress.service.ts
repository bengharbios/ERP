import prisma from '../../common/db/prisma';
import { startOfDay } from 'date-fns';

export class ProgressService {
    /**
     * Initializes student unit progress for a new enrollment.
     * Decisions are based on the current class schedule.
     */
    static async initializeProgress(studentId: string, enrollmentId: string, classId: string) {
        console.log(`[ProgressService] Initializing progress for Student: ${studentId}, Class: ${classId}`);

        // 1. Get Class and its Program Units
        const classData = await prisma.class.findUnique({
            where: { id: classId },
            include: {
                program: {
                    include: {
                        programUnits: {
                            orderBy: { sequenceOrder: 'asc' }
                        }
                    }
                }
            }
        });

        if (!classData || !classData.program) {
            console.error(`[ProgressService] Class or Program not found for classId: ${classId}`);
            return;
        }

        // 2. Get all lectures for this class to determine current progress
        const lectures = await prisma.lecture.findMany({
            where: { classId },
            orderBy: { scheduledDate: 'asc' }
        });

        const today = startOfDay(new Date());

        // 2.5. Get existing progress records to preserve manual overrides (like completed)
        const existingProgress = await prisma.studentUnitProgress.findMany({
            where: { enrollmentId }
        });

        // 3. Determine status for each unit in the program
        const progressData = classData.program.programUnits.map(pu => {
            const unitId = pu.unitId;
            const existing = existingProgress.find(p => p.unitId === unitId);

            // Priority 1: Keep Completed status if it was manually/previously set
            if (existing?.status === 'completed') {
                return {
                    studentId,
                    enrollmentId,
                    unitId,
                    status: 'completed',
                    startDate: existing.startDate,
                    completionDate: existing.completionDate,
                    grade: existing.grade
                };
            }

            const unitLectures = lectures.filter(l => l.unitId === unitId);
            let status = 'not_started';
            let startDate = null;

            if (unitLectures.length > 0) {
                const firstLectureDate = new Date(unitLectures[0].scheduledDate);
                const lastLectureDate = new Date(unitLectures[unitLectures.length - 1].scheduledDate);

                if (startOfDay(lastLectureDate) < today) {
                    // Entire unit is in the past
                    status = 'missing';
                } else if (startOfDay(firstLectureDate) <= today) {
                    // Unit has started but hasn't finished
                    status = 'in_progress';
                    startDate = firstLectureDate;
                } else {
                    // Unit is in the future
                    status = 'not_started';
                }
            }

            return {
                studentId,
                enrollmentId,
                unitId,
                status,
                startDate,
                completionDate: null,
                grade: null
            };
        });

        // 4. Update progress records in a transaction
        await prisma.$transaction([
            prisma.studentUnitProgress.deleteMany({
                where: { enrollmentId }
            }),
            prisma.studentUnitProgress.createMany({
                data: progressData
            })
        ]);

        console.log(`[ProgressService] Synced ${progressData.length} progress records for student ${studentId}`);
    }
}
