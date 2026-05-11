import { google } from 'googleapis';
import * as path from 'path';
import * as fs from 'fs';
import prisma from '../../../common/db/prisma';
import { normalizePhone } from './lead.service';

/**
 * Service to handle unidirectional pulling from Google Sheets and live appending.
 */
export class GoogleSheetsService {
    private static auth: any = null;

    private static getAuth(): any {
        if (this.auth) return this.auth;

        let clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        let privateKey = process.env.GOOGLE_PRIVATE_KEY;

        // Fallback to local JSON file if environment variables are not set (local development)
        if (!clientEmail || !privateKey) {
            let credentialsPath = path.join(__dirname, '../../../../google-credentials.json');
            
            if (!fs.existsSync(credentialsPath)) {
                credentialsPath = path.join(process.cwd(), 'google-credentials.json');
            }
            if (!fs.existsSync(credentialsPath)) {
                credentialsPath = path.join(process.cwd(), 'backend', 'google-credentials.json');
            }

            if (fs.existsSync(credentialsPath)) {
                try {
                    const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
                    clientEmail = credentials.client_email;
                    privateKey = credentials.private_key;
                } catch (err: any) {
                    throw new Error(`فشل قراءة ملف المفتاح السري المحلي: ${err.message}`);
                }
            } else {
                throw new Error(
                    'بيانات تسجيل الدخول لجوجل شيتس غير متوفرة. يرجى إضافة المتغيرات GOOGLE_SERVICE_ACCOUNT_EMAIL و GOOGLE_PRIVATE_KEY في لوحة تحكم Vercel، أو توفير ملف google-credentials.json محلياً.'
                );
            }
        }

        if (!clientEmail || !privateKey) {
            throw new Error('بيانات حساب الخدمة السحابي لجوجل ناقصة أو فارغة. يرجى التحقق من متغيرات البيئة.');
        }

        // Reconstruct the PEM private key cleanly in case Vercel stripped newlines or added spaces
        let cleanKey = privateKey.trim();
        
        // Remove surrounding quotes if they exist
        if (cleanKey.startsWith('"') && cleanKey.endsWith('"')) {
            cleanKey = cleanKey.substring(1, cleanKey.length - 1);
        }

        const header = '-----BEGIN PRIVATE KEY-----';
        const footer = '-----END PRIVATE KEY-----';
        
        let base64Body = cleanKey;
        if (base64Body.includes(header)) {
            base64Body = base64Body.replace(header, '');
        }
        if (base64Body.includes(footer)) {
            base64Body = base64Body.replace(footer, '');
        }

        // Remove all whitespaces, newlines, escaped \n, \r and backslashes
        base64Body = base64Body
            .replace(/\\n/g, '')
            .replace(/\\r/g, '')
            .replace(/\s+/g, '');

        // Reconstruct PEM by splitting base64 body into 64-character lines
        const lines: string[] = [];
        for (let i = 0; i < base64Body.length; i += 64) {
            lines.push(base64Body.slice(i, i + 64));
        }

        const formattedPrivateKey = `${header}\n${lines.join('\n')}\n${footer}\n`;

        this.auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: clientEmail,
                private_key: formattedPrivateKey
            },
            scopes: [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.readonly'
            ]
        });

        return this.auth;
    }

    /**
     * Extracts Spreadsheet ID from various Google Sheets URL formats or a raw ID.
     */
    private static extractSheetId(urlOrId: string): string {
        const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
        return match ? match[1] : urlOrId;
    }

    /**
     * Map Arabic/English column headers to CRM Lead fields.
     */
    private static mapHeadersToFields(headers: string[]): Record<string, number> {
        const mapping: Record<string, number> = {};
        
        const clean = (s: string) => s.trim().toLowerCase().replace(/[^a-zA-Z0-9\u0621-\u064A]/g, '');

        headers.forEach((header, index) => {
            const h = clean(header);
            
            if (['الاسم', 'اسم', 'اسمالعميل', 'name', 'fullname', 'clientname', 'اسمالعميلcustomername'].includes(h)) {
                mapping['name'] = index;
            } else if (['الهاتف', 'رقمالهاتف', 'الهاتفالموبايل', 'رقم', 'phone', 'phonenumber', 'telephone', 'column4'].includes(h)) {
                mapping['phone'] = index;
            } else if (['الموبايل', 'رقمالموبايل', 'موبايل', 'mobile', 'mobilenumber'].includes(h)) {
                mapping['mobile'] = index;
            } else if (['البريد', 'البريدالإلكتروني', 'البريدالالكتروني', 'email', 'emailaddress', 'إيميلالعميلcustomeremail', 'customeremail'].includes(h)) {
                mapping['emailFrom'] = index;
            } else if (['الجنسية', 'جنسية', 'nationality', 'country', 'الجنسية-'].includes(h)) {
                mapping['nationality'] = index;
            } else if (['الإمارة', 'الامارة', 'المدينة', 'العنوان', 'emirate', 'city', 'address'].includes(h)) {
                mapping['emirate'] = index;
            } else if (['الدبلوم', 'التخصص', 'الدورة', 'البرنامجالمهتمبه', 'diploma', 'program', 'course', 'interesteddiploma', 'درجةالإهتمامlevelofinterest'].includes(h)) {
                mapping['interestedDiploma'] = index;
            } else if (['مستوىالاهتمام', 'الاهتمام', 'levelofinterest', 'interest', 'interestlevel', 'درجةالاهتمامlevelofinterest'].includes(h)) {
                mapping['levelOfInterest'] = index;
            } else if (['ملاحظات', 'ملاحظة', 'التفاصيل', 'notes', 'note', 'comments', 'comment', 'ملاحظاتnotes'].includes(h)) {
                mapping['notes'] = index;
            } else if (['المصدر', 'المنصة', 'source', 'platform', 'leadsource', 'المنصةplatform', 'platform'].includes(h)) {
                mapping['source'] = index;
            } else if (['تاريخالتسجيل', 'تاريخالإنشاء', 'تاريخالاضافه', 'تاريخ', 'التاريخ', 'date', 'createdat', 'timestamp', 'registrationdate', 'تاريخالتسليم', 'تاريخالاستلام', 'deliverydate', 'delivery_date'].includes(h)) {
                mapping['createdAt'] = index;
            }
        });

        return mapping;
    }

    /**
     * Sync data from Google Sheet into ERP (Unidirectional Pull with Smart Deduplication).
     */
    public static async pullFromSheet(options: {
        spreadsheetUrlOrId: string;
        range?: string;
        userId: string;
    }) {
        const { spreadsheetUrlOrId, range = 'Sheet1!A:Z', userId } = options;
        const spreadsheetId = this.extractSheetId(spreadsheetUrlOrId);

        const auth = this.getAuth();
        const sheets = google.sheets({ version: 'v4', auth });

        // 1. Fetch values from Google Sheet
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range
        });

        const rows = response.data.values;
        if (!rows || rows.length < 2) {
            return {
                success: true,
                message: 'لم يتم العثور على أي سطور بيانات في الجدول المحدد (أو الجدول يحتوي على سطر العناوين فقط).',
                summary: { totalProcessed: 0, createdCount: 0, duplicateCount: 0, errors: [] }
            };
        }

        const headers = rows[0];
        const mapping = this.mapHeadersToFields(headers);

        // Verify we mapped the bare essentials
        if (mapping['name'] === undefined || mapping['phone'] === undefined) {
            throw new Error('فشل مطابقة عناوين الأعمدة تلقائياً. يرجى التأكد من وجود عمود باسم "الاسم" وعمود باسم "الهاتف" أو "رقم الهاتف" في السطر الأول.');
        }

        // Ordered note keys to construct monthly and status notes in a clean chronological sequence
        const orderedNoteKeys = [
            { label: 'الملاحظات', keywords: ['ملاحظات', 'note', 'comment'] },
            { label: 'درجة الاهتمام', keywords: ['درجة', 'level'] },
            { label: 'حالة التواصل / اهتمام العميل', keywords: ['مهتم', 'interested', 'يتسفر', 'حالة', 'status', 'رد', 'answer', 'اتصال', 'call', 'تواصل'] }
        ];

        const orderedMapping: { label: string; index: number }[] = [];
        orderedNoteKeys.forEach(keyObj => {
            headers.forEach((h, idx) => {
                if (
                    idx === mapping['name'] || 
                    idx === mapping['phone'] || 
                    idx === mapping['mobile'] || 
                    idx === mapping['emailFrom'] || 
                    idx === mapping['nationality'] || 
                    idx === mapping['emirate']
                ) {
                    return;
                }
                const cleanH = h.trim().toLowerCase().replace(/[^a-zA-Z0-9\u0621-\u064A]/g, '');
                if (keyObj.keywords.some(kw => cleanH.includes(kw))) {
                    // Prevent duplicate entries for the exact same column index
                    if (!orderedMapping.some(m => m.index === idx)) {
                        orderedMapping.push({ label: keyObj.label, index: idx });
                    }
                }
            });
        });

        // Fetch default stage for NEW leads
        const defaultStage = await prisma.crmStage.findFirst({
            where: { isActive: true },
            orderBy: { sequence: 'asc' }
        });
        const defaultStageId = defaultStage?.id || null;

        // Load all existing CRM leads into memory for ultra-fast lookup (bypassing slow per-row DB queries)
        const allLeads = await prisma.crmLead.findMany({
            select: {
                id: true,
                phoneNormalized: true,
                mobileNormalized: true,
                duplicateCount: true,
                nationality: true,
                emirate: true,
                interestedDiploma: true,
                levelOfInterest: true,
                createdAt: true,
                notes: {
                    select: {
                        content: true
                    }
                }
            }
        });

        // Map phone numbers to leads in memory for O(1) checks
        const phoneMap = new Map<string, typeof allLeads[0]>();
        allLeads.forEach(lead => {
            if (lead.phoneNormalized) phoneMap.set(lead.phoneNormalized, lead);
            if (lead.mobileNormalized) phoneMap.set(lead.mobileNormalized, lead);
        });

        const MAX_WRITES = 800;
        let writesCount = 0;
        let reachedBatchLimit = false;

        const summary = {
            totalProcessed: 0,
            createdCount: 0,
            duplicateCount: 0,
            errors: [] as string[]
        };

        let lastValidDate: Date | null = null;

        // 2. Loop and process rows
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            summary.totalProcessed++;

            let nameValue = row[mapping['name']]?.toString().trim();
            const phoneValue = row[mapping['phone']]?.toString().trim();

            if (!phoneValue) {
                summary.errors.push(`السطر رقم ${i + 1}: تم تخطيه لعدم وجود رقم هاتف.`);
                continue;
            }

            if (!nameValue) {
                nameValue = 'عميل';
            }

            const mobileValue = mapping['mobile'] !== undefined ? row[mapping['mobile']]?.toString().trim() : undefined;
            const emailValue = mapping['emailFrom'] !== undefined ? row[mapping['emailFrom']]?.toString().trim() : undefined;
            const nationalityValue = mapping['nationality'] !== undefined ? row[mapping['nationality']]?.toString().trim() : undefined;
            const emirateValue = mapping['emirate'] !== undefined ? row[mapping['emirate']]?.toString().trim() : undefined;
            const diplomaValue = mapping['interestedDiploma'] !== undefined ? row[mapping['interestedDiploma']]?.toString().trim() : undefined;
            const rawInterest = mapping['levelOfInterest'] !== undefined ? row[mapping['levelOfInterest']]?.toString().trim() : undefined;
            const sourceValue = mapping['source'] !== undefined ? row[mapping['source']]?.toString().trim() : 'Google Sheet';
            const dateValue = mapping['createdAt'] !== undefined ? row[mapping['createdAt']]?.toString().trim() : undefined;

            // Parse registration date safely
            let parsedDate: Date | null = null;
            if (dateValue) {
                const cleanDateStr = dateValue.replace(/\n/g, ' ').trim();
                const ts = Date.parse(cleanDateStr);
                if (!isNaN(ts)) {
                    parsedDate = new Date(ts);
                } else {
                    // Handle DD/MM/YYYY or DD.MM.YYYY
                    const parts = cleanDateStr.split(/[\/\-\.\s]+/);
                    if (parts.length >= 3) {
                        const day = parseInt(parts[0]);
                        const month = parseInt(parts[1]) - 1; // 0-indexed
                        let year = parseInt(parts[2]);
                        if (year < 100) year += 2000;

                        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
                            const d1 = new Date(year, month, day);
                            if (!isNaN(d1.getTime())) {
                                parsedDate = d1;
                            }
                        }
                    }
                }
            }

            // Fallback to previous row's date if blank (user's data-entry pattern)
            if (parsedDate) {
                lastValidDate = parsedDate;
            } else if (lastValidDate) {
                parsedDate = lastValidDate;
            }

            // Parse level of interest to number safely
            let levelValue: number | null = null;
            if (rawInterest) {
                const numeric = parseInt(rawInterest.replace(/\D/g, ''));
                if (!isNaN(numeric)) {
                    levelValue = numeric;
                } else {
                    // Try mapping text
                    const txt = rawInterest.toLowerCase();
                    if (txt.includes('عالي') || txt.includes('high') || txt.includes('مرتفع')) levelValue = 5;
                    else if (txt.includes('متوسط') || txt.includes('medium')) levelValue = 3;
                    else levelValue = 1;
                }
            }

            // Clean & Normalize phone numbers
            const phoneNormalized = normalizePhone(phoneValue);
            const mobileNormalized = normalizePhone(mobileValue);

            if (!phoneNormalized) {
                summary.errors.push(`السطر رقم ${i + 1} (${nameValue}): رقم الهاتف غير صالح للمزامنة.`);
                continue;
            }

            try {
                // Gather actual monthly and general notes in a clean sequential order
                const extraNotes: string[] = [];
                orderedMapping.forEach(mapObj => {
                    const val = row[mapObj.index]?.toString().trim();
                    if (val && val !== '-' && val !== '') {
                        const originalHeader = headers[mapObj.index].replace(/\n/g, ' ').trim();
                        extraNotes.push(`📌 **${originalHeader}**:\n${val}`);
                    }
                });

                // Check in-memory Map if lead exists (hyper-fast lookup!)
                let existing: typeof allLeads[0] | undefined = undefined;
                if (phoneNormalized) existing = phoneMap.get(phoneNormalized);
                if (!existing && mobileNormalized) existing = phoneMap.get(mobileNormalized);

                if (existing) {
                    // Append the spreadsheet row comment as a new timeline note
                    let formattedNote = `🔄 تكرار تواصل من Google Sheet (السطر رقم ${i + 1})`;
                    if (extraNotes.length > 0) {
                        formattedNote += `:\n\n${extraNotes.join('\n')}`;
                    } else {
                        formattedNote += ` (بدون ملاحظات إضافية في الشيت).`;
                    }

                    // Check if this specific row and its note content are already fully synced
                    const isAlreadySynced = existing.notes.some(n => {
                        const hasRowMarker = n.content.includes(`السطر رقم ${i + 1}`) || n.content.includes(`(السطر رقم ${i + 1})`);
                        if (!hasRowMarker) return false;
                        
                        // If we have extra notes in the sheet, check if they are already present in this note
                        if (extraNotes.length > 0) {
                            const extraNotesStr = extraNotes.join('\n');
                            return n.content.includes(extraNotesStr);
                        }
                        
                        return true; // No extra notes in sheet, and row marker matches, so it is fully synced
                    });

                    // Check if the registration date needs correction
                    let needsDateCorrection = false;
                    if (parsedDate && existing.createdAt) {
                        const parsedTime = parsedDate.getTime();
                        const existingTime = existing.createdAt.getTime();
                        // If difference is more than 12 hours, we trigger update correction
                        if (Math.abs(parsedTime - existingTime) > 12 * 60 * 60 * 1000) {
                            needsDateCorrection = true;
                        }
                    }

                    if (isAlreadySynced && !needsDateCorrection) {
                        // Already synced with identical notes and date matches! Skip database write!
                        continue;
                    }

                    // Enforce write batch limit to respect Vercel's 10-second timeout limits
                    if (writesCount >= MAX_WRITES) {
                        reachedBatchLimit = true;
                        break;
                    }
                    writesCount++;

                    summary.duplicateCount++;

                    // Update duplicate stats and date on existing record
                    await prisma.crmLead.update({
                        where: { id: existing.id },
                        data: {
                            isDuplicate: true,
                            duplicateCount: existing.duplicateCount + (isAlreadySynced ? 0 : 1),
                            // Backfill empty details if available in the sheet
                            nationality: existing.nationality || nationalityValue || null,
                            emirate: existing.emirate || emirateValue || null,
                            interestedDiploma: existing.interestedDiploma || diplomaValue || null,
                            levelOfInterest: existing.levelOfInterest || levelValue || null,
                            // Correct the registration date if it was set incorrectly or is earlier
                            createdAt: parsedDate || undefined,
                        }
                    });

                    // Update in-memory record so we don't write it again in this run
                    existing.duplicateCount += (isAlreadySynced ? 0 : 1);
                    if (parsedDate) existing.createdAt = parsedDate;
                    if (!existing.nationality) existing.nationality = nationalityValue || null;
                    if (!existing.emirate) existing.emirate = emirateValue || null;
                    if (!existing.interestedDiploma) existing.interestedDiploma = diplomaValue || null;
                    if (!existing.levelOfInterest) existing.levelOfInterest = levelValue || null;

                    if (!isAlreadySynced) {
                        await prisma.crmNote.create({
                            data: {
                                leadId: existing.id,
                                userId,
                                content: formattedNote,
                                type: 'note'
                            }
                        });

                        // Keep track of this note in memory
                        existing.notes.push({ content: formattedNote });
                    }

                } else {
                    // Enforce write batch limit to respect Vercel's 10-second timeout limits
                    if (writesCount >= MAX_WRITES) {
                        reachedBatchLimit = true;
                        break;
                    }
                    writesCount++;

                    // العميل غير موجود ➡️ تسجيل عميل جديد بالكامل!
                    summary.createdCount++;

                    const newLead = await prisma.crmLead.create({
                        data: {
                            name: nameValue,
                            type: 'lead',
                            phone: phoneValue,
                            mobile: mobileValue || null,
                            phoneNormalized,
                            mobileNormalized: mobileNormalized || null,
                            emailFrom: emailValue || null,
                            nationality: nationalityValue || null,
                            emirate: emirateValue || null,
                            interestedDiploma: diplomaValue || null,
                            levelOfInterest: levelValue,
                            platform: sourceValue,
                            stageId: defaultStageId,
                            isDuplicate: false,
                            duplicateCount: 0,
                            salespersonId: userId,
                            createdAt: parsedDate || undefined,
                        }
                    });

                    // Create the initial note with consolidated unhidden note columns
                    const noteParts: string[] = [];
                    noteParts.push(`📥 تم الاستيراد بنجاح من Google Sheet (السطر رقم ${i + 1})`);
                    if (sourceValue) noteParts.push(`📌 مصدر القناة: ${sourceValue}`);
                    
                    if (extraNotes.length > 0) {
                        noteParts.push(`\n📝 **بيانات وملاحظات الشيت المستوردة:**\n${extraNotes.join('\n')}`);
                    }

                    const initialNoteContent = noteParts.join('\n');
                    await prisma.crmNote.create({
                        data: {
                            leadId: newLead.id,
                            userId,
                            content: initialNoteContent,
                            type: 'note'
                        }
                    });

                    // Add new lead with its notes to the in-memory Map for O(1) detection of subsequent rows in the same sheet
                    const inMemoryNewLead = {
                        id: newLead.id,
                        phoneNormalized,
                        mobileNormalized: mobileNormalized || null,
                        duplicateCount: 0,
                        nationality: nationalityValue || null,
                        emirate: emirateValue || null,
                        interestedDiploma: diplomaValue || null,
                        levelOfInterest: levelValue,
                        notes: [{ content: initialNoteContent }]
                    };

                    if (phoneNormalized) phoneMap.set(phoneNormalized, inMemoryNewLead);
                    if (mobileNormalized) phoneMap.set(mobileNormalized, inMemoryNewLead);
                }
            } catch (err: any) {
                console.error(`Error processing Google Sheet row ${i + 1}:`, err);
                summary.errors.push(`السطر رقم ${i + 1} (${nameValue}): فشل الحفظ بسبب خطأ قاعدة البيانات.`);
            }
        }

        let customMessage = `اكتملت المزامنة بنجاح! تم معالجة ${summary.totalProcessed} سطر.`;
        if (reachedBatchLimit) {
            customMessage = `📥 تم استيراد دفعة من ${writesCount} عميل بنجاح لتجنب ضغط السيرفر! يرجى الضغط على زر المزامنة مجدداً لاستكمال سحب بقية العملاء تلقائياً.`;
        }

        return {
            success: true,
            message: customMessage,
            reachedBatchLimit,
            summary
        };
    }

    /**
     * Appends a newly registered lead to the Google Sheet (Live Export).
     */
    public static async appendLeadToSheet(options: {
        spreadsheetUrlOrId: string;
        range?: string;
        lead: any;
        noteContent?: string;
    }) {
        try {
            const { spreadsheetUrlOrId, range = 'Sheet1!A:Z', lead, noteContent } = options;
            const spreadsheetId = this.extractSheetId(spreadsheetUrlOrId);

            const auth = this.getAuth();
            const sheets = google.sheets({ version: 'v4', auth });

            // Fetch the column headers to map our lead values dynamically
            const metaResponse = await sheets.spreadsheets.values.get({
                spreadsheetId,
                range: `${range.split('!')[0]}!1:1` // Read only first row
            });

            const headers = metaResponse.data.values?.[0];
            if (!headers || headers.length === 0) {
                // If sheet is empty, write a default header row first
                const defaultHeaders = ['الاسم', 'الهاتف', 'الموبايل', 'البريد الإلكتروني', 'الجنسية', 'الإمارة', 'الدبلوم المهتم به', 'مستوى الاهتمام', 'الملاحظات', 'المصدر', 'تاريخ التسجيل'];
                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: `${range.split('!')[0]}!A1`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [defaultHeaders] }
                });
                
                // Retry sending the row with default mapping
                const formattedRow = [
                    lead.name || lead.contactName || '',
                    lead.phone || '',
                    lead.mobile || '',
                    lead.emailFrom || '',
                    lead.nationality || '',
                    lead.emirate || '',
                    lead.interestedDiploma || '',
                    lead.levelOfInterest || '',
                    noteContent || '',
                    lead.platform || 'Telegram Bot',
                    new Date().toLocaleString('ar-AE')
                ];

                await sheets.spreadsheets.values.append({
                    spreadsheetId,
                    range: `${range.split('!')[0]}!A:K`,
                    valueInputOption: 'USER_ENTERED',
                    requestBody: { values: [formattedRow] }
                });

                return { success: true, message: 'تمت الكتابة وتأسيس عناوين الأعمدة بنجاح.' };
            }

            const mapping = this.mapHeadersToFields(headers);
            
            // Build the dynamic values row matching the sheet's existing columns
            const newRowValues = new Array(headers.length).fill('');

            const mapIfExist = (field: string, val: any) => {
                if (mapping[field] !== undefined && mapping[field] < newRowValues.length) {
                    newRowValues[mapping[field]] = val || '';
                }
            };

            mapIfExist('name', lead.name || lead.contactName);
            mapIfExist('phone', lead.phone);
            mapIfExist('mobile', lead.mobile);
            mapIfExist('emailFrom', lead.emailFrom);
            mapIfExist('nationality', lead.nationality);
            mapIfExist('emirate', lead.emirate);
            mapIfExist('interestedDiploma', lead.interestedDiploma);
            mapIfExist('levelOfInterest', lead.levelOfInterest);
            mapIfExist('notes', noteContent || '');
            mapIfExist('source', lead.platform || 'Telegram Bot');

            // Append any unmatched remaining details as fallback at the end of the sheet row if headers exist for them
            // or write the values row
            await sheets.spreadsheets.values.append({
                spreadsheetId,
                range,
                valueInputOption: 'USER_ENTERED',
                requestBody: {
                    values: [newRowValues]
                }
            });

            return { success: true };
        } catch (error: any) {
            console.error('[GoogleSheetsService] appendLeadToSheet error:', error.message);
            // Non-blocking error. We do not want to fail the main TelegramBot or manual lead creation if Google fails.
            return { success: false, error: error.message };
        }
    }
}
