const { PrismaClient } = require('@prisma/client');
const { Decimal } = require('@prisma/client/runtime/library');

const prisma = new PrismaClient();

async function main() {
    try {
        console.log(' Starting Employee Creation Test...');

        // 1. Get or Create a Test User
        let user = await prisma.user.findFirst({ where: { email: 'test.emp.debug@example.com' } });
        if (!user) {
            console.log(' Creating Test User...');
            user = await prisma.user.create({
                data: {
                    username: 'test.emp.debug',
                    email: 'test.emp.debug@example.com',
                    passwordHash: 'hashed_password',
                    firstName: 'Debug',
                    lastName: 'Employee',
                    role: 'EMPLOYEE',
                    isActive: true
                }
            });
        }
        console.log(' User ID:', user.id);

        // 2. Get or Create a Department
        let dept = await prisma.department.findFirst();
        if (!dept) {
            console.log(' Creating Test Department...');
            dept = await prisma.department.create({
                data: {
                    nameAr: 'تجربة',
                    nameEn: 'Test Dept',
                    isActive: true
                }
            });
        }
        console.log(' Department ID:', dept.id);

        // 3. Prepare Employee Data
        const empCode = 'EMP-' + Date.now();
        console.log(' Code:', empCode);

        const employeeData = {
            userId: user.id,
            departmentId: dept.id,
            employeeCode: empCode,
            jobTitleAr: 'مطور',
            jobTitleEn: 'Developer',
            contractType: 'full_time',
            salaryType: 'FIXED',
            salary: new Decimal(5000),
            housingAllowance: new Decimal(1000),
            transportAllowance: new Decimal(500),
            otherAllowances: new Decimal(0),
            totalDeductions: new Decimal(0),
            
            // Personal
            nationality: 'Saudi',
            gender: 'male',
            maritalStatus: 'single',
            
            // Dates
            hiringDate: new Date(),
            joiningDate: new Date(),
            
            // Status
            status: 'active'
        };

        // 4. Attempt Creation
        console.log(' Attempting to create employee in DB...');
        const employee = await prisma.employee.create({
            data: employeeData
        });

        console.log(' Employee Created Successfully:', employee.id);

    } catch (error) {
        console.error(' Error Creating Employee:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

