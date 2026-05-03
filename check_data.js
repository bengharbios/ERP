const { PrismaClient } = require('./backend/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('\n🔍 Checking database data...\n');

    const programs = await prisma.program.count();
    const classes = await prisma.class.count();
    const students = await prisma.student.count();
    const units = await prisma.unit.count();

    console.log(`📚 Programs: ${programs}`);
    console.log(`🎓 Classes: ${classes}`);
    console.log(`👥 Students: ${students}`);
    console.log(`📖 Units: ${units}`);

    if (programs === 0) {
        console.log('\n⚠️  Database is empty! You need to seed data.\n');
    } else {
        console.log('\n✅ Data exists in database\n');

        // List programs
        const programList = await prisma.program.findMany({
            select: {
                id: true,
                code: true,
                nameAr: true,
                nameEn: true
            }
        });

        console.log('Programs:');
        programList.forEach(p => {
            console.log(`  - [${p.code}] ${p.nameAr}`);
        });

        // List classes
        const classList = await prisma.class.findMany({
            select: {
                id: true,
                code: true,
                name: true,
                status: true
            }
        });

        console.log('\nClasses:');
        classList.forEach(c => {
            console.log(`  - [${c.code}] ${c.name} (${c.status})`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
