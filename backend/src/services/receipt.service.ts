import prisma from '../common/db/prisma';
import { CreateReceiptInput, UpdateReceiptInput, ReceiptQueryParams } from '../validation/receipt.validation';

import journalService from './journal.service';
import { CreateJournalEntryInput } from '../validation/journal.validation';

class ReceiptService {
    /**
     * Get all receipts with filters and pagination
     */
    async getReceipts(params: ReceiptQueryParams) {
        const { page = 1, limit = 10, search, startDate, endDate, status, studentId } = params;
        const skip = (page - 1) * limit;

        const where: any = {};

        if (search) {
            where.OR = [
                { receiptNumber: { contains: search, mode: 'insensitive' } },
                {
                    student: {
                        OR: [
                            { firstNameEn: { contains: search, mode: 'insensitive' } },
                            { lastNameEn: { contains: search, mode: 'insensitive' } },
                            { firstNameAr: { contains: search, mode: 'insensitive' } },
                            { lastNameAr: { contains: search, mode: 'insensitive' } }
                        ]
                    }
                },
                { referenceNo: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (startDate && endDate) {
            where.receivedDate = {
                gte: new Date(startDate),
                lte: new Date(endDate)
            };
        }

        if (status) where.status = status;
        if (studentId) where.studentId = studentId;

        const [total, receipts] = await Promise.all([
            prisma.receipt.count({ where }),
            prisma.receipt.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: {
                        select: {
                            id: true,
                            firstNameEn: true,
                            lastNameEn: true,
                            firstNameAr: true,
                            lastNameAr: true,
                            studentNumber: true
                        }
                    },
                    financialAccount: {
                        select: { id: true, name: true, nameAr: true, code: true }
                    },
                    journalEntry: {
                        select: { id: true, entryNumber: true, isPosted: true }
                    }
                }
            })
        ]);

        return {
            data: receipts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get receipt by ID
     */
    async getReceiptById(id: string) {
        const receipt = await prisma.receipt.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        firstNameEn: true,
                        lastNameEn: true,
                        firstNameAr: true,
                        lastNameAr: true,
                        studentNumber: true
                    }
                },
                financialAccount: { select: { id: true, name: true, nameAr: true, code: true } },
                journalEntry: { include: { lines: { include: { account: true } } } }
            }
        });

        if (!receipt) throw new Error('Receipt not found');
        return receipt;
    }

    /**
     * Generate next receipt number
     */
    async generateReceiptNumber(): Promise<string> {
        const currentYear = new Date().getFullYear();
        const count = await prisma.receipt.count({
            where: {
                receiptNumber: {
                    startsWith: `REC-${currentYear}`
                }
            }
        });

        return `REC-${currentYear}-${String(count + 1).padStart(4, '0')}`;
    }

    /**
     * Create new receipt (Draft)
     */
    async createReceipt(data: CreateReceiptInput & { receivedBy?: string }) {
        const receiptNumber = await this.generateReceiptNumber();

        return prisma.receipt.create({
            data: {
                receiptNumber,
                studentId: data.studentId,
                amount: data.amount,
                amountInWords: data.amountInWords,
                paymentMethod: data.paymentMethod as any,
                referenceNo: data.referenceNo,
                receivedDate: new Date(data.receivedDate || new Date()),
                notes: data.notes,
                purpose: data.purpose,
                status: 'DRAFT',
                receivedBy: data.receivedBy,
                financialAccountId: data.financialAccountId
            }
        });
    }

    /**
     * Update receipt (Draft only)
     */
    async updateReceipt(id: string, data: UpdateReceiptInput) {
        const receipt = await this.getReceiptById(id);

        if (receipt.status !== 'DRAFT') {
            throw new Error('Can only update DRAFT receipts');
        }

        const updateData: any = { ...data };
        if (data.receivedDate) updateData.receivedDate = new Date(data.receivedDate);

        return prisma.receipt.update({
            where: { id },
            data: updateData
        });
    }

    /**
     * Post receipt -> Creates Journal Entry
     */
    async postReceipt(id: string, postedBy?: string) {
        const receipt = await this.getReceiptById(id);

        if (receipt.status !== 'DRAFT') {
            throw new Error('Receipt is not in DRAFT status or already posted');
        }

        if (!receipt.financialAccountId) {
            throw new Error('Financial Account (Bank/Cash) is required for posting');
        }

        const receivableAccount = await prisma.account.findFirst({
            where: { OR: [{ code: '1100' }, { name: { contains: 'Receivable' } }] }
        });

        if (!receivableAccount) {
            throw new Error('Receivable Account not found in Chart of Accounts. Please create one.');
        }

        const student = receipt.student as any;
        const studentName = `${student?.firstNameEn || ''} ${student?.lastNameEn || ''}`.trim();

        const journalEntryData: CreateJournalEntryInput = {
            date: receipt.receivedDate.toISOString(),
            description: `Receipt from ${studentName} - ${receipt.purpose || 'Fees Payment'}`,
            reference: receipt.receiptNumber,
            lines: [
                {
                    accountId: receipt.financialAccountId!,
                    debit: Number(receipt.amount),
                    credit: 0,
                    description: `Receipt ${receipt.receiptNumber}`
                },
                {
                    accountId: receivableAccount.id,
                    debit: 0,
                    credit: Number(receipt.amount),
                    description: `Payment from ${studentName}`
                }
            ]
        };

        const journalEntry = await journalService.createJournalEntry(journalEntryData, postedBy || 'SYSTEM');
        await journalService.postJournalEntry(journalEntry.id, postedBy || 'SYSTEM');

        return prisma.receipt.update({
            where: { id },
            data: {
                status: 'POSTED',
                journalEntryId: journalEntry.id
            }
        });
    }

    /**
     * Cancel receipt
     */
    async cancelReceipt(id: string) {
        const receipt = await this.getReceiptById(id);

        if (receipt.status === 'POSTED') {
            throw new Error('Cannot cancel posted receipt. Please create a reversal entry manually.');
        }

        return prisma.receipt.update({
            where: { id },
            data: { status: 'CANCELLED' }
        });
    }

    /**
     * Delete receipt (Draft only)
     */
    async deleteReceipt(id: string) {
        const receipt = await this.getReceiptById(id);
        if (receipt.status !== 'DRAFT') {
            throw new Error('Only DRAFT receipts can be deleted');
        }
        return prisma.receipt.delete({ where: { id } });
    }
}

export default new ReceiptService();
