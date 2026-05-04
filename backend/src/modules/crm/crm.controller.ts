import { Request, Response } from 'express';
import { crmService } from './crm.service';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

// Lazy bot initialization — only created when needed
let bot: any = null;
function getBot() {
    if (!BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not defined in environment variables');
    if (!bot) {
        const { Telegraf } = require('telegraf');
        bot = new Telegraf(BOT_TOKEN);
        bot.on('text', async (ctx: any) => {
            const text = ctx.message.text;
            if (text.includes('الاسم:') && text.includes('رقم الهاتف:')) {
                try {
                    const parsedData = crmService.parseTelegramMessage(text);
                    const lead = await crmService.updateLeadFromMessage(parsedData);
                    ctx.reply(`✅ تم تحديث بيانات العميل: ${lead.name}\nدرجة الاهتمام: ${parsedData.interestLevel || 'غير محدد'}`);
                } catch (error: any) {
                    console.error('Telegram Parse Error:', error.message);
                    ctx.reply('⚠️ عذراً، حدث خطأ أثناء قراءة التقرير. تأكد من التنسيق الصحيح.');
                }
            } else if (text === '/start') {
                ctx.reply('مرحباً بك في بوت CRM السلام. أرسل تقرير العميل هنا ليتم تسجيله تلقائياً.');
            }
        });
    }
    return bot;
}

export const crmController = {
    /**
     * Handles incoming updates from Telegram via Webhook
     */
    async handleTelegramWebhook(req: Request, res: Response) {
        try {
            await getBot().handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (error: any) {
            console.error('Webhook Error:', error.message);
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Set Webhook for Telegram (Utility)
     */
    async setupWebhook(req: Request, res: Response) {
        const host = req.get('host');
        const protocol = host?.includes('localhost') ? 'http' : 'https';
        const url = `${protocol}://${host}/api/v1/crm/telegram/webhook`;
        try {
            await getBot().telegram.setWebhook(url);
            res.json({ success: true, url });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
