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
            const credentialsPath = path.join(process.cwd(), 'google-credentials.json');
            
            if (!fs.existsSync(credentialsPath)) {
                throw new Error(
                    'بيانات تسجيل الدخول لجوجل شيتس غير متوفرة. يرجى إضافة المتغيرات GOOGLE_SERVICE_ACCOUNT_EMAIL و GOOGLE_PRIVATE_KEY في لوحة تحكم Vercel، أو توفير ملف google-credentials.json محلياً.'
                );
            }

            try {
                const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));
                clientEmail = credentials.client_email;
                privateKey = credentials.private_key;
            } catch (err: any) {
                throw new Error(`فشل قراءة ملف المفتاح السري المحلي: ${err.message}`);
            }
        }

        if (!clientEmail || !privateKey) {
            throw new Error('بيانات حساب الخدمة السحابي لجوجل ناقصة أو فارغة. يرجى التحقق من متغيرات البيئة.');
        }

        // Standardize newline characters in the private key (highly crucial for Vercel multiline keys)
        const formattedPrivateKey = privateKey.replace(/\\n/g, '\n');

        this.auth = new google.auth.JWT(
            clientEmail,
            undefined,
            formattedPrivateKey,
            [
                'https://www.googleapis.com/auth/spreadsheets',
                'https://www.googleapis.com/auth/drive.readonly'
            ]
        );

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
            
            if (['الاسم', 'اسم', 'اسمالعميل', 'name', 'fullname', 'clientname'].includes(h)) {
                mapping['name'] = index;
            } else if (['الهاتف', 'رقمالهاتف', 'الهاتفالموبايل', 'رقم', 'phone', 'phonenumber', 'telephone'].includes(h)) {
                mapping['phone'] = index;
            } else if (['الموبايل', 'رقمالموبايل', 'موبايل', 'mobile', 'mobilenumber'].includes(h)) {
                mapping['mobile'] = index;
            } else if (['البريد', 'البريدالإلكتروني', 'البريدالالكتروني', 'email', 'emailaddress'].includes(h)) {
                mapping['emailFrom'] = index;
            } else if (['الجنسية', 'جنسية', 'nationality', 'country'].includes(h)) {
                mapping['nationality'] = index;
            } else if (['الإمارة', 'الامارة', 'المدينة', 'العنوان', 'emirate', 'city', 'address'].includes(h)) {
                mapping['emirate'] = index;
            } else if (['الدبلوم', 'التخصص', 'الدورة', 'البرنامجالمهتمبه', 'diploma', 'program', 'course', 'interesteddiploma'].includes(h)) {
                mapping['interestedDiploma'] = index;
            } else if (['مستوىالاهتمام', 'الاهتمام', 'levelofinterest', 'interest', 'interestlevel'].includes(h)) {
                mapping['levelOfInterest'] = index;
            } else if (['ملاحظات', 'ملاحظة', 'التفاصيل', 'notes', 'note', 'comments', 'comment'].includes(h)) {
                mapping['notes'] = index;
            } else if (['المصدر', 'المنصة', 'source', 'platform', 'leadsource'].includes(h)) {
                mapping['source'] = index;
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

        // Fetch default stage for NEW leads
        const defaultStage = await prisma.crmStage.findFirst({
            where: { isActive: true },
            orderBy: { sequence: 'asc' }
        });
        const defaultStageId = defaultStage?.id || null;

        const summary = {
            totalProcessed: 0,
            createdCount: 0,
            duplicateCount: 0,
            errors: [] as string[]
        };

        // 2. Loop and process rows
        for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            summary.totalProcessed++;

            const nameValue = row[mapping['name']]?.toString().trim();
            const phoneValue = row[mapping['phone']]?.toString().trim();

            if (!nameValue || !phoneValue) {
                summary.errors.push(`السطر رقم ${i + 1}: تم تخطيه لعدم وجود اسم أو رقم هاتف.`);
                continue;
            }

            const mobileValue = mapping['mobile'] !== undefined ? row[mapping['mobile']]?.toString().trim() : undefined;
            const emailValue = mapping['emailFrom'] !== undefined ? row[mapping['emailFrom']]?.toString().trim() : undefined;
            const nationalityValue = mapping['nationality'] !== undefined ? row[mapping['nationality']]?.toString().trim() : undefined;
            const emirateValue = mapping['emirate'] !== undefined ? row[mapping['emirate']]?.toString().trim() : undefined;
            const diplomaValue = mapping['interestedDiploma'] !== undefined ? row[mapping['interestedDiploma']]?.toString().trim() : undefined;
            const rawInterest = mapping['levelOfInterest'] !== undefined ? row[mapping['levelOfInterest']]?.toString().trim() : undefined;
            const noteValue = mapping['notes'] !== undefined ? row[mapping['notes']]?.toString().trim() : undefined;
            const sourceValue = mapping['source'] !== undefined ? row[mapping['source']]?.toString().trim() : 'Google Sheet';

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
                // Check if lead already exists in ERP
                const existingLeads = await prisma.crmLead.findMany({
                    where: {
                        OR: [
                            { phoneNormalized },
                            { mobileNormalized: phoneNormalized },
                            ...(mobileNormalized ? [{ phoneNormalized: mobileNormalized }, { mobileNormalized }] : [])
                        ]
                    },
                    include: { notes: true }
                });

                if (existingLeads.length > 0) {
                    // العميل موجود مسبقاً ➡️ تكرار دمج ذكي!
                    const existing = existingLeads[0];
                    summary.duplicateCount++;

                    // Update duplicate stats on existing record
                    await prisma.crmLead.update({
                        where: { id: existing.id },
                        data: {
                            isDuplicate: true,
                            duplicateCount: existing.duplicateCount + 1,
                            // Backfill empty details if available in the sheet
                            nationality: existing.nationality || nationalityValue || null,
                            emirate: existing.emirate || emirateValue || null,
                            interestedDiploma: existing.interestedDiploma || diplomaValue || null,
                            levelOfInterest: existing.levelOfInterest || levelValue || null,
                        }
                    });

                    // Append the spreadsheet row comment as a new timeline note
                    const formattedNote = noteValue 
                        ? `🔄 تكرار تواصل من Google Sheet (السطر رقم ${i + 1}):\n${noteValue}` 
                        : `🔄 تكرار تواصل من Google Sheet (السطر رقم ${i + 1} - بدون ملاحظات إضافية).`;

                    await prisma.crmNote.create({
                        data: {
                            leadId: existing.id,
                            userId,
                            content: formattedNote,
                            type: 'note'
                        }
                    });

                } else {
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
                        }
                    });

                    // Create the initial note if we have comments in the spreadsheet
                    const noteParts: string[] = [];
                    noteParts.push(`📥 تم الاستيراد بنجاح من Google Sheet (السطر رقم ${i + 1})`);
                    if (sourceValue) noteParts.push(`📌 مصدر القناة: ${sourceValue}`);
                    if (noteValue) noteParts.push(`📝 ملاحظة الشيت: ${noteValue}`);

                    await prisma.crmNote.create({
                        data: {
                            leadId: newLead.id,
                            userId,
                            content: noteParts.join('\n'),
                            type: 'note'
                        }
                    });
                }
            } catch (err: any) {
                console.error(`Error processing Google Sheet row ${i + 1}:`, err);
                summary.errors.push(`السطر رقم ${i + 1} (${nameValue}): فشل الحفظ بسبب خطأ قاعدة البيانات.`);
            }
        }

        return {
            success: true,
            message: `اكتملت المزامنة بنجاح! تم معالجة ${summary.totalProcessed} سطر.`,
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
