const { google } = require('googleapis');
const path = require('path');

async function testAuthV2() {
    console.log('=== بدء تشخيص الاتصال بجوجل V2 (GoogleAuth) ===');
    
    const keyFile = path.join(__dirname, 'google-credentials.json');
    console.log('مسار ملف الاعتماد:', keyFile);
    
    const auth = new google.auth.GoogleAuth({
        keyFile,
        scopes: [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.readonly'
        ]
    });
    
    const spreadsheetId = '1-BrBFAl885A5_whxJPneu1nzwOVY4lS9QfdpOW1tgqQ';
    console.log(`جاري تجربة قراءة الشيت بالمعرف: ${spreadsheetId}...`);
    
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.get({
            spreadsheetId
        });
        
        console.log('✅ نجاح كامل! تم الاتصال بجوجل شيت بنجاح باستخدام GoogleAuth!');
        console.log('عنوان الشيت:', response.data.properties.title);
    } catch (err) {
        console.error('❌ فشل الاتصال V2!');
        console.error('تفاصيل الخطأ الكاملة:', err.message);
        if (err.response && err.response.data) {
            console.error('محتوى خطأ خادم جوجل:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

testAuthV2();
