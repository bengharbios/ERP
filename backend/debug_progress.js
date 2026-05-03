
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkProgress() {
    const studentId = '8787cfff-87a8-4663-b25f-b9c2afb0eba1';
    const unitId = 'a039afca-5dbc-47a8-bf7a-68826ada36ee';

    console.log(`🔍 Checking progress for Student: ${studentId}, Unit: ${unitId}`);

    try {
        // 1. Check Student existence
        const student = await prisma.student.findUnique({
            where: { id: studentId },
            include: { enrollments: true }
        });

        if (!student) {
            console.log('❌ Student NOT FOUND!');
            return;
        }
        console.log(`✅ Student Found: ${student.studentNumber}`);
        console.log(`   Enrollments: ${student.enrollments.length}`);
        student.enrollments.forEach(e => console.log(`   - Enrollment ID: ${e.id}, Date: ${e.enrollmentDate}`));

        // 2. Check Unit existence
        const unit = await prisma.unit.findUnique({
            where: { id: unitId }
        });

        if (!unit) {
            console.log('❌ Unit NOT FOUND!');
            return;
        }
        console.log(`✅ Unit Found: ${unit.code} - ${unit.nameEn}`);

        // 3. Check Progress Records
        const progress = await prisma.studentUnitProgress.findMany({
            where: {
                studentId: studentId,
                unitId: unitId
            },
            orderBy: { updatedAt: 'desc' }
        });

        console.log(`📊 Progress Records Found: ${progress.length}`);
        progress.forEach((p, index) => {
            console.log(`   [${index}] ID: ${p.id}`);
            console.log(`       Status: ${p.status}`);
            console.log(`       Grade: ${p.grade}`);
            console.log(`       UpdatedAt: ${p.updatedAt}`);
            console.log(`       EnrollmentId: ${p.enrollmentId}`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkProgress();
