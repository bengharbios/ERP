const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function addClasses() {
    try {
        console.log('🎓 Adding classes...\n');

        // Get the existing program
        const program = await prisma.program.findFirst();

        if (!program) {
            console.log('❌ No program found. Please create a program first.');
            return;
        }

        console.log(`✅ Found program: ${program.nameAr}\n`);

        // Helper function to create time
        const createTime = (time) => {
            const [hours, minutes] = time.split(':');
            const date = new Date();
            date.setHours(parseInt(hours), parseInt(minutes), 0, 0);
            return date;
        };

        // Create classes
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
        console.log(`✅ Created: ${class1.name}`);

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
        console.log(`✅ Created: ${class2.name}`);

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
        console.log(`✅ Created: ${class3.name}`);

        console.log('\n🎉 Successfully created 3 classes!\n');

        // Show summary
        const totalClasses = await prisma.class.count();
        console.log(`📊 Total classes in database: ${totalClasses}\n`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
        if (error.code === 'P2002') {
            console.log('💡 Hint: Class with this code already exists. Try different codes or delete existing classes.\n');
        }
    }
}

addClasses()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
