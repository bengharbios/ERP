import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Testing getClasses query with full details...');
        const result = await prisma.class.findMany({
            include: {
                program: {
                    include: {
                        programLevel: true,
                        awardingBody: true,
                        programUnits: {
                            include: {
                                unit: true,
                            },
                        },
                    },
                },
                lectures: {
                    select: {
                        unitId: true,
                        instructorId: true,
                        instructor: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                            }
                        }
                    },
                },
                _count: {
                    select: {
                        lectures: true,
                        studentEnrollments: true,
                    },
                },
            },
        });
        console.log('QUERY SUCCESSFUL!');
        console.log('Count:', result.length);
        if (result.length > 0) {
            console.log('First class sample:', JSON.stringify(result[0], null, 2).substring(0, 500));
        }
    } catch (error) {
        console.error('QUERY FAILED!');
        console.error('Error Name:', error.name);
        console.error('Error Message:', error.message);
        console.error('Error Stack:', error.stack);

        if (error.code) console.error('Error Code:', error.code);
        if (error.meta) console.error('Error Meta:', JSON.stringify(error.meta, null, 2));
    } finally {
        await prisma.$disconnect();
    }
}

main();
