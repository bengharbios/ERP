
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Checking database counts...');
    const users = await prisma.user.count();
    const students = await prisma.student.count();
    const programs = await prisma.program.count();
    const employees = await prisma.employee.count();
    const settings = await prisma.settings.count();

    console.log('Users:', users);
    console.log('Students:', students);
    console.log('Programs:', programs);
    console.log('Employees:', employees);
    console.log('Settings:', settings);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
