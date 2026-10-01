const { createClient } = require('@libsql/client');
require('dotenv').config();

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log('🔌 محاولة الاتصال بـ Turso...');
  console.log('URL:', process.env.TURSO_DATABASE_URL);
  
  try {
    // اختبار بسيط أولاً
    const ping = await turso.execute("SELECT 1 as ping");
    console.log('✅ الاتصال ناجح!');

    // قائمة الجداول
    const tables = await turso.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    console.log(`\n📊 عدد الجداول: ${tables.rows.length}`);
    
    // عد السجلات في كل جدول
    console.log('\n=== عدد السجلات في كل جدول ===');
    for (const row of tables.rows) {
      const name = row.name;
      if (name.startsWith('_')) continue; // تجاهل جداول النظام
      try {
        const count = await turso.execute(`SELECT COUNT(*) as c FROM "${name}"`);
        const c = count.rows[0].c;
        if (c > 0) console.log(`✅ ${name}: ${c} سجل`);
        else console.log(`⚪ ${name}: فارغ`);
      } catch(e) {
        console.log(`❌ ${name}: ${e.message}`);
      }
    }
  } catch(e) {
    console.log('❌ فشل الاتصال:', e.message);
    console.log('\n🔍 التشخيص:');
    if (e.message.includes('401')) console.log('→ Auth Token منتهي الصلاحية أو خاطئ');
    if (e.message.includes('404')) console.log('→ قاعدة البيانات غير موجودة');
    if (e.message.includes('ECONNREFUSED')) console.log('→ مشكلة في الشبكة');
  }
}

main();
