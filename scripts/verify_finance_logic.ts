
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

async function verifyFinance() {
    console.log('🚀 Starting Financial Logic Verification (VAT & Discount)...');

    try {
        // 0. Login
        console.log('🔐 Authenticating...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@example.com',
            password: 'admin123'
        });
        const token = loginRes.data.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };

        // 1. Create Student with Tuition + Registration + Discount
        // Scenario: Tuition 10,000 | Reg 500 | Discount 10%
        // Net Tuition = 9,000
        // Taxable Base = 9,000 + 500 = 9,500
        // VAT (15%) = 1,425
        // Total Expected = 9,500 + 1,425 = 10,925

        const payload = {
            firstNameEn: "Finance",
            lastNameEn: "Test",
            firstNameAr: "تجربة",
            lastNameAr: "مالية",
            gender: "male",
            username: `fin_${Date.now()}`,

            // Financials
            tuitionFee: 10000,
            registrationFee: 500,
            initialPayment: 0,
            installmentCount: 1,
            discountType: 'percentage',
            discountValue: 10,  // 10%
            includeRegistrationInInstallments: true
        };

        console.log('📤 Submitting Finance Test Student...');
        console.log('   Tuition: 10,000, Reg: 500, Discount: 10%');

        const createRes = await axios.post(`${API_URL}/students`, payload, config);
        const studentId = createRes.data.data.student.id;
        console.log(`✅ Student Created: ${studentId}`);

        // 2. Fetch Billing Details (Fees Page Logic)
        // We probably need to query the FeeCalculation directly via API if available, 
        // or just check the installments/enrollment endpoint if it returns balance.
        // Actually, the best way is to check the Database or an Endpoint that exposes the Fee Calculation.
        // Let's assume there is an endpoint to get student details with fees, or we use a Prisma script.
        // Since this is a "simulation" from outside, I'll use a direct Prisma check if API doesn't expose tax yet.
        // But wait, I can't run Prisma inside this script if I use axios (client side simulation).
        // I'll try to fetch the student profile, maybe it has balance?

        console.log('🔍 Fetching Student Profile to verify Balance...');
        const studentRes = await axios.get(`${API_URL}/students/${studentId}`, config);
        const feeCalc = studentRes.data.data.student.feeCalculations?.[0]; // Assuming relation is included

        if (feeCalc) {
            console.log('📊 Fee Calculation Found:');
            console.log(`   - Subtotal: ${feeCalc.subtotal} (Exp: 10500)`);
            console.log(`   - Discount: ${feeCalc.discountAmount} (Exp: 1000)`);
            console.log(`   - Tax (VAT): ${feeCalc.taxAmount} (Exp: 1425)`);
            console.log(`   - Total: ${feeCalc.totalAmount} (Exp: 10925)`);

            const expectedTotal = 10925;
            if (Math.abs(Number(feeCalc.totalAmount) - expectedTotal) < 1) {
                console.log('✅✅ SUCCESS: VAT and Discount logic is CORRECT!');
            } else {
                console.error('❌❌ FAILURE: Total mismatch.');
            }
        } else {
            console.warn('⚠️ No Fee Calculation returned in profile. Logic might run async or relation not included.');
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Script Error:', error.message);
        }
    }
}

verifyFinance();
