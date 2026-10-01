const { createClient } = require('@libsql/client');
require('dotenv').config();

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  console.log('=== Turso Tenants Fix Script ===');
  console.log('Connected to:', process.env.TURSO_DATABASE_URL);

  try {
    // 1. Check all tables
    const tablesResult = await turso.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name");
    const tables = tablesResult.rows.map(r => r.name);
    console.log('\nAll tables (' + tables.length + '):', tables.join(', '));

    const hasTenants = tables.includes('tenants');
    const hasSuperAdmins = tables.includes('super_admins');
    console.log('\ntenants table:', hasTenants ? 'EXISTS' : 'MISSING');
    console.log('super_admins table:', hasSuperAdmins ? 'EXISTS' : 'MISSING');

    // 2. Create tenants table if missing
    if (!hasTenants) {
      console.log('\nCreating tenants table...');
      await turso.execute("CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, logo TEXT, domain TEXT UNIQUE, country TEXT NOT NULL DEFAULT 'SA', currency TEXT NOT NULL DEFAULT 'SAR', timezone TEXT NOT NULL DEFAULT 'Asia/Riyadh', language TEXT NOT NULL DEFAULT 'ar', is_active INTEGER NOT NULL DEFAULT 1, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))");
      console.log('tenants table created!');
    } else {
      const existing = await turso.execute('SELECT id, name, slug FROM tenants');
      console.log('\nExisting tenants:', existing.rows.length);
      existing.rows.forEach(t => console.log(' -', t.id, '|', t.name, '|', t.slug));
    }

    // 3. Create super_admins table if missing
    if (!hasSuperAdmins) {
      console.log('\nCreating super_admins table...');
      await turso.execute("CREATE TABLE IF NOT EXISTS super_admins (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, full_name TEXT NOT NULL, phone TEXT, role TEXT NOT NULL DEFAULT 'SUPER_ADMIN', avatar_url TEXT, two_factor_enabled INTEGER NOT NULL DEFAULT 0, two_factor_secret TEXT, last_login_at TEXT, last_login_ip TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')), updated_at TEXT NOT NULL DEFAULT (datetime('now')))");
      console.log('super_admins table created!');
    }

    // 4. Check tenant_id column in users
    const userCols = await turso.execute('PRAGMA table_info(users)');
    const hasTenantId = userCols.rows.some(c => c.name === 'tenant_id');
    console.log('\ntenant_id in users:', hasTenantId ? 'EXISTS' : 'MISSING');
    if (!hasTenantId) {
      await turso.execute('ALTER TABLE users ADD COLUMN tenant_id TEXT REFERENCES tenants(id)');
      console.log('tenant_id added to users!');
    }

    // 5. Restore معهد السلام
    const alsalamCheck = await turso.execute("SELECT * FROM tenants WHERE slug = 'alsalam-institute'");
    if (alsalamCheck.rows.length === 0) {
      console.log('\nRestoring alsalam institute...');
      await turso.execute({ sql: "INSERT OR IGNORE INTO tenants (id, name, slug, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, datetime('now'), datetime('now'))", args: ['tenant_primary_001', 'معهد السلام الدولي للغات والتدريب', 'alsalam-institute'] });
      const updated = await turso.execute({ sql: 'UPDATE users SET tenant_id = ? WHERE tenant_id IS NULL', args: ['tenant_primary_001'] });
      console.log('Restored! Linked', updated.rowsAffected, 'users to tenant.');
    } else {
      console.log('\nalsalam-institute already exists!');
    }

    // Final count
    const finalTenants = await turso.execute('SELECT id, name, slug FROM tenants');
    console.log('\n=== FINAL: Total tenants:', finalTenants.rows.length, '===');
    finalTenants.rows.forEach(t => console.log(' -', t.name, '(' + t.slug + ')'));

  } catch (err) {
    console.error('ERROR:', err.message);
  }
  process.exit(0);
}
main();
