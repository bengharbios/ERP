import prisma from '../../common/db/prisma';

/**
 * Undo a cancelled lecture - restore it to scheduled status
 */
export async function undoCancelLecture(lectureId: string) {
    const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId }
    });

    if (!lecture) {
        throw new Error('Lecture not found');
    }

    if (lecture.status !== 'cancelled') {
        throw new Error('Can only undo cancelled lectures');
    }

    // Simply restore status to scheduled/rescheduled
    const previousStatus = lecture.notes?.includes('Previously: scheduled') ? 'scheduled' : 'rescheduled';

    await prisma.lecture.update({
        where: { id: lectureId },
        data: {
            status: previousStatus,
            cancellationReason: null,
            notes: lecture.notes ? lecture.notes + ' | Restored from cancelled' : 'Restored from cancelled'
        }
    });

    return { message: 'Lecture restored successfully' };
}

/**
 * Undo a postponed lecture - delete clone and restore original
 */
export async function undoPostponeLecture(lectureId: string) {
    const lecture = await prisma.lecture.findUnique({
        where: { id: lectureId },
        include: { class: true }
    });

    if (!lecture) {
        throw new Error('Lecture not found');
    }

    if (lecture.status !== 'postponed') {
        throw new Error('Can only undo postponed lectures');
    }

    // Find the clone that was created - it has SAME sequenceNumber, status='rescheduled', and contains note about being postponed
    const cloneLecture = await prisma.lecture.findFirst({
        where: {
            classId: lecture.classId,
            unitId: lecture.unitId,
            sequenceNumber: lecture.sequenceNumber, // SAME sequence number!
            status: 'rescheduled',
            notes: { contains: 'كانت مؤجلة' }
        },
        orderBy: { scheduledDate: 'asc' }
    });

    if (!cloneLecture) {
        throw new Error('Cannot find cloned lecture to undo');
    }

    // Simple transaction:
    // 1. Delete the clone
    // 2. Restore original lecture
    // No need to shift sequences or update totalLectures!
    await prisma.$transaction(async (tx) => {
        // Delete clone
        await tx.lecture.delete({
            where: { id: cloneLecture.id }
        });

        // Restore original
        await tx.lecture.update({
            where: { id: lectureId },
            data: {
                status: 'scheduled',
                cancellationReason: null,
                notes: lecture.notes ? lecture.notes + ' | Restored from postponed' : 'Restored from postponed'
            }
        });
    });

    return { message: 'Postponed lecture undone successfully' };
}
