import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDemoData() {
    console.log('🌱 Starting demo data seeding...');

    try {
        // 1. Create Academic Year
        const academicYear = await prisma.academicYear.upsert({
            where: { name: '2025-2026' },
            update: {},
            create: {
                name: '2025-2026',
                startDate: new Date('2025-09-01'),
                endDate: new Date('2026-06-30'),
                isCurrent: true
            }
        });
        console.log('✅ Academic Year created');

        // 2. Create Awarding Body
        const awardingBody = await prisma.awardingBody.upsert({
            where: { nameEn: 'Ministry of Education' },
            update: {},
            create: {
                nameEn: 'Ministry of Education',
                nameAr: 'وزارة التربية والتعليم',
                country: 'UAE'
            }
        });
        console.log('✅ Awarding Body created');

        // 3. Create Program Level
        const level = await prisma.programLevel.upsert({
            where: { nameEn: 'Diploma' },
            update: {},
            create: {
                nameEn: 'Diploma',
                nameAr: 'دبلوم',
                order: 1
            }
        });
        console.log('✅ Program Level created');

        // 4. Create Program
        const program = await prisma.program.upsert({
            where: { code: 'CS-DIP-001' },
            update: {},
            create: {
                code: 'CS-DIP-001',
                nameEn: 'Computer Science Diploma',
                nameAr: 'دبلوم علوم الحاسوب',
                levelId: level.id,
                awardingBodyId: awardingBody.id,
                durationMonths: 24,
                totalCredits: 120,
                isActive: true
            }
        });
        console.log('✅ Program created');

        // 5. Create Class
        const classData = await prisma.class.upsert({
            where: { code: 'CS-2025-A' },
            update: {},
            create: {
                code: 'CS-2025-A',
                name: 'Computer Science - Class A',
                programId: program.id,
                academicYearId: academicYear.id,
                startDate: new Date('2025-09-01'),
                durationMonths: 24,
                studyDaysPerWeek: 5,
                studyDays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
                status: 'active'
            }
        });
        console.log('✅ Class created');

        // 6. Create Students
        for (let i = 1; i <= 5; i++) {
            const user = await prisma.user.upsert({
                where: { email: `student${i}@institute.com` },
                update: {},
                create: {
                    username: `student${i}`,
                    email: `student${i}@institute.com`,
                    passwordHash: await bcrypt.hash('123456', 10),
                    firstName: `طالب ${i}`,
                    lastName: 'التجريبي',
                    phone: `050000000${i}`,
                    isActive: true
                }
            });

            await prisma.student.upsert({
                where: { userId: user.id },
                update: {},
                create: {
                    userId: user.id,
                    studentId: `STD-2025-${String(i).padStart(3, '0')}`,
                    programId: program.id,
                    classId: classData.id,
                    enrollmentDate: new Date('2025-09-01'),
                    status: 'active',
                    nationality: 'UAE',
                    gender: i % 2 === 0 ? 'male' : 'female'
                }
            });
        }
        console.log('✅ 5 Students created');

        // 7. Create Fee Structure
        const feeStructure = await prisma.feeStructure.upsert({
            where: { name: 'Standard Tuition Fee' },
            update: {},
            create: {
                name: 'Standard Tuition Fee',
                programId: program.id,
                amount: 25000,
                currency: 'AED',
                frequency: 'ANNUAL',
                isActive: true
            }
        });
        console.log('✅ Fee Structure created');

        console.log('\n🎉 Demo data seeding completed successfully!');
        console.log('\n📊 Summary:');
        console.log('- 1 Academic Year');
        console.log('- 1 Awarding Body');
        console.log('- 1 Program Level');
        console.log('- 1 Program');
        console.log('- 1 Class');
        console.log('- 5 Students');
        console.log('- 1 Fee Structure');
        console.log('\n🔑 Student Login: student1@institute.com / 123456');

    } catch (error) {
        console.error('❌ Error seeding demo data:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

seedDemoData();
