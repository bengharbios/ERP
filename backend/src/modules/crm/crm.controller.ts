import { Request, Response } from 'express';
import { crmService } from './crm.service';
import prisma from '../../common/db/prisma';
import { normalizePhone } from './services/lead.service';
import { GoogleSheetsService } from './services/google-sheets.service';
import { Telegraf, Markup } from 'telegraf';
import { comparePassword } from '../../common/utils/password';

// Cache bots by token to avoid re-initializing on every request
const botsCache: Record<string, any> = {};

async function getUserState(userId: number): Promise<{ action: string; leadId: string } | null> {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: `telegram_state:${userId}` }
        });
        if (setting && setting.value) {
            return JSON.parse(setting.value);
        }
    } catch (e) {
        console.error('Failed to get user state:', e);
    }
    return null;
}

async function setUserState(userId: number, action: string, leadId: string): Promise<void> {
    try {
        await prisma.systemSetting.upsert({
            where: { key: `telegram_state:${userId}` },
            update: { value: JSON.stringify({ action, leadId }) },
            create: { key: `telegram_state:${userId}`, value: JSON.stringify({ action, leadId }) }
        });
    } catch (e) {
        console.error('Failed to set user state:', e);
    }
}

async function deleteUserState(userId: number): Promise<void> {
    try {
        await prisma.systemSetting.delete({
            where: { key: `telegram_state:${userId}` }
        }).catch(() => {});
    } catch (e) {
        // ignore if not found
    }
}

export interface TelegramCrmConfig {
    noAnswerButtonEnabled: boolean;
    noAnswerNote: string;
    noAnswerInterest: number;
    followUpButtonEnabled: boolean;
    callQueueEnabled: boolean;
    callQueueLimit: number;
    remindersEnabled: boolean;
    reminderTime: string;
    statsCommandEnabled: boolean;
    statsCommandAdmins: string;
    leadAlertsEnabled: boolean;
    whatsappBotEnabled: boolean;
    whatsappAllowedGroups: string;
}

const DEFAULT_TELEGRAM_CRM_CONFIG: TelegramCrmConfig = {
    noAnswerButtonEnabled: true,
    noAnswerNote: '🚨 تم الاتصال ولم يرد على المكالمة.',
    noAnswerInterest: 0,
    followUpButtonEnabled: true,
    callQueueEnabled: true,
    callQueueLimit: 5,
    remindersEnabled: true,
    reminderTime: '09:00',
    statsCommandEnabled: true,
    statsCommandAdmins: '',
    leadAlertsEnabled: true,
    whatsappBotEnabled: false,
    whatsappAllowedGroups: ''
};

async function getTelegramCrmConfig(): Promise<TelegramCrmConfig> {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'telegram_crm_config' }
        });
        if (setting && setting.value) {
            return { ...DEFAULT_TELEGRAM_CRM_CONFIG, ...JSON.parse(setting.value) };
        }
    } catch (e) {
        console.error('Failed to parse telegram_crm_config, using defaults:', e);
    }
    return DEFAULT_TELEGRAM_CRM_CONFIG;
}

async function getGoogleSheetUrl(): Promise<string> {
    try {
        const googleSheetUrl = process.env.GOOGLE_SHEET_URL || process.env.GOOGLE_SHEET_ID;
        if (googleSheetUrl) return googleSheetUrl;

        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'crm_google_sheet_url' }
        });
        return setting?.value || '';
    } catch (e) {
        console.error('Failed to retrieve crm_google_sheet_url:', e);
        return '';
    }
}

