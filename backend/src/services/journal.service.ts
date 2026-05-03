import prisma from '../common/db/prisma';
import accountService from './account.service';
import type { CreateJournalEntryInput, UpdateJournalEntryInput, GetJournalEntriesQuery } from '../validation/journal.validation';

export class JournalService {
    /**
     * Get all journal entries with pagination and filters
     */
    async getJournalEntries(query: GetJournalEntriesQuery) {
        const { startDate, endDate, isPosted, search, page = 1, limit = 20 } = query;

        const where: any = {};

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        } else if (startDate) {
            where.date = { gte: new Date(startDate) };
        } else if (endDate) {
            where.date = { lte: new Date(endDate) };
        }

        if (isPosted !== undefined) where.isPosted = isPosted;

        if (search) {
            where.OR = [
                { entryNumber: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
                { reference: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [entries, total] = await Promise.all([
            prisma.journalEntry.findMany({
                where,
                include: {
                    journal: true,
                    lines: {
                        include: {
                            account: {
                                select: {
                                    code: true,
                                    name: true,
                                    nameAr: true
                                }
                            }
                        }
                    }
                },
                skip: (page - 1) * limit,
                take: limit,
                orderBy: { date: 'desc' }
            }),
            prisma.journalEntry.count({ where })
        ]);

        return {
            success: true,
            data: entries,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Create a new journal entry
     */
    async createJournalEntry(data: CreateJournalEntryInput, userId: string, tx?: any): Promise<any> {
        const client = tx || prisma;
        // 1. Double check balance (though Zod does this, let's be safe)
        const totalDebit = data.lines.reduce((sum, line) => sum + Number(line.debit), 0);
        const totalCredit = data.lines.reduce((sum, line) => sum + Number(line.credit), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.001) {
            throw new Error('Journal entry is unbalanced. Debit must equal Credit.');
        }

        // 2. Generate a unique numbering sequence (e.g., JE-2026-0001)
        const count = await client.journalEntry.count();
        const entryNumber = `JE-${new Date().getFullYear()}-${(count + 1).toString().padStart(5, '0')}`;

        // 3. Create the entry
        const entry = await client.journalEntry.create({
            data: {
                entryNumber,
                date: new Date(data.date),
                description: data.description,
                reference: data.reference,
                journalId: data.journalId,
                isPosted: false, // Always draft initially
                lines: {
                    create: data.lines.map(line => ({
                        accountId: line.accountId,
                        description: line.description || data.description, // Fallback to main desc if empty
                        debit: line.debit,
                        credit: line.credit
                    }))
                }
            },
            include: {
                lines: {
                    include: {
                        account: true
                    }
                }
            }
        });

        return entry;
    }

    /**
     * Post a journal entry (Finalize it and update account balances)
     */
    async postJournalEntry(id: string, userId: string, tx?: any): Promise<any> {
        const client = tx || prisma;
        const entry = await client.journalEntry.findUnique({
            where: { id },
            include: { lines: true }
        });

        if (!entry) throw new Error('Journal entry not found');
        if (entry.isPosted) throw new Error('Journal entry is already posted');

        // 1. Mark as posted
        const updatedEntry = await client.journalEntry.update({
            where: { id },
            data: { isPosted: true }
        });

        // 2. Update account balances
        // Since we're using real-time calculation, we might not need to physically update 'balance' field 
        // on every transaction if the system is small. However, for performance, let's update the cache.
        for (const line of entry.lines) {
            await accountService.updateAccountBalance(line.accountId, tx);
        }

        return updatedEntry;
    }

    /**
     * Get entry by ID
     */
    async getJournalEntryById(id: string) {
        const entry = await prisma.journalEntry.findUnique({
            where: { id },
            include: {
                lines: {
                    include: {
                        account: {
                            select: {
                                code: true,
                                name: true,
                                nameAr: true
                            }
                        }
                    }
                }
            }
        });

        if (!entry) throw new Error('Journal entry not found');
        return entry;
    }

    /**
     * Delete draft entry
     */
    async deleteJournalEntry(id: string) {
        const entry = await prisma.journalEntry.findUnique({
            where: { id }
        });

        if (!entry) throw new Error('Journal entry not found');
        if (entry.isPosted) throw new Error('Cannot delete a posted journal entry. Create a reversal entry instead.');

        // Delete lines first (cascade usually handles this but let's be explicit if needed)
        // Prisma cascade delete on 'lines' relation should work if configured in schema.
        await prisma.journalEntry.delete({
            where: { id }
        });

        return { message: 'Journal entry deleted successfully' };
    }
}

export default new JournalService();
