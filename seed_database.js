const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function seed() {
    console.log('🌱 Seeding database...\n');

    try {
        // 1. Create a Program
        console.log('📚 Creating program...');
        const program = await prisma.program.create({
            data: {
                code: 'BTEC-L5-HND',
                nameAr: 'دبلوم المستوى الخامس في الحوسبة',
                nameEn: 'HND Level 5 in Computing',
                description: 'Pearson BTEC Higher National Diploma in Computing',
                level: 'diploma',
                durationMonths: 24,
                totalUnits: 16,
                isActive: true
            }
        });
        console.log(`✅ Program created: ${program.nameAr}\n`);

        // 2. Create Units
        console.log('📖 Creating units...');
        const unit1 = await prisma.unit.create({
            data: {
                code: 'UNIT-1',
                nameAr: 'برمجة الويب المتقدمة',
                nameEn: 'Advanced Web Programming',
                description: 'Advanced web development concepts',
                creditHours: 15,
                totalLectures: 12,
                learningOutcomes: ['Develop web applications', 'Use frameworks'],
                isActive: true
            }
        });

        const unit2 = await prisma.unit.create({
            data: {
                code: 'UNIT-2',
                nameAr: 'قواعد البيانات المتقدمة',
                nameEn: 'Advanced Database Systems',
                description: 'Advanced database concepts',
                creditHours: 15,
                totalLectures: 12,
                learningOutcomes: ['Design databases', 'Optimize queries'],
                isActive: true
            }
        });

        const unit3 = await prisma.unit.create({
            data: {
                code: 'UNIT-3',
                nameAr: 'أمن المعلومات',
                nameEn: 'Information Security',
                description: 'Information security fundamentals',
                creditHours: 15,
                totalLectures: 12,
                learningOutcomes: ['Understand security', 'Implement security'],
                isActive: true
            }
        });
        console.log(`✅ Created 3 units\n`);

        // 3. Link Units to Program
        console.log('🔗 Linking units to program...');
        await prisma.programUnit.createMany({
            data: [
                { programId: program.id, unitId: unit1.id, sequenceOrder: 1, isMandatory: true },
                { programId: program.id, unitId: unit2.id, sequenceOrder: 2, isMandatory: true },
                { programId: program.id, unitId: unit3.id, sequenceOrder: 3, isMandatory: true }
            ]
        });
        console.log('✅ Units linked to program\n');

        // 4. Create Classes
        console.log('🎓 Creating classes...');

        // Helper function to create time
        const createTime = (time) => {
            const [hours, minutes] = time.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return date;
        };

        const class1 = await prisma.class.create({
            data: {
                code: 'BTEC-2026-A',
                name: 'Batch A - January 2026',
                programId: program.id,
                startDate: new Date('2026-01-15'),
                durationMonths: 24,
                studyDays: ['Sunday', 'Tuesday', 'Thursday'],
                lectureStartTime: createTime('09:00'),
                lectureEndTime: createTime('12:00'),
                maxStudents: 30,
                status: 'active',
                studyMode: 'IN_PERSON',
                studyLanguage: 'Arabic',
                classroom: 'A101',
                building: 'المبنى الرئيسي'
            }
        });

        const class2 = await prisma.class.create({
            data: {
                code: 'BTEC-2026-B',
                name: 'Batch B - February 2026',
                programId: program.id,
                startDate: new Date('2026-02-01'),
                durationMonths: 24,
                studyDays: ['Monday', 'Wednesday'],
                lectureStartTime: createTime('14:00'),
                lectureEndTime: createTime('17:00'),
                maxStudents: 25,
                status: 'active',
                studyMode: 'ONLINE',
                studyLanguage: 'English',
                defaultZoomLink: 'https://zoom.us/j/123456789'
            }
        });

        const class3 = await prisma.class.create({
            data: {
                code: 'BTEC-2025-C',
                name: 'Batch C - December 2025',
                programId: program.id,
                startDate: new Date('2025-12-01'),
                durationMonths: 24,
                studyDays: ['Sunday', 'Monday', 'Tuesday'],
                lectureStartTime: createTime('10:00'),
                lectureEndTime: createTime('13:00'),
                maxStudents: 35,
                status: 'active',
                studyMode: 'IN_PERSON',
                studyLanguage: 'Bilingual',
                classroom: 'B205',
                building: 'المبنى الثاني'
            }
        });
        console.log(`✅ Created 3 classes\n`);

        // 5. Create Users and Students
        console.log('👥 Creating students...');

        const students = [];
        for (let i = 1; i <= 10; i++) {
            const user = await prisma.user.create({
                data: {
                    username: `student${i}`,
                    email: `student${i}@example.com`,
                    passwordHash: '$2b$10$abcdefghijklmnopqrstuvwxyz', // Dummy hash
                    firstName: `Student${i}`,
                    lastName: `LastName${i}`,
                    isActive: true
                }
            });

            const student = await prisma.student.create({
                data: {
                    userId: user.id,
                    studentNumber: `STU-2026-${String(i).padStart(4, '0')}`,
                    firstNameAr: `الطالب ${i}`,
                    lastNameAr: `العائلة ${i}`,
                    firstNameEn: `Student${i}`,
                    lastNameEn: `LastName${i}`,
                    dateOfBirth: new Date('2000-01-01'),
                    gender: i % 2 === 0 ? 'male' : 'female',
                    nationality: 'Saudi Arabia',
                    status: 'active',
                    enrollmentDate: new Date('2026-01-15')
                }
            });

            students.push(student);
        }
        console.log(`✅ Created ${students.length} students\n`);

        // 6. Enroll students in classes
        console.log('📝 Enrolling students...');
        for (let i = 0; i < students.length; i++) {
            const classId = i < 4 ? class1.id : i < 7 ? class2.id : class3.id;
            await prisma.studentEnrollment.create({
                data: {
                    studentId: students[i].id,
                    classId: classId,
                    enrollmentDate: new Date('2026-01-15'),
                    status: 'active'
                }
            });
        }
        console.log('✅ Students enrolled\n');

        console.log('🎉 Database seeded successfully!\n');

        // Print summary
        const counts = {
            programs: await prisma.program.count(),
            units: await prisma.unit.count(),
            classes: await prisma.class.count(),
            students: await prisma.student.count(),
            enrollments: await prisma.studentEnrollment.count()
        };

        console.log('📊 Summary:');
        console.log(`   Programs: ${counts.programs}`);
        console.log(`   Units: ${counts.units}`);
        console.log(`   Classes: ${counts.classes}`);
        console.log(`   Students: ${counts.students}`);
        console.log(`   Enrollments: ${counts.enrollments}\n`);

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        throw error;
    }
}

seed()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
