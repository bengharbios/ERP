const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const axios = require('axios');

async function main() {
    try {
        const settings = await prisma.settings.findFirst({
            where: { id: 'singleton' }
        });
        
        console.log('--- DATABASE SETTINGS ---');
        console.log('telegramBotEnabled:', settings?.telegramBotEnabled);
        console.log('telegramBotToken:', settings?.telegramBotToken ? (settings.telegramBotToken.substring(0, 10) + '...') : 'none');
        
        const token = (settings?.telegramBotEnabled && settings?.telegramBotToken)
            ? settings.telegramBotToken
            : process.env.TELEGRAM_BOT_TOKEN;
            
        console.log('Active Token used by App:', token ? (token.substring(0, 10) + '...') : 'none');
        
        if (!token) {
            console.log('No token configured!');
            return;
        }
        
        const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;
        console.log('Fetching webhook info from Telegram...');
        const response = await axios.get(url);
        console.log('--- TELEGRAM WEBHOOK INFO ---');
        console.log(JSON.stringify(response.data, null, 2));
    } catch (err) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
