const { google } = require('googleapis');
const path = require('path');

async function checkSheetRows() {
    console.log('=== فحص صفوف ملف جوجل شيت بالتفصيل ===');
    
    const keyFile = path.join(__dirname, 'google-credentials.json');
    const auth = new google.auth.GoogleAuth({
        keyFile,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.readonly'
        ]
    });
    
    const spreadsheetId = '1-BrBFAl885A5_whxJPneu1nzwOVY4lS9QfdpOW1tgqQ';
    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        // Fetch data from "'Leads '!A:Z"
        console.log('\n--- جاري جلب البيانات من النطاق "\'Leads \'!A:Z" ---');
        const range1 = "'Leads '!A:Z";
        const res1 = await sheets.spreadsheets.values.get({ spreadsheetId, range: range1 });
        const rows1 = res1.data.values || [];
        console.log(`إجمالي الأسطر المسترجعة من "'Leads '!A:Z": ${rows1.length}`);
        
        if (rows1.length > 0) {
            console.log('عينة من السطر الأول (العناوين):', rows1[0]);
            console.log(`عينة من السطر الأخير (رقم ${rows1.length}):`, rows1[rows1.length - 1]);
        }

    } catch (err) {
        console.error('❌ فشل الفحص:', err.message);
    }
}

checkSheetRows();
