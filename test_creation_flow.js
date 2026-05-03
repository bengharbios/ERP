const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testCreationFlow() {
    console.log('🚀 Starting Creation Flow Test...\n');

    try {
        // 1. Login
        console.log('🔑 Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin@example.com',
            password: 'admin123'
        });

        const token = loginRes.data.data.accessToken;
        console.log('✅ Login successful! Token acquired.\n');

        const headers = { Authorization: `Bearer ${token}` };

        // 2. Create Program Level
        console.log('📊 Creating Test Level...');
        const levelData = {
            nameAr: 'مستوى اختباري',
            nameEn: 'Test Level ' + Date.now(),
            order: 99,
            isActive: true
        };
        const levelRes = await axios.post(`${API_URL}/academic/levels`, levelData, { headers });
        console.log('✅ Level Created:', levelRes.data.data.level.id, '\n');
        const levelId = levelRes.data.data.level.id;

        // 3. Create Awarding Body
        console.log('🏛️ Creating Test Awarding Body...');
        const bodyData = {
            code: 'TEST-' + Date.now(),
            nameAr: 'جهة اختبارية',
            nameEn: 'Test Body',
            description: 'Created by verification script',
            website: 'https://test.com',
            isActive: true
        };
        const bodyRes = await axios.post(`${API_URL}/academic/awarding-bodies`, bodyData, { headers });
        console.log('✅ Body Created:', bodyRes.data.data.body.id, '\n');
        const bodyId = bodyRes.data.data.body.id;

        // 4. Create Program
        console.log('🎓 Creating Test Program...');
        const programData = {
            code: 'PROG-' + Date.now(),
            nameAr: 'برنامج اختباري',
            nameEn: 'Test Program',
            description: 'Created by verification script',
            levelId: levelId,
            awardingBodyId: bodyId,
            durationMonths: 12,
            totalUnits: 10
        };
        const programRes = await axios.post(`${API_URL}/academic/programs`, programData, { headers });
        console.log('✅ Program Created:', programRes.data.data.program.id);
        console.log('   - Linked Level:', programRes.data.data.program.programLevel?.id);
        console.log('   - Linked Body:', programRes.data.data.program.awardingBody?.id);

        console.log('\n🎉 ALL TESTS PASSED! Backend is working correctly.');

    } catch (error) {
        console.error('\n❌ TEST FAILED!');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testCreationFlow();
