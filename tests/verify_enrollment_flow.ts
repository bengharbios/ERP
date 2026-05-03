import { apiClient } from '../frontend/src/services/api';
import prisma from '../backend/src/common/db/prisma';

// Mock API Client for Node (using axios or fetch if needed, but since we are in same repo, we can use prisma directly to verify backend)
// Actually better to test the API Endpoints to simulate frontend.
// Usage: npx ts-node tests/verify_enrollment_flow.ts

async function testFlow() {
    try {
        console.log('🚀 Starting Verification Flow...');

        // 1. Create Clean Student
        const student = await prisma.student.create({
            data: {
                studentNumber: `TEST-${Date.now()}`,
                firstNameEn: 'Test',
                lastNameEn: 'Student',
                firstNameAr: 'تجربة',
                lastNameAr: 'طالب',
                user: {
                    create: {
                        email: `test-${Date.now()}@test.com`,
                        password: 'password',
                        firstName: 'Test',
                        lastName: 'Student',
                        role: 'Student'
                    }
                }
            }
        });
        console.log('✅ Created Student:', student.id);

        // 2. Create Clean Class
        const program = await prisma.program.findFirst();
        if (!program) throw new Error('No program found');

        const classItem = await prisma.class.create({
            data: {
                code: `CLS-${Date.now()}`,
                name: 'Test Class',
                programId: program.id,
                startDate: new Date(),
                durationMonths: 6,
                studyDays: ['Monday'],
                studyDaysPerWeek: 1,
                status: 'active'
            }
        });
        console.log('✅ Created Class:', classItem.id);

        // 3. Enroll Student (Simulating Classes Controller logic)
        const enrollment = await prisma.studentEnrollment.create({
            data: {
                studentId: student.id,
                classId: classItem.id,
                status: 'active', // Using 'active' as per my fix
                enrollmentDate: new Date()
            }
        });
        console.log('✅ Enrolled Student (Status: active):', enrollment.id);

        // 4. Fetch Student via Prisma (Simulating getStudentById logic)
        const fetchedStudent = await prisma.student.findUnique({
            where: { id: student.id },
            include: {
                enrollments: {
                    include: {
                        class: {
                            select: {
                                id: true,
                                program: { select: { id: true } }
                            }
                        }
                    },
                    orderBy: { enrollmentDate: 'desc' }
                }
            }
        });

        console.log('🔍 Fetched Student Enrollments:', JSON.stringify(fetchedStudent?.enrollments, null, 2));

        if (!fetchedStudent?.enrollments || fetchedStudent.enrollments.length === 0) {
            console.error('❌ FAIL: No enrollments found!');
        } else {
            const active = fetchedStudent.enrollments.find(e => ['active', 'enrolled'].includes(e.status));
            console.log('🔍 Active Enrollment Found via Logic:', active);

            if (active && active.class && active.class.program) {
                console.log('✅ SUCCESS: Active enrollment has Class and Program.');
            } else {
                console.error('❌ FAIL: Active enrollment missing Class or Program data.');
            }
        }

        // Cleanup
        await prisma.studentEnrollment.deleteMany({ where: { studentId: student.id } });
        await prisma.student.delete({ where: { id: student.id } }); // Cascades user usually, or manually delete user
        await prisma.class.delete({ where: { id: classItem.id } });
        await prisma.user.delete({ where: { email: student.user?.email } }).catch(() => { });

    } catch (e) {
        console.error('❌ Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

testFlow();
