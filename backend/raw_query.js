const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const results = await prisma.$queryRaw`SELECT 
        column_name 
    FROM 
        information_schema.columns 
    WHERE 
        table_name = 'settings'
    ORDER BY column_name`;
    console.log(results.map(r => r.column_name).join(', '));
}

main().finally(() => prisma.$disconnect());
