import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting students and classes seed...');

    // Get programs
    const level3Program = await prisma.program.findUnique({ where: { code: 'BTEC-L3-NEC' } });
    const level5Program = await prisma.program.findUnique({ where: { code: 'BTEC-L5-HND' } });

    if (!level3Program || !level5Program) {
        throw new Error('Required programs not found! Please run seed:programs first.');
    }

    console.log(`📚 Programs found: Level 3 & Level 5`);

    // ============================================
    // 1. CREATE CLASSES
    // ============================================

    // Helper function to get program ID
    const getProgramId = (code: string) => {
        if (code.startsWith('PL3')) return level3Program.id;
        if (code.startsWith('PL5')) return level5Program.id;
        return level3Program.id; // Default fallback
    };

    const classes = [
        {
            code: 'PL3-AR',
            name: 'Pre-Level 3 - Arabic',
            nameAr: 'المستوى الثالث التحضيري - عربي',
            studyLanguage: 'Arabic'
        },
        {
            code: 'PL5-AR',
            name: 'Pre-Level 5 - Arabic',
            nameAr: 'المستوى الخامس التحضيري - عربي',
            studyLanguage: 'Arabic'
        },
        {
            code: 'PL5-ENG',
            name: 'Pre-Level 5 - English',
            nameAr: 'المستوى الخامس التحضيري - إنجليزي',
            studyLanguage: 'English'
        }
    ];

    const createdClasses: Record<string, any> = {};

    for (const classData of classes) {
        const createdClass = await prisma.class.upsert({
            where: { code: classData.code },
            update: {},
            create: {
                code: classData.code,
                name: classData.name,
                programId: getProgramId(classData.code),
                startDate: new Date('2026-01-01'),
                durationMonths: 6,
                studyDaysPerWeek: 3,
                studyDays: ['Sunday', 'Tuesday', 'Thursday'],
                studyLanguage: classData.studyLanguage,
                maxStudents: 30,
                status: 'active'
            }
        });

        createdClasses[classData.code] = createdClass;
        console.log(`✅ Class created: ${classData.code}`);
    }

    // ============================================
    // 2. CREATE STUDENTS
    // ============================================

    const students = [
        // PL3-AR Students
        { nameAr: 'حياة لولو', nameEn: 'Hayat Loulou', class: 'PL3-AR', gender: 'female', installment: 3 },
        { nameAr: 'فاطمة محمد صادق', nameEn: 'Fatma Mohamed Sadeq', class: 'PL3-AR', gender: 'female', installment: 7 },
        { nameAr: 'مريم هشام سلمان', nameEn: 'Maream Hosham Salman', class: 'PL3-AR', gender: 'female', installment: 13 },
        { nameAr: 'نواف سامي', nameEn: 'Nawaf Sami', class: 'PL3-AR', gender: 'male', installment: 4 },
        { nameAr: 'نورا الخثيري', nameEn: 'Noura Alktheeri', class: 'PL3-AR', gender: 'female', installment: 5 },

        // PL5-AR Students
        { nameAr: 'روى الكثيري', nameEn: 'Rawa Al ketheeri', class: 'PL5-AR', gender: 'female', installment: 11 },
        { nameAr: 'عبدالله المرزوقي', nameEn: 'Abdulla Al Marzooqi', class: 'PL5-AR', gender: 'male', installment: 9 },
        { nameAr: 'بشار غسان معلا', nameEn: 'Bashar Ghassan Mualla', class: 'PL5-AR', gender: 'male', installment: 7 },
        { nameAr: 'عائشة قاسم', nameEn: 'Aisha kasem', class: 'PL5-AR', gender: 'female', installment: 4 },
        { nameAr: 'سارة بورعي', nameEn: 'Sara Bourai', class: 'PL5-AR', gender: 'female', installment: 1 },
        { nameAr: 'عبدالرحمن أحمد', nameEn: 'Abdel Rahman Ahmed', class: 'PL5-AR', gender: 'male', installment: 8 },
        { nameAr: 'مهند محمد السويدان', nameEn: 'Mohanad Mohammad Al swidan', class: 'PL5-AR', gender: 'male', installment: 3 },
        { nameAr: 'ريم المهيري', nameEn: 'Reem Almheiri', class: 'PL5-AR', gender: 'female', installment: 11 },
        { nameAr: 'مي التميمي', nameEn: 'Mai AL Tamimi', class: 'PL5-AR', gender: 'female', installment: 4 },
        { nameAr: 'ماجد عبدالله أحمد', nameEn: 'Majed Abdulla ahmed', class: 'PL5-AR', gender: 'male', installment: 2 },
        { nameAr: 'نورا رجب', nameEn: 'Noura Ragab', class: 'PL5-AR', gender: 'female', installment: 0 },

        // PL5-ENG Students
        { nameAr: 'محمد فؤاد رمضان', nameEn: 'Mohamed Fouad Ramadan', class: 'PL5-ENG', gender: 'male', installment: 5 },
    ];

    let studentCount = 0;
    const currentYear = new Date().getFullYear();

    for (const studentData of students) {
        studentCount++;
        const studentNumber = `S${currentYear}${String(studentCount).padStart(4, '0')}`;
        const email = `${studentData.nameEn.toLowerCase().replace(/ /g, '.')}@alsalam.ae`;
        const username = `student_${studentNumber.toLowerCase()}`;

        // Create user first
        const hashedPassword = await bcrypt.hash('student123', 10);

        const user = await prisma.user.upsert({
            where: { email: email },
            update: {},
            create: {
                username: username,
                email: email,
                passwordHash: hashedPassword,
                firstName: studentData.nameEn.split(' ')[0],
                lastName: studentData.nameEn.split(' ').slice(1).join(' '),
                phone: `+971${50 + studentCount}${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
                isActive: true,
            }
        });

        // Create student
        const student = await prisma.student.upsert({
            where: { studentNumber: studentNumber },
            update: {},
            create: {
                userId: user.id,
                studentNumber: studentNumber,
                firstNameAr: studentData.nameAr.split(' ')[0],
                lastNameAr: studentData.nameAr.split(' ').slice(1).join(' '),
                firstNameEn: studentData.nameEn.split(' ')[0],
                lastNameEn: studentData.nameEn.split(' ').slice(1).join(' '),
                gender: studentData.gender,
                phone: user.phone,
                email: user.email,
                nationality: 'AE',
                enrollmentDate: new Date('2026-01-01'),
                status: 'active',
                dateOfBirth: new Date(2005, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1)
            }
        });

        // Enroll in class
        const classObj = createdClasses[studentData.class];

        await prisma.studentEnrollment.upsert({
            where: {
                studentId_classId: {
                    studentId: student.id,
                    classId: classObj.id
                }
            },
            update: {},
            create: {
                studentId: student.id,
                classId: classObj.id,
                enrollmentDate: new Date('2026-01-01'),
                status: 'active'
            }
        });

        console.log(`✅ Student ${studentCount}/17: ${studentData.nameEn} (${studentNumber}) - ${studentData.class} - Installment: ${studentData.installment}`);
    }

    console.log('\n🎉 Seed completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - Classes created: ${classes.length}`);
    console.log(`   - Students created: ${students.length}`);
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
