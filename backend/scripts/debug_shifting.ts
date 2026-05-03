import prisma from '../src/common/db/prisma';
import { handleLectureInterruption } from '../src/modules/academic/dynamic_scheduling.service';
import { addDays, format } from 'date-fns';

async function main() {
    console.log('--- Starting Debug Shifting ---');

    // 0. Ensure Dependencies
    let program = await prisma.program.findFirst();
    if (!program) {
        program = await prisma.program.create({
            data: {
                nameAr: 'برنامج ديباج',
                nameEn: 'Debug Program',
                code: 'DBG-PROG-' + Date.now(),
                durationMonths: 6,
                // type: 'diploma' // Removed as not in schema
            }
        });
    }

    // 1. Create a Dummy Class
    const cls = await prisma.class.create({
        data: {
            name: 'Debug Shifting Class',
            code: 'DBG-001-' + Date.now(),
            studyDays: ['Monday', 'Wednesday'], // Mon=1, Wed=3
            startDate: new Date('2026-02-01T00:00:00Z'),
            // endDate: new Date('2026-03-01T00:00:00Z'), // Assuming expectedEndDate is the field?
            expectedEndDate: new Date('2026-03-01T00:00:00Z'),
            programId: program.id,
            maxStudents: 20,
            durationMonths: 6
        }
    });

    console.log(`Created Class: ${cls.id} (${cls.name})`);

    // 2. Create Dummy Lectures (Mon Feb 02, Wed Feb 04, Mon Feb 09)
    await prisma.lecture.createMany({
        data: [
            {
                classId: cls.id,
                unitId: 'u1',
                sequenceNumber: 1,
                scheduledDate: new Date('2026-02-02T09:00:00Z'), // Mon
                scheduledStartTime: new Date('2026-02-02T09:00:00Z'),
                scheduledEndTime: new Date('2026-02-02T11:00:00Z'),
                status: 'completed' // Past
            },
            {
                classId: cls.id,
                unitId: 'u2',
                sequenceNumber: 2,
                scheduledDate: new Date('2026-02-04T09:00:00Z'), // Wed (Target)
                scheduledStartTime: new Date('2026-02-04T09:00:00Z'),
                scheduledEndTime: new Date('2026-02-04T11:00:00Z'),
                status: 'scheduled'
            },
            {
                classId: cls.id,
                unitId: 'u3',
                sequenceNumber: 3,
                scheduledDate: new Date('2026-02-09T09:00:00Z'), // Mon (Next)
                scheduledStartTime: new Date('2026-02-09T09:00:00Z'),
                scheduledEndTime: new Date('2026-02-09T11:00:00Z'),
                status: 'scheduled'
            }
        ]
    });

    console.log('Lectures Created. Current Schedule:');
    const lecturesBefore = await prisma.lecture.findMany({ where: { classId: cls.id }, orderBy: { sequenceNumber: 'asc' } });
    lecturesBefore.forEach(l => console.log(`#${l.sequenceNumber} Date: ${l.scheduledDate.toISOString()} Status: ${l.status}`));

    // 3. Trigger Postpone on Feb 04
    console.log('\n>>> Triggering Postpone on 2026-02-04...');
    const targetDate = new Date('2026-02-04T09:00:00Z'); // Matches the lecture time, or midnight?
    // Controller logic uses `new Date(stringFromFrontend)` which is usually midnight UTC
    // Logic in service uses `startOfDay`.
    // Let's pass midnight UTC.
    const interruptionDate = new Date('2026-02-04T00:00:00Z');

    const result = await handleLectureInterruption({
        classId: cls.id,
        interruptionDate: interruptionDate,
        mode: 'SHIFT_POSTPONE',
        reason: 'Debug Postpone'
    });
    console.log('Result:', result);

    // 4. Check Results
    console.log('\n>>> Schedule After Postpone:');
    const lecturesAfter = await prisma.lecture.findMany({ where: { classId: cls.id }, orderBy: { sequenceNumber: 'asc' } });
    lecturesAfter.forEach(l => console.log(`#${l.sequenceNumber} Date: ${l.scheduledDate.toISOString()} Status: ${l.status}`));

    // Cleanup
    await prisma.lecture.deleteMany({ where: { classId: cls.id } });
    await prisma.class.delete({ where: { id: cls.id } });
}

main().catch(console.error);
