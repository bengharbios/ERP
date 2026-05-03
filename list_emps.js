
const { PrismaClient } = require('./backend/src/common/db/prisma');
const prisma = new PrismaClient();

async function main() {
    const employees = await prisma.employee.findMany();
    console.table(employees.map(e => ({
        ID: e.id,
        Name: `${e.firstName} ${e.lastName}`,
        BiometricID: e.biometricId,
        JobTitle: e.jobTitle
    })));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
