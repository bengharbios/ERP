import prisma from '../backend/src/common/db/prisma';

async function fixEnrollmentStatus() {
    try {
        console.log('🔄 Checking for enrollments with status "enrolled"...');

        const count = await prisma.studentEnrollment.count({
            where: { status: 'enrolled' }
        });

        console.log(`Found ${count} enrollments with status "enrolled".`);

        if (count > 0) {
            console.log('🛠 Updating them to "active"...');
            const result = await prisma.studentEnrollment.updateMany({
                where: { status: 'enrolled' },
                data: { status: 'active' }
            });
            console.log(`✅ Updated ${result.count} enrollments.`);
        } else {
            console.log('✅ No updates needed.');
        }

    } catch (error) {
        console.error('❌ Error fixing enrollment status:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixEnrollmentStatus();
