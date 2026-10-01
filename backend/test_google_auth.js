const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

async function testAuth() {
    console.log('=== بدء تشخيص الاتصال بجوجل ===');
    
    // 1. Resolve credentials path
    const credentialsPath = path.join(__dirname, 'google-credentials.json');
    console.log('مسار ملف الاعتماد المحلي:', credentialsPath);
    
    if (!fs.existsSync(credentialsPath)) {
        console.error('❌ ملف google-credentials.json غير موجود في مجلد backend!');
        return;
    }
    
    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
    console.log('تم تحميل الملف بنجاح.');
    console.log('بريد حساب الخدمة:', credentials.client_email);
    console.log('معرف المشروع:', credentials.project_id);
    
    // 2. Format Private Key
    let privateKey = credentials.private_key;
    let cleanKey = privateKey.trim();
    const header = '-----BEGIN PRIVATE KEY-----';
    const footer = '-----END PRIVATE KEY-----';
    
    let base64Body = cleanKey;
    if (base64Body.includes(header)) base64Body = base64Body.replace(header, '');
    if (base64Body.includes(footer)) base64Body = base64Body.replace(footer, '');
    base64Body = base64Body.replace(/\\n/g, '').replace(/\\r/g, '').replace(/\s+/g, '');
    
    const lines = [];
    for (let i = 0; i < base64Body.length; i += 64) {
        lines.push(base64Body.slice(i, i + 64));
    }
    const formattedPrivateKey = `${header}\n${lines.join('\n')}\n${footer}\n`;
    
    // 3. Initialize Auth Client
    console.log('جاري إعداد JWT Client الخاص بجوجل...');
    const auth = new google.auth.JWT(
        credentials.client_email,
        null,
        formattedPrivateKey,
        [
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/drive.readonly'
        ]
    );
    
    // 4. Call Google Sheets API
    const spreadsheetId = '1-BrBFAl885A5_whxJPneu1nzwOVY4lS9QfdpOW1tgqQ';
    console.log(`جاري تجربة قراءة الشيت بالمعرف: ${spreadsheetId}...`);
    
    try {
        const sheets = google.sheets({ version: 'v4', auth });
        const response = await sheets.spreadsheets.get({
            spreadsheetId
        });
        
        console.log('✅ نجاح كامل! تم الاتصال بجوجل شيت بنجاح!');
        console.log('عنوان الشيت:', response.data.properties.title);
        console.log('اللوحات المتاحة:', response.data.sheets.map(s => s.properties.title).join(', '));
    } catch (err) {
        console.error('❌ فشل الاتصال بجوجل شيت!');
        console.error('تفاصيل الخطأ الكاملة:', err.message);
        if (err.response && err.response.data) {
            console.error('محتوى خطأ خادم جوجل:', JSON.stringify(err.response.data, null, 2));
        }
    }
}

testAuth();
