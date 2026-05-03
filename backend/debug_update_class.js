const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function debugUpdateClass() {
    try {
        console.log('--- Debugging Update Class API ---');

        // 1. Get Auth Token
        console.log('Logging in...');
        const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.data.accessToken;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('Login successful.');

        // 2. Get a Class ID
        console.log('Fetching classes...');
        const classesRes = await axios.get(`${API_BASE_URL}/academic/classes`, config);
        const classes = classesRes.data.data.classes;
        if (!classes || classes.length === 0) {
            console.log('No classes found to update.');
            return;
        }
        const targetClass = classes[0];
        console.log(`Updating class: ${targetClass.name} (${targetClass.id})`);

        // 3. Attempt Update
        console.log('Sending update request...');
        // Match the data sent by the frontend
        const updateData = {
            name: targetClass.name + ' (Updated)',
            code: targetClass.code,
            startDate: targetClass.startDate.split('T')[0],
            durationMonths: targetClass.durationMonths,
            studyDays: targetClass.studyDays,
            lectureStartTime: '',
            lectureEndTime: '',
            maxStudents: targetClass.maxStudents || 30,
            studyMode: targetClass.studyMode || 'IN_PERSON',
            studyLanguage: targetClass.studyLanguage || 'Arabic',
            unitIds: targetClass.lectures?.map(l => l.unitId) || [],
            unitSelections: [], // Simplify for debug
            unitInstructors: []
        };

        const updateRes = await axios.put(`${API_BASE_URL}/academic/classes/${targetClass.id}`, updateData, config);
        console.log('Update successful!');
        console.log('Status:', updateRes.status);
        console.log('Data:', JSON.stringify(updateRes.data, null, 2));

    } catch (error) {
        console.error('Update failed:');
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

debugUpdateClass();
