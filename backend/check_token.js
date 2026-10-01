require('dotenv').config();

const token = process.env.TURSO_AUTH_TOKEN;
if (!token) {
  console.log('❌ لا يوجد TURSO_AUTH_TOKEN في .env');
  process.exit(1);
}

// JWT = header.payload.signature
const parts = token.split('.');
if (parts.length !== 3) {
  console.log('❌ التوكن ليس JWT صحيحاً');
  process.exit(1);
}

try {
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
  console.log('\n=== معلومات Auth Token ===');
  console.log('Payload:', JSON.stringify(payload, null, 2));
  
  if (payload.exp) {
    const expDate = new Date(payload.exp * 1000);
    const now = new Date();
    const isExpired = now > expDate;
    console.log(`\n📅 تاريخ الانتهاء: ${expDate.toLocaleString('ar-AE')}`);
    console.log(`⏰ الوقت الحالي:  ${now.toLocaleString('ar-AE')}`);
    console.log(isExpired ? '❌ التوكن منتهي الصلاحية!' : '✅ التوكن لا يزال صالحاً');
  } else {
    console.log('\n♾️ التوكن بدون تاريخ انتهاء (لا ينتهي)');
    console.log('→ المشكلة ليست في الصلاحية، ربما تم إلغاء التوكن أو تغيير الـ database');
  }
} catch(e) {
  console.log('❌ خطأ في قراءة التوكن:', e.message);
}
