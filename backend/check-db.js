const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const table = await prisma.$queryRaw`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'financial_settings'`;
    console.log('Result:', table);
}

main().catch(console.error).finally(() => prisma.$disconnect());
