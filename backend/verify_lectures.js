const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function verifyLectures() {
    try {
        console.log('--- Verifying Lectures API ---');

        // 0. Login to get token
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.data.accessToken;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('Login successful.');

        // 1. Get all lectures
        console.log('\nFetching all lectures...');
        const res = await axios.get(`${API_BASE_URL}/academic/lectures`, config);
        console.log('Success:', res.data.success);
        console.log('Total lectures found:', res.data.data.lectures.length);

        if (res.data.data.lectures.length > 0) {
            const firstLec = res.data.data.lectures[0];
            console.log('\nFirst Lecture Details:');
            console.log('- ID:', firstLec.id);
            console.log('- Unit:', firstLec.unit?.nameAr);
            console.log('- Class:', firstLec.class?.name);
            console.log('- Instructor:', firstLec.instructor?.firstName);

            // 2. Test filter by class
            console.log(`\nTesting filter by classId: ${firstLec.classId}`);
            const classRes = await axios.get(`${API_BASE_URL}/academic/lectures?classId=${firstLec.classId}`, config);
            console.log('Filtered lectures count:', classRes.data.data.lectures.length);

            // 3. Get single lecture
            console.log(`\nFetching lecture by ID: ${firstLec.id}`);
            const singleRes = await axios.get(`${API_BASE_URL}/academic/lectures/${firstLec.id}`, config);
            console.log('Success:', singleRes.data.success);
            console.log('Single lecture unit:', singleRes.data.data.lecture.unit?.nameAr);
        } else {
            console.log('No lectures found to test filters.');
        }

    } catch (error) {
        console.error('Verification failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error Code:', error.response.data?.error?.code);
            console.error('Error Message:', error.response.data?.error?.message);
            console.error('Full Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
    }
}


verifyLectures();