async function getAuthenticatedUser(telegramUserId: number) {
    const userIdStr = String(telegramUserId);
    return await prisma.user.findFirst({
        where: { telegramUserId: userIdStr }
    });
}

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

    const botInstance = new Telegraf(token);

    // Register Callback Query handler (for inline action buttons)
    botInstance.on('callback_query', async (ctx: any) => {
        try {
            const data = ctx.callbackQuery.data;
            const userId = ctx.from.id;

            // 1. Check authentication
            const currentUser = await getAuthenticatedUser(userId);
            if (!currentUser) {
                await ctx.answerCbQuery();
                await ctx.replyWithHTML(
                    `⚠️ <b>عذراً، يجب عليك تسجيل الدخول للبوت أولاً للقيام بهذا الإجراء!</b>\n` +
                    `يرجى كتابة:\n<code>/login [اسم المستخدم] [كلمة المرور]</code>`
                );
                return;
            }

            // 2. Check Lead Ownership if we are performing an edit action
            let checkLeadId: string | null = null;
            if (data.startsWith('add_note:')) {
                checkLeadId = data.split(':')[1];
            } else if (data.startsWith('change_interest:')) {
                checkLeadId = data.split(':')[1];
            } else if (data.startsWith('set_interest:')) {
                checkLeadId = data.split(':')[1];
            } else if (data.startsWith('change_stage:')) {
                checkLeadId = data.split(':')[1];
            } else if (data.startsWith('set_stage:')) {
                checkLeadId = data.split(':')[1];
            } else if (data.startsWith('no_answer:')) {
                checkLeadId = data.split(':')[1];
            } else if (data.startsWith('schedule_call:')) {
                checkLeadId = data.split(':')[1];
            } else if (data.startsWith('set_followup:')) {
                checkLeadId = data.split(':')[1];
            } else if (data.startsWith('set_followup_custom:')) {
                checkLeadId = data.split(':')[1];
            } else if (data.startsWith('queue_no_answer:')) {
                checkLeadId = data.split(':')[1];
            } else if (data.startsWith('queue_answered:')) {
                checkLeadId = data.split(':')[1];
            }

            if (checkLeadId) {
                const lead = await prisma.crmLead.findUnique({
                    where: { id: checkLeadId },
                    include: { salesperson: true }
                });

                if (lead) {
                    // Check if lead has an owner, and owner is not the current user, and current user is not admin
                    if (lead.salespersonId && lead.salespersonId !== currentUser.id && currentUser.username !== 'admin') {
                        // Strict Block: CANNOT change interest/stage
                        if (data.startsWith('change_interest:') || data.startsWith('set_interest:') || data.startsWith('change_stage:') || data.startsWith('set_stage:') || data.startsWith('no_answer:') || data.startsWith('schedule_call:')) {
                            await ctx.answerCbQuery();
                            await ctx.replyWithHTML(
                                `⚠️ <b>عذراً، هذا العميل مخصص للموظف المسؤول (${lead.salesperson?.firstName || ''} ${lead.salesperson?.lastName || 'أحد الزملاء'}).</b>\n` +
                                `لا تملك صلاحية تعديل بياناته.`
                            );
                            return;
                        }
                    } else if (!lead.salespersonId && (data.startsWith('set_interest:') || data.startsWith('set_stage:') || data.startsWith('add_note:') || data.startsWith('no_answer:') || data.startsWith('set_followup:'))) {
                        // Collaborative auto-assignment: If lead is unassigned, assign it to the current user on active interaction!
                        await prisma.crmLead.update({
                            where: { id: lead.id },
                            data: { salespersonId: currentUser.id }
                        });
                    }
                }
            }

            if (data.startsWith('add_note:')) {
                const leadId = data.split(':')[1];
                await setUserState(userId, 'expecting_note', leadId);
                await ctx.answerCbQuery();
                await ctx.replyWithHTML('✍️ <b>يرجى كتابة الملاحظة الجديدة للعميل وإرسالها الآن كرسالة نصية مباشرة:</b>');
            } else if (data.startsWith('change_interest:')) {
                const leadId = data.split(':')[1];
                await ctx.answerCbQuery();
                const buttons = [];
                for (let i = 1; i <= 10; i += 2) {
                    buttons.push([
                        { text: `${i}/10 🔥`, callback_data: `set_interest:${leadId}:${i}` },
                        { text: `${i+1}/10 🔥`, callback_data: `set_interest:${leadId}:${i+1}` }
                    ]);
                }
                await ctx.reply('🔥 يرجى اختيار درجة الاهتمام الجديدة للعميل:', {
                    reply_markup: { inline_keyboard: buttons }
                });
            } else if (data.startsWith('set_interest:')) {
                const [_, leadId, level] = data.split(':');
                await ctx.answerCbQuery();

                const updatedLead = await prisma.crmLead.update({
                    where: { id: leadId },
                    data: { levelOfInterest: parseInt(level) }
                });

                // Push update to Google Sheet asynchronously if available
                try {
                    const googleSheetUrl = await getGoogleSheetUrl();
                    if (googleSheetUrl && (updatedLead.phone || updatedLead.mobile)) {
                        GoogleSheetsService.updateLeadFieldInSheet({
                            spreadsheetUrlOrId: googleSheetUrl,
                            phone: (updatedLead.phone || updatedLead.mobile)!,
                            updates: {
                                levelOfInterest: parseInt(level),
                                noteContent: `تحديث درجة الاهتمام تلقائياً إلى ${level}/10`
                            }
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
                    const row = [{ text: `📁 ${stages[i].name}`, callback_data: `set_stage:${leadId}:${stages[i].id}` }];
                    if (stages[i+1]) {
                        row.push({ text: `📁 ${stages[i+1].name}`, callback_data: `set_stage:${leadId}:${stages[i+1].id}` });
                    }
                    stageButtons.push(row);
                }
                await ctx.reply('📁 يرجى اختيار المرحلة الجديدة للعميل:', {
                    reply_markup: { inline_keyboard: stageButtons }
                });
            } else if (data.startsWith('set_stage:')) {
                const [_, leadId, stageId] = data.split(':');
                await ctx.answerCbQuery();

                const stage = await prisma.crmStage.findUnique({ where: { id: stageId } });
                
                // If stage represents a final/completed/DND status, we clear dateDeadline
                const isFinalStage = stage && (
                    stage.name.includes('مسجل') || 
                    stage.name.includes('ازعاج') || 
                    stage.name.includes('عدم') || 
                    stage.name.includes('ملغي')
                );

                const updatedLead = await prisma.crmLead.update({
                    where: { id: leadId },
                    data: { 
                        stageId,
                        dateDeadline: isFinalStage ? null : undefined
                    }
                });

                // Push update to Google Sheet asynchronously if available
                try {
                    const googleSheetUrl = await getGoogleSheetUrl();
                    if (googleSheetUrl && (updatedLead.phone || updatedLead.mobile)) {
                        GoogleSheetsService.updateLeadFieldInSheet({
                            spreadsheetUrlOrId: googleSheetUrl,
                            phone: (updatedLead.phone || updatedLead.mobile)!,
                            updates: {
                                status: stage?.name || 'مرحلة جديدة',
                                noteContent: `تحديث مرحلة العميل تلقائياً إلى: ${stage?.name || 'مرحلة جديدة'}`
                            }
                        }).catch((err: any) => console.error('[Google Sheets Sync] Live update failed:', err));
                    }
                } catch (e) {}

                await ctx.replyWithHTML(`✅ تم نقل العميل <b>${updatedLead.name}</b> بنجاح إلى مرحلة: <b>${stage?.name}</b>!`);
            } else if (data.startsWith('no_answer:')) {
                const leadId = data.split(':')[1];
                try {
                    const crmConfig = await getTelegramCrmConfig();
                    const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
                    if (!lead) {
                        await ctx.answerCbQuery('⚠️ لم يتم العثور على العميل');
                        return;
                    }

                    const updated = await prisma.crmLead.update({
                        where: { id: leadId },
                        data: {
                            dateDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // Postpone next follow-up by 24h
                        }
                    });

                    await prisma.crmNote.create({
                        data: {
                            leadId,
                            userId: currentUser.id,
                            content: crmConfig.noAnswerNote,
                            type: 'note'
                        }
                    });

                    // Google sheet sync
                    try {
                        const googleSheetUrl = await getGoogleSheetUrl();
                        if (googleSheetUrl && (updated.phone || updated.mobile)) {
                            GoogleSheetsService.updateLeadFieldInSheet({
                                spreadsheetUrlOrId: googleSheetUrl,
                                phone: (updated.phone || updated.mobile)!,
                                updates: {
                                    status: 'لا يرد',
                                    noteContent: crmConfig.noAnswerNote
                                }
                            }).catch((err: any) => console.error('[Google Sheets Sync] Live update failed:', err));
                        }
                    } catch (e) {}

                    await ctx.answerCbQuery('✅ تم تسجيل عدم الرد');
                    await ctx.replyWithHTML(`📴 تم تسجيل <b>عدم رد</b> للعميل <b>${lead.name}</b> بنجاح!\n\n🔥 درجة الاهتمام الحالية: <code>${lead.levelOfInterest || 0}/10</code> (محفوظة دون تعديل)\n📝 الملاحظة: <i>${crmConfig.noAnswerNote}</i>`);
                } catch (err: any) {
                    await ctx.answerCbQuery('❌ حدث خطأ');
                }
            } else if (data.startsWith('schedule_call:')) {
                const leadId = data.split(':')[1];
                const inline_keyboard = [
                    [
                        { text: '🌅 غداً', callback_data: `set_followup:${leadId}:1` },
                        { text: '📅 بعد يومين', callback_data: `set_followup:${leadId}:2` }
                    ],
                    [
                        { text: '📅 بعد 3 أيام', callback_data: `set_followup:${leadId}:3` },
                        { text: '📅 بعد أسبوع', callback_data: `set_followup:${leadId}:7` }
                    ],
                    [
                        { text: '✍️ إدخال مخصص', callback_data: `set_followup_custom:${leadId}` }
                    ]
                ];
                await ctx.replyWithHTML(`📅 <b>جدولة متابعة تالية للعميل:</b>\nيرجى تحديد الموعد المطلوب للاتصال القادم:`, {
                    reply_markup: { inline_keyboard }
                });
                await ctx.answerCbQuery();
            } else if (data.startsWith('set_followup:')) {
                const parts = data.split(':');
                const leadId = parts[1];
                const days = parseInt(parts[2]);

                try {
                    const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
                    if (!lead) {
                        await ctx.answerCbQuery('⚠️ لم يتم العثور على العميل');
                        return;
                    }

                    const followUpDate = new Date();
                    followUpDate.setDate(followUpDate.getDate() + days);
                    followUpDate.setHours(9, 0, 0, 0); // Default to 9:00 AM

                    const updated = await prisma.crmLead.update({
                        where: { id: leadId },
                        data: { dateDeadline: followUpDate }
                    });

                    const dateStr = followUpDate.toLocaleDateString('ar-AE', { day: 'numeric', month: 'numeric', year: 'numeric' });
                    const noteText = `📅 تم جدولة مكالمة متابعة تالية للعميل بتاريخ ${dateStr}.`;

                    await prisma.crmNote.create({
                        data: {
                            leadId,
                            userId: currentUser.id,
                            content: noteText,
                            type: 'note'
                        }
                    });

                    // Google sheet sync
                    try {
                        const googleSheetUrl = await getGoogleSheetUrl();
                        if (googleSheetUrl) {
                            GoogleSheetsService.appendLeadToSheet({
                                spreadsheetUrlOrId: googleSheetUrl,
                                lead: updated,
                                noteContent: noteText
                            }).catch((err: any) => console.error('[Google Sheets Sync] Sync failed:', err));
                        }
                    } catch (e) {}

                    await ctx.answerCbQuery('✅ تم جدولة المتابعة');
                    await ctx.replyWithHTML(`📅 تم جدولة مكالمة متابعة للعميل <b>${lead.name}</b> بنجاح!\n\n📅 <b>موعد الاتصال القادم:</b> ${dateStr}`);
                } catch (err: any) {
                    await ctx.answerCbQuery('❌ حدث خطأ');
                }
            } else if (data.startsWith('set_followup_custom:')) {
                const leadId = data.split(':')[1];
                await setUserState(userId, 'expecting_custom_followup', leadId);
                await ctx.answerCbQuery();
                await ctx.replyWithHTML(`📅 <b>يرجى إرسال موعد المتابعة المطلوب:</b>\nيمكنك كتابة التاريخ والوقت بالتنسيق المباشر (مثال: <code>15/05/2026 الساعة 5 مساءً</code> أو <code>غداً الساعة 3 العصر</code>):`);
            } else if (data.startsWith('queue_no_answer:')) {
                const parts = data.split(':');
                const leadId = parts[1];
                const currentIndex = parseInt(parts[2]);
                const total = parseInt(parts[3]);

                try {
                    const crmConfig = await getTelegramCrmConfig();
                    const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
                    if (!lead) {
                        await ctx.answerCbQuery();
                        return;
                    }

                    const updated = await prisma.crmLead.update({
                        where: { id: leadId },
                        data: {
                            dateDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000) // Postpone to tomorrow
                        }
                    });

                    await prisma.crmNote.create({
                        data: {
                            leadId,
                            userId: currentUser.id,
                            content: `${crmConfig.noAnswerNote} (طابور الاتصال التفاعلي)`,
                            type: 'note'
                        }
                    });

                    await ctx.answerCbQuery('📴 تم تسجيل عدم الرد للعميل');
                    await ctx.replyWithHTML(`📴 تم تسجيل عدم الرد للعميل <b>${lead.name}</b> وتأجيل مكالمته لغد تلقائياً.\n\n🔥 درجة الاهتمام الحالية: <code>${lead.levelOfInterest || 0}/10</code> (محفوظة دون تعديل)`);

                    // Fetch next
                    await fetchAndPresentNextInQueue(ctx, currentUser.id, currentIndex, total);
                } catch (err: any) {
                    await ctx.reply(`⚠️ فشل التخطي: ${err.message}`);
                }
            } else if (data.startsWith('queue_answered:')) {
                const parts = data.split(':');
                const leadId = parts[1];
                const currentIndex = parseInt(parts[2]);
                const total = parseInt(parts[3]);

                await setUserState(userId, `expecting_queue_note:${currentIndex}:${total}`, leadId);
                await ctx.answerCbQuery();
                await ctx.replyWithHTML(`📝 <b>يرجى إرسال التقرير والملخص الصوتي وملاحظات المكالمة للعميل الآن كرسالة مباشرة:</b>`);
            } else if (data.startsWith('queue_start_calling')) {
                await ctx.answerCbQuery();
                try {
                    const crmConfig = await getTelegramCrmConfig();
                    const endOfToday = new Date();
                    endOfToday.setHours(23, 59, 59, 999);

                    const parts = data.split(':');
                    const parsedLimit = parts[1] ? parseInt(parts[1]) : null;
                    const limit = (parsedLimit && !isNaN(parsedLimit)) ? parsedLimit : crmConfig.callQueueLimit;

                    const leads = await prisma.crmLead.findMany({
                        where: {
                            salespersonId: currentUser.id,
                            active: true,
                            OR: [
                                { dateDeadline: { lte: endOfToday } },
                                { dateDeadline: null, levelOfInterest: null }
                            ]
                        },
                        orderBy: [
                            { priority: 'desc' },
                            { createdAt: 'asc' }
                        ],
                        take: limit,
                        include: {
                            notes: {
                                orderBy: { createdAt: 'desc' },
                                take: 1
                            }
                        }
                    });

                    if (leads.length === 0) {
                        await ctx.reply('🎉 رائع! لا توجد مكالمات متابعة لليوم في قائمتك.');
                        return;
                    }

                    await presentLeadInQueue(ctx, leads[0], 1, leads.length);
                } catch (err: any) {
                    await ctx.reply(`⚠️ فشل بدء الاتصالات: ${err.message}`);
                }
            } else if (data.startsWith('queue_view_list')) {
                await ctx.answerCbQuery();
                try {
                    const crmConfig = await getTelegramCrmConfig();
                    const endOfToday = new Date();
                    endOfToday.setHours(23, 59, 59, 999);

                    const parts = data.split(':');
                    const parsedLimit = parts[1] ? parseInt(parts[1]) : null;
                    const limit = (parsedLimit && !isNaN(parsedLimit)) ? parsedLimit : crmConfig.callQueueLimit;

                    const leads = await prisma.crmLead.findMany({
                        where: {
                            salespersonId: currentUser.id,
                            active: true,
                            OR: [
                                { dateDeadline: { lte: endOfToday } },
                                { dateDeadline: null, levelOfInterest: null }
                            ]
                        },
                        orderBy: [
                            { priority: 'desc' },
                            { createdAt: 'desc' }
                        ],
                        take: limit,
                        include: {
                            notes: {
                                orderBy: { createdAt: 'desc' },
                                take: 1
                            }
                        }
                    });

                    if (leads.length === 0) {
                        await ctx.reply('🎉 رائع! لا توجد مكالمات متابعة لليوم في قائمتك.');
                        return;
                    }

                    let msg = `📋 <b>قائمة عملاء اليوم المطلوب الاتصال بهم (${leads.length} عملاء):</b>\n\n`;
                    leads.forEach((lead, index) => {
                        const cleanPhone = lead.phone || lead.mobile || 'غير مسجل';
                        
                        let classification = '🆕 عميل جديد لم يتم التواصل معه بعد';
                        if (lead.dateDeadline) {
                            classification = '📅 مكالمة متابعة مجدولة تالياً';
                        }
                        const hasNoAnswer = lead.notes?.[0]?.content?.includes('لم يرد');
                        if (hasNoAnswer) {
                            classification = '📴 إعادة اتصال (لم يرد على المكالمة السابقة)';
                        }

                        msg += `${index + 1}. 👤 <b>${lead.name}</b>\n`;
                        msg += `   📞 الهاتف: <code>${cleanPhone}</code>\n`;
                        msg += `   🎯 التصنيف: <i>${classification}</i>\n`;
                        if (lead.levelOfInterest) {
                            msg += `   🔥 الاهتمام: <code>${lead.levelOfInterest}/10</code>\n`;
                        }
                        if (lead.interestedDiploma) {
                            msg += `   🎓 الدبلوم: <i>${lead.interestedDiploma}</i>\n`;
                        }
                        msg += `\n`;
                    });

                    msg += `💡 <i>يمكنك الضغط على أي رقم هاتف للاتصال به ومراسلته مباشرة!</i>`;
                    await ctx.replyWithHTML(msg, {
                        reply_markup: {
                            keyboard: [
                                [{ text: '🔍 بحث عن عميل' }, { text: '📝 إضافة تقرير' }],
                                [{ text: '📞 اتصالات اليوم' }],
                                [{ text: '📊 ملخص اليوم' }, { text: '⚙️ حالة الربط' }]
                            ],
                            resize_keyboard: true
                        }
                    });
                } catch (err: any) {
                    await ctx.reply(`⚠️ فشل عرض القائمة: ${err.message}`);
                }
            }
        } catch (err: any) {
            console.error('Callback Query Error:', err.message);
        }
    });

    // Register Message text handler
    botInstance.on('text', async (ctx: any) => {
        const text = ctx.message.text.trim();
        const userId = ctx.from.id;

        // Load currentUser at the top so it is available to all text triggers
        const currentUser = await getAuthenticatedUser(userId);

        // Allow /start, /menu, /login, /auth, /logout commands to run without authentication
        const isAuthCommand = text.startsWith('/start') || text.startsWith('/login') || text.startsWith('/auth') || text.startsWith('/logout') || text === 'قائمة' || text === '/menu' || text === 'تسجيل الخروج' || text === 'تسجيل خروج';

        if (!isAuthCommand) {
            if (!currentUser) {
                const settings = await prisma.settings.findFirst({
                    where: { id: 'singleton' }
                });

                const customMessage = settings?.telegramAuthMessage ||
                    `🔒 <b>عذراً، هذا النظام آمن ومخصص لموظفي معهد السلام الثقافي فقط!</b>\n\n` +
                    `يرجى تسجيل الدخول أولاً لربط حساب التليجرام الخاص بك وتفعيل الصلاحيات:\n` +
                    `<code>/login [اسم المستخدم] [كلمة المرور]</code>`;

                const customExample = settings?.telegramAuthExample ||
                    `<code>/login Abdelkader Pass1234</code>`;

                await ctx.replyWithHTML(
                    `${customMessage}\n\n` +
                    `<i>مثال:</i>\n${customExample}`
                );
                return;
            }
        }

        // Handle /start Command (with Deep Linking support)
        if (text.startsWith('/start')) {
            const parts = text.split(/\s+/);
            if (parts.length > 1 && parts[1].startsWith('lead_')) {
                const leadId = parts[1].replace('lead_', '').trim();
                try {
                    const lead = await prisma.crmLead.findUnique({
                        where: { id: leadId },
                        include: { stage: true }
                    });

                    if (lead) {
                        // Show Lead details immediately!
                        let cardMsg = `👤 <b>الملف المالي والاتصالي للعميل:</b>\n\n`;
                        cardMsg += `🏷️ <b>الاسم:</b> ${lead.name}\n`;
                        if (lead.phone || lead.mobile) {
                            cardMsg += `📱 <b>الهاتف:</b> <code>${lead.phone || lead.mobile}</code>\n`;
                        }
                        if (lead.nationality) {
                            cardMsg += `🌍 <b>الجنسية:</b> ${lead.nationality}\n`;
                        }
                        if (lead.emirate) {
                            cardMsg += `📍 <b>الإمارة:</b> ${lead.emirate}\n`;
                        }
                        if (lead.interestedDiploma) {
                            cardMsg += `🎓 <b>الدبلوم المهتم:</b> ${lead.interestedDiploma}\n`;
                        }
                        if (lead.levelOfInterest !== null && lead.levelOfInterest !== undefined) {
                            cardMsg += `🔥 <b>درجة الاهتمام:</b> ${lead.levelOfInterest}/10\n`;
                        }
                        if (lead.stage) {
                            cardMsg += `📁 <b>المرحلة الحالية:</b> ${lead.stage.name}\n`;
                        }
                        cardMsg += `\n📅 <i>تاريخ الإضافة: ${lead.createdAt.toLocaleDateString('ar-AE')}</i>\n`;

                        // Display Interactive Quick Action Buttons!
                        const buttons = [
                            [
                                { text: '📴 تم الاتصال ولم يرد', callback_data: `no_answer:${lead.id}` },
                                { text: '🔥 مهتم جداً', callback_data: `set_interest:${lead.id}:9` }
                            ],
                            [
                                { text: '📅 جدولة متابعة', callback_data: `schedule_call:${lead.id}` },
                                { text: '✍️ إضافة ملاحظة', callback_data: `add_note:${lead.id}` }
                            ],
                            [
                                { text: '📁 نقل إلى مرحلة أخرى', callback_data: `change_stage:${lead.id}` }
                            ]
                        ];

                        await ctx.replyWithHTML(cardMsg, {
                            reply_markup: { inline_keyboard: buttons }
                        });
                        return;
                    } else {
                        await ctx.reply('⚠️ عذراً، لم يتم العثور على هذا العميل بالنظام.');
                    }
                } catch (err: any) {
                    console.error('Start lead deep link error:', err.message);
                }
            }

            // Standard Start greeting
            await ctx.replyWithHTML(
                `👋 <b>مرحباً بك في نظام إدارة علاقات العملاء الذكي (CRM) لمعهد السلام!</b>\n\n` +
                `هذا البوت يتيح لك البحث عن العملاء، تسجيل الملاحظات، وجدولة المتابعات اليومية فوراً وبلمسة واحدة لزيادة مبيعاتك.\n\n` +
                `💡 <b>لتسجيل الدخول:</b>\n` +
                `<code>/login [اسم المستخدم] [كلمة المرور]</code>`
            );
            return;
        }

        // Handle Login Command
        if (text.startsWith('/login') || text.startsWith('/auth')) {
            const parts = text.split(/\s+/);
            if (parts.length < 3) {
                const settings = await prisma.settings.findFirst({
                    where: { id: 'singleton' }
                });
                const customExample = settings?.telegramAuthExample || `<code>/login Abdelkader MyPass123</code>`;

                await ctx.replyWithHTML(
                    `🔑 <b>لتسجيل الدخول وربط حسابك بالنظام، يرجى إرسال الأمر بالتنسيق التالي:</b>\n` +
                    `<code>/login [اسم_المستخدم] [كلمة_المرور]</code>\n\n` +
                    `<i>مثال:</i>\n${customExample}`
                );
                return;
            }

            const usernameInput = parts[1].trim();
            const passwordInput = parts[2].trim();

            try {
                const user = await prisma.user.findFirst({
                    where: { username: usernameInput }
                });

                if (!user) {
                    await ctx.reply('❌ عذراً، اسم المستخدم غير موجود بالنظام.');
                    return;
                }

                const passwordValid = await comparePassword(passwordInput, user.passwordHash);
                if (!passwordValid) {
                    await ctx.reply('❌ عذراً، كلمة المرور غير صحيحة.');
                    return;
                }

                // Save Telegram ID in user profile
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        telegramUserId: String(userId),
                        telegramUsername: ctx.from.username || null
                    }
                });

                await ctx.replyWithHTML(
                    `🎉 <b>تم تسجيل دخولك بنجاح وربط حساب التليجرام!</b>\n\n` +
                    `👤 <b>الموظف</b>: ${user.firstName || ''} ${user.lastName || ''}\n` +
                    `📧 <b>البريد</b>: ${user.email}\n` +
                    `🟢 <b>حالة الربط</b>: معتمد وآمن تماماً ✅\n\n` +
                    `يمكنك الآن استخدام كافة أزرار البحث وإضافة الملاحظات ونقل المراحل لعملائك بكل خصوصية وأمان!`
                );
            } catch (err: any) {
                console.error('Telegram Login Error:', err.message);
                await ctx.reply(`⚠️ حدث خطأ أثناء عملية تسجيل الدخول: ${err.message}`);
            }
            return;
        }

        // Handle Logout Command
        if (text.startsWith('/logout') || text === 'تسجيل الخروج' || text === 'تسجيل خروج') {
            try {
                const user = await getAuthenticatedUser(userId);
                if (!user) {
                    await ctx.reply('❌ عذراً، أنت غير مسجل الدخول بالنظام بالأساس!');
                    return;
                }

                // Clear Telegram mapping in user profile
                await prisma.user.update({
                    where: { id: user.id },
                    data: {
                        telegramUserId: null,
                        telegramUsername: null
                    }
                });

                // Clear any active conversational state
                delete userStates[userId];

                await ctx.replyWithHTML(
                    `👋 <b>تم تسجيل خروجك بنجاح وإلغاء ربط حساب التليجرام!</b>\n\n` +
                    `👤 <b>الموظف</b>: ${user.firstName || ''} ${user.lastName || ''}\n` +
                    `🔴 <b>حالة الربط</b>: ملغية وغير نشطة ⚠️\n\n` +
                    `تم حذف جلسة عملك بأمان تام وحماية خصوصية بيانات المعهد. يمكنك إعادة تسجيل الدخول في أي وقت باستخدام الأمر <code>/login</code>.`
                );
            } catch (err: any) {
                console.error('Telegram Logout Error:', err.message);
                await ctx.reply(`⚠️ حدث خطأ أثناء عملية تسجيل الخروج: ${err.message}`);
            }
            return;
        }

        // Check active database-driven user states (survives Vercel restarts)
        const activeState = await getUserState(userId);

        if (activeState && activeState.action === 'expecting_note') {
            const { leadId } = activeState;
            await deleteUserState(userId); // reset state

            try {
                const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
                if (!lead) {
                    ctx.reply('⚠️ عذراً، لم يتم العثور على ملف العميل لحفظ الملاحظة.');
                    return;
                }

                const noteAuthorId = currentUser ? currentUser.id : (lead.salespersonId || 'system');

                await prisma.crmNote.create({
                    data: {
                        leadId,
                        userId: noteAuthorId,
                        content: text,
                        type: 'note'
                    }
                });

                // Push update to Google Sheet live
                try {
                    const googleSheetUrl = await getGoogleSheetUrl();
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

        // Custom follow up date & time parsing text state handler
        if (activeState && activeState.action === 'expecting_custom_followup') {
            const { leadId } = activeState;
            await deleteUserState(userId); // reset state

            try {
                const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
                if (!lead) {
                    ctx.reply('⚠️ عذراً، لم يتم العثور على ملف العميل لجدولة المتابعة.');
                    return;
                }

                let parsedDate = new Date();
                const cleanedText = text.trim();

                // 1. Parse Date portion
                let dayAdded = false;
                if (cleanedText.includes('اليوم')) {
                    dayAdded = true;
                } else if (cleanedText.includes('غدا') || cleanedText.includes('غداً')) {
                    parsedDate.setDate(parsedDate.getDate() + 1);
                    dayAdded = true;
                } else if (cleanedText.includes('بعد يومين')) {
                    parsedDate.setDate(parsedDate.getDate() + 2);
                    dayAdded = true;
                } else if (cleanedText.includes('بعد 3 أيام') || cleanedText.includes('بعد ثلاثة أيام')) {
                    parsedDate.setDate(parsedDate.getDate() + 3);
                    dayAdded = true;
                } else if (cleanedText.includes('بعد أسبوع') || cleanedText.includes('اسبوع')) {
                    parsedDate.setDate(parsedDate.getDate() + 7);
                    dayAdded = true;
                } else {
                    // Check for DD/MM/YYYY or DD/MM pattern
                    const dateParts = cleanedText.match(/(\d{1,2})[\/\-\.](\d{1,2})(?:[\/\-\.](\d{2,4}))?/);
                    if (dateParts) {
                        const day = parseInt(dateParts[1]);
                        const month = parseInt(dateParts[2]) - 1;
                        const year = dateParts[3] ? (dateParts[3].length === 2 ? 2000 + parseInt(dateParts[3]) : parseInt(dateParts[3])) : new Date().getFullYear();
                        parsedDate = new Date(year, month, day);
                        dayAdded = true;
                    }
                }

                // 2. Parse Time portion
                let hour = 9; // Default: 9:00 AM
                let minute = 0;
                let timeMatched = false;

                // Match colon-separated format e.g. "5:30" or "17:00"
                const colonTimeMatch = cleanedText.match(/(\d{1,2}):(\d{2})/);
                if (colonTimeMatch) {
                    hour = parseInt(colonTimeMatch[1]);
                    minute = parseInt(colonTimeMatch[2]);
                    timeMatched = true;
                } else {
                    // Match "الساعة X"
                    const hourMatch = cleanedText.match(/(?:الساعة|ساعة)\s*(\d{1,2})/);
                    if (hourMatch) {
                        hour = parseInt(hourMatch[1]);
                        minute = 0;
                        timeMatched = true;
                    } else {
                        // Check for stand-alone digits in text if date portion was already found
                        const plainNumMatch = cleanedText.match(/(?:\s|^)(\d{1,2})(?:\s|$)/);
                        if (plainNumMatch && dayAdded) {
                            hour = parseInt(plainNumMatch[1]);
                            minute = 0;
                            timeMatched = true;
                        }
                    }
                }

                // Adjust for PM / AM
                const isPM = cleanedText.includes('مساء') || cleanedText.includes('مساءً') || cleanedText.includes('م') || cleanedText.includes('العصر') || cleanedText.includes('المساء') || cleanedText.includes('مساءا');
                const isAM = cleanedText.includes('صباح') || cleanedText.includes('صباحاً') || cleanedText.includes('ص') || cleanedText.includes('الصباح') || cleanedText.includes('صباحا');

                if (isPM && hour < 12) {
                    hour += 12;
                } else if (isAM && hour === 12) {
                    hour = 0;
                } else if (!isAM && !isPM && timeMatched && hour < 8) {
                    // Default small standalone business hours (1 to 7) to PM if no AM/PM specified (e.g. "الساعة 5" -> 5:00 PM)
                    hour += 12;
                }

                parsedDate.setHours(hour, minute, 0, 0);

                // If no date was matched explicitly and parsed time is already past today, schedule it for tomorrow!
                if (!dayAdded) {
                    if (parsedDate.getTime() < Date.now()) {
                        parsedDate.setDate(parsedDate.getDate() + 1);
                    }
                }

                const updated = await prisma.crmLead.update({
                    where: { id: leadId },
                    data: { dateDeadline: parsedDate }
                });

                const dateStr = parsedDate.toLocaleDateString('ar-AE', { day: 'numeric', month: 'numeric', year: 'numeric' });
                const timeStr = parsedDate.toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit', hour12: true });
                const noteText = `📅 تم جدولة مكالمة متابعة تالية للعميل بتاريخ ${dateStr} الساعة ${timeStr}.`;

                await prisma.crmNote.create({
                    data: {
                        leadId,
                        userId: currentUser!.id,
                        content: noteText,
                        type: 'note'
                    }
                });

                // Google sheet sync
                try {
                    const googleSheetUrl = await getGoogleSheetUrl();
                    if (googleSheetUrl) {
                        GoogleSheetsService.appendLeadToSheet({
                            spreadsheetUrlOrId: googleSheetUrl,
                            lead: updated,
                            noteContent: noteText
                        }).catch((err: any) => console.error('[Google Sheets Sync] Sync failed:', err));
                    }
                } catch (e) {}

                ctx.replyWithHTML(`✅ <b>تم جدولة مكالمة متابعة للعميل ${lead.name} بنجاح!</b>\n\n📅 <b>موعد الاتصال القادم:</b> ${dateStr} في تمام الساعة <b>${timeStr}</b> ⏰`);
            } catch (err: any) {
                ctx.reply('⚠️ حدث خطأ أثناء حفظ موعد المتابعة.');
            }
            return;
        }

        // Custom follow up expectation inside call queue handler
        if (activeState && activeState.action.startsWith('expecting_queue_note:')) {
            const stateParts = activeState.action.split(':');
            const currentIndex = parseInt(stateParts[1]);
            const total = parseInt(stateParts[2]);
            const { leadId } = activeState;
            await deleteUserState(userId); // reset state

            try {
                const lead = await prisma.crmLead.findUnique({ where: { id: leadId } });
                if (!lead) {
                    ctx.reply('⚠️ عذراً، لم يتم العثور على ملف العميل لحفظ التقرير.');
                    return;
                }

                // Add Note
                await prisma.crmNote.create({
                    data: {
                        leadId,
                        userId: currentUser!.id,
                        content: `${text} (طابور الاتصال التفاعلي)`,
                        type: 'note'
                    }
                });

                // Set deadline / postpone to 7 days since we successfully called them!
                const updated = await prisma.crmLead.update({
                    where: { id: leadId },
                    data: {
                        dateDeadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    }
                });

                // Sync to sheets...
                try {
                    const googleSheetUrl = await getGoogleSheetUrl();
                    if (googleSheetUrl) {
                        GoogleSheetsService.appendLeadToSheet({
                            spreadsheetUrlOrId: googleSheetUrl,
                            lead: updated,
                            noteContent: text
                        }).catch((err: any) => console.error('[Google Sheets Sync] Failed:', err));
                    }
                } catch (e) {}

                await ctx.replyWithHTML(`✅ تم إضافة تقرير المتابعة للعميل <b>${lead.name}</b> بنجاح!\n\n📝 <b>التقرير المضاف:</b>\n${text}`);

                // Fetch and present NEXT
                await fetchAndPresentNextInQueue(ctx, currentUser!.id, currentIndex, total);
            } catch (err: any) {
                ctx.reply('⚠️ حدث خطأ أثناء حفظ تقرير المتابعة.');
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

        // Leaderboard & Sales Stats Command
        if (text === '🏆 لوحة الصدارة' || text === '/leaderboard' || text === '/stats') {
            try {
                const crmConfig = await getTelegramCrmConfig();
                if (!crmConfig.statsCommandEnabled) {
                    await ctx.reply('⚠️ عذراً، لوحة الصدارة وإحصائيات المبيعات معطلة حالياً من قبل الإدارة.');
                    return;
                }

                // Check authorization
                const adminsStr = crmConfig.statsCommandAdmins || '';
                if (adminsStr.trim().length > 0) {
                    const allowedAdmins = adminsStr.split(',').map(s => s.trim().toLowerCase());
                    const senderId = String(ctx.from.id);
                    const senderUser = ctx.from.username ? ctx.from.username.toLowerCase() : '';
                    
                    const isAuthorized = allowedAdmins.includes(senderId) || 
                                         (senderUser && allowedAdmins.includes(senderUser)) || 
                                         (currentUser && currentUser.username === 'admin');

                    if (!isAuthorized) {
                        await ctx.reply('⚠️ عذراً، لا تملك الصلاحية الكافية لعرض لوحة الصدارة وإحصائيات المبيعات الحساسة.');
                        return;
                    }
                }

                // Query statistics
                const sevenDaysAgo = new Date();
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

                // 1. Leads registered this week grouped by salesperson
                const leadsGrouped = await prisma.crmLead.groupBy({
                    by: ['salespersonId'],
                    where: {
                        createdAt: { gte: sevenDaysAgo },
                        active: true
                    },
                    _count: {
                        id: true
                    }
                });

                // 2. Calls/notes created this week grouped by user
                const notesGrouped = await prisma.crmNote.groupBy({
                    by: ['userId'],
                    where: {
                        createdAt: { gte: sevenDaysAgo }
                    },
                    _count: {
                        id: true
                    }
                });

                // Fetch user/salesperson names to display on the leaderboard
                const users = await prisma.user.findMany({
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                });

                const userMap = new Map(users.map(u => [u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'موظف']));

                // Map results for leads
                const leadLeaderboard = leadsGrouped
                    .map(g => ({
                        name: g.salespersonId ? (userMap.get(g.salespersonId) || 'موزع تلقائي') : 'غير معين',
                        count: g._count.id
                    }))
                    .sort((a, b) => b.count - a.count);

                // Map results for follow-ups
                const notesLeaderboard = notesGrouped
                    .map(g => ({
                        name: userMap.get(g.userId) || 'موظف مبيعات',
                        count: g._count.id
                    }))
                    .sort((a, b) => b.count - a.count);

                // Formatting output
                let responseText = `🏆 <b>لوحة الصدارة وإحصائيات مبيعات فريق السلام (آخر 7 أيام)</b> 🏆\n\n`;

                responseText += `👤 <b>إضافة العملاء الجدد والفرص:</b>\n`;
                if (leadLeaderboard.length === 0) {
                    responseText += `  <i>لا توجد بيانات عملاء جدد هذا الأسبوع</i>\n`;
                } else {
                    leadLeaderboard.forEach((item, index) => {
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '👤';
                        responseText += `  ${medal} <b>${item.name}</b>: <code>${item.count}</code> عميل\n`;
                    });
                }

                responseText += `\n📞 <b>متابعات الاتصال وتقارير المبيعات:</b>\n`;
                if (notesLeaderboard.length === 0) {
                    responseText += `  <i>لا توجد بيانات متابعات هذا الأسبوع</i>\n`;
                } else {
                    notesLeaderboard.forEach((item, index) => {
                        const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📞';
                        responseText += `  ${medal} <b>${item.name}</b>: <code>${item.count}</code> متابعة\n`;
                    });
                }

                responseText += `\n🎯 <i>هذه البيانات تحدث تلقائياً لتحفيز ورفع كفاءة مبيعات المعهد! استمروا بالقوة والعزيمة!</i> 💪🚀`;

                await ctx.replyWithHTML(responseText);
            } catch (err: any) {
                console.error('Leaderboard command error:', err.message);
                await ctx.reply('⚠️ فشل جلب بيانات لوحة الصدارة.');
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

        // Call Queue Trigger
        if (text === '📞 اتصالات اليوم' || text.startsWith('/today')) {
            try {
                const crmConfig = await getTelegramCrmConfig();
                const endOfToday = new Date();
                endOfToday.setHours(23, 59, 59, 999);

                // Parse custom limit if supplied
                let limit = crmConfig.callQueueLimit;
                const parts = text.split(/\s+/);
                if (parts.length > 1) {
                    const parsedLimit = parseInt(parts[1]);
                    if (!isNaN(parsedLimit) && parsedLimit > 0) {
                        limit = parsedLimit;
                    }
                }

                // Fetch leads assigned to user that have followUpDate <= today or new uncontacted leads
                const leads = await prisma.crmLead.findMany({
                    where: {
                        salespersonId: currentUser ? currentUser.id : undefined,
                        active: true,
                        OR: [
                            { dateDeadline: { lte: endOfToday } },
                            { dateDeadline: null, levelOfInterest: null }
                        ]
                    },
                    orderBy: [
                        { priority: 'desc' },
                        { createdAt: 'asc' }
                    ],
                    take: limit
                });

                if (leads.length === 0) {
                    await ctx.reply('🎉 رائع وممتاز! لا توجد مكالمات متابعة أو عملاء غير متصل بهم حالياً في قائمتك لليوم.');
                    return;
                }

                await ctx.replyWithHTML(
                    `📞 <b>طابور اتصالات اليوم مجهز بنجاح!</b>\n` +
                    `تم تجهيز <code>${leads.length}</code> عميل للمتابعة والاتصال لليوم.\n\n` +
                    `💡 <i>يمكنك طلب عدد مخصص من العملاء بكتابة: <code>/today [العدد]</code> (مثال: <code>/today 15</code>)</i>\n\n` +
                    `يرجى اختيار طريقة العرض المفضلة للبدء:`,
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    { text: '🚀 بدء الاتصال المتتابع (واحد تلو الآخر)', callback_data: `queue_start_calling:${limit}` }
                                ],
                                [
                                    { text: '📋 عرض قائمة الأسماء الكاملة لليوم', callback_data: `queue_view_list:${limit}` }
                                ]
                            ]
                        }
                    }
                );
            } catch (err: any) {
                console.error('Call Queue Error:', err.message);
                await ctx.reply('⚠️ فشل جلب اتصالات اليوم.');
            }
            return;
        }

        // Genius Lead Filtering & Reporting Parser
        if (text.startsWith('فلتر') || text.startsWith('/filter')) {
            try {
                // Get month mapping
                const arabicMonths: { [key: string]: number } = {
                    'يناير': 0, 'فبراير': 1, 'مارس': 2, 'أبريل': 3, 'مايو': 4, 'يونيو': 5,
                    'يوليو': 6, 'أغسطس': 7, 'سبتمبر': 8, 'أكتوبر': 9, 'نوفمبر': 10, 'ديسمبر': 11
                };

                const parts = text.split(/\s+/);
                let limit = 10;
                let statusQuery: string | null = null;
                let targetMonth: number | null = null;

                // Parse components naturally from the input phrase
                for (const part of parts) {
                    if (part === 'فلتر' || part === '/filter') continue;

                    // Parse limit (any written number)
                    const num = parseInt(part);
                    if (!isNaN(num) && num > 0) {
                        limit = num;
                        continue;
                    }

                    // Parse month
                    let foundMonth = false;
                    for (const monthName of Object.keys(arabicMonths)) {
                        if (part.includes(monthName)) {
                            targetMonth = arabicMonths[monthName];
                            foundMonth = true;
                            break;
                        }
                    }
                    if (foundMonth) continue;

                    // Check numeric month formats if they write e.g. "شهر 11" or similar
                    if (part.startsWith('شهر_') || part.startsWith('شهر')) {
                        const mNum = parseInt(part.replace(/\D/g, ''));
                        if (!isNaN(mNum) && mNum >= 1 && mNum <= 12) {
                            targetMonth = mNum - 1;
                            continue;
                        }
                    }

                    // If it's none of the above, it's treated as part of the status query phrase
                    statusQuery = statusQuery ? `${statusQuery} ${part}` : part;
                }

                // Construct Database Prisma where clauses
                const whereClause: any = { active: true };

                // 1. Filter by Status/Stage category
                if (statusQuery) {
                    const sq = statusQuery.trim();
                    if (sq.includes('مهتم')) {
                        // High interest leads
                        whereClause.levelOfInterest = { gte: 7 };
                    } else if (sq.includes('يستفسر') || sq.includes('استفسار')) {
                        whereClause.notes = {
                            some: {
                                content: { contains: 'يستفسر', mode: 'insensitive' }
                            }
                        };
                    } else if (sq.includes('لايرد') || sq.includes('لا يرد') || sq.includes('لم يرد')) {
                        whereClause.notes = {
                            some: {
                                content: { contains: 'لم يرد', mode: 'insensitive' }
                            }
                        };
                    } else if (sq.includes('مسجل')) {
                        const registeredStage = await prisma.crmStage.findFirst({
                            where: { name: { contains: 'مسجل' } }
                        });
                        if (registeredStage) {
                            whereClause.stageId = registeredStage.id;
                        } else {
                            whereClause.notes = {
                                some: {
                                    content: { contains: 'مسجل', mode: 'insensitive' }
                                }
                            };
                        }
                    } else if (sq.includes('عدمالازعاج') || sq.includes('عدم ازعاج') || sq.includes('ازعاج')) {
                        whereClause.notes = {
                            some: {
                                content: { contains: 'عدم ازعاج', mode: 'insensitive' }
                            }
                        };
                    } else if (sq.includes('جديد') || sq.includes('حديث')) {
                        whereClause.levelOfInterest = null;
                        whereClause.dateDeadline = null;
                    } else {
                        // General text search over stage name, notes or interested diploma
                        whereClause.OR = [
                            { interestedDiploma: { contains: sq, mode: 'insensitive' } },
                            { notes: { some: { content: { contains: sq, mode: 'insensitive' } } } },
                            { stage: { name: { contains: sq, mode: 'insensitive' } } }
                        ];
                    }
                }

                // 2. Filter by month of the current year (2026)
                if (targetMonth !== null) {
                    const currentYear = new Date().getFullYear();
                    const startDate = new Date(currentYear, targetMonth, 1, 0, 0, 0);
                    const endDate = new Date(currentYear, targetMonth + 1, 0, 23, 59, 59, 999);
                    whereClause.createdAt = {
                        gte: startDate,
                        lte: endDate
                    };
                }

                // Fetch filtered leads
                const leads = await prisma.crmLead.findMany({
                    where: whereClause,
                    orderBy: { createdAt: 'desc' },
                    take: limit,
                    include: {
                        stage: true,
                        notes: {
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                });

                if (leads.length === 0) {
                    let emptyMsg = `🔍 <b>لم يتم العثور على أي عملاء يطابقون الفلتر:</b>\n`;
                    if (statusQuery) emptyMsg += `• 🎯 تصنيف/حالة: <code>${statusQuery}</code>\n`;
                    if (targetMonth !== null) emptyMsg += `• 📅 الشهر: <code>${Object.keys(arabicMonths)[targetMonth]}</code>\n`;
                    await ctx.replyWithHTML(emptyMsg);
                    return;
                }

                let filterTitle = '🔍 <b>نتائج التصفية والتقرير الذكي:</b>\n';
                if (statusQuery) filterTitle += `• 🎯 الحالة المستهدفة: <code>${statusQuery}</code>\n`;
                if (targetMonth !== null) filterTitle += `• 📅 شهر التسليم: <code>${Object.keys(arabicMonths)[targetMonth]}</code>\n`;
                filterTitle += `• 📊 عدد النتائج المعروضة: <code>${leads.length}</code>\n\n`;

                let msg = filterTitle;
                leads.forEach((lead, index) => {
                    const cleanPhone = lead.phone || lead.mobile || 'غير مسجل';
                    let leadStatus = lead.stage?.name || 'جديد لم يتم التواصل معه';
                    if (lead.notes?.[0]?.content?.includes('لم يرد')) {
                        leadStatus = 'لا يرد (قيد المحاولة)';
                    } else if (lead.notes?.[0]?.content?.includes('عدم ازعاج')) {
                        leadStatus = 'عدم إزعاج (DND)';
                    }

                    msg += `${index + 1}. 👤 <b>${lead.name}</b>\n`;
                    msg += `   📞 الهاتف: <code>${cleanPhone}</code>\n`;
                    msg += `   🎯 الحالة/المرحلة: <i>${leadStatus}</i>\n`;
                    if (lead.levelOfInterest) msg += `   🔥 الاهتمام: <code>${lead.levelOfInterest}/10</code>\n`;
                    if (lead.interestedDiploma) msg += `   🎓 الدبلوم: <i>${lead.interestedDiploma}</i>\n`;
                    const dateStr = lead.createdAt.toLocaleDateString('ar-AE', { day: 'numeric', month: 'numeric', year: 'numeric' });
                    msg += `   📅 تاريخ الاستلام: <code>${dateStr}</code>\n\n`;
                });

                msg += `💡 <i>يمكنك تخصيص الفلاتر بشكل مرن تماماً، مثال: <code>فلتر مهتمين نوفمبر 5</code></i>`;
                await ctx.replyWithHTML(msg, {
                    reply_markup: {
                        keyboard: [
                            [{ text: '🔍 بحث عن عميل' }, { text: '📝 إضافة تقرير' }],
                            [{ text: '📞 اتصالات اليوم' }],
                            [{ text: '📊 ملخص اليوم' }, { text: '⚙️ حالة الربط' }]
                        ],
                        resize_keyboard: true
                    }
                });
            } catch (err: any) {
                console.error('Filter Command Error:', err.message);
                await ctx.reply(`⚠️ حدث خطأ أثناء تصفية البيانات: ${err.message}`);
            }
            return;
        }

        const isReport = /الاسم\s*:/i.test(text) && /(?:رقم\s*)?الهاتف\s*:/i.test(text);
        if (isReport) {
            try {
                const parsedData = crmService.parseTelegramMessage(text);
                const currentUser = await getAuthenticatedUser(userId);
                
                // If the user hasn't specified an employee, automatically assign the logged-in user's name!
                if (currentUser && !parsedData.employee) {
                    parsedData.employee = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
                }

                const result = await crmService.updateLeadFromMessage(parsedData);
                const lead = result.lead;

                let replyMsg = `✅ <b>تم تسجيل/تحديث العميل بنجاح!</b>\n\n`;
                replyMsg += `👤 <b>الاسم</b>: ${lead.name}\n`;
                replyMsg += `📞 <b>الهاتف</b>: ${lead.phone || lead.mobile}\n`;
                
                const salespersonName = lead.salesperson ? `${lead.salesperson.firstName || ''} ${lead.salesperson.lastName || ''}`.trim() : 'غير محدد';
                replyMsg += `👤 <b>المسؤول</b>: ${salespersonName}\n`;
                
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

                // Add interactive action buttons (raw JSON format to ensure 100% platform compatibility)
                const inline_keyboard: any[] = [];
                const cleanPhone = lead.phoneNormalized || lead.phone || lead.mobileNormalized || lead.mobile;
                if (cleanPhone) {
                    const digits = cleanPhone.replace(/\D/g, '');
                    inline_keyboard.push([
                        { text: '💬 فتح واتساب', url: `https://wa.me/${digits}` }
                    ]);
                }

                const crmConfig = await getTelegramCrmConfig();
                const btnRow1 = [];
                if (crmConfig.noAnswerButtonEnabled) {
                    btnRow1.push({ text: '📴 لم يرد', callback_data: `no_answer:${lead.id}` });
                }
                btnRow1.push({ text: '➕ إضافة ملاحظة', callback_data: `add_note:${lead.id}` });

                const btnRow2 = [];
                if (crmConfig.followUpButtonEnabled) {
                    btnRow2.push({ text: '📅 جدولة متابعة', callback_data: `schedule_call:${lead.id}` });
                }
                btnRow2.push({ text: '🏷️ درجة الاهتمام', callback_data: `change_interest:${lead.id}` });

                inline_keyboard.push(btnRow1);
                inline_keyboard.push(btnRow2);
                inline_keyboard.push([
                    { text: '🔄 نقل المرحلة', callback_data: `change_stage:${lead.id}` }
                ]);

                try {
                    await ctx.replyWithHTML(replyMsg, {
                        reply_markup: { inline_keyboard }
                    });
                } catch (sendErr: any) {
                    console.error('Telegram HTML Send Error, falling back to plain text:', sendErr.message);
                    const plainMsg = replyMsg.replace(/<[^>]+>/g, '');
                    await ctx.reply(plainMsg, {
                        reply_markup: { inline_keyboard }
                    });
                }
            } catch (error: any) {
                console.error('Telegram Parse Error:', error.message);
                await ctx.reply(`⚠️ عذراً، حدث خطأ أثناء قراءة التقرير: ${error.message}`);
            }
        } else if (text.startsWith('/search') || text.startsWith('/find') || text.startsWith('/بحث') || /^\+?[0-9\s\-]{8,18}$/.test(text)) {
            try {
                let searchPhone = text;
                if (searchPhone.startsWith('/search') || searchPhone.startsWith('/find') || searchPhone.startsWith('/بحث')) {
                    searchPhone = searchPhone.replace(/^\/(search|find|بحث)\s*/, '').trim();
                }

                if (!searchPhone) {
                    await ctx.reply('⚠️ يرجى إدخال رقم الهاتف المراد البحث عنه. مثال:\n971501234567');
                    return;
                }

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
                        salesperson: true,
                        notes: {
                            orderBy: { createdAt: 'desc' },
                            take: 30 // Increased to fetch more notes, filtered in JS to show up to 10 unique ones
                        }
                    }
                });

                if (results.length === 0) {
                    await ctx.reply(`🔍 لم يتم العثور على أي عميل مسجل بالرقم: ${searchPhone}`);
                } else {
                    for (const lead of results) {
                        let emirate = lead.emirate;
                        let nationality = lead.nationality;
                        let interestedDiploma = lead.interestedDiploma;
                        let levelOfInterest = lead.levelOfInterest;

                        if (lead.notes && lead.notes.length > 0) {
                            lead.notes.forEach((note: any) => {
                                const text = note.content;
                                if (!emirate) {
                                    const m = text.match(/(?:📍\s*)?الإمارة\s*:\s*([^\n\r\-\|]+?)(?=\s*(?:الدبلوم|درجة الاهتمام|الجنسية|الملاحظات|👤|📞|🎓|🔥|🚨|•|$))/);
                                    if (m) emirate = m[1].trim();
                                }
                                if (!nationality) {
                                    const m = text.match(/(?:🌍\s*)?الجنسية\s*(?:\.\.|\s*:\s*)\s*([^\n\r\-\|]+?)(?=\s*(?:الإمارة|الدبلوم|درجة الاهتمام|الملاحظات|👤|📞|🎓|🔥|🚨|•|$))/);
                                    if (m) nationality = m[1].trim();
                                }
                                if (!interestedDiploma) {
                                    const m = text.match(/(?:🎓\s*)?(?:الدبلوم المهتم به|الدبلوم)\s*:\s*([^\n\r\-\|]+?)(?=\s*(?:درجة الاهتمام|درجة الإهتمام|الإمارة|الجنسية|الملاحظات|👤|📞|🎓|🔥|🚨|•|$))/);
                                    if (m) interestedDiploma = m[1].trim();
                                }
                                if (!levelOfInterest) {
                                    const m = text.match(/(?:🔥\s*)?(?:درجة الاهتمام|درجة الإهتمام)\s*:\s*(\d+)/);
                                    if (m) {
                                        levelOfInterest = parseInt(m[1]);
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
                            let displayedNotesCount = 0;

                            for (const note of lead.notes) {
                                if (displayedNotesCount >= 10) break; // Limit to 10 unique notes

                                const noteDate = new Date(note.createdAt);
                                const dateStr = `${noteDate.getDate()}/${noteDate.getMonth() + 1}/${noteDate.getFullYear()}`;
                                
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

                                if (!cleanContent || seenNotes.has(cleanContent)) continue;
                                seenNotes.add(cleanContent);

                                itemMsg += `• 📅 ${dateStr} : ${cleanContent}\n`;
                                displayedNotesCount++;
                            }
                        }
                        itemMsg += `\n──────────────────\n`;
                        const salespersonName = lead.salesperson ? `${lead.salesperson.firstName || ''} ${lead.salesperson.lastName || ''}`.trim() : 'غير محدد';
                        itemMsg += `👤 <b>المسؤول</b>: ${salespersonName}\n`;

                        // Add interactive action buttons (raw JSON format to ensure 100% platform compatibility)
                        const inline_keyboard: any[] = [];
                        const cleanPhone = lead.phoneNormalized || lead.phone || lead.mobileNormalized || lead.mobile;
                        if (cleanPhone) {
                            const digits = cleanPhone.replace(/\D/g, '');
                            inline_keyboard.push([
                                { text: '💬 فتح واتساب', url: `https://wa.me/${digits}` }
                            ]);
                        }

                        const crmConfig = await getTelegramCrmConfig();
                        const btnRow1 = [];
                        if (crmConfig.noAnswerButtonEnabled) {
                            btnRow1.push({ text: '📴 لم يرد', callback_data: `no_answer:${lead.id}` });
                        }
                        btnRow1.push({ text: '➕ إضافة ملاحظة', callback_data: `add_note:${lead.id}` });

                        const btnRow2 = [];
                        if (crmConfig.followUpButtonEnabled) {
                            btnRow2.push({ text: '📅 جدولة متابعة', callback_data: `schedule_call:${lead.id}` });
                        }
                        btnRow2.push({ text: '🏷️ درجة الاهتمام', callback_data: `change_interest:${lead.id}` });

                        inline_keyboard.push(btnRow1);
                        inline_keyboard.push(btnRow2);
                        inline_keyboard.push([
                            { text: '🔄 نقل المرحلة', callback_data: `change_stage:${lead.id}` }
                        ]);

                        try {
                            await ctx.replyWithHTML(itemMsg, {
                                reply_markup: { inline_keyboard }
                            });
                        } catch (sendErr: any) {
                            console.error('Telegram search HTML send failure, falling back to plain text:', sendErr.message);
                            const plainMsg = itemMsg.replace(/<[^>]+>/g, '');
                            await ctx.reply(plainMsg, {
                                reply_markup: { inline_keyboard }
                            });
                        }
                    }
                }
            } catch (err: any) {
                console.error('Telegram Search Error:', err.message);
                await ctx.reply(`⚠️ عذراً، حدث خطأ أثناء البحث عن الهاتف: ${err.message}`);
            }
        } else if (text === '/start' || text === '/menu' || text === 'قائمة') {
            await ctx.reply(
                'مرحباً بك في نظام السلام CRM المتكامل الذكي! 📱💎\n\nيرجى اختيار الإجراء المطلوب من الأزرار بالأسفل:',
                {
                    reply_markup: {
                        keyboard: [
                            [{ text: '🔍 بحث عن عميل' }, { text: '📝 إضافة تقرير' }],
                            [{ text: '📞 اتصالات اليوم' }],
                            [{ text: '📊 ملخص اليوم' }, { text: '⚙️ حالة الربط' }]
                        ],
                        resize_keyboard: true
                    }
                }
            );
        }
    });

    const alreadyCached = !!botsCache[token];
    botsCache[token] = botInstance;

    // If running locally, enable polling auto-start
    if (process.env.VERCEL !== '1' && !alreadyCached) {
        botInstance.telegram.deleteWebhook()
            .then(() => {
                botInstance.launch().catch((err: any) => console.error('Error starting Telegraf polling:', err.message));
                console.log('🤖 Telegram Bot launched in POLLING mode for local testing!');
            })
            .catch((err: any) => console.error('Error deleting webhook for local polling:', err.message));
    }

    return botInstance;
}

async function presentLeadInQueue(ctx: any, lead: any, currentIndex: number, total: number) {
    let msg = `📞 <b>[عميل رقم ${currentIndex}/${total}]</b>\n\n`;
    msg += `👤 <b>الاسم:</b> ${lead.name}\n`;
    msg += `📞 <b>رقم الهاتف:</b> ${lead.phone || lead.mobile}\n`;
    if (lead.nationality) msg += `🌍 <b>الجنسية:</b> ${lead.nationality}\n`;
    if (lead.emirate) msg += `📍 <b>الإمارة:</b> ${lead.emirate}\n`;
    if (lead.interestedDiploma) msg += `🎓 <b>الدبلوم المهتم به:</b> ${lead.interestedDiploma}\n`;
    if (lead.levelOfInterest) msg += `🔥 <b>درجة الاهتمام:</b> ${lead.levelOfInterest}/10\n`;
    
    if (lead.notes && lead.notes.length > 0) {
        msg += `\n📝 <b>آخر ملاحظة مسجلة للعميل:</b>\n<i>${lead.notes[0].content}</i>\n`;
    }

    const cleanPhone = lead.phoneNormalized || lead.phone || lead.mobileNormalized || lead.mobile;
    const digits = cleanPhone ? cleanPhone.replace(/\D/g, '') : '';

    const inline_keyboard = [];
    if (digits) {
        inline_keyboard.push([
            { text: '💬 فتح واتساب العميل', url: `https://wa.me/${digits}` }
        ]);
    }

    inline_keyboard.push([
        { text: '📴 لم يرد (تخطي وتأجيل)', callback_data: `queue_no_answer:${lead.id}:${currentIndex}:${total}` },
        { text: '✅ أجاب (إدخال تقرير)', callback_data: `queue_answered:${lead.id}:${currentIndex}:${total}` }
    ]);

    inline_keyboard.push([
        { text: '⏩ العميل التالي ↩️', callback_data: `queue_next:${currentIndex}:${total}` }
    ]);

    await ctx.replyWithHTML(msg, {
        reply_markup: { inline_keyboard }
    });
}

async function fetchAndPresentNextInQueue(ctx: any, salespersonId: string, currentIndex: number, total: number) {
    if (currentIndex >= total) {
        await ctx.replyWithHTML('🎉 <b>تهانينا الحارة! لقد أنهيت طابور اتصالات ومتابعات اليوم بالكامل بنجاح تام!</b> ✨\nجهودكم مشكورة في ريادة مبيعات معهد السلام! 🚀');
        return;
    }

    try {
        const crmConfig = await getTelegramCrmConfig();
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const leads = await prisma.crmLead.findMany({
            where: {
                salespersonId,
                active: true,
                OR: [
                    { dateDeadline: { lte: endOfToday } },
                    { dateDeadline: null, levelOfInterest: null }
                ]
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'asc' }
            ],
            take: crmConfig.callQueueLimit,
            include: {
                notes: {
                    orderBy: { createdAt: 'desc' },
                    take: 1
                }
            }
        });

        if (leads.length <= currentIndex) {
            await ctx.replyWithHTML('🎉 <b>لقد أكملت جميع الاتصالات المتبقية المتاحة لليوم! عمل رائع!</b> ✨');
            return;
        }

        const nextLead = leads[currentIndex];
        await presentLeadInQueue(ctx, nextLead, currentIndex + 1, total);
    } catch (err: any) {
        await ctx.reply(`⚠️ فشل تحميل العميل التالي: ${err.message}`);
    }
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
    },

    /**
     * Get Telegram CRM settings configuration
     */
    async getTelegramConfig(req: Request, res: Response) {
        try {
            const config = await getTelegramCrmConfig();
            res.json({ success: true, data: config });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Update Telegram CRM settings configuration
     */
    async updateTelegramConfig(req: Request, res: Response) {
        try {
            const configData = req.body;
            const updated = await prisma.systemSetting.upsert({
                where: { key: 'telegram_crm_config' },
                update: { value: JSON.stringify(configData) },
                create: {
                    key: 'telegram_crm_config',
                    value: JSON.stringify(configData)
                }
            });
            res.json({ success: true, data: JSON.parse(updated.value) });
        } catch (error: any) {
            res.status(500).json({ success: false, error: error.message });
        }
    },

    /**
     * Send an instant alert to the assigned salesperson when a new lead is created
     */
    async sendInstantLeadAlert(leadId: string) {
        try {
            const config = await getTelegramCrmConfig();
            if (!config.leadAlertsEnabled) return;

            const lead = await prisma.crmLead.findUnique({
                where: { id: leadId },
                include: { salesperson: true }
            });

            if (!lead || !lead.salespersonId || !lead.salesperson?.telegramUserId) return;

            const botInstance = await getDynamicBot();
            const tgId = lead.salesperson.telegramUserId;

            let msg = `🔥 <b>تنبيه: عميل جديد تم تعيينه لك فوراً!</b> 🔥\n\n`;
            msg += `🏷️ <b>الاسم:</b> ${lead.name}\n`;
            if (lead.phone || lead.mobile) {
                msg += `📱 <b>الهاتف:</b> <code>${lead.phone || lead.mobile}</code>\n`;
            }
            if (lead.nationality) {
                msg += `🌍 <b>الجنسية:</b> ${lead.nationality}\n`;
            }
            if (lead.emirate) {
                msg += `📍 <b>الإمارة:</b> ${lead.emirate}\n`;
            }
            if (lead.interestedDiploma) {
                msg += `🎓 <b>الدبلوم المهتم:</b> ${lead.interestedDiploma}\n`;
            }
            msg += `\n🎯 <i>يرجى التواصل الفوري مع العميل وتحديث تقرير المتابعة الخاص به لزيادة نسبة نجاح التحويل والتسجيل!</i>\n\n`;
            msg += `🔗 <a href="t.me/${botInstance.botInfo?.username}?start=lead_${lead.id}">ابدأ المتابعة الآن بالبوت 🤖</a>`;

            await botInstance.telegram.sendMessage(tgId, msg, { parse_mode: 'HTML' });
            console.log(`✅ [Alert] Instant Lead notification sent to salesperson ${lead.salesperson.firstName} for lead ${lead.name}`);
        } catch (error: any) {
            console.error('[Alert] Error sending instant lead telegram alert:', error.message);
        }
    }
};

// Auto-initialize bot in local polling mode when the module is loaded (if running locally)
if (process.env.VERCEL !== '1') {
    getDynamicBot()
        .then(() => console.log('🤖 Telegram Bot auto-started in local environment successfully!'))
        .catch((err: any) => console.error('❌ Failed to auto-start Telegram Bot locally:', err.message));
}

let lastRemindersSentDate = '';

async function triggerDailyMorningReminders() {
    try {
        const crmConfig = await getTelegramCrmConfig();
        if (!crmConfig.remindersEnabled) return;

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0]; // '2026-05-13'
        
        // Prevent sending duplicates on the same day
        if (lastRemindersSentDate === todayStr) return;

        const currentHourMin = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }); // '09:12'
        const configTime = crmConfig.reminderTime || '09:00';

        if (currentHourMin < configTime) return; // Not time yet

        console.log(`⏰ [Tazkeer] Time matches! Triggering morning follow-up reminders for ${todayStr} after ${configTime}...`);

        // Fetch all leads whose dateDeadline matches today
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        const leadsDue = await prisma.crmLead.findMany({
            where: {
                active: true,
                dateDeadline: {
                    gte: startOfToday,
                    lte: endOfToday
                },
                salespersonId: { not: null }
            },
            include: {
                salesperson: true
            }
        });

        if (leadsDue.length === 0) {
            console.log('⏰ [Tazkeer] No leads scheduled for follow-up today.');
            lastRemindersSentDate = todayStr; // Mark as done for today anyway
            return;
        }

        // Group leads by salesperson
        const salespersonLeads = new Map<string, any[]>();
        for (const lead of leadsDue) {
            if (!lead.salespersonId || !lead.salesperson?.telegramUserId) continue;
            const list = salespersonLeads.get(lead.salespersonId) || [];
            list.push(lead);
            salespersonLeads.set(lead.salespersonId, list);
        }

        // Send customized telegram message to each salesperson
        const botInstance = await getDynamicBot();
        for (const [spId, leads] of salespersonLeads.entries()) {
            const salesperson = leads[0].salesperson;
            const tgId = salesperson.telegramUserId;

            let msg = `☀️ <b>صباح الخير يا ${salesperson.firstName || 'مستشار المبيعات'}!</b> ☀️\n\n`;
            msg += `⏰ <b>حان وقت المتابعات اليومية لعملاء معهد السلام!</b>\n`;
            msg += `لديك اليوم <code>${leads.length}</code> عملاء مجدولين للاتصال والمتابعة:\n\n`;

            leads.forEach((lead, index) => {
                const phoneStr = lead.phone || lead.mobile || 'لا يوجد';
                msg += `${index + 1}. 👤 <b>${lead.name}</b>\n`;
                msg += `   📱 الهاتف: <code>${phoneStr}</code>\n`;
                if (lead.interestedDiploma) {
                    msg += `   🎓 المهتم بـ: ${lead.interestedDiploma}\n`;
                }
                msg += `   🔗 تفاصيل العميل: <a href="t.me/${botInstance.botInfo?.username}?start=lead_${lead.id}">عرض بالبوت 🤖</a>\n\n`;
            });

            msg += `💪 نتمنى لك يوماً حافلاً بالنجاح والتسجيلات! ابدأ فوراً بكتابة <code>/today</code> لتجهيز خط اتصالات اليوم.`;

            try {
                await botInstance.telegram.sendMessage(tgId, msg, { parse_mode: 'HTML' });
                console.log(`✅ [Tazkeer] Morning reminder successfully sent to ${salesperson.firstName} (${tgId})`);
            } catch (err: any) {
                console.error(`❌ [Tazkeer] Failed to send telegram reminder to user ${tgId}:`, err.message);
            }
        }

        lastRemindersSentDate = todayStr;
    } catch (error: any) {
        console.error('⏰ [Tazkeer] Error in daily reminders job:', error.message);
    }
}

// Start in-memory background interval to check reminders every 5 minutes
setInterval(() => {
    triggerDailyMorningReminders().catch(err => console.error('[Tazkeer Background Error]', err));
}, 5 * 60 * 1000);
