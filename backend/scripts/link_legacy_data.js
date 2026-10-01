const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' });

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

const turso = createClient({ url, authToken });

async function linkLegacyData() {
  console.log('Linking legacy data to a new Tenant...');
  
  try {
    // 1. Fetch legacy institute name from settings if exists
    let instituteName = 'المعهد الأساسي (Legacy)';
    try {
      const settingsResult = await turso.execute(`SELECT institute_name_ar FROM settings LIMIT 1`);
      if (settingsResult.rows.length > 0 && settingsResult.rows[0].institute_name_ar) {
        instituteName = settingsResult.rows[0].institute_name_ar;
      }
    } catch (e) {
      console.log('Could not fetch settings, using default name.');
    }

    // 2. Check if the legacy tenant already exists
    const legacySlug = 'legacy-main-institute';
    const checkTenant = await turso.execute(`SELECT id FROM tenants WHERE slug = '${legacySlug}'`);
    
    let tenantId;
    
    if (checkTenant.rows.length === 0) {
      tenantId = 'tenant_legacy_001';
      console.log(`Creating Legacy Tenant: ${instituteName}...`);
      await turso.execute({
        sql: `INSERT INTO tenants (id, name, slug, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        args: [tenantId, instituteName, legacySlug]
      });
    } else {
      tenantId = checkTenant.rows[0].id;
      console.log('Legacy tenant already exists.');
    }

    // 3. Link all existing unlinked users to this tenant
    console.log(`Linking existing users to Tenant ID: ${tenantId}...`);
    const updateResult = await turso.execute(`UPDATE users SET tenant_id = '${tenantId}' WHERE tenant_id IS NULL`);
    
    console.log(`Successfully linked ${updateResult.rowsAffected} legacy users to the primary tenant!`);
    
  } catch (error) {
    console.error('Error linking legacy data:', error.message);
  }
}

linkLegacyData();
