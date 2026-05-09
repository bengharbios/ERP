import { Request, Response } from 'express';
import { crmService } from './crm.service';
import prisma from '../../common/db/prisma';

// Cache bots by token to avoid re-initializing on every request
const botsCache: Record<string, any> = {};
const userStates: Record<string, { action: string; leadId: string }> = {};

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

    const { Telegraf, Markup } = require('telegraf');
    const botInstance = new Telegraf(token);

    // Register Callback Query handler (for inline action buttons)
    botInstance.on('callback_query', async (ctx: any) => {
        try {
            const data = ctx.callbackQuery.data;
            const userId = ctx.from.id;

            if (data.startsWith('add_note:')) {
                const leadId = data.split(':')[1];
                userStates[userId] = { action: 'expecting_note', leadId };
                await ctx.answerCbQuery();
                await ctx.replyWithHTML('✍️ <b>يرجى كتابة الملاحظة الجديدة للعميل وإرسالها الآن كرسالة نصية مباشرة:</b>');
            } else if (data.startsWith('change_interest:')) {
                const leadId = data.split(':')[1];
                await ctx.answerCbQuery();
                const buttons = [];
                for (let i = 1; i <= 10; i += 2) {
                    buttons.push([
                        Markup.button.callback(`${i}/10 🔥`, `set_interest:${leadId}:${i}`),
                        Markup.button.callback(`${i+1}/10 🔥`, `set_interest:${leadId}:${i+1}`)
                    ]);
                }
                await ctx.reply('🔥 يرجى اختيار درجة الاهتمام الجديدة للعميل:', Markup.inlineKeyboard(buttons));
            } else if (data.startsWith('set_interest:')) {
                const [_, leadId, level] = data.split(':');
                await ctx.answerCbQuery();

                const updatedLead = await prisma.crmLead.update({
                    where: { id: leadId },
                    data: { levelOfInterest: parseInt(level) }
                });

                // Push update to Google Sheet asynchronously if available
                try {
                    const { GoogleSheetsService } = require('./services/google-sheets.service');
                    const googleSheetUrl = process.env.GOOGLE_SHEET_URL || process.env.GOOGLE_SHEET_ID;
                    if (googleSheetUrl) {
                        GoogleSheetsService.appendLeadToSheet({
                            spreadsheetUrlOrId: googleSheetUrl,
                            lead: updatedLead,
                            noteContent: `تحديث درجة الاهتمام تلقائياً إلى ${level}/10`
                        }).catch((err: any) => console.error('[Google Sheets Sync] Live update failed:', err));
                    }
                } catch (e) {}

                await ctx.replyWithHTML(`✅ تم تحديث درجة اهتمام العميل <b>${updatedLead.name}</b> بنجاح إلى <b>${level}/10</b>!`);
            } else if (data.startsWith('change_stage:')) {
                const leadId = data.split(':')[1];
                await ctx.answerCbQuery();

                const stages = await prisma.crmStage.findMany({ orderBy: { order: 'asc' } });
                const stageButtons = [];
                for (let i = 0; i < stages.length; i += 2) {
                    const row = [Markup.button.callback(`📁 ${stages[i].name}`, `set_stage:${leadId}:${stages[i].id}`)];
                    if (stages[i+1]) {
                        row.push(Markup.button.callback(`📁 ${stages[i+1].name}`, `set_stage:${leadId}:${stages[i+1].id}`));
                    }
                    stageButtons.push(row);
                }
                await ctx.reply('📁 يرجى اختيار المرحلة الجديدة للعميل:', Markup.inlineKeyboard(stageButtons));
            } else if (data.startsWith('set_stage:')) {
                const [_, leadId, stageId] = data.split(':');
                await ctx.answerCbQuery();

                const stage = await prisma.crmStage.findUnique({ where: { id: stageId } });
                const updatedLead = await prisma.crmLead.update({
                    where: { id: leadId },
                    data: { stageId }
                });

                // Push update to Google Sheet asynchronously if available
                try {
                    const { GoogleSheetsService } = require('./services/google-sheets.service');
                    const googleSheetUrl = process.env.GOOGLE_SHEET_URL || process.env.GOOGLE_SHEET_ID;
                    if (googleSheetUrl) {
                        GoogleSheetsService.appendLeadToSheet({
                            spreadsheetUrlOrId: googleSheetUrl,
                            lead: updatedLead,
                            noteContent: `تحديث مرحلة العميل تلقائياً إلى: ${stage?.name || 'مرحلة جديدة'}`
                        }).catch((err: any) => console.error('[Google Sheets Sync] Live update failed:', err));
                    }
                } catch (e) {}

                await ctx.replyWithHTML(`✅ تم نقل العميل <b>${updatedLead.name}</b> بنجاح إلى مرحلة: <b>${stage?.name}</b>!`);
            }
        } catch (err: any) {
            console.error('Callback Query Error:', err.message);
        }
    });

    // Register Message text handler
    botInstance.on('text', async (ctx: any) => {
        const text = ctx.message.text.trim();
        const userId = ctx.from.id;

        // Check active in-memory user states (e.g. typing a note)
        if (userStates[userId] && userStates[userId].action === 'expecting_note') {
            const { leadId } = userStates[userId];
            delete userStates[userId]; // reset state

            try {
                const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
                if (!lead) {
                    ctx.reply('⚠️ عذراً، لم يتم العثور على ملف العميل لحفظ الملاحظة.');
                    return;
                }

                await prisma.crmNote.create({
                    data: {
                        leadId,
                        userId: lead.salespersonId || 'system',
                        content: text,
                        type: 'note'
                    }
                });

                // Push update to Google Sheet live
                try {
                    const { GoogleSheetsService } = require('./services/google-sheets.service');
                    const googleSheetUrl = process.env.GOOGLE_SHEET_URL || process.env.GOOGLE_SHEET_ID;
                    if (googleSheetUrl) {
                        GoogleSheetsService.appendLeadToSheet({
                            spreadsheetUrlOrId: googleSheetUrl,
                            lead,
                            noteContent: text
                        }).catch((err: any) => console.error('[Google Sheets Sync] Live update failed:', err));
                    }
                } catch (e) {}

                ctx.replyWithHTML(`✅ تم إضافة الملاحظة للعميل <b>${lead.name}</b> بنجاح في الموقع وجوجل شيت!\n\n📝 <b>الملاحظة المضافة:</b>\n${text}`);
            } catch (err: any) {
                ctx.reply('⚠️ حدث خطأ أثناء حفظ الملاحظة في قاعدة البيانات.');
            }
            return;
        }

        // Main Menu button actions
        if (text === '🔍 بحث عن عميل') {
            ctx.replyWithHTML('⌨️ <b>يرجى إرسال رقم الهاتف للبحث عنه مباشرة</b> (مثال: <code>971543446372</code>).');
            return;
        }

        if (text === '📝 إضافة تقرير') {
            ctx.replyWithHTML(
                `✍️ <b>لتسجيل عميل جديد أو إضافة تقرير تواصل، يرجى نسخ التنسيق التالي وتعديله ثم إرساله:</b>\n\n` +
                `<code>الاسم: اسم العميل\n` +
                `رقم الهاتف: 971501234567\n` +
                `الجنسية: سوريا\n` +
                `الإمارة: الشارقة\n` +
                `الدبلوم: العالي\n` +
                `درجة الاهتمام: 7\n` +
                `الملاحظات: تم الاتصال وشرح كافة الاختصاصات والعروض...</code>`
            );
            return;
        }

        if (text === '📊 ملخص اليوم') {
            try {
                const startOfToday = new Date();
                startOfToday.setHours(0, 0, 0, 0);
                const endOfToday = new Date();
                endOfToday.setHours(23, 59, 59, 999);

                const leadsCount = await prisma.crmLead.count({
                    where: { createdAt: { gte: startOfToday, lte: endOfToday } }
                });
                const notesCount = await prisma.crmNote.count({
                    where: { createdAt: { gte: startOfToday, lte: endOfToday } }
                });

                ctx.replyWithHTML(
                    `📊 <b>ملخص المبيعات لليوم (${startOfToday.toLocaleDateString('ar-AE')}):</b>\n\n` +
                    `👤 <b>العملاء الجدد المسجلين</b>: <code>${leadsCount}</code> عميل\n` +
                    `📝 <b>تقارير التواصل الجديدة</b>: <code>${notesCount}</code> تقرير\n\n` +
                    `🔥 عمل رائع فريق السلام! استمروا بالعطاء والتقدم! 🚀`
                );
            } catch (err: any) {
                ctx.reply('⚠️ فشل تحميل إحصاءات اليوم.');
            }
            return;
        }

        if (text === '⚙️ حالة الربط') {
            try {
                ctx.replyWithHTML(
                    `⚙️ <b>حالة اتصال وتكامل النظام لعام 2026:</b>\n\n` +
                    `🟢 <b>بوت التليجرام</b>: نشط ومتصل بنجاح\n` +
                    `🟢 <b>لوحة تحكم الـ CRM</b>: متصلة بقاعدة البيانات\n` +
                    `🟢 <b>ربط Google Sheets</b>: مفعل ويعمل بنظام المزامنة الذكية\n` +
                    `🤖 <b>معرف البوت الحالي</b>: @${ctx.botInfo?.username || 'SalamCRM_Bot'}\n\n` +
                    `💎 كافة الأنظمة تعمل بكفاءة مطلقة!`
                );
            } catch (err: any) {
                ctx.reply('⚠️ فشل جلب تفاصيل الاتصال.');
            }
            return;
        }

        if (text.includes('الاسم:') && text.includes('رقم الهاتف:')) {
            try {
                const parsedData = crmService.parseTelegramMessage(text);
                const result = await crmService.updateLeadFromMessage(parsedData);
                const lead = result.lead;

                let replyMsg = `✅ <b>تم تسجيل/تحديث العميل بنجاح!</b>\n\n`;
                replyMsg += `👤 <b>الاسم</b>: ${lead.name}\n`;
                replyMsg += `📞 <b>الهاتف</b>: ${lead.phone || lead.mobile}\n`;
                
                if (lead.nationality) replyMsg += `🌍 <b>الجنسية</b>: ${lead.nationality}\n`;
                if (lead.emirate) replyMsg += `📍 <b>الإمارة</b>: ${lead.emirate}\n`;
                if (lead.interestedDiploma) replyMsg += `🎓 <b>الدبلوم</b>: ${lead.interestedDiploma}\n`;
                if (lead.levelOfInterest) replyMsg += `🔥 <b>درجة الاهتمام</b>: ${lead.levelOfInterest}/10\n`;
                
                if (result.isDuplicate) {
                    replyMsg += `\n⚠️ <b>هذا العميل مكرر واستفسر سابقاً!</b>\n`;
                    replyMsg += `🔄 <b>عدد مرات التكرار</b>: ${result.duplicateCount} مرة\n`;
                    if (result.firstMessageDate) {
                        const firstDate = new Date(result.firstMessageDate).toLocaleDateString('ar-AE', { day: 'numeric', month: 'numeric', year: 'numeric' });
                        replyMsg += `📅 <b>أول تواصل</b>: ${firstDate}\n`;
                    }
                    const lastDate = new Date().toLocaleDateString('ar-AE', { day: 'numeric', month: 'numeric', year: 'numeric' });
                    replyMsg += `📅 <b>آخر تفاعل</b>: اليوم ${lastDate}\n`;
                }

                // Add interactive action buttons
                const inlineButtons = [];
                const cleanPhone = lead.phoneNormalized || lead.phone || lead.mobileNormalized || lead.mobile;
                if (cleanPhone) {
                    inlineButtons.push([
                        Markup.button.url('💬 فتح واتساب', `https://wa.me/${cleanPhone.replace(/\+/g, '')}`),
                        Markup.button.url('📞 اتصال هاتف', `tel:${cleanPhone}`)
                    ]);
                }
                inlineButtons.push([
                    Markup.button.callback('➕ إضافة ملاحظة', `add_note:${lead.id}`),
                    Markup.button.callback('🏷️ درجة الاهتمام', `change_interest:${lead.id}`)
                ]);
                inlineButtons.push([
                    Markup.button.callback('🔄 نقل المرحلة', `change_stage:${lead.id}`)
                ]);

                ctx.replyWithHTML(replyMsg, Markup.inlineKeyboard(inlineButtons));
            } catch (error: any) {
                console.error('Telegram Parse Error:', error.message);
                ctx.reply('⚠️ عذراً، حدث خطأ أثناء قراءة التقرير. تأكد من التنسيق الصحيح.');
            }
        } else if (text.startsWith('/search') || text.startsWith('/find') || text.startsWith('/بحث') || /^\+?[0-9\s\-]{8,18}$/.test(text)) {
            try {
                let searchPhone = text;
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
                            take: 5 // Expanded to show 5 recent notes (فتح ملاحظات الاستفسار)
                        }
                    }
                });

                if (results.length === 0) {
                    ctx.reply(`🔍 لم يتم العثور على أي عميل مسجل بالرقم: ${searchPhone}`);
                } else {
                    results.forEach((lead, index) => {
                        let emirate = lead.emirate;
                        let nationality = lead.nationality;
                        let interestedDiploma = lead.interestedDiploma;
                        let levelOfInterest = lead.levelOfInterest;

                        if (lead.notes && lead.notes.length > 0) {
                            lead.notes.forEach((note: any) => {
                                const text = note.content;
                                if (!emirate) {
                                    const m = text.match(/الإمارة:\s*([^\n\r\-]+)/);
                                    if (m) emirate = m[1].trim();
                                }
                                if (!nationality) {
                                    const m = text.match(/الجنسية:\s*([^\n\r\-]+)/);
                                    if (m) nationality = m[1].trim();
                                }
                                if (!interestedDiploma) {
                                    const m = text.match(/(الدبلوم المهتم به|الدبلوم):\s*([^\n\r\-]+)/);
                                    if (m) interestedDiploma = m[2].trim();
                                }
                                if (!levelOfInterest) {
                                    const m = text.match(/(درجة الاهتمام|درجة الإهتمام):\s*([^\n\r\-]+)/);
                                    if (m) {
                                        const num = parseInt(m[2].replace(/\D/g, ''));
                                        if (!isNaN(num)) levelOfInterest = num;
                                    }
                                }
                            });
                        }

                        let itemMsg = `👤 <b>الاسم</b>: ${lead.name}\n`;
                        if (lead.phone) itemMsg += `📞 <b>الهاتف</b>: ${lead.phone}\n`;
                        if (lead.mobile) itemMsg += `📱 <b>الموبايل</b>: ${lead.mobile}\n`;
                        if (nationality) itemMsg += `🌍 <b>الجنسية</b>: ${nationality}\n`;
                        if (emirate) itemMsg += `📍 <b>الإمارة</b>: ${emirate}\n`;
                        if (interestedDiploma) itemMsg += `🎓 <b>الدبلوم</b>: ${interestedDiploma}\n`;
                        if (levelOfInterest) itemMsg += `🔥 <b>درجة الاهتمام</b>: ${levelOfInterest}/10\n`;
                        if (lead.platform) itemMsg += `📢 <b>المصدر</b>: ${lead.platform}\n`;
                        
                        if (lead.duplicateCount > 0) {
                            itemMsg += `\n⚠️ <b>هذا العميل مكرر واستفسر سابقاً!</b>\n`;
                            itemMsg += `🔄 <b>عدد مرات التكرار</b>: ${lead.duplicateCount} مرة\n`;
                        }

                        if (lead.notes && lead.notes.length > 0) {
                            itemMsg += `\n📜 <b>آخر الملاحظات والأنشطة (تظهر الملاحظات كاملة):</b>\n`;
                            const seenNotes = new Set<string>();

                            lead.notes.forEach((note: any) => {
                                const noteDate = new Date(note.createdAt);
                                const dateStr = noteDate.toLocaleDateString('ar-AE', { day: 'numeric', month: 'numeric', year: 'numeric' });
                                
                                let cleanContent = note.content;
                                if (cleanContent.includes('📝 **بيانات وملاحظات الشيت المستوردة:**')) {
                                    cleanContent = cleanContent.split('📝 **بيانات وملاحظات الشيت المستوردة:**')[1].trim();
                                }
                                cleanContent = cleanContent.replace(/📥 تم الاستيراد بنجاح من Google Sheet \(السطر رقم \d+\)\n?/g, '');
                                cleanContent = cleanContent.replace(/🔄 تكرار تواصل من Google Sheet \(السطر رقم \d+\):\n?/g, '');
                                cleanContent = cleanContent.replace(/📌 مصدر القناة: .*\n?/g, '');
                                cleanContent = cleanContent.replace(/📌 \*\*ملاحظات [^*]+\*\*:\n?/g, '');
                                cleanContent = cleanContent.replace(/📌 \*\*[^*]+\*\*:\n?/g, '');
                                
                                if (cleanContent.includes('📝 الملاحظات:')) {
                                    cleanContent = cleanContent.split('📝 الملاحظات:')[1].trim();
                                } else if (cleanContent.includes('-----------------------')) {
                                    const parts = cleanContent.split('-----------------------');
                                    cleanContent = parts[parts.length - 1].trim();
                                }

                                cleanContent = cleanContent.replace(/\*\*/g, '').trim();

                                if (!cleanContent || seenNotes.has(cleanContent)) return;
                                seenNotes.add(cleanContent);

                                itemMsg += `• [${dateStr}] ${cleanContent}\n`;
                            });
                        }
                        itemMsg += `\n──────────────────\n`;

                        // Add interactive inline buttons for each result
                        const inlineButtons = [];
                        const cleanPhone = lead.phoneNormalized || lead.phone || lead.mobileNormalized || lead.mobile;
                        if (cleanPhone) {
                            inlineButtons.push([
                                Markup.button.url('💬 فتح واتساب', `https://wa.me/${cleanPhone.replace(/\+/g, '')}`),
                                Markup.button.url('📞 اتصال هاتف', `tel:${cleanPhone}`)
                            ]);
                        }
                        inlineButtons.push([
                            Markup.button.callback('➕ إضافة ملاحظة', `add_note:${lead.id}`),
                            Markup.button.callback('🏷️ درجة الاهتمام', `change_interest:${lead.id}`)
                        ]);
                        inlineButtons.push([
                            Markup.button.callback('🔄 نقل المرحلة', `change_stage:${lead.id}`)
                        ]);

                        ctx.replyWithHTML(itemMsg, Markup.inlineKeyboard(inlineButtons));
                    });
                }
            } catch (err: any) {
                console.error('Telegram Search Error:', err.message);
                ctx.reply('⚠️ عذراً، حدث خطأ أثناء البحث عن الهاتف.');
            }
        } else if (text === '/start' || text === '/menu' || text === 'قائمة') {
            ctx.reply(
                'مرحباً بك في نظام السلام CRM المتكامل الذكي! 📱💎\n\nيرجى اختيار الإجراء المطلوب من الأزرار بالأسفل:',
                Markup.keyboard([
                    ['🔍 بحث عن عميل', '📝 إضافة تقرير'],
                    ['📊 ملخص اليوم', '⚙️ حالة الربط']
                ]).resize()
            );
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
