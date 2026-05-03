import { addDays, addMonths, isAfter, setHours, setMinutes } from 'date-fns';

interface ScheduleParams {
    startDate: Date;
    durationMonths: number;
    studyDays: string[]; // ['Monday', 'Saturday']
    lectureStartTime: string; // '09:00'
    lectureEndTime: string; // '12:00'
    units: {
        id: string;
        totalLectures: number;
        sequenceOrder: number;
    }[];
    forceAllUnits?: boolean;
}

interface ScheduledLecture {
    unitId: string;
    sequenceNumber: number;
    scheduledDate: Date;
    scheduledStartTime: Date;
    scheduledEndTime: Date;
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

export function generateLectureSchedule(params: ScheduleParams): ScheduledLecture[] {
    const { startDate, durationMonths, studyDays, lectureStartTime, lectureEndTime, units } = params;

    // Calculate end date
    const endDate = addMonths(startDate, durationMonths);

    // Convert study days to numbers
    const studyDayNumbers = studyDays.map((day) => DAY_MAP[day]).sort((a, b) => a - b);

    // Parse times
    const [startHour, startMinute] = lectureStartTime.split(':').map(Number);
    const [endHour, endMinute] = lectureEndTime.split(':').map(Number);

    const schedule: ScheduledLecture[] = [];
    let currentDate = new Date(startDate);

    // Sort units by sequence order
    const sortedUnits = [...units].sort((a, b) => a.sequenceOrder - b.sequenceOrder);

    // Track lectures per unit
    const unitLectureCount: { [unitId: string]: number } = {};
    sortedUnits.forEach((unit) => {
        unitLectureCount[unit.id] = 0;
    });

    let currentUnitIndex = 0;

    const forceAll = params.forceAllUnits || false;

    // Generate schedule
    while ((forceAll || isAfter(endDate, currentDate)) && currentUnitIndex < sortedUnits.length) {
        const currentUnit = sortedUnits[currentUnitIndex];

        // Check if current day is a study day
        const dayOfWeek = currentDate.getDay();
        if (studyDayNumbers.includes(dayOfWeek)) {
            // Add lecture for current unit
            if (unitLectureCount[currentUnit.id] < currentUnit.totalLectures) {
                const lectureDate = new Date(currentDate);
                const startTime = setMinutes(setHours(new Date(currentDate), startHour), startMinute);
                const endTime = setMinutes(setHours(new Date(currentDate), endHour), endMinute);

                schedule.push({
                    unitId: currentUnit.id,
                    sequenceNumber: unitLectureCount[currentUnit.id] + 1,
                    scheduledDate: lectureDate,
                    scheduledStartTime: startTime,
                    scheduledEndTime: endTime,
                });

                unitLectureCount[currentUnit.id]++;

                // If unit is complete, move to next unit
                if (unitLectureCount[currentUnit.id] >= currentUnit.totalLectures) {
                    currentUnitIndex++;
                }
            }
        }

        // Move to next day
        currentDate = addDays(currentDate, 1);
    }

    return schedule;
}

export function calculateExpectedEndDate(params: {
    startDate: Date;
    studyDays: string[];
    totalLectures: number;
}): Date {
    const { startDate, studyDays, totalLectures } = params;

    const studyDayNumbers = studyDays.map((day) => DAY_MAP[day]);
    let currentDate = new Date(startDate);
    let lecturesScheduled = 0;

    while (lecturesScheduled < totalLectures) {
        const dayOfWeek = currentDate.getDay();
        if (studyDayNumbers.includes(dayOfWeek)) {
            lecturesScheduled++;
        }
        if (lecturesScheduled < totalLectures) {
            currentDate = addDays(currentDate, 1);
        }
    }

    return currentDate;
}

export function rescheduleFromDate(params: {
    cancelledLectureDate: Date;
    remainingLectures: {
        id: string;
        unitId: string;
        sequenceNumber: number;
        scheduledDate: Date;
    }[];
    studyDays: string[];
    lectureStartTime: string;
    lectureEndTime: string;
    endDate: Date;
}): ScheduledLecture[] {
    const {
        cancelledLectureDate,
        remainingLectures,
        studyDays,
        lectureStartTime,
        lectureEndTime,
        endDate,
    } = params;

    const studyDayNumbers = studyDays.map((day) => DAY_MAP[day]);
    const [startHour, startMinute] = lectureStartTime.split(':').map(Number);
    const [endHour, endMinute] = lectureEndTime.split(':').map(Number);

    const rescheduled: ScheduledLecture[] = [];
    let currentDate = new Date(cancelledLectureDate);
    let lectureIndex = 0;

    while (lectureIndex < remainingLectures.length && isAfter(endDate, currentDate)) {
        const dayOfWeek = currentDate.getDay();
        if (studyDayNumbers.includes(dayOfWeek)) {
            const lecture = remainingLectures[lectureIndex];
            const lectureDate = new Date(currentDate);
            const startTime = setMinutes(setHours(new Date(currentDate), startHour), startMinute);
            const endTime = setMinutes(setHours(new Date(currentDate), endHour), endMinute);

            rescheduled.push({
                unitId: lecture.unitId,
                sequenceNumber: lecture.sequenceNumber,
                scheduledDate: lectureDate,
                scheduledStartTime: startTime,
                scheduledEndTime: endTime,
            });

            lectureIndex++;
        }

        currentDate = addDays(currentDate, 1);
    }

    return rescheduled;
}
