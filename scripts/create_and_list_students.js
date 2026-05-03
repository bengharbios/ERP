const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

// Mock data generator
const generateStudent = (i) => ({
    studentNumber: `TEST${Date.now()}_${i}`,
    firstNameAr: `طالب_${i}`,
    lastNameAr: `اختبار_${i}`,
    firstNameEn: `Student_${i}`,
    lastNameEn: `Test_${i}`,
    email: `student_${Date.now()}_${i}@test.com`,
    phone: `050000000${i}`,
    gender: 'male',
    dateOfBirth: '2000-01-01',
    admissionDate: new Date().toISOString().split('T')[0],
    address: 'Test Address',
    status: 'active'
});

async function run() {
    console.log('🧪 Starting Bulk Student Creation & List Test...');

    try {
        // 1. Authenticate
        console.log('🔑 Authenticating...');
        let token;
        try {
            const authRes = await axios.post(`${API_URL}/auth/login`, {
                username: 'admin',
                password: 'password123'
            });
            token = authRes.data.data.accessToken;
        } catch (e) {
            console.log('   Default login failed (admin), trying verifier...');
            if (e.response) console.log('   (Admin Login Error: ' + e.response.status + ' ' + JSON.stringify(e.response.data) + ')');

            // Try 'verifier' user which we know exists from assign_admin.js
            const authRes = await axios.post(`${API_URL}/auth/login`, {
                username: 'verifier', // Corrected from email to username
                password: 'password123'
            });
            token = authRes.data.data.accessToken;
        }

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };
        console.log('✅ Authenticated.');

        // 2. Create 5 Students
        console.log('📝 Creating 5 Students...');
        for (let i = 1; i <= 5; i++) {
            const studentData = generateStudent(i);
            try {
                // Determine payload based on previous fixes (email/phone in studentData might need destructuring in controller, 
                // but our controller now handles whitelist/stripping, so sending them is fine as long as they valid inputs)
                // Controller expects them in payload to pass to User creation.

                await axios.post(`${API_URL}/students/students`, studentData, config);
                console.log(`   ✅ Created Student ${i}: ${studentData.firstNameEn}`);
            } catch (err) {
                console.error(`   ❌ Failed to create Student ${i}:`, err.response?.data || err.message);
            }
        }

        // 3. Fetch List
        console.log('📋 Fetching Student List...');
        const listRes = await axios.get(`${API_URL}/students/students`, config);

        const students = listRes.data.data.students;
        console.log(`✅ Fetched ${students.length} students.`);

        // 4. Verify Content
        console.log('🔍 Verifying last 5 students...');
        const recentStudents = students.slice(0, 5); // Controller sorts by createdAt desc
        recentStudents.forEach(s => {
            console.log(`   - [${s.studentNumber}] ${s.firstNameEn} ${s.lastNameEn} (User Email: ${s.user?.email || 'MISSING'})`);
        });

        if (recentStudents.length >= 5 && recentStudents[0].user?.email) {
            console.log('\n✨ SUCCESS: Students created and retrieved with user details.');
        } else {
            console.log('\n❌ FAILURE: Students missing or user details incomplete.');
        }

    } catch (error) {
        console.error('❌ Script Fatal Error:', error.message);
        if (error.response) {
            console.error('Response Status:', error.response.status);
            console.error('Response Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

run();
