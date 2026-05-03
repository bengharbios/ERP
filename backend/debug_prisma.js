const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Attempting to find/create settings...');
        const settings = await prisma.settings.upsert({
            where: { id: 'singleton' },
            update: {},
            create: {
                id: 'singleton',
                instituteName: 'معهد الإبداع',
                instituteNameAr: 'معهد الإبداع',
                instituteNameEn: 'Creativity Institute'
            }
        });
        console.log('SUCCESS:', settings);
    } catch (err) {
        console.error('CRITICAL ERROR:', err);
        if (err.code) console.error('Error Code:', err.code);
        if (err.meta) console.error('Error Meta:', err.meta);
    } finally {
        await prisma.$disconnect();
    }
}

main();
