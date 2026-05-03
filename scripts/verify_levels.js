const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function verifyLevels() {
    console.log('🧪 Verifying Levels API...');

    try {
        // 1. Login
        console.log('🔑 Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'verifier',
            password: 'password123'
        });

        const token = loginRes.data.data.accessToken;
        console.log('✅ Login successful.');

        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 2. Get Levels
        console.log('📋 Fetching Levels...');
        const getRes = await axios.get(`${API_URL}/academic/levels`, config);
        console.log('✅ Fetched ' + getRes.data.data.levels.length + ' levels.');

        // 3. Create Level
        console.log('➕ Creating Level...');
        const newLevel = {
            nameAr: 'مستوى جديد',
            nameEn: 'New Level ' + Date.now(),
            order: 10,
            isActive: true
        };
        const createRes = await axios.post(`${API_URL}/academic/levels`, newLevel, config);
        console.log('✅ Created Level:', createRes.data.data.level.id);

        console.log('\n🎉 SUCCESS: Levels API is working correctly.');

    } catch (error) {
        console.error('❌ FAILED:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Data:', JSON.stringify(error.response.data, null, 2));
        }
    }
}

verifyLevels();
