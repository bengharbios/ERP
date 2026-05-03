
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Debugging HR Modules...');

    try {
        if (!prisma.department) {
            console.error('❌ prisma.department is UNDEFINED. The client is stale.');
        } else {
            console.log('✅ prisma.department exists.');
            const count = await prisma.department.count();
            console.log(`📊 Department count: ${count}`);
        }

        if (!prisma.employee) {
            console.error('❌ prisma.employee is UNDEFINED. The client is stale.');
        } else {
            console.log('✅ prisma.employee exists.');
            const count = await prisma.employee.count();
            console.log(`📊 Employee count: ${count}`);
        }

    } catch (error) {
        console.error('❌ DB Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
