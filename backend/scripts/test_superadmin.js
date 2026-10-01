const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function run() {
  console.log('Testing SuperAdmin Service...');
  const { superAdminService } = require('../src/modules/superadmin/superadmin.service');
  const overview = await superAdminService.getOverview();
  console.log('✅ SuperAdmin Overview Result:');
  console.log(JSON.stringify(overview, null, 2));
}

run().catch((err) => {
  console.error('Error running test:', err);
  process.exit(1);
});
