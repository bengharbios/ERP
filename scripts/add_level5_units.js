const axios = require('axios');

const API_URL = 'http://localhost:3000/api/v1';

// Level 5 Units (المستوى الخامس) - 15 Credits Each
const level5Units = [
    {
        code: 'L5-M1',
        nameAr: 'الوحدة الأولى - المستوى الخامس',
        nameEn: 'Level 5 - Module 1',
        description: 'المستوى الخامس - الوحدة الأولى',
        creditHours: 15,
        totalLectures: 30
    },
    {
        code: 'L5-M2',
        nameAr: 'الوحدة الثانية - المستوى الخامس',
        nameEn: 'Level 5 - Module 2',
        description: 'المستوى الخامس - الوحدة الثانية',
        creditHours: 15,
        totalLectures: 30
    },
    {
        code: 'L5-M3',
        nameAr: 'الوحدة الثالثة - المستوى الخامس',
        nameEn: 'Level 5 - Module 3',
        description: 'المستوى الخامس - الوحدة الثالثة',
        creditHours: 15,
        totalLectures: 30
    },
    {
        code: 'L5-M4',
        nameAr: 'الوحدة الرابعة - المستوى الخامس',
        nameEn: 'Level 5 - Module 4',
        description: 'المستوى الخامس - الوحدة الرابعة',
        creditHours: 15,
        totalLectures: 30
    },
    {
        code: 'L5-M5',
        nameAr: 'الوحدة الخامسة - المستوى الخامس',
        nameEn: 'Level 5 - Module 5',
        description: 'المستوى الخامس - الوحدة الخامسة',
        creditHours: 15,
        totalLectures: 30
    },
    {
        code: 'L5-M6',
        nameAr: 'الوحدة السادسة - المستوى الخامس',
        nameEn: 'Level 5 - Module 6',
        description: 'المستوى الخامس - الوحدة السادسة',
        creditHours: 15,
        totalLectures: 30
    }
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

async function createUnits(token) {
    console.log(`\n📚 Creating ${level5Units.length} Level 5 Units...\n`);

    let successCount = 0;
    let errorCount = 0;

    for (const unit of level5Units) {
        try {
            const response = await axios.post(
                `${API_URL}/academic/units`,
                unit,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            if (response.data?.success) {
                successCount++;
                console.log(`✅ Created: ${unit.nameAr} (${unit.code}) - ${unit.creditHours} credits`);
            }
        } catch (error) {
            errorCount++;
            const errorMsg = error.response?.data?.error?.message || error.message;
            console.error(`❌ Failed: ${unit.code} - ${errorMsg}`);
        }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Failed: ${errorCount}`);
    console.log(`   📚 Total: ${level5Units.length}`);
}

async function main() {
    try {
        const token = await authenticate();
        await createUnits(token);

        console.log('\n✅ Script completed successfully!');
    } catch (error) {
        console.error('\n❌ Script failed:', error.message);
        process.exit(1);
    }
}

main();
