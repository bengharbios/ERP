const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

async function testRegistration() {
    try {
        console.log('🔐 Logging in as admin...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin@institute.com',
            password: 'admin123'
        });

        const token = loginRes.data.data.accessToken;
        console.log('✅ Logged in successfully.');

        const studentData = {
            firstNameAr: 'أحمد',
            lastNameAr: 'محمد علي',
            firstNameEn: 'Ahmed',
            lastNameEn: 'Mohamed Ali',
            email: `ahmed.test.${Date.now()}@example.com`,
            phone: '+966500000000',
            gender: 'male',
            dateOfBirth: '2005-05-15',
            nationality: 'KSA',
            address: 'Riyadh, Saudi Arabia',
            status: 'active',
            admissionDate: new Date().toISOString().split('T')[0],
            programId: '231c47a7-6363-4964-a71a-327a35c2a55c', // BTEC-L3-NEC
            classId: '44e1498b-fa49-48e2-9a25-e0825c6c4eb3',   // PL3-AR
            specialization: 'Business Management',
            certificateCourseTitle: 'BTEC Level 3 Certificate',

            // Financial Details
            tuitionFee: 5000,
            registrationFee: 500,
            discountType: 'fixed',
            discountValue: 500,
            initialPayment: 1000,
            installmentCount: 4,
            firstInstallmentDate: '2026-03-01',
            registrationFeeDate: '2026-02-25',
            includeRegistrationInInstallments: true
        };

        console.log('🚀 Creating student with full financial details...');
        const regRes = await axios.post(`${API_URL}/students`, studentData, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('✨ Response Success:', regRes.data.success);
        console.log('🆔 Student ID:', regRes.data.data.student.id);
        console.log('🔢 Student Number:', regRes.data.data.student.studentNumber);

        // Verify financial details by fetching student
        console.log('📋 Verifying financial calculations...');
        const studentRes = await axios.get(`${API_URL}/students/${regRes.data.data.student.id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        const student = studentRes.data.data.student;
        const calc = student.feeCalculations?.[0];

        if (calc) {
            console.log('💰 Financial Calculations:');
            console.log('   - Total Amount (inc Tax):', calc.totalAmount);
            console.log('   - Paid Amount:', calc.paidAmount);
            console.log('   - Balance:', calc.balance);
            console.log('   - Status:', calc.status);

            if (calc.installmentPlans?.[0]) {
                const plan = calc.installmentPlans[0];
                console.log('📅 Installment Plan:', plan.name);
                console.log('   - Count:', plan.installments.length);
            }
        } else {
            console.warn('⚠️ No fee calculation found for the student!');
        }

    } catch (error) {
        console.error('❌ Test Failed:', error.response?.data || error.message);
    }
}

testRegistration();
