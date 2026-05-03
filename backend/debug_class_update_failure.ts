
import prisma from './src/common/db/prisma';
import { generateLectureSchedule } from './src/modules/academic/scheduling.service';

async function main() {
    try {
        console.log('--- Starting Debug Simulation ---');

        // 1. Create a dummy class with NO time
        const classCode = 'DEBUG-' + Date.now();
        console.log('Creating class:', classCode);

        const program = await prisma.program.findFirst();
        if (!program) throw new Error('No program found');

        const newClass = await prisma.class.create({
            data: {
                code: classCode,
                name: 'Debug Class',
                programId: program.id,
                startDate: new Date(),
                durationMonths: 3,
                studyDaysPerWeek: 3,
                studyDays: ['Monday', 'Wednesday', 'Saturday'],
                lectureStartTime: null, // No time initially
                lectureEndTime: null,
                studyMode: 'IN_PERSON'
            }
        });
        console.log('Class created:', newClass.id);

        // 2. Simulate Update: Setting time and days
        console.log('Updating class...');
        const updatePayload = {
            studyDays: ['Sunday', 'Tuesday', 'Thursday'],
            lectureStartTime: '10:00',
            lectureEndTime: '12:00',
            startDate: '2026-02-01'
        };

        // Logic from controller:
        const existing = await prisma.class.findUnique({ where: { id: newClass.id }, include: { lectures: true } });

        const updateData: any = {};
        if (updatePayload.lectureStartTime) {
            updateData.lectureStartTime = new Date(`1970-01-01T${updatePayload.lectureStartTime}:00Z`);
        }
        if (updatePayload.lectureEndTime) {
            updateData.lectureEndTime = new Date(`1970-01-01T${updatePayload.lectureEndTime}:00Z`);
        }
        if (updatePayload.startDate) {
            updateData.startDate = new Date(`${updatePayload.startDate}T00:00:00Z`);
        }
        if (updatePayload.studyDays) {
            updateData.studyDays = updatePayload.studyDays;
            updateData.studyDaysPerWeek = updatePayload.studyDays.length;
        }

        const classData = await prisma.class.update({
            where: { id: newClass.id },
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
        console.log('Class updated in DB.');

        // 3. Trigger regeneration
        // Hardcoded check simulation
        const isParamsChanged = true; // We know we changed params

        if (isParamsChanged) {
            console.log('Regenerating schedule...');
            await prisma.lecture.deleteMany({ where: { classId: newClass.id } });

            const filteredUnits = classData.program.programUnits.map((pu: any) => ({
                id: pu.unit.id,
                totalLectures: pu.unit.totalLectures,
                sequenceOrder: pu.sequenceOrder || 0,
            }));

            const schedule = generateLectureSchedule({
                startDate: classData.startDate,
                durationMonths: classData.durationMonths,
                studyDays: classData.studyDays,
                lectureStartTime: classData.lectureStartTime ?
                    classData.lectureStartTime.getUTCHours().toString().padStart(2, '0') + ':' +
                    classData.lectureStartTime.getUTCMinutes().toString().padStart(2, '0') : '09:00',
                lectureEndTime: classData.lectureEndTime ?
                    classData.lectureEndTime.getUTCHours().toString().padStart(2, '0') + ':' +
                    classData.lectureEndTime.getUTCMinutes().toString().padStart(2, '0') : '12:00',
                units: filteredUnits,
                forceAllUnits: true,
            });

            console.log(`Generated ${schedule.length} lectures.`);

            if (schedule.length > 0) {
                await prisma.lecture.createMany({
                    data: schedule.map(lecture => ({
                        classId: newClass.id,
                        unitId: lecture.unitId,
                        sequenceNumber: lecture.sequenceNumber,
                        scheduledDate: lecture.scheduledDate,
                        scheduledStartTime: lecture.scheduledStartTime,
                        scheduledEndTime: lecture.scheduledEndTime,
                        status: 'scheduled',
                        instructorId: null
                    })),
                });
                console.log('Lectures created successfully.');
            }
        }

        console.log('--- SUCCESS ---');

    } catch (error: any) {
        console.error('--- ERROR CAUGHT ---');
        console.error(error);
    }
}

main();
