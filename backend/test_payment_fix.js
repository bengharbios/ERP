const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testPayment() {
    try {
        console.log('🔐 Logging in as admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin@institute.com',
            password: 'admin123'
        });

        const token = loginRes.data.data.accessToken;
        console.log('✅ Logged in successfully.');

        // Payment data for a specific installment
        const paymentData = {
            calculationId: '899f05a2-5468-42d4-a2b7-5fb6b2cfa528',
            installmentId: '7e06b0ed-4e50-42bb-b6a1-5a50da18f0d8',
            amount: 500, // Partial payment
            method: 'CASH',
            referenceNo: 'TEST-PAY-' + Date.now(),
            notes: 'Test payment after RBAC fix'
        };

        console.log('🚀 Attempting to create payment...');
        const payRes = await axios.post(`${API_URL}/fees/payments`, paymentData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✨ Payment Successful:', payRes.data.success);
        if (payRes.data.data) {
            console.log('🆔 Payment ID:', payRes.data.data.id);
            console.log('💰 Amount:', payRes.data.data.amount);
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ Test Failed:', error.response.status, error.response.data);
        } else {
            console.error('❌ Test Failed:', error.message);
        }
    }
}

testPayment();
