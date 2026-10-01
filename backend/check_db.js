const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const students = await p.student.count();
  const users = await p.user.count();
  const employees = await p.employee.count();
  
  let crmLeads = 0;
  try { crmLeads = await p.crmLead.count(); } catch(e) {}
  
  let programs = 0;
  try { programs = await p.program.count(); } catch(e) {}

  let classes = 0;
  try { classes = await p.class.count(); } catch(e) {}

  console.log(JSON.stringify({ students, users, employees, crmLeads, programs, classes }, null, 2));
}

main().catch(console.error).finally(() => p.$disconnect());
