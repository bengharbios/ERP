const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

// The program to assign units to
const PROGRAM_ID = 'a827c09c-0f3b-4705-aa79-444819b4e3c7'; // Pearson BTEC Ar G1 l5

// Level 5 unit codes that were just created
const level5UnitCodes = [
    'L5-M1',
    'L5-M2',
    'L5-M3',
    'L5-M4',
    'L5-M5',
    'L5-M6'
];

async function authenticate() {
    try {
        console.log('🔐 Logging in...');
        const response = await axios.post(`${API_URL}/auth/login`, {
            username: 'verifier',
            password: 'password123'
        });

        if (response.data?.data?.accessToken) {
            console.log('✅ Login successful');
            return response.data.data.accessToken;
        }
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        throw error;
    }
}

async function getUnits(token) {
    try {
        const response = await axios.get(`${API_URL}/academic/units`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.data?.success) {
            return response.data.data;
        }
    } catch (error) {
        console.error('❌ Failed to fetch units:', error.response?.data || error.message);
        throw error;
    }
}

async function assignUnitToProgram(token, unitId, unitCode) {
    try {
        const response = await axios.put(
            `${API_URL}/academic/units/${unitId}`,
            {
                programIds: [PROGRAM_ID]
            },
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        if (response.data?.success) {
            console.log(`  ✅ ${unitCode} assigned to program`);
            return true;
        }
    } catch (error) {
        const errorMsg = error.response?.data?.error?.message || error.message;
        console.error(`  ❌ Failed to assign ${unitCode}: ${errorMsg}`);
        return false;
    }
}

async function main() {
    try {
        const token = await authenticate();

        console.log('\n📚 Fetching units...');
        const response = await getUnits(token);

        // Debug: Check the response structure
        console.log('Response type:', typeof response);
        console.log('Is Array?:', Array.isArray(response));

        // Handle the response properly - it might be an object with units property
        let allUnits;
        if (Array.isArray(response)) {
            allUnits = response;
        } else if (response && typeof response === 'object') {
            // Response might be { units: [...] } or similar
            allUnits = response.units || response.data || [];
        } else {
            allUnits = [];
        }

        console.log(`Found ${allUnits.length} total units\n`);

        // Filter to get only our Level 5 units
        const level5Units = allUnits.filter(unit => level5UnitCodes.includes(unit.code));

        console.log(`✨ Assigning ${level5Units.length} units to program: Pearson BTEC Ar G1 l5\n`);

        let successCount = 0;

        for (const unit of level5Units) {
            const success = await assignUnitToProgram(token, unit.id, unit.code);
            if (success) successCount++;
        }

        console.log(`\n📊 Summary:`);
        console.log(`   ✅ Successfully assigned: ${successCount}`);
        console.log(`   ❌ Failed: ${level5Units.length - successCount}`);
        console.log(`   📚 Total: ${level5Units.length}`);

        console.log('\n✅ Assignment completed!');
    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        process.exit(1);
    }
}

main();
