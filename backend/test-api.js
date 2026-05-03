const axios = require('axios');
const fs = require('fs');

async function testCreateTemplate() {
    try {
        let tokenRaw = fs.readFileSync('token.txt', 'utf8');
        tokenRaw = tokenRaw.replace(/[^\x20-\x7E]/g, '');
        const token = tokenRaw.split('TOKEN:')[1]?.trim() || tokenRaw.trim();

        if (!token) {
            console.error('No token found in token.txt');
            return;
        }

        const response = await axios.post('http://localhost:3000/api/v1/fees/templates', {
            name: 'Test Template with empty program',
            nameAr: 'قالب تجريبي بدون برنامج',
            programId: "", // EMPTY STRING
            currency: 'SAR',
            feeItems: [
                {
                    name: 'Registration Fee',
                    nameAr: 'رسوم تسجيل',
                    type: 'REGISTRATION',
                    amount: 500,
                    isIncludedInTuition: false
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        console.log('Success:', response.data);
    } catch (error) {
        if (error.response) {
            console.error('Error Status:', error.response.status);
            console.error('Error Data:', JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('Error:', error.message);
        }
    }
}

testCreateTemplate();
