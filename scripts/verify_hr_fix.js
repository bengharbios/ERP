const { PrismaClient } = require('../backend/node_modules/@prisma/client');
const axios = require('axios');
const bcrypt = require('../backend/node_modules/bcryptjs');

const prisma = new PrismaClient();
const API_URL = 'http://localhost:3000/api/v1';

async function verifyFix() {
    console.log('🔍 Verifying HR Data Loading Fix...\n');

    try {
        // 1. Create/Update Admin User
        console.log('👤 Preparing test user...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const user = await prisma.user.upsert({
            where: { email: 'verify_hr@example.com' },
            update: { passwordHash: hashedPassword },
            create: {
                email: 'verify_hr@example.com',
                firstName: 'Verify',
                lastName: 'User',
                passwordHash: hashedPassword,
                username: 'verify_hr',
                isActive: true
            }
        });
        console.log('   ✅ Test user ready: verify_hr@example.com');

        // 2. Login
        console.log('\n🔑 Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'verify_hr@example.com',
            password: 'password123'
        });
        const token = loginRes.data.data.accessToken;
        console.log('   ✅ Login successful');

        // 3. Test Departments Endpoint
        console.log('\n🏢 Testing GET /hr/departments...');
        const deptRes = await axios.get(`${API_URL}/hr/departments`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (deptRes.data.success) {
            console.log(`   ✅ Success! Loaded ${deptRes.data.data.length} departments.`);
        } else {
            throw new Error('Response success flag is false');
        }

        // 4. Test Employees Endpoint
        console.log('\n👥 Testing GET /hr/employees...');
        const empRes = await axios.get(`${API_URL}/hr/employees`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (empRes.data.success) {
            console.log(`   ✅ Success! Loaded ${empRes.data.data.length} employees.`);
        } else {
            throw new Error('Response success flag is false');
        }

        console.log('\n✨ VERIFICATION SUCCESSFUL! The HR endpoints are working correctly.');

    } catch (error) {
        console.error('\n❌ VERIFICATION FAILED');
        if (error.response) {
            console.error(`Status: ${error.response.status}`);
            console.error(`Data: ${JSON.stringify(error.response.data)}`);
        } else {
            console.error(error.message);
        }
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

verifyFix();
