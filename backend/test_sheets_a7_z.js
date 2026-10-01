const { google } = require('googleapis');
const path = require('path');

async function testA7toZ() {
    console.log('=== اختبار جلب النطاق "\'Leads \'!A7:Z" ومطابقة الحقول ===');
    
    const keyFile = path.join(__dirname, 'google-credentials.json');
    const auth = new google.auth.GoogleAuth({
        keyFile,
        scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });
    
    const spreadsheetId = '1-BrBFAl885A5_whxJPneu1nzwOVY4lS9QfdpOW1tgqQ';
    const sheets = google.sheets({ version: 'v4', auth });
    
    try {
        const range = "'Leads '!A7:Z";
        const res = await sheets.spreadsheets.values.get({ spreadsheetId, range });
        const rows = res.data.values || [];
        
        console.log(`إجمالي الأسطر المسترجعة من النطاق المحدد: ${rows.length}`);
        if (rows.length === 0) {
            console.log('❌ لم يتم العثور على أي سطور!');
            return;
        }
        
        const headers = rows[0];
        console.log('رأس الجدول (السطر الأول المكتشف):', headers);
        
        // Let's run our column mapper logic:
        const mapping = {};
        const clean = (s) => s.trim().toLowerCase().replace(/[^a-zA-Z0-9\u0621-\u064A]/g, '');
        
        headers.forEach((header, index) => {
            const h = clean(header);
            if (['الاسم', 'اسم', 'اسمالعميل', 'name', 'fullname', 'clientname', 'اسمالعميلcustomername'].includes(h)) {
                mapping['name'] = index;
            } else if (['الهاتف', 'رقمالهاتف', 'الهاتفالموبايل', 'رقم', 'phone', 'phonenumber', 'telephone', 'column4'].includes(h)) {
                mapping['phone'] = index;
            } else if (['الموبايل', 'رقمالموبايل', 'موبايل', 'mobile', 'mobilenumber'].includes(h)) {
                mapping['mobile'] = index;
            } else if (['البريد', 'البريدالإلكتروني', 'البريدالالكتروني', 'email', 'emailaddress', 'إيميلالعميلcustomeremail'].includes(h)) {
                mapping['emailFrom'] = index;
            } else if (['الجنسية', 'جنسية', 'nationality', 'country', 'الجنسية-'].includes(h)) {
                mapping['nationality'] = index;
            } else if (['الإمارة', 'الامارة', 'المدينة', 'العنوان', 'emirate', 'city', 'address'].includes(h)) {
                mapping['emirate'] = index;
            } else if (['الدبلوم', 'التخصص', 'الدورة', 'البرنامجالمهتمبه', 'diploma', 'program', 'course', 'interesteddiploma'].includes(h)) {
                mapping['interestedDiploma'] = index;
            } else if (['مستوىالاهتمام', 'الاهتمام', 'levelofinterest', 'interest', 'interestlevel'].includes(h)) {
                mapping['levelOfInterest'] = index;
            } else if (['ملاحظات', 'ملاحظة', 'التفاصيل', 'notes', 'note', 'comments', 'comment'].includes(h)) {
                mapping['notes'] = index;
            } else if (['المصدر', 'المنصة', 'source', 'platform', 'leadsource', 'المنصةplatform'].includes(h)) {
                mapping['source'] = index;
            }
        });
        
        console.log('الربط المكتشف للأعمدة:', mapping);
        
        // Let's see some mapped row examples
        console.log('\nعينة من أول 3 عملاء مكتشفين:');
        for (let i = 1; i <= 3 && i < rows.length; i++) {
            const row = rows[i];
            console.log(`العميل رقم ${i}:`, {
                الاسم: row[mapping['name']],
                الهاتف: row[mapping['phone']],
                الجنسية: row[mapping['nationality']],
                الإمارة: row[mapping['emirate']],
                البريد: row[mapping['emailFrom']],
                المنصة: row[mapping['source']]
            });
        }

    } catch (err) {
        console.error('❌ خطأ في الفحص:', err.message);
    }
}

testA7toZ();
