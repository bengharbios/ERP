const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
    try {
        const studentCount = await prisma.student.count();
        const programCount = await prisma.program.count();
        const leadCount = await prisma.crmLead.count();
        const classCount = await prisma.class.count();

        console.log('--- Database Stats ---');
        console.log(`Students: ${studentCount}`);
        console.log(`Programs: ${programCount}`);
        console.log(`Classes:  ${classCount}`);
        console.log(`CRM Leads/Opps: ${leadCount}`);

        if (studentCount > 0) {
            const student = await prisma.student.findFirst({ select: { firstNameAr: true, lastNameAr: true } });
            console.log(`Sample Student: ${student.firstNameAr} ${student.lastNameAr}`);
        }

    } catch (error) {
        console.error('Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verify();
