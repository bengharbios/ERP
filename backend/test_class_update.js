const axios = require('axios');

const API_BASE_URL = 'http://localhost:3000/api/v1';

async function testClassUpdate() {
    try {
        console.log('=== Testing Class Update with Various Scenarios ===\n');

        // 1. Login
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.data.accessToken;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('✅ Login successful\n');

        // 2. Get first class
        console.log('2. Fetching classes...');
        const classesRes = await axios.get(`${API_BASE_URL}/academic/classes`, config);
        const classes = classesRes.data.data.classes;

        if (!classes || classes.length === 0) {
            console.log('❌ No classes found');
            return;
        }

        const targetClass = classes[0];
        console.log(`✅ Found class: ${targetClass.name} (${targetClass.code})\n`);
        console.log('Current class data:', JSON.stringify({
            id: targetClass.id,
            code: targetClass.code,
            name: targetClass.name,
            lectureStartTime: targetClass.lectureStartTime,
            lectureEndTime: targetClass.lectureEndTime,
            studyDays: targetClass.studyDays,
            studyMode: targetClass.studyMode
        }, null, 2));

        // 3. Test different update scenarios
        const scenarios = [
            {
                name: 'Scenario 1: Update with valid times',
                data: {
                    code: targetClass.code,
                    name: targetClass.name,
                    durationMonths: targetClass.durationMonths,
                    studyDays: targetClass.studyDays,
                    lectureStartTime: '09:00',
                    lectureEndTime: '12:00',
                    maxStudents: targetClass.maxStudents || 30,
                    studyMode: targetClass.studyMode || 'IN_PERSON',
                    studyLanguage: targetClass.studyLanguage || 'Arabic'
                }
            },
            {
                name: 'Scenario 2: Update with empty time strings',
                data: {
                    code: targetClass.code,
                    name: targetClass.name,
                    durationMonths: targetClass.durationMonths,
                    studyDays: targetClass.studyDays,
                    lectureStartTime: '',
                    lectureEndTime: '',
                    maxStudents: targetClass.maxStudents || 30,
                    studyMode: targetClass.studyMode || 'IN_PERSON',
                    studyLanguage: targetClass.studyLanguage || 'Arabic'
                }
            },
            {
                name: 'Scenario 3: Update without time fields',
                data: {
                    code: targetClass.code,
                    name: targetClass.name,
                    durationMonths: targetClass.durationMonths,
                    studyDays: targetClass.studyDays,
                    maxStudents: targetClass.maxStudents || 30,
                    studyMode: targetClass.studyMode || 'IN_PERSON',
                    studyLanguage: targetClass.studyLanguage || 'Arabic'
                }
            },
            {
                name: 'Scenario 4: Minimal update (like frontend might send)',
                data: {
                    name: targetClass.name + ' (Test)'
                }
            }
        ];

        for (const scenario of scenarios) {
            console.log(`\n3. Testing: ${scenario.name}`);
            console.log('Request data:', JSON.stringify(scenario.data, null, 2));

            try {
                const updateRes = await axios.put(
                    `${API_BASE_URL}/academic/classes/${targetClass.id}`,
                    scenario.data,
                    config
                );
                console.log(`✅ ${scenario.name} - SUCCESS`);
                console.log('Response status:', updateRes.status);
            } catch (error) {
                console.log(`❌ ${scenario.name} - FAILED`);
                if (error.response) {
                    console.log('Status:', error.response.status);
                    console.log('Error Code:', error.response.data?.error?.code);
                    console.log('Error Message:', error.response.data?.error?.message);
                    if (error.response.data?.error?.details) {
                        console.log('Validation Details:', JSON.stringify(error.response.data.error.details, null, 2));
                    }
                } else {
                    console.log('Error:', error.message);
                }
            }
        }

    } catch (error) {
        console.error('\n❌ Test failed:');
        if (error.response) {
            console.error('Status:', error.response.status);
            console.error('Error:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Message:', error.message);
        }
    }
}

testClassUpdate();
