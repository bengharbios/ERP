import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBlockingRecords() {
  const studentName = 'dsfdfd dfsfsdfsdf';
  const className = 'Pre-Level 5 - English';

  console.log(`Checking blocking records for Student: ${studentName} in Class: ${className}`);

  try {
    // 1. Find the student
    const student = await prisma.student.findFirst({
      where: {
        OR: [
          { firstNameAr: { contains: studentName } },
          { firstNameEn: { contains: studentName } },
          { user: { firstName: { contains: studentName.split(' ')[0] } } }
        ]
      },
      include: { user: true }
    });

    if (!student) {
      console.log('Student not found');
      return;
    }
    console.log(`Found Student: ${student.user.firstName} ${student.user.lastName} (ID: ${student.id})`);

    // 2. Find the class
    const cls = await prisma.class.findFirst({
      where: { name: { contains: className } }
    });

    if (!cls) {
      console.log('Class not found');
      return;
    }
    console.log(`Found Class: ${cls.name} (ID: ${cls.id})`);

    // 3. Find the enrollment
    const enrollment = await prisma.studentEnrollment.findUnique({
      where: {
        studentId_classId: {
          studentId: student.id,
          classId: cls.id
        }
      }
    });

    if (!enrollment) {
      console.log('Enrollment not found');
      return;
    }
    console.log(`Found Enrollment: ${enrollment.id}`);

    // 4. Check for blocking records
    const attendanceRecords = await prisma.attendanceRecord.findMany({
      where: { studentId: student.id, studentEnrollmentId: enrollment.id }
    });
    console.log(`Attendance Records: ${attendanceRecords.length}`);

    const studentAssignments = await prisma.studentAssignment.findMany({
      where: { studentId: student.id, studentEnrollmentId: enrollment.id }
    });
    console.log(`Student Assignments: ${studentAssignments.length}`);

    const progressRecords = await prisma.studentUnitProgress.findMany({
      where: { enrollmentId: enrollment.id }
    });
    console.log(`Progress Records (should be cascaded but checking anyway): ${progressRecords.length}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlockingRecords();
