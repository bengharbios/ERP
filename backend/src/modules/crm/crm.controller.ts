import { Request, Response } from 'express';
import { crmService } from './crm.service';
import prisma from '../../common/db/prisma';
import { normalizePhone } from './services/lead.service';
import { GoogleSheetsService } from './services/google-sheets.service';
import { Telegraf, Markup } from 'telegraf';
import { comparePassword } from '../../common/utils/password';

// Cache bots by token to avoid re-initializing on every request
const botsCache: Record<string, any> = {};
const userStates: Record<string, { action: string; leadId: string }> = {};

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
                        if (data.startsWith('change_interest:') || data.startsWith('set_interest:') || data.startsWith('change_stage:') || data.startsWith('set_stage:')) {
                            await ctx.answerCbQuery();
                            await ctx.replyWithHTML(
                                `⚠️ <b>عذراً، هذا العميل مخصص للموظف المسؤول (${lead.salesperson?.firstName || ''} ${lead.salesperson?.lastName || 'أحد الزملاء'}).</b>\n` +
                                `لا تملك صلاحية تغيير مرحلته أو درجة اهتمامه.`
                            );
                            return;
                        }
                    } else if (!lead.salespersonId && (data.startsWith('set_interest:') || data.startsWith('set_stage:') || data.startsWith('add_note:'))) {
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
                userStates[userId] = { action: 'expecting_note', leadId };
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
                const updatedLead = await prisma.crmLead.update({
                    where: { id: leadId },
                    data: { stageId }
                });

                // Push update to Google Sheet asynchronously if available
                try {
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

        // Allow /start, /menu, /login, /auth commands to run without authentication
        const isAuthCommand = text.startsWith('/start') || text.startsWith('/login') || text.startsWith('/auth') || text === 'قائمة' || text === '/menu';

        if (!isAuthCommand) {
            const currentUser = await getAuthenticatedUser(userId);
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

                const currentUser = await getAuthenticatedUser(userId);
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
                inline_keyboard.push([
                    { text: '➕ إضافة ملاحظة', callback_data: `add_note:${lead.id}` },
                    { text: '🏷️ درجة الاهتمام', callback_data: `change_interest:${lead.id}` }
                ]);
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
                        notes: {
                            orderBy: { createdAt: 'desc' },
                            take: 5 // Expanded to show 5 recent notes (فتح ملاحظات الاستفسار)
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

                        // Add interactive action buttons (raw JSON format to ensure 100% platform compatibility)
                        const inline_keyboard = [];
                        const cleanPhone = lead.phoneNormalized || lead.phone || lead.mobileNormalized || lead.mobile;
                        if (cleanPhone) {
                            const digits = cleanPhone.replace(/\D/g, '');
                            inline_keyboard.push([
                                { text: '💬 فتح واتساب', url: `https://wa.me/${digits}` }
                            ]);
                        }
                        inline_keyboard.push([
                            { text: '➕ إضافة ملاحظة', callback_data: `add_note:${lead.id}` },
                            { text: '🏷️ درجة الاهتمام', callback_data: `change_interest:${lead.id}` }
                        ]);
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

// Auto-initialize bot in local polling mode when the module is loaded (if running locally)
if (process.env.VERCEL !== '1') {
    getDynamicBot()
        .then(() => console.log('🤖 Telegram Bot auto-started in local environment successfully!'))
        .catch((err: any) => console.error('❌ Failed to auto-start Telegram Bot locally:', err.message));
}
