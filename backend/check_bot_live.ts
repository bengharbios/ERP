import prisma from './src/common/db/prisma';
import axios from 'axios';

async function main() {
    try {
        console.log('Connecting to live Turso database...');
        const settings = await prisma.settings.findFirst({
            where: { id: 'singleton' }
        });
        
        console.log('--- LIVE DB SETTINGS ---');
        console.log('telegramBotEnabled:', settings?.telegramBotEnabled);
        console.log('telegramBotToken:', settings?.telegramBotToken ? (settings.telegramBotToken.substring(0, 10) + '...') : 'none');
        
        const token = (settings?.telegramBotEnabled && settings?.telegramBotToken)
            ? settings.telegramBotToken
            : process.env.TELEGRAM_BOT_TOKEN;
            
        console.log('Active Token used by App:', token ? (token.substring(0, 15) + '...') : 'none');
        
        if (!token) {
            console.log('No token configured!');
            return;
        }
        
        // Let's check live webhook info
        const url = `https://api.telegram.org/bot${token}/getWebhookInfo`;
        console.log('Fetching live webhook info from Telegram...');
        const response = await axios.get(url);
        console.log('--- LIVE TELEGRAM WEBHOOK INFO ---');
        console.log(JSON.stringify(response.data, null, 2));

        // Let's check users linked in live Turso DB
        const users = await prisma.user.findMany({
            where: {
                telegramUserId: { not: null }
            },
            select: {
                id: true,
                username: true,
                email: true,
                firstName: true,
                lastName: true,
                telegramUserId: true,
                telegramUsername: true
            }
        });
        console.log('--- LIVE USERS WITH LINKED TELEGRAM ---');
        console.log(JSON.stringify(users, null, 2));

    } catch (err: any) {
        console.error('Error:', err.message);
        if (err.response) {
            console.error('Response data:', err.response.data);
        }
    } finally {
        await prisma.$disconnect();
    }
}

main();
