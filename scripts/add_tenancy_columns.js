const { createClient } = require('@libsql/client');
require('dotenv').config({ path: './backend/.env' });

const libsql = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN
});

async function run() {
  console.log('Connecting to Turso...');
  
  try {
    await libsql.execute("ALTER TABLE programs ADD COLUMN tenant_id TEXT DEFAULT 'tenant_primary_001';");
    console.log('Added tenant_id to programs');
  } catch (e) {
    console.log('programs note:', e.message);
  }

  try {
    await libsql.execute("ALTER TABLE classes ADD COLUMN tenant_id TEXT DEFAULT 'tenant_primary_001';");
    console.log('Added tenant_id to classes');
  } catch (e) {
    console.log('classes note:', e.message);
  }

  try {
    await libsql.execute("ALTER TABLE crm_leads ADD COLUMN tenant_id TEXT DEFAULT 'tenant_primary_001';");
    console.log('Added tenant_id to crm_leads');
  } catch (e) {
    console.log('crm_leads note:', e.message);
  }

  console.log('Migration completed successfully!');
}

run().catch(console.error);
