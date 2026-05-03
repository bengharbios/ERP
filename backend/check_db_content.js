const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log('--- Checking Database Data ---\n');

        // 1. Check Programs
        const programs = await prisma.program.findMany({
            include: {
                _count: { select: { classes: true } }
            }
        });
        console.log(`📚 Programs: ${programs.length} found`);
        if (programs.length > 0) {
            console.log('Sample Program:', JSON.stringify(programs[0], null, 2));
        }
        console.log('\n-----------------------------------\n');

        // 2. Check Units
        const units = await prisma.unit.findMany({
            include: {
                programUnits: {
                    include: {
                        program: {
                            select: { id: true, code: true, nameEn: true, nameAr: true }
                        }
                    }
                },
                _count: {
                    select: { programUnits: true, lectures: true, assignments: true }
                }
            }
        });
        console.log(`📦 Units: ${units.length} found`);
        if (units.length > 0) {
            console.log('Sample Unit:', JSON.stringify(units[0], null, 2));
        }
        console.log('\n-----------------------------------\n');

        // 3. Check Classes
        const classes = await prisma.class.findMany({
            include: {
                program: { select: { nameAr: true } },
                _count: { select: { studentEnrollments: true } }
            }
        });
        console.log(`🏫 Classes: ${classes.length} found`);
        if (classes.length > 0) {
            console.log('Sample Class:', JSON.stringify(classes[0], null, 2));
        }
        console.log('\n-----------------------------------\n');

        // 4. Check Students
        const students = await prisma.student.findMany({
            take: 1
        });
        console.log(`👨‍🎓 Students: ${await prisma.student.count()} found`);
        if (students.length > 0) {
            console.log('Sample Student:', JSON.stringify(students[0], null, 2));
        }

    } catch (error) {
        console.error('Error checking data:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
