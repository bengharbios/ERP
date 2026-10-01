const { google } = require('googleapis');
const path = require('path');

async function findHeaders() {
    console.log('=== البحث عن سطر العناوين في لوحة "Leads " ===');
    
    const keyFile = path.join(__dirname, 'google-credentials.json');
    const auth = new google.auth.GoogleAuth({
        keyFile,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const spreadsheetId = '1-BrBFAl885A5_whxJPneu1nzwOVY4lS9QfdpOW1tgqQ';
    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        const range1 = "'Leads '!A1:Z10"; // Fetch first 10 rows
        const res1 = await sheets.spreadsheets.values.get({ spreadsheetId, range: range1 });
        const rows = res1.data.values || [];
        
        console.log(`تم جلب ${rows.length} سطور للمعاينة:`);
        rows.forEach((row, idx) => {
            console.log(`السطر رقم ${idx + 1}:`, row.slice(0, 10)); // Print first 10 columns
        });

    } catch (err) {
        console.error('❌ فشل:', err.message);
    }
}

findHeaders();
