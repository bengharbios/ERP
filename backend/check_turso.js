const { createClient } = require('@libsql/client');
require('dotenv').config();

const turso = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function main() {
  const tables = [
    'students', 'users', 'employees', 'crm_leads',
    'programs', 'classes', 'lectures', 'student_enrollments',
    'assignments', 'student_assignments', 'attendance_records'
  ];

  console.log('=== Turso Database Record Counts ===');
  for (const table of tables) {
    try {
      const result = await turso.execute(`SELECT COUNT(*) as count FROM ${table}`);
      const count = result.rows[0].count;
      console.log(`${table}: ${count}`);
    } catch (e) {
      console.log(`${table}: ERROR - ${e.message}`);
    }
  }
}

main().catch(console.error);
