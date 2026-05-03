// Quick test to check if Backend APIs are working
const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testAPIs() {
    console.log('🔍 Testing Backend APIs...\n');

    const tests = [
        { name: 'Programs', url: `${API_URL}/academic/programs` },
        { name: 'Levels', url: `${API_URL}/academic/levels` },
        { name: 'Awarding Bodies', url: `${API_URL}/academic/awarding-bodies` },
        { name: 'Classes', url: `${API_URL}/academic/classes` },
        { name: 'Students', url: `${API_URL}/students` },
    ];

    for (const test of tests) {
        try {
            console.log(`Testing ${test.name}...`);
            const response = await axios.get(test.url, {
                headers: {
                    // Add a dummy token - you'll need to replace with real token
                    'Authorization': 'Bearer dummy_token_for_test'
                },
                timeout: 5000
            });

            if (response.data && response.data.success) {
                console.log(`✅ ${test.name}: ${response.status} - ${JSON.stringify(response.data).slice(0, 100)}...\n`);
            } else {
                console.log(`⚠️ ${test.name}: Unexpected response format\n`);
            }
        } catch (error) {
            if (error.response) {
                console.log(`❌ ${test.name}: ${error.response.status} - ${error.response.data.error?.message || 'Unknown error'}\n`);
            } else if (error.code === 'ECONNREFUSED') {
                console.log(`❌ ${test.name}: Backend not running!\n`);
            } else {
                console.log(`❌ ${test.name}: ${error.message}\n`);
            }
        }
    }
}

testAPIs().catch(console.error);
