
import prisma from '../backend/common/db/prisma';
import { Decimal } from '@prisma/client/runtime/library';

async function main() {
    try {
        console.log(' Starting Employee Creation Test...');

        // 1. Get or Create a Test User
        let user = await prisma.user.findFirst({ where: { email: 'test.employee@example.com' } });
        if (!user) {
            console.log('?? Creating Test User...');
            user = await prisma.user.create({
                data: {
                    username: 'test.employee',
                    email: 'test.employee@example.com',
                    passwordHash: 'hashed_password',
                    firstName: 'Test',
                    lastName: 'Employee',
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
                    nameAr: '?????',
                    nameEn: 'Test Dept',
                    isActive: true
                }
            });
        }
        console.log(' Department ID:', dept.id);

        // 3. Prepare Employee Data
        const employeeData = {
            userId: user.id,
            departmentId: dept.id,
            employeeCode: 'EMP-TEST-001-' + Date.now(),
            jobTitleAr: '????',
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

        console.log(' Sending Data:', JSON.stringify(employeeData, null, 2));

        // 4. Attempt Creation
        const employee = await prisma.employee.create({
            data: employeeData
        });

        console.log(' Employee Created Successfully:', employee.id);

    } catch (error) {
        console.error(' Error Creating Employee:', error);
    } finally {
        await prisma.();
    }
}

main();

