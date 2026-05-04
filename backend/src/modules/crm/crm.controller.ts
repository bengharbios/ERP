import { Request, Response } from 'express';
import { Telegraf } from 'telegraf';
import { crmService } from './crm.service';

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '8532764098:AAFRuQEAxtXQpmE7VcEc2lxNLBo925boxGg';
const bot = new Telegraf(BOT_TOKEN);

// Configure Bot logic
bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    
    // Check if it's a report message
    if (text.includes('الاسم:') && text.includes('رقم الهاتف:')) {
        try {
            const parsedData = crmService.parseTelegramMessage(text);
            const lead = await crmService.updateLeadFromMessage(parsedData);
            
            ctx.reply(`✅ تم تحديث بيانات العميل: ${lead.name}\nالحالة: ${parsedData.interestLevel || 'غير محدد'}`);
        } catch (error: any) {
            console.error('Telegram Parse Error:', error.message);
            ctx.reply('⚠️ عذراً، حدث خطأ أثناء قراءة التقرير. تأكد من التنسيق الصحيح.');
        }
    } else if (text === '/start') {
        ctx.reply('مرحباً بك في بوت CRM السلام. أرسل تقرير العميل هنا ليتم تسجيله تلقائياً.');
    }
});

export const crmController = {
    /**
     * Handles incoming updates from Telegram via Webhook
     */
    async handleTelegramWebhook(req: Request, res: Response) {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (error: any) {
            console.error('Webhook Error:', error.message);
            res.status(500).send('Internal Error');
        }
    },

    /**
     * Set Webhook for Telegram (Utility)
     */
    async setupWebhook(req: Request, res: Response) {
        const url = `${req.protocol}://${req.get('host')}/api/v1/crm/telegram/webhook`;
        try {
            await bot.telegram.setWebhook(url);
            res.json({ success: true, url });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
