
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function diagnose() {
    const searchTerm = process.argv[2] || 'محمد فؤاد';
    console.log(`Searching for student: "${searchTerm}"...`);

    try {
        const student = await prisma.student.findFirst({
            where: {
                OR: [
                    { nameAr: { contains: searchTerm } },
                    { nameEn: { contains: searchTerm } }
                ]
            },
            include: {
                enrollments: {
                    include: {
                        class: {
                            include: {
                                program: {
                                    include: {
                                        programUnits: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!student) {
            console.log('Student not found!');
            return;
        }

        console.log(`Found Student: ${student.nameAr} (${student.id})`);
        console.log(`Enrollments: ${student.enrollments.length}`);

        student.enrollments.forEach((e: any, i: number) => {
            console.log(`\nEnrollment #${i + 1}:`);
            console.log(`  Date: ${e.enrollmentDate}`);
            if (e.class) {
                console.log(`  Class: ${e.class.name} (${e.classId})`);
                if (e.class.program) {
                    console.log(`  Program: ${e.class.program.nameAr} (${e.class.program.id})`);
                    console.log(`  Program Units: ${e.class.program.programUnits.length}`);
                } else {
                    console.log(`  Program: NULL (Class has no program linked)`);
                }
            } else {
                console.log(`  Class: NULL`);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
