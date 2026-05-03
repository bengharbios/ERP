import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

async function testStudentCreation() {
    console.log('Testing Student Creation with Full Data...\n');

    try {
        // Login
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        const token = loginRes.data.data.token;
        const config = { headers: { Authorization: `Bearer ${token}` } };
        console.log('   Login successful!\n');

        // Create student with complete data
        const studentData = {
            // Names
            firstNameAr: 'محمد',
            lastNameAr: 'الشمري',
            firstNameEn: 'Mohammed',
            lastNameEn: 'Al-Shammari',

            // Basic info
            dateOfBirth: '2000-01-15',
            gender: 'male',
            nationality: 'Saudi',

            // Contact
            email: `test${Date.now()}@example.com`,
            phone: '+966501234567',

            // Financial data
            tuitionFee: 15000,
            registrationFee: 1000,
            initialPayment: 2000,
            installmentCount: 6,
            discountType: 'percentage',
            discountValue: 10
        };

        // Expected calculations
        const tuitionAfterDiscount = 13500; // 15000 - 10%
        const taxableAmount = 14500; // 13500 + 1000
        const vat = 2175; // 14500 * 0.15
        const totalExpected = 16675; // 14500 + 2175
        const balanceExpected = 14675; // 16675 - 2000

        console.log('2. Expected Financial Calculations:');
        console.log(`   Tuition: ${studentData.tuitionFee}`);
        console.log(`   Discount (10%): ${studentData.tuitionFee - tuitionAfterDiscount}`);
        console.log(`   After Discount: ${tuitionAfterDiscount}`);
        console.log(`   Registration: ${studentData.registrationFee}`);
        console.log(`   Taxable Amount: ${taxableAmount}`);
        console.log(`   VAT (15%): ${vat}`);
        console.log(`   Total Expected: ${totalExpected}`);
        console.log(`   Initial Payment: ${studentData.initialPayment}`);
        console.log(`   Balance Expected: ${balanceExpected}\n`);

        // Create student
        console.log('3. Creating student...');
        const createRes = await axios.post(`${API_URL}/students`, studentData, config);

        const student = createRes.data.data.student;
        console.log('   Student created successfully!');
        console.log(`   ID: ${student.id}`);
        console.log(`   Student Number: ${student.studentNumber}\n`);

        // Fetch student details with financial data
        console.log('4. Fetching financial data...');
        const detailRes = await axios.get(`${API_URL}/students/${student.id}`, config);
        const feeCalcs = detailRes.data.data.student.feeCalculations;

        if (feeCalcs && feeCalcs.length > 0) {
            const calc = feeCalcs[0];
            console.log('   Financial Calculation Found:');
            console.log(`   Subtotal: ${calc.subtotal}`);
            console.log(`   Discount: ${calc.discountAmount}`);
            console.log(`   Tax (VAT): ${calc.taxAmount || 'NOT CALCULATED'}`);
            console.log(`   Total: ${calc.totalAmount}`);
            console.log(`   Paid: ${calc.paidAmount}`);
            console.log(`   Balance: ${calc.balance}`);
            console.log(`   Status: ${calc.status}\n`);

            // Verify calculations
            const tolerance = 1;
            const totalOK = Math.abs(Number(calc.totalAmount) - totalExpected) < tolerance;
            const balanceOK = Math.abs(Number(calc.balance) - balanceExpected) < tolerance;
            const vatOK = calc.taxAmount ? Math.abs(Number(calc.taxAmount) - vat) < tolerance : false;

            console.log('5. Verification Results:');
            console.log(`   Total: ${totalOK ? 'PASS' : 'FAIL'} (Expected: ${totalExpected}, Got: ${calc.totalAmount})`);
            console.log(`   Balance: ${balanceOK ? 'PASS' : 'FAIL'} (Expected: ${balanceExpected}, Got: ${calc.balance})`);
            console.log(`   VAT: ${vatOK ? 'PASS' : 'FAIL'} (Expected: ${vat}, Got: ${calc.taxAmount || 'MISSING'})\n`);

            if (totalOK && balanceOK && vatOK) {
                console.log('SUCCESS: All calculations are correct!');
            } else {
                console.log('WARNING: Some calculations do not match expected values.');
                if (!calc.taxAmount) {
                    console.log('NOTE: Server may need restart to apply schema changes (taxAmount field).');
                }
            }
        } else {
            console.log('   WARNING: No financial calculation created.');
        }

    } catch (error: any) {
        console.error('\nERROR:');
        if (error.response) {
            console.error(`   Status: ${error.response.status}`);
            console.error(`   Message: ${error.response.data?.message || 'Unknown'}`);
            if (error.response.data?.errors) {
                console.error('   Details:', JSON.stringify(error.response.data.errors, null, 2));
            }
        } else {
            console.error(`   ${error.message}`);
        }
    }
}

testStudentCreation();
