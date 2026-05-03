
import prisma from './src/common/db/prisma';

async function main() {
    try {
        console.log('--- Verifying Lecture Endpoints ---');

        // 1. Get a sample lecture
        const lecture = await prisma.lecture.findFirst({
            include: {
                unit: true,
                class: true
            }
        });

        if (!lecture) {
            console.log('No lectures found to test.');
            return;
        }

        console.log(`Testing with Lecture ID: ${lecture.id}`);

        // 2. Test getLectureDetails Logic
        console.log('\n--- Testing getLectureDetails Logic ---');
        const detailedLecture = await prisma.lecture.findUnique({
            where: { id: lecture.id },
            include: {
                unit: {
                    select: {
                        id: true,
                        code: true,
                        nameAr: true,
                        nameEn: true,
                        totalLectures: true,
                        description: true
                    }
                },
                class: {
                    include: {
                        program: {
                            select: {
                                id: true,
                                nameAr: true,
                                nameEn: true,
                                code: true
                            }
                        },
                        studentEnrollments: {
                            where: {
                                status: 'active'
                            },
                            include: {
                                student: {
                                    include: {
                                        user: {
                                            select: {
                                                id: true,
                                                firstName: true,
                                                lastName: true,
                                                email: true,
                                                phone: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                instructor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                },
                attendanceRecords: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (detailedLecture) {
            const lectureCount = await prisma.lecture.count({
                where: {
                    classId: detailedLecture.classId,
                    unitId: detailedLecture.unitId,
                    sequenceNumber: {
                        lte: detailedLecture.sequenceNumber
                    }
                }
            });

            console.log('Lecture Details Retrieved Successfully:');
            console.log(`- Unit: ${detailedLecture.unit.nameAr} (${detailedLecture.unit.code})`);
            console.log(`- Sequence: ${lectureCount} / ${detailedLecture.unit.totalLectures}`);
            console.log(`- Instructor: ${detailedLecture.instructor ? detailedLecture.instructor.firstName : 'None'}`);
            console.log(`- Students Enrolled: ${detailedLecture.class.studentEnrollments.length}`);
            console.log(`- Attendance Records: ${detailedLecture.attendanceRecords.length}`);

            const studentsList = detailedLecture.class.studentEnrollments.map(enrollment => ({
                name: `${enrollment.student.user.firstName} ${enrollment.student.user.lastName}`,
                hasAttended: detailedLecture.attendanceRecords.some(r => r.studentId === enrollment.student.id)
            }));
            console.log('- Sample Student List:', studentsList.slice(0, 3));

        } else {
            console.error('Failed to retrieve detailed lecture.');
        }

        // 3. Test getLectures (List) Logic
        console.log('\n--- Testing getLectures (List) Logic ---');
        const lecturesList = await prisma.lecture.findMany({
            take: 1,
            include: {
                unit: {
                    select: {
                        totalLectures: true,
                        code: true
                    }
                },
                class: {
                    select: {
                        _count: {
                            select: { studentEnrollments: true }
                        }
                    }
                }
            }
        });

        if (lecturesList.length > 0) {
            const first = lecturesList[0];
            console.log('List Query Successful:');
            console.log(`- Unit Total Lectures: ${first.unit.totalLectures}`);
            console.log(`- Class Student Count: ${first.class._count.studentEnrollments}`);
        }

    } catch (error) {
        console.error('Verification Error:', error);
    }
}

main();
