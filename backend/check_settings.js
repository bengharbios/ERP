const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Checking for settings...');
    let settings = await prisma.settings.findFirst({
        where: { id: 'singleton' }
    });

    if (!settings) {
        console.log('Settings not found. Creating default singleton settings...');
        settings = await prisma.settings.create({
            data: {
                id: 'singleton',
                instituteName: 'معهد الإبداع',
                instituteNameAr: 'معهد الإبداع',
                instituteNameEn: 'Creativity Institute',
                country: 'SA',
                currency: 'SAR',
                timezone: 'Asia/Riyadh'
            }
        });
        console.log('Created successfully.');
    } else {
        console.log('Settings found:', JSON.stringify(settings, null, 2));
    }
}

main()
    .catch((e) => {
        console.error('Error:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
