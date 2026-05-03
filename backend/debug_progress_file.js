
const fs = require('fs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function log(msg) {
    console.log(msg);
    fs.appendFileSync('debug_result.txt', msg + '\n');
}

async function checkProgress() {
    fs.writeFileSync('debug_result.txt', ''); // Clear file
    const studentId = '8787cfff-87a8-4663-b25f-b9c2afb0eba1';
    const unitId = 'a039afca-5dbc-47a8-bf7a-68826ada36ee';

    await log(`Checking progress for Student: ${studentId}, Unit: ${unitId}`);

    try {
        const student = await prisma.student.findUnique({ where: { id: studentId } });
        if (!student) {
            await log('Student NOT FOUND!');
            return;
        }
        await log(`Student Found: ${student.studentNumber}`);

        const progress = await prisma.studentUnitProgress.findMany({
            where: { studentId: studentId, unitId: unitId },
            orderBy: { updatedAt: 'desc' }
        });

        await log(`Progress Records Found: ${progress.length}`);
        progress.forEach((p, index) => {
            await log(`[${index}] ID: ${p.id}`);
            await log(`    Status: "${p.status}"`);
            await log(`    Grade: "${p.grade}"`);
            await log(`    UpdatedAt: ${p.updatedAt}`);
        });

    } catch (error) {
        await log(`Error: ${error.message}`);
    } finally {
        await prisma.$disconnect();
    }
}

checkProgress();
