import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedBasicData() {
    console.log('🌱 Starting basic data seeding...\n');

    try {
        // 1. Create Students (simple version)
        console.log('Creating students...');
        for (let i = 1; i <= 10; i++) {
            const user = await prisma.user.upsert({
                where: { email: `student${i}@institute.com` },
                update: {},
                create: {
                    username: `student${i}`,
                    email: `student${i}@institute.com`,
                    passwordHash: await bcrypt.hash('123456', 10),
                    firstName: `طالب ${i}`,
                    lastName: 'تجريبي',
                    phone: `050000000${i}`,
                    isActive: true
                }
            });

            await prisma.student.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    nationality: 'UAE',
                    gender: i % 2 === 0 ? 'male' : 'female'
                }
            });
        }
        console.log('✅ Created 10 students\n');

        console.log('\n🎉 Basic data seeding completed!');
        console.log('\n📊 Summary:');
        console.log('- 10 Students');
        console.log('\n🔑 Student Login: student1@institute.com / 123456');
        console.log('🔑 Admin Login: admin@institute.com / admin123');

    } catch (error: any) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

seedBasicData();
