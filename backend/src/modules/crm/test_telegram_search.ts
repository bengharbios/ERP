import prisma from '../../common/db/prisma';
import { normalizePhone } from './services/lead.service';

async function testSearch() {
    const searchPhone = '971566099980';
    const normalized = normalizePhone(searchPhone);

    console.log('Searching for:', searchPhone, 'Normalized:', normalized);

    try {
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
                    take: 5
                }
            }
        });

        console.log(`Results found: ${results.length}`);

        for (const lead of results) {
            console.log(`Lead ID: ${lead.id}, Name: ${lead.name}`);
            let emirate = lead.emirate;
            let nationality = lead.nationality;
            let interestedDiploma = lead.interestedDiploma;
            let levelOfInterest = lead.levelOfInterest;

            if (lead.notes && lead.notes.length > 0) {
                lead.notes.forEach((note: any) => {
                    const text = note.content;
                    if (!emirate && text) {
                        const m = text.match(/الإمارة:\s*([^\n\r\-]+)/);
                        if (m) emirate = m[1].trim();
                    }
                    if (!nationality && text) {
                        const m = text.match(/الجنسية:\s*([^\n\r\-]+)/);
                        if (m) nationality = m[1].trim();
                    }
                    if (!interestedDiploma && text) {
                        const m = text.match(/(الدبلوم المهتم به|الدبلوم):\s*([^\n\r\-]+)/);
                        if (m) interestedDiploma = m[2].trim();
                    }
                    if (!levelOfInterest && text) {
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

            console.log('Formatted message successfully compiled for Lead ID:', lead.id);
            console.log('Message:', itemMsg);
        }

        console.log('Success: No rendering exceptions thrown!');
    } catch (err: any) {
        console.error('CRASH DETECTED IN LOGIC:', err.stack || err.message);
    }
}

testSearch().then(() => prisma.$disconnect());
