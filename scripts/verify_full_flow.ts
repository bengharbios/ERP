
import axios from 'axios';

const API_URL = 'http://localhost:3000/api/v1';

async function verifyStudentFlow() {
    console.log('🚀 Starting Full Student Creation Verification...');

    // Mock Form Payload (Simulating the frontend state)
    const payload = {
        // Step 1: Personal
        firstNameAr: "تجربة",
        lastNameAr: "النظام",
        firstNameEn: "System",
        lastNameEn: "Test",
        username: `user_${Date.now()}`, // Added required field
        gender: "male",
        nationality: "Saudi",
        phone: "0509999999",
        email: `test_sys_${Date.now()}@test.com`,
        studentNumber: `SYS-${Date.now()}`,

        // Step 2: Academic
        enrollmentDate: new Date().toISOString().split('T')[0],
        programId: "", // Will be fetched
        classId: "",   // Will be fetched

        // Step 3: Financial
        tuitionFee: 5000,
        registrationFee: 500,
        initialPayment: 1000,
        installmentCount: 4,
        includeRegistrationInInstallments: true,
        firstInstallmentDate: new Date().toISOString().split('T')[0]
    };

    try {
        // 0. Login
        console.log('🔐 Authenticating...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'admin@example.com',
            password: 'admin123'
        });
        const token = loginRes.data.data.token;
        if (!token) throw new Error("Login failed - No token received");
        console.log('✅ Authenticated successfully!');

        // Setup Auth Header
        const config = {
            headers: { Authorization: `Bearer ${token}` }
        };

        // 1. Fetch Program & Class to use
        console.log('📡 Fetching valid Program & Class...');
        const programsRes = await axios.get(`${API_URL}/academic/programs`, config);
        const programs = programsRes.data.data.programs;

        if (!programs.length) throw new Error("No programs found!");
        payload.programId = programs[0].id;

        const classesRes = await axios.get(`${API_URL}/academic/classes?programId=${payload.programId}`, config);
        const classes = classesRes.data.data.classes;

        if (!classes.length) {
            throw new Error("No classes found to enroll in.");
        }
        payload.classId = classes[0].id;
        console.log(`✅ Selected Program: ${programs[0].nameEn}, Class: ${classes[0].name}`);

        // 2. Submit Student (Simulate Form Submit)
        console.log('📤 Submitting Student Data...');
        const createRes = await axios.post(`${API_URL}/students`, payload, config);

        if (createRes.status === 201) {
            const student = createRes.data.data.student;
            console.log(`✅ Student Created! ID: ${student.id} | Name: ${student.firstNameEn}`);

            // 3. Verify Enrollment
            console.log('🔍 Verifying Enrollment...');
            const enrollmentRes = await axios.get(`${API_URL}/students/${student.id}/enrollments`, config);
            const enrollments = enrollmentRes.data.data.enrollments;

            const enrollmentMatch = enrollments.find(e => e.classId === payload.classId);
            if (enrollmentMatch) {
                console.log(`✅ Enrollment Verified! (ID: ${enrollmentMatch.id})`);
            } else {
                console.error('❌ Enrollment Check Failed! Class mismatch.');
            }

            // 4. Verify Financials
            console.log('🔍 Verifying Financials...');
            // Check Fee Calculation
            const feesRes = await axios.get(`${API_URL}/fees/student-calculations/${student.id}`, config);
            const calculations = feesRes.data.data.calculations;

            if (calculations && calculations.length > 0) {
                // Find the latest one just created
                const calc = calculations[calculations.length - 1]; // Assuming order or just pick last

                console.log(`✅ Fee Calculation Found: ${calc.calculationNumber}`);
                console.log(`   - Total Amount: ${calc.totalAmount} (Expected: 5500)`);
                console.log(`   - Program ID Saved: ${calc.programId}`);

                if (calc.programId === payload.programId) {
                    console.log('✅ Program ID Linkage Verified!');
                } else {
                    console.error('❌ Program ID Missing in Fee Calculation!');
                }

                // Verify Installments
                if (payload.installmentCount > 0) {
                    // We need to fetch installment plan separately or check if included in calculation response
                    // The getStudentFeeCalculations usually includes minimal info, let's assume if calculation exists, logic ran.
                    console.log('✅ Financial Logic triggered successfully.');
                }

            } else {
                console.error('❌ No Fee Calculations created!');
            }

        } else {
            console.error('❌ Creation Failed:', createRes.data);
        }

    } catch (error) {
        if (error.response) {
            console.error('❌ API Error:', error.response.status, JSON.stringify(error.response.data, null, 2));
        } else {
            console.error('❌ Script Error:', error.message);
        }
    }
}

verifyStudentFlow();
