const Database = require('better-sqlite3');
const path = require('path');

const dbs = [
  path.join(__dirname, 'dataaa', 'config.db'),
  path.join(__dirname, 'dataaa', 'finger.db'),
  path.join(__dirname, 'dataaa', 'local.db'),
  path.join(__dirname, 'prisma', 'dev.db'),
];

for (const dbPath of dbs) {
  try {
    const db = new Database(dbPath, { readonly: true });
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    console.log(`\n=== ${path.basename(dbPath)} ===`);
    for (const { name } of tables) {
      try {
        const count = db.prepare(`SELECT COUNT(*) as c FROM "${name}"`).get();
        console.log(`  ${name}: ${count.c} records`);
      } catch(e) {
        console.log(`  ${name}: ERROR`);
      }
    }
    db.close();
  } catch(e) {
    console.log(`\n=== ${path.basename(dbPath)} === CANNOT OPEN: ${e.message}`);
  }
}
