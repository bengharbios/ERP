import prisma from '../../common/db/prisma';

export const crmService = {
    /**
     * Parses a structured telegram message into a Lead object
     */
    parseTelegramMessage(text: string) {
        const patterns = {
            name: /الاسم:\s*(.+)/,
            phone: /رقم الهاتف:\s*([\d\s+-]+)/,
            nationality: /الجنسية:\s*(.+)/,
            emirate: /الإمارة:\s*(.+)/,
            diploma: /الدبلوم المهتم به:\s*(.+)/,
            interestLevel: /درجة الاهتمام:\s*(\d+)/,
            notes: /📝 الملاحظات:\s*([\s\S]+?)(?=-{3,}|👤|📅|$)/,
            reschedule: /📅 إعادة جدولة:\s*(.+)/,
            employee: /👤 الموظف المسؤول:\s*(?:الاسم:\s*)?(.+)/
        };

        const data: any = {};
        for (const [key, pattern] of Object.entries(patterns)) {
            const match = text.match(pattern);
            if (match) {
                data[key] = match[1].trim();
            }
        }

        return data;
    },

    /**
     * Fuzzy lookup to match salesperson names in the database
     */
    async findUserByName(name: string) {
        if (!name) return null;
        const normalized = name.trim().toLowerCase();

        // 1. Direct username check
        let user = await prisma.user.findFirst({
            where: { username: { equals: normalized } }
        });
        if (user) return user;

        // 2. Fetch all users to do partial/fuzzy matching
        const users = await prisma.user.findMany({
            select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true
            }
        });

        // Try partial matching on full name or username
        for (const u of users) {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
            if (fullName && fullName.includes(normalized)) {
                return u;
            }
            if (u.username.toLowerCase().includes(normalized)) {
                return u;
            }
        }

        // 3. Try parts match
        for (const u of users) {
            const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
            if (fullName) {
                const uParts = fullName.split(/\s+/);
                const inputParts = normalized.split(/\s+/);
                const allMatch = inputParts.every(part => uParts.some(up => up.includes(part) || part.includes(up)));
                if (allMatch) return u;
            }
        }

        return null;
    },

    /**
     * Updates or creates a lead based on parsed data from Telegram
     */
    async updateLeadFromMessage(parsedData: any) {
        if (!parsedData.phone) {
            throw new Error('Phone number is missing in the message');
        }

        // Normalize phone: remove spaces and extra chars
        const normalizedPhone = parsedData.phone.replace(/\s+/g, '');

        // 1. Try to find matched salesperson/employee
        let salespersonId = null;
        if (parsedData.employee) {
            const matchedEmployee = await this.findUserByName(parsedData.employee);
            if (matchedEmployee) {
                salespersonId = matchedEmployee.id;
            }
        }

        // 2. Search for existing lead in the database
        let lead = await prisma.crmLead.findFirst({
            where: {
                OR: [
                    { mobile: normalizedPhone },
                    { phone: normalizedPhone }
                ]
            }
        });

        let isDuplicate = false;
        let duplicateCount = 0;
        let firstMessageDate = new Date().toISOString();

        // Retrieve the first active CRM stage to use as the default "NEW" column
        const firstStage = await prisma.crmStage.findFirst({
            where: { isActive: true },
            orderBy: { sequence: 'asc' }
        });
        const defaultStageId = firstStage?.id || null;

        if (!lead) {
            // Promote immediately to opportunity if salesperson is assigned, otherwise keep as raw lead
            const type = salespersonId ? 'opportunity' : 'lead';

            lead = await prisma.crmLead.create({
                data: {
                    name: parsedData.name || 'Unknown',
                    mobile: normalizedPhone,
                    phone: normalizedPhone,
                    nationality: parsedData.nationality,
                    emirate: parsedData.emirate,
                    interestedDiploma: parsedData.diploma,
                    levelOfInterest: parsedData.interestLevel ? parseInt(parsedData.interestLevel) : 0,
                    platform: 'Telegram Bot',
                    salespersonId,
                    type,
                    stageId: type === 'opportunity' ? defaultStageId : null,
                    firstMessageDate,
                    isDuplicate: false,
                    duplicateCount: 0
                }
            });
        } else {
            isDuplicate = true;
            duplicateCount = (lead.duplicateCount || 0) + 1;
            firstMessageDate = lead.firstMessageDate || lead.createdAt?.toISOString() || new Date().toISOString();

            // Promote to opportunity if salesperson is assigned or already was assigned
            const updatedType = (salespersonId || lead.salespersonId) ? 'opportunity' : lead.type;

            lead = await prisma.crmLead.update({
                where: { id: lead.id },
                data: {
                    name: parsedData.name || lead.name,
                    nationality: parsedData.nationality || lead.nationality,
                    emirate: parsedData.emirate || lead.emirate,
                    interestedDiploma: parsedData.diploma || lead.interestedDiploma,
                    levelOfInterest: parsedData.interestLevel ? parseInt(parsedData.interestLevel) : lead.levelOfInterest,
                    salespersonId: salespersonId || lead.salespersonId,
                    type: updatedType,
                    stageId: updatedType === 'opportunity' ? (lead.stageId || defaultStageId) : null, // Retain existing stage or reset back to active column NEW
                    isDuplicate: true,
                    duplicateCount
                }
            });
        }

        // 3. Create the Note / Call Report stamped with the matched salesperson's ID
        if (parsedData.notes) {
            // Resolve author: default to matched salesperson, then system/admin
            let authorId = salespersonId;
            if (!authorId) {
                const adminUser = await prisma.user.findFirst({
                    where: { OR: [{ username: 'admin' }, { id: 'system' }] }
                });
                authorId = adminUser?.id || (await prisma.user.findFirst())?.id || null;
            }

            if (authorId) {
                await prisma.crmNote.create({
                    data: {
                        leadId: lead.id,
                        userId: authorId,
                        content: parsedData.notes,
                        type: 'call_report'
                    }
                });
            }
        }

        return {
            lead,
            isDuplicate,
            duplicateCount,
            firstMessageDate
        };
    }
};
