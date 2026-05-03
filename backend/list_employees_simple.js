
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const employees = await prisma.employee.findMany();
        console.log('\n--- Employee List ---');
        if (employees.length === 0) {
            console.log('No employees found in database.');
        } else {
            console.table(employees.map(e => ({
                ID: e.id,
                Name: `${e.firstName} ${e.lastName}`,
                BiometricID: e.biometricId || 'NOT SET', // Show clearly if missing
                JobTitle: e.jobTitle || 'N/A'
            })));
        }
        console.log('---------------------\n');
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
