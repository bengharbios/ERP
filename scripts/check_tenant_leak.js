const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const tenants = await prisma.tenant.findMany();
  console.log('Tenants in DB:', tenants.map(t => ({ id: t.id, name: t.name, slug: t.slug })));

  const students = await prisma.student.findMany({
    include: { user: true }
  });
  console.log('Total students:', students.length);
  const sample = students.slice(0, 5).map(s => ({
    id: s.id,
    name: s.firstNameAr || s.firstNameEn,
    userId: s.userId,
    userTenantId: s.user?.tenantId
  }));
  console.log('Sample students:', sample);

  // Check how many students have user with tenantId null or 'tenant_primary_001'
  const noTenant = students.filter(s => !s.user || !s.user.tenantId).length;
  console.log('Students with null or missing user.tenantId:', noTenant);

  // Check other tables: Class, Program, Course
  const classes = await prisma.class.count();
  const programs = await prisma.program.count();
  console.log('Total classes:', classes, 'Total programs:', programs);
}

check().catch(console.error).finally(() => prisma.$disconnect());
