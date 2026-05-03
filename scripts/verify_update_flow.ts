
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

async function verifyUpdateFlow() {
    console.log('🚀 Starting Student Update Verification...');

    try {
        // 0. Login
        console.log('🔐 Authenticating...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@example.com',
            password: 'admin123'
        });
        const token = loginRes.data.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Create a dummy student to update
        const createPayload = {
            firstNameAr: "تحديث",
            lastNameAr: "اختبار",
            firstNameEn: "Update",
            lastNameEn: "Test",
            gender: "male",
            username: `upd_${Date.now()}`,
            dateOfBirth: "2010-01-01" // Ensure valid date
        };

        console.log('📤 Creating Temp Student...');
        const createRes = await axios.post(`${API_URL}/students`, createPayload, config);
        const studentId = createRes.data.data.student.id;
        console.log(`✅ Temp Student Created: ${studentId}`);

        // 2. Attempt Update with same payload structure (including username)
        const updatePayload = {
            firstNameEn: "Update Modified",
            username: createPayload.username, // Sending username back as frontend does
            tuitionFee: 6000 // Adding financial update
        };

        console.log('🔄 Attempting Update (PUT)...');
        const updateRes = await axios.put(`${API_URL}/students/${studentId}`, updatePayload, config);

        if (updateRes.status === 200) {
            console.log('✅ Update Successful!');
            console.log('   New Name:', updateRes.data.data.student.firstNameEn);
        } else {
            console.error('❌ Update Failed with status:', updateRes.status);
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Script Error:', error.message);
        }
    }
}

verifyUpdateFlow();
