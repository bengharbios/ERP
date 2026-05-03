import prisma from '../backend/src/common/db/prisma';

async function debugStudent() {
    // The user mentioned "Saif". I'll search for him.
    const student = await prisma.student.findFirst({
        where: { firstNameEn: { contains: 'Saif' } },
        include: {
            enrollments: {
                include: {
                    class: {
                        select: {
                            id: true,
                            code: true,
                            name: true,
                            status: true,
                            programId: true, // Checking if this scalar is retrievable if I added it to query, but standard query here mimics controller?
                            // Controller code:
                            /*
                            select: {
                                id: true,
                                ...
                                program: { select: { id: true ... } }
                            }
                            */
                            program: {
                                select: { id: true, nameEn: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (student) {
        console.log('✅ Found Student:', student.firstNameEn, student.lastNameEn, student.id);
        console.log('Enrollments:', JSON.stringify(student.enrollments, null, 2));
    } else {
        console.log('❌ Student Saif not found.');
    }
}

debugStudent()
    .catch(console.error)
    .finally(async () => await prisma.$disconnect());
