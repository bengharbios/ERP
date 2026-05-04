import { prisma } from '../../common/db/prisma';

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
     * Updates or creates a lead based on parsed data
     */
    async updateLeadFromMessage(parsedData: any) {
        if (!parsedData.phone) {
            throw new Error('Phone number is missing in the message');
        }

        // Normalize phone: remove spaces and extra chars
        const normalizedPhone = parsedData.phone.replace(/\s+/g, '');

        // 1. Find or Create Lead
        let lead = await prisma.crmLead.findFirst({
            where: {
                OR: [
                    { mobile: normalizedPhone },
                    { phone: normalizedPhone }
                ]
            }
        });

        if (!lead) {
            lead = await prisma.crmLead.create({
                data: {
                    name: parsedData.name || 'Unknown',
                    mobile: normalizedPhone,
                    nationality: parsedData.nationality,
                    emirate: parsedData.emirate,
                    interestedDiploma: parsedData.diploma,
                    levelOfInterest: parsedData.interestLevel ? parseInt(parsedData.interestLevel) : 0,
                    platform: 'Telegram Bot'
                }
            });
        } else {
            // Update existing lead fields if provided
            await prisma.crmLead.update({
                where: { id: lead.id },
                data: {
                    nationality: parsedData.nationality || lead.nationality,
                    emirate: parsedData.emirate || lead.emirate,
                    interestedDiploma: parsedData.diploma || lead.interestedDiploma,
                    levelOfInterest: parsedData.interestLevel ? parseInt(parsedData.interestLevel) : lead.levelOfInterest
                }
            });
        }

        // 2. Add the Note/Interaction
        if (parsedData.notes) {
            // Find a valid user to associate with this note (default to first user if 'system' doesn't exist)
            let user = await prisma.user.findFirst({
                where: { OR: [{ id: 'system' }, { username: 'admin' }] }
            });

            if (!user) {
                user = await prisma.user.findFirst(); // Get any existing user
            }

            if (user) {
                await prisma.crmNote.create({
                    data: {
                        leadId: lead.id,
                        userId: user.id,
                        content: parsedData.notes,
                        type: 'call_report'
                    }
                });
            }
        }

        return lead;
    }
};
