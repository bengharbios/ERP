const { createClient } = require('@libsql/client');
require('dotenv').config({ path: '.env' }); // Load from current backend directory

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url || !authToken) {
  console.error('Missing Turso credentials');
  process.exit(1);
}

const turso = createClient({ url, authToken });

async function migrate() {
  console.log('Starting Turso migration...');
  
  try {
    // 1. Create tenants table
    console.log('Creating tenants table...');
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS "tenants" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "name" TEXT NOT NULL,
          "slug" TEXT NOT NULL,
          "logo" TEXT,
          "domain" TEXT,
          "country" TEXT NOT NULL DEFAULT 'SA',
          "currency" TEXT NOT NULL DEFAULT 'SAR',
          "timezone" TEXT NOT NULL DEFAULT 'Asia/Riyadh',
          "language" TEXT NOT NULL DEFAULT 'ar',
          "is_active" BOOLEAN NOT NULL DEFAULT 1,
          "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    await turso.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "tenants_slug_key" ON "tenants"("slug");`);
    await turso.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "tenants_domain_key" ON "tenants"("domain");`);
    
    // 2. Create super_admins table
    console.log('Creating super_admins table...');
    await turso.execute(`
      CREATE TABLE IF NOT EXISTS "super_admins" (
          "id" TEXT NOT NULL PRIMARY KEY,
          "email" TEXT NOT NULL,
          "password_hash" TEXT NOT NULL,
          "full_name" TEXT NOT NULL,
          "phone" TEXT,
          "role" TEXT NOT NULL DEFAULT 'SUPER_ADMIN',
          "avatar_url" TEXT,
          "two_factor_enabled" BOOLEAN NOT NULL DEFAULT 0,
          "two_factor_secret" TEXT,
          "last_login_at" DATETIME,
          "last_login_ip" TEXT,
          "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await turso.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "super_admins_email_key" ON "super_admins"("email");`);

    // 3. Alter users table
    console.log('Adding tenant_id to users table...');
    try {
      await turso.execute(`ALTER TABLE "users" ADD COLUMN "tenant_id" TEXT REFERENCES "tenants"("id") ON DELETE SET NULL ON UPDATE CASCADE;`);
    } catch (e) {
      if (e.message.includes('duplicate column name')) {
        console.log('Column tenant_id already exists in users table, skipping.');
      } else {
        throw e;
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error.message);
  }
}

migrate();
