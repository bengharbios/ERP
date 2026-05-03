import prisma from '../../common/db/prisma';

export interface SuggestionResult {
    unitId: string;
    code: string;
    nameAr: string;
    nameEn: string;
    missingCount: number;
    totalEnrolled: number;
    percentageMissing: number;
    recommendedSequence: number;
    reason: string;
}

/**
 * Suggests the next unit for a class based on student needs.
 */
export async function suggestNextUnit(classId: string): Promise<SuggestionResult[]> {
    // 1. Get class and its program units
    const classData = await prisma.class.findUnique({
        where: { id: classId },
        include: {
            program: {
                include: {
                    programUnits: {
                        include: { unit: true }
                    }
                }
            },
            studentEnrollments: {
                where: { status: 'active' }
            }
        }
    });

    if (!classData || classData.studentEnrollments.length === 0) return [];

    const enrolledStudentIds = classData.studentEnrollments.map(e => e.studentId);
    const results: SuggestionResult[] = [];

    // 2. For each unit in the program, calculate how many students still need it
    for (const pu of classData.program.programUnits) {
        const unit = pu.unit;

        // Count students who haven't completed this unit
        const completedCount = await prisma.studentUnitProgress.count({
            where: {
                unitId: unit.id,
                studentId: { in: enrolledStudentIds },
                status: 'completed'
            }
        });

        const missingCount = enrolledStudentIds.length - completedCount;
        const percentageMissing = (missingCount / enrolledStudentIds.length) * 100;

        results.push({
            unitId: unit.id,
            code: unit.code,
            nameAr: unit.nameAr,
            nameEn: unit.nameEn,
            missingCount,
            totalEnrolled: enrolledStudentIds.length,
            percentageMissing,
            recommendedSequence: pu.sequenceOrder || 99,
            reason: `${missingCount} students (${percentageMissing.toFixed(0)}%) need this unit.`
        });
    }

    // 3. Sort by:
    // - Highest percentage missing first
    // - Then by recommended sequence order
    return results.sort((a, b) => {
        if (b.percentageMissing !== a.percentageMissing) {
            return b.percentageMissing - a.percentageMissing;
        }
        return a.recommendedSequence - b.recommendedSequence;
    });
}
