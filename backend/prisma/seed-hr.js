
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('👔 Seeding HR Data...');

    // 1. Create Departments
    const departments = [
        { nameAr: 'الموارد البشرية', nameEn: 'Human Resources', description: 'HR Management' },
        { nameAr: 'تقنية المعلومات', nameEn: 'IT Department', description: 'Technical Support & Development' },
        { nameAr: 'الشؤون الأكاديمية', nameEn: 'Academic Affairs', description: 'Teachers & Instructors' },
        { nameAr: 'المالية', nameEn: 'Finance', description: 'Accounting & Payroll' }
    ];

    const dbDepartments = [];

    for (const dep of departments) {
        const d = await prisma.department.create({
            data: dep
        });
        dbDepartments.push(d);
        console.log(`✅ Department created: ${dep.nameEn}`);
    }

    // 2. Create Employees (Users first)
    const employees = [
        {
            firstName: 'Ahmed', lastName: 'Ali', email: 'ahmed.ali@demo.com', phone: '0501111111',
            jobTitleEn: 'HR Manager', jobTitleAr: 'مدير الموارد البشرية',
            salary: 15000, departmentIndex: 0, code: 'EMP-101'
        },
        {
            firstName: 'Sarah', lastName: 'Connor', email: 'sarah.c@demo.com', phone: '0502222222',
            jobTitleEn: 'Senior Developer', jobTitleAr: 'مطور أول',
            salary: 18000, departmentIndex: 1, code: 'EMP-102'
        },
        {
            firstName: 'Mohammed', lastName: 'Salah', email: 'm.salah@demo.com', phone: '0503333333',
            jobTitleEn: 'Academic Coordinator', jobTitleAr: 'منسق أكاديمي',
            salary: 12000, departmentIndex: 2, code: 'EMP-103'
        }
    ];

    const passwordHash = await bcrypt.hash('password123', 10);

    for (const emp of employees) {
        // Create User
        const user = await prisma.user.upsert({
            where: { email: emp.email },
            update: {},
            create: {
                username: emp.email.split('@')[0],
                email: emp.email,
                passwordHash,
                firstName: emp.firstName,
                lastName: emp.lastName,
                phone: emp.phone,
                isActive: true,
                emailVerified: true
            }
        });

        // Create Employee Profile
        await prisma.employee.create({
            data: {
                userId: user.id,
                departmentId: dbDepartments[emp.departmentIndex].id,
                employeeCode: emp.code,
                jobTitleAr: emp.jobTitleAr,
                jobTitleEn: emp.jobTitleEn,
                salary: emp.salary,
                hiringDate: new Date(),
                status: 'active'
            }
        });
        console.log(`✅ Employee created: ${emp.firstName} ${emp.lastName}`);
    }

    console.log('🎉 HR Data Seeded Successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
