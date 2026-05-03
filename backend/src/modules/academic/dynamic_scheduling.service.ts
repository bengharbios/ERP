import { addDays, setHours, setMinutes, startOfDay } from 'date-fns';
import prisma from '../../common/db/prisma';

export interface ShiftParams {
    classId: string;
    interruptionDate: Date;
    mode: 'SHIFT_POSTPONE' | 'CANCEL_SKIP';
    reason?: string;
}

// Helper function to get next study day
function getNextStudyDay(currentDate: Date, studyDays: string[]): Date {
    const dayMap: { [key: string]: number } = {
        'sunday': 0, 'sun': 0, 'الأحد': 0,
        'monday': 1, 'mon': 1, 'الإثنين': 1,
        'tuesday': 2, 'tue': 2, 'الثلاثاء': 2,
        'wednesday': 3, 'wed': 3, 'الأربعاء': 3,
        'thursday': 4, 'thu': 4, 'الخميس': 4,
        'friday': 5, 'fri': 5, 'الجمعة': 5,
        'saturday': 6, 'sat': 6, 'السبت': 6
    };

    let validDays = studyDays
        .map(d => dayMap[d.toLowerCase()] ?? dayMap[d])
        .filter(d => d !== undefined)
        .sort((a, b) => a - b);

    if (validDays.length === 0) return addDays(currentDate, 1);

    let nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);

    let safetyCounter = 0;
    while (safetyCounter < 60) {
        if (validDays.includes(nextDate.getDay())) {
            return nextDate;
        }
        nextDate.setDate(nextDate.getDate() + 1);
        safetyCounter++;
    }
    return addDays(currentDate, 1);
}

const DAY_MAP: { [key: string]: number } = {
    Sunday: 0,
    Monday: 1,
    Tuesday: 2,
    Wednesday: 3,
    Thursday: 4,
    Friday: 5,
    Saturday: 6,
};

/**
 * Handles lecture interruptions by either shifting subsequent lectures
 * or cancelling the specific lecture and skipping it.
 */
export async function handleLectureInterruption(params: ShiftParams) {
    const { classId, interruptionDate, mode } = params;
    const targetDate = startOfDay(interruptionDate);

    // 1. Get the class details and its study days
    const classData = await prisma.class.findUnique({
        where: { id: classId },
        select: {
            studyDays: true,
            lectureStartTime: true,
            lectureEndTime: true,
            expectedEndDate: true,
        }
    });

    if (!classData) throw new Error('Class not found');

    const studyDayNumbers = classData.studyDays.map(day => DAY_MAP[day]);
    const startHour = classData.lectureStartTime?.getUTCHours() || 9;
    const startMinute = classData.lectureStartTime?.getUTCMinutes() || 0;
    const endHour = classData.lectureEndTime?.getUTCHours() || 12;
    const endMinute = classData.lectureEndTime?.getUTCMinutes() || 0;

    if (mode === 'CANCEL_SKIP') {
        // Mode 2: Just cancel the lectures on that date and do nothing else
        await prisma.lecture.updateMany({
            where: {
                classId,
                scheduledDate: targetDate,
                status: 'scheduled'
            },
            data: {
                status: 'cancelled',
                cancellationReason: params.reason || 'Management decision (Skip)'
            }
        });
        return { message: 'Lecture(s) cancelled and skipped.' };
    }

    if (mode === 'SHIFT_POSTPONE') {
        // New simplified postpone logic:
        // 1. Keep original lecture with status='postponed' (same sequenceNumber)
        // 2. Create clone with SAME sequenceNumber, status='rescheduled'
        // 3. Do NOT shift subsequent lectures
        // 4. Do NOT increase totalLectures

        // Use date range to handle timezone issues - compare using UTC
        const targetYear = targetDate.getUTCFullYear();
        const targetMonth = targetDate.getUTCMonth();
        const targetDay = targetDate.getUTCDate();

        const dayStart = new Date(Date.UTC(targetYear, targetMonth, targetDay, 0, 0, 0, 0));
        const dayEnd = new Date(Date.UTC(targetYear, targetMonth, targetDay + 1, 0, 0, 0, 0));

        console.log('🔍 Searching for lecture on:', targetDate);
        console.log('🔍 Date range:', dayStart, 'to', dayEnd);

        const lectureToPostpone = await prisma.lecture.findFirst({
            where: {
                classId,
                scheduledDate: {
                    gte: dayStart,
                    lt: dayEnd
                },
                status: { in: ['scheduled', 'rescheduled'] }
            },
            include: { class: true }
        });

        if (!lectureToPostpone) {
            console.log('❌ No lecture found between', dayStart, 'and', dayEnd);
            return { message: 'No lecture found on the specified date.' };
        }

        console.log('✅ Found lecture to postpone:', lectureToPostpone.id, 'seq:', lectureToPostpone.sequenceNumber);

        // Mark original as postponed
        await prisma.lecture.update({
            where: { id: lectureToPostpone.id },
            data: {
                status: 'postponed',
                cancellationReason: params.reason || 'Lecture postponed'
            }
        });

        // Find next available study day for the clone
        const nextDate = getNextStudyDay(lectureToPostpone.scheduledDate, lectureToPostpone.class.studyDays);

        console.log('📅 Creating clone for next date:', nextDate);

        // Create clone with SAME sequenceNumber
        await prisma.lecture.create({
            data: {
                classId: lectureToPostpone.classId,
                unitId: lectureToPostpone.unitId,
                instructorId: lectureToPostpone.instructorId,
                sequenceNumber: lectureToPostpone.sequenceNumber, // SAME number!
                scheduledDate: nextDate,
                scheduledStartTime: lectureToPostpone.scheduledStartTime,
                scheduledEndTime: lectureToPostpone.scheduledEndTime,
                room: lectureToPostpone.room,
                status: 'rescheduled',
                topic: lectureToPostpone.topic,
                notes: `كانت مؤجلة من ${lectureToPostpone.scheduledDate.toLocaleDateString('ar-EG')}`
            }
        });

        return {
            message: `Lecture postponed. Original kept as 'postponed', clone created with same sequence number.`
        };
    } else if (mode === 'CANCEL_NO_SHIFT') {
        // Placeholder for new mode logic if needed
        return { message: 'CANCEL_NO_SHIFT mode selected. No action taken yet.' };
    }

    return { message: 'No action taken.' };
}
