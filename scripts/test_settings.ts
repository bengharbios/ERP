import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

async function testSettings() {
    try {
        console.log('1. Fetching Settings...');
        const res = await axios.get(`${API_URL}/settings`);
        console.log('   Settings:', JSON.stringify(res.data, null, 2));
    } catch (e: any) {
        console.error('❌ Settings Error:', e.response?.status, e.response?.data || e.message);
    }
}

testSettings();
