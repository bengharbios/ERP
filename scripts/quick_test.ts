import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

async function quickTest() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin@example.com', // Using email in username field (backend allows both)
            password: 'admin123'
        });

        // Corrected token name: 'accessToken' instead of 'token'
        const token = loginRes.data.data.accessToken;
        if (!token) {
            console.error('Failed to get access token');
            return;
        }

        const config = { headers: { Authorization: `Bearer ${token}` } };

        const studentData = {
            firstNameAr: 'أحمد',
            lastNameAr: 'محمد',
            firstNameEn: 'Ahmed',
            lastNameEn: 'Mohammed',
            gender: 'male',
            email: `test${Date.now()}@test.com`,
            tuitionFee: 10000,
            registrationFee: 500,
            initialPayment: 1000,
            installmentCount: 3,
            discountType: 'percentage',
            discountValue: 10
        };

        console.log('2. Creating student...');
        const res = await axios.post(`${API_URL}/students`, studentData, config);
        const studentId = res.data.data.student.id;
        console.log('   Student created:', studentId);

        console.log('3. Fetching student details...');
        const detail = await axios.get(`${API_URL}/students/${studentId}`, config);
        const calc = detail.data.data.student.feeCalculations?.[0];

        if (calc) {
            console.log('\nFinancial Verification (IFRS 2026 / VAT 15%):');
            console.log('---------------------------------------------');
            console.log('Subtotal:         ', calc.subtotal);
            console.log('Discount Amount:  ', calc.discountAmount);
            console.log('Registration Fee: ', 500); // from setup
            console.log('Tax Amount (VAT): ', calc.taxAmount || 'MISSING');
            console.log('Total Amount:     ', calc.totalAmount);
            console.log('Initial Payment:  ', 1000);
            console.log('Balance:          ', calc.balance);

            /* 
              Expected Calculation:
              Tuition: 10,000
              Discount: 10% of 10,000 = 1,000
              Net Tuition: 9,000
              Registration Fee: 500
              Taxable Amount: 9,000 + 500 = 9,500
              VAT (15%): 9,500 * 0.15 = 1,425
              Total: 9,500 + 1,425 = 10,925
              Balance: 10,925 - 1,000 = 9,925
            */
            const expectedTotal = 10925;
            const expectedTax = 1425;

            console.log('\nCheck Results:');
            console.log('VAT Match (1425):    ', Math.abs(Number(calc.taxAmount) - expectedTax) < 1 ? '✅ PASS' : '❌ FAIL');
            console.log('Total Match (10925): ', Math.abs(Number(calc.totalAmount) - expectedTotal) < 1 ? '✅ PASS' : '❌ FAIL');
        } else {
            console.log('❌ No financial calculation found');
        }
    } catch (e: any) {
        console.error('Error:', e.response?.status, e.response?.data?.error?.message || e.message);
        if (e.response?.data?.error?.debug) {
            console.log('Debug Info:', JSON.stringify(e.response.data.error.debug, null, 2));
        }
    }
}

quickTest();
