// Utils for testing

// Mimic the interface from frontend
interface CreateStudentInput {
    studentNumber?: string;
    firstNameEn: string;
    lastNameEn: string;
    firstNameAr: string;
    lastNameAr: string;
    dateOfBirth: string;
    gender: string;
    nationality?: string;
    nationalId?: string;
    email?: string;
    phone?: string;
    address?: string;
    emergencyContact?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    admissionDate: string;
    status?: string;
}

const API_URL = 'http://localhost:3000/api/v1';

async function testCreateStudent() {
    console.log('🧪 Starting Student Creation Test (using fetch)...');

    // 1. Login to get Token
    console.log('🔑 Authenticating...');
    let token = '';

    // Helper to login
    const tryLogin = async (creds: any) => {
        const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(creds)
        });
        return res;
    };

    // Try default admin
    let loginRes = await tryLogin({ email: 'admin@institute.com', password: 'password123' }); // Try password123 first (common seed)

    if (!loginRes.ok) {
        console.log('   Default login failed, trying admin/admin123...');
        loginRes = await tryLogin({ email: 'admin@institute.com', password: 'admin123' });
    }

    if (!loginRes.ok) {
        console.log('   Admin login failed. Registering temp admin...');
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
            console.log('   Register success/exists. Logging in...');
            loginRes = await tryLogin({ email: 'tempadmin@test.com', password: 'password123' });
        }
    }

    if (!loginRes.ok) {
        throw new Error(`Auth Fatal Error: Could not login. Status: ${loginRes.status}`);
    }

    const loginData = await loginRes.json();
    token = loginData.data.accessToken;
    console.log('✅ Key Acquired!');

    // 2. Simulate Form Data
    const formData = {
        firstNameEn: "Test",
        lastNameEn: "Script",
        firstNameAr: "اختبار",
        lastNameAr: "سكربت",
        dateOfBirth: "2005-01-01",
        gender: "male",
        email: "",
        phone: "1234567890",
        address: "Test Address",
        admissionDate: "",
        emergencyContactName: "Father",
        emergencyContactPhone: "0500000000",
        status: "active"
    };

    // 3. Frontend Logic
    console.log('🔄 Cleaning & Mapping Data...');
    const cleanData: any = { ...formData };
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
            console.log('   ID:', data.data.student.id);
        } else {
            console.error('❌ Server Error:', response.status);
            console.error('   Details:', JSON.stringify(data, null, 2));
        }
    } catch (error: any) {
        console.error('❌ Network Error:', error.message);
    }
}

testCreateStudent();
