
const API_URL = 'http://localhost:3000/api/v1';

async function testCreateStudent() {
    console.log('🧪 Starting Student Creation Test (JS version)...');

    // 1. Login to get Token
    console.log('🔑 Authenticating...');
    let token = '';

    // Helper to login
    const tryLogin = async (creds) => {
        try {
            const res = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(creds)
            });
            return res;
        } catch (e) {
            console.error('Fetch error during login:', e.message);
            return { ok: false, status: 0, statusText: e.message };
        }
    };

    // Try default admin (Note: Backend expects 'username' key even for email)
    let loginRes = await tryLogin({ username: 'admin@institute.com', password: 'password123' });

    if (!loginRes.ok) {
        console.log('   Default login failed (admin@institute.com), trying username "admin"...');
        loginRes = await tryLogin({ username: 'admin', password: 'admin123' });
    }

    if (!loginRes.ok) {
        console.log('   Username "admin" failed. Registering temp admin...');
        const regRes = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'tempadmin',
                email: 'tempadmin@test.com',
                password: 'password123',
                firstName: 'Temp',
                lastName: 'Admin'
            })
        });

        if (regRes.ok || regRes.status === 409) { // 409 means exists, so just login
            console.log('   Register success/exists. Logging in with tempadmin...');
            loginRes = await tryLogin({ username: 'tempadmin', password: 'password123' });
        }
    }

    if (!loginRes.ok) {
        console.error(`❌ Auth Fatal Error: Could not login. Status: ${loginRes.status}`);
        return;
    }

    const loginData = await loginRes.json();
    token = loginData.data?.accessToken;

    if (!token) {
        console.error('❌ Token not found in response:', loginData);
        return;
    }
    console.log('✅ Key Acquired!');

    // 2. Simulate Form Data
    const formData = {
        firstNameEn: "Verification",
        lastNameEn: "User",
        firstNameAr: "مستخدم",
        lastNameAr: "التحقق",
        dateOfBirth: "2000-01-01",
        gender: "male",
        email: "",
        phone: "0599999999",
        address: "Test Address",
        admissionDate: "",
        emergencyContactName: "Mother",
        emergencyContactPhone: "0511111111",
        status: "active"
    };

    // 3. Frontend Logic
    console.log('🔄 Cleaning & Mapping Data...');
    const cleanData = { ...formData };
    if (cleanData.email === '') delete cleanData.email;
    if (cleanData.admissionDate === '') delete cleanData.admissionDate;

    if (cleanData.emergencyContactName || cleanData.emergencyContactPhone) {
        cleanData.emergencyContact = `${cleanData.emergencyContactName || ''} - ${cleanData.emergencyContactPhone || ''}`;
        delete cleanData.emergencyContactName;
        delete cleanData.emergencyContactPhone;
    }

    console.log('📤 Sending Payload:', JSON.stringify(cleanData, null, 2));

    // 4. Send Request
    try {
        const response = await fetch(`${API_URL}/students/students`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(cleanData)
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ SUCCESS! Student Created.');
            console.log('   ID:', data.data?.student?.id || data.data?.id);
        } else {
            console.error('❌ Server Error:', response.status);
            console.error('   Details:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ Network Error:', error.message);
    }
}

testCreateStudent();
