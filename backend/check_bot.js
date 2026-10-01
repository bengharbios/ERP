const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

async function main() {
    try {
        const settings = await prisma.settings.findFirst({
            where: { id: 'singleton' }
        });
        
        console.log('--- DATABASE SETTINGS ---');
        console.log(JSON.stringify(settings, null, 2));
        
        // Also let's check settings from "financialSettings" or any other settings table
        const allSettings = await prisma.settings.findMany();
        console.log('Number of settings records:', allSettings.length);
        if (allSettings.length > 0) {
            console.log('First settings record fields:', Object.keys(allSettings[0]));
        }
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
