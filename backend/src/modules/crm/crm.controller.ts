import { Request, Response } from 'express';
import { crmService } from './crm.service';
import prisma from '../../common/db/prisma';

// Cache bots by token to avoid re-initializing on every request
const botsCache: Record<string, any> = {};

async function getDynamicBot() {
    // 1. Load settings to check if custom Telegram bot is configured and enabled
    const settings = await prisma.settings.findFirst({
        where: { id: 'singleton' }
    });

    const token = (settings?.telegramBotEnabled && settings?.telegramBotToken)
        ? settings.telegramBotToken
        : process.env.TELEGRAM_BOT_TOKEN;

    if (!token) {
        throw new Error('Telegram Bot Token is not defined in settings or environment variables');
    }

    // Return cached bot if already initialized
    if (botsCache[token]) {
        return botsCache[token];
    }

    const { Telegraf } = require('telegraf');
    const botInstance = new Telegraf(token);

    // Register handlers
    botInstance.on('text', async (ctx: any) => {
        const text = ctx.message.text;
        if (text.includes('الاسم:') && text.includes('رقم الهاتف:')) {
            try {
                const parsedData = crmService.parseTelegramMessage(text);
                const result = await crmService.updateLeadFromMessage(parsedData);
                const lead = result.lead;

                let replyMsg = `✅ تم تسجيل/تحديث العميل بنجاح!\n\n`;
                replyMsg += `👤 الاسم: ${lead.name}\n`;
                replyMsg += `📞 الهاتف: ${lead.phone || lead.mobile}\n`;
                
                if (lead.nationality) replyMsg += `🌍 الجنسية: ${lead.nationality}\n`;
                if (lead.emirate) replyMsg += `📍 الإمارة: ${lead.emirate}\n`;
                if (lead.interestedDiploma) replyMsg += `🎓 الدبلوم: ${lead.interestedDiploma}\n`;
                if (lead.levelOfInterest) replyMsg += `🔥 درجة الاهتمام: ${lead.levelOfInterest}/10\n`;
                
                if (result.isDuplicate) {
                    replyMsg += `\n⚠️ هذا العميل مكرر واستفسر سابقاً!\n`;
                    replyMsg += `🔄 عدد مرات التكرار: ${result.duplicateCount} مرة\n`;
                    if (result.firstMessageDate) {
                        const firstDate = new Date(result.firstMessageDate).toLocaleDateString('ar-AE', { day: 'numeric', month: 'numeric', year: 'numeric' });
                        replyMsg += `📅 أول تواصل: ${firstDate}\n`;
                    }
                    const lastDate = new Date().toLocaleDateString('ar-AE', { day: 'numeric', month: 'numeric', year: 'numeric' });
                    replyMsg += `📅 آخر تفاعل: اليوم ${lastDate}\n`;
                }

                ctx.reply(replyMsg);
            } catch (error: any) {
                console.error('Telegram Parse Error:', error.message);
                ctx.reply('⚠️ عذراً، حدث خطأ أثناء قراءة التقرير. تأكد من التنسيق الصحيح.');
            }
        } else if (text.startsWith('/search') || text.startsWith('/find') || text.startsWith('/بحث') || /^\+?[0-9\s\-]{8,18}$/.test(text.trim())) {
            try {
                let searchPhone = text.trim();
                if (searchPhone.startsWith('/search') || searchPhone.startsWith('/find') || searchPhone.startsWith('/بحث')) {
                    searchPhone = searchPhone.replace(/^\/(search|find|بحث)\s*/, '').trim();
                }

                if (!searchPhone) {
                    ctx.reply('⚠️ يرجى إدخال رقم الهاتف المراد البحث عنه. مثال:\n971501234567');
                    return;
                }

                const { normalizePhone } = require('./services/lead.service');
                const normalized = normalizePhone(searchPhone);

                const results = await prisma.crmLead.findMany({
                    where: {
                        OR: [
                            normalized ? { phoneNormalized: normalized } : undefined,
                            normalized ? { mobileNormalized: normalized } : undefined,
                            { phone: { contains: searchPhone } },
                            { mobile: { contains: searchPhone } }
                        ].filter(Boolean) as any
                    },
                    include: {
                        notes: {
                            orderBy: { createdAt: 'desc' },
                            take: 2
                        }
                    }
                });

                if (results.length === 0) {
                    ctx.reply(`🔍 لم يتم العثور على أي عميل مسجل بالرقم: ${searchPhone}`);
                } else {
                    let replyMsg = `🔍 **نتائج البحث للرقم (${searchPhone}):**\n\n`;
                    results.forEach((lead, index) => {
                        replyMsg += `👤 **الاسم**: ${lead.name}\n`;
                        if (lead.phone) replyMsg += `📞 **الهاتف**: ${lead.phone}\n`;
                        if (lead.mobile) replyMsg += `📱 **الموبايل**: ${lead.mobile}\n`;
                        if (lead.nationality) replyMsg += `🌍 **الجنسية**: ${lead.nationality}\n`;
                        if (lead.emirate) replyMsg += `📍 **الإمارة**: ${lead.emirate}\n`;
                        if (lead.interestedDiploma) replyMsg += `🎓 **الدبلوم**: ${lead.interestedDiploma}\n`;
                        if (lead.levelOfInterest) replyMsg += `🔥 **درجة الاهتمام**: ${lead.levelOfInterest}/10\n`;
                        if (lead.platform) replyMsg += `📢 **المصدر**: ${lead.platform}\n`;
                        
                        if (lead.duplicateCount > 0) {
                            replyMsg += `⚠️ **هذا العميل مكرر واستفسر سابقاً!**\n`;
                            replyMsg += `🔄 **عدد مرات التكرار**: ${lead.duplicateCount} مرات\n`;
                        }

                        if (lead.notes && lead.notes.length > 0) {
                            replyMsg += `\n📜 **آخر الملاحظات والأنشطة:**\n`;
                            lead.notes.forEach((note: any) => {
                                const noteDate = new Date(note.createdAt);
                                const dateStr = noteDate.toLocaleDateString('ar-AE', { day: 'numeric', month: 'numeric', year: 'numeric' });
                                
                                let cleanContent = note.content;
                                // Smart clean up of Google Sheet import headers for sleek Telegram formatting
                                if (cleanContent.includes('📝 **بيانات وملاحظات الشيت المستوردة:**')) {
                                    cleanContent = cleanContent.split('📝 **بيانات وملاحظات الشيت المستوردة:**')[1].trim();
                                }
                                cleanContent = cleanContent.replace(/📥 تم الاستيراد بنجاح من Google Sheet \(السطر رقم \d+\)\n?/g, '');
                                cleanContent = cleanContent.replace(/📌 مصدر القناة: .*\n?/g, '');
                                cleanContent = cleanContent.trim();

                                replyMsg += `• [${dateStr}] ${cleanContent.substring(0, 400)}${cleanContent.length > 400 ? '...' : ''}\n`;
                            });
                        }
                        replyMsg += `\n──────────────────\n`;
                    });
                    ctx.reply(replyMsg);
                }
            } catch (err: any) {
                console.error('Telegram Search Error:', err.message);
                ctx.reply('⚠️ عذراً، حدث خطأ أثناء البحث عن الهاتف.');
            }
        } else if (text === '/start') {
            ctx.reply('مرحباً بك في بوت CRM السلام. أرسل تقرير العميل هنا ليتم تسجيله تلقائياً.');
        }
    });

    botsCache[token] = botInstance;
    return botInstance;
}

export const crmController = {
    /**
     * Handles incoming updates from Telegram via Webhook
     */
    async handleTelegramWebhook(req: Request, res: Response) {
        try {
            const botInstance = await getDynamicBot();
            await botInstance.handleUpdate(req.body);
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
            const botInstance = await getDynamicBot();
            await botInstance.telegram.setWebhook(url);
            res.json({ success: true, url });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    }
};
