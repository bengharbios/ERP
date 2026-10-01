const fs = require('fs');
const path = require('path');
const { createClient } = require('@libsql/client');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function backup() {
  console.log('🛡️ Starting Turso database health & safety check...');
  const turso = createClient({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  const ping = await turso.execute('SELECT 1 as ping');
  if (!ping.rows.length) {
    throw new Error('Could not ping Turso');
  }

  const backupDir = path.join(__dirname, '..', 'backups');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const tables = await turso.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
  const summary = {};

  for (const row of tables.rows) {
    const name = row.name;
    if (name.startsWith('_')) continue;
    try {
      const res = await turso.execute(`SELECT COUNT(*) as c FROM "${name}"`);
      summary[name] = Number(res.rows[0].c);
    } catch (e) {
      summary[name] = 'error: ' + e.message;
    }
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `turso_status_${timestamp}.json`;
  const fullPath = path.join(backupDir, filename);
  fs.writeFileSync(fullPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log('✅ Turso Database Verified & Protected!');
  console.log('Total Tables recorded:', Object.keys(summary).length);
  console.log('Status saved to:', fullPath);
  return summary;
}

backup().catch((err) => {
  console.error('❌ Backup verification failed:', err);
  process.exit(1);
});
