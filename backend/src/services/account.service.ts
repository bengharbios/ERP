import prisma from '../common/db/prisma';
import type { CreateAccountInput, UpdateAccountInput, GetAccountsQuery } from '../validation/account.validation';

export class AccountService {
    /**
     * Get all accounts with optional filters
     */
    async getAccounts(query: GetAccountsQuery) {
        const { type, isActive, search, parentId, includeBalance } = query;

        const where: any = {};

        if (type) where.type = type;
        if (isActive !== undefined) where.isActive = isActive;
        if (parentId !== undefined) where.parentId = parentId;
        if (search) {
            where.OR = [
                { code: { contains: search, mode: 'insensitive' } },
                { name: { contains: search, mode: 'insensitive' } },
                { nameAr: { contains: search, mode: 'insensitive' } }
            ];
        }

        const accounts = await prisma.account.findMany({
            where,
            include: {
                parent: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        nameAr: true
                    }
                },
                children: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        nameAr: true,
                        type: true,
                        balance: true,
                        isActive: true
                    }
                },
                ...(includeBalance && {
                    journalLines: {
                        select: {
                            debit: true,
                            credit: true
                        }
                    }
                })
            },
            orderBy: {
                code: 'asc'
            }
        });

        return accounts;
    }

    /**
     * Get account tree structure (hierarchical)
     */
    async getAccountTree() {
        // Get all root accounts (no parent)
        const rootAccounts = await prisma.account.findMany({
            where: { parentId: null },
            include: {
                children: {
                    include: {
                        children: {
                            include: {
                                children: true // Up to 4 levels deep
                            }
                        }
                    }
                }
            },
            orderBy: { code: 'asc' }
        });

        return rootAccounts;
    }

    /**
     * Get account by ID
     */
    async getAccountById(id: string) {
        const account = await prisma.account.findUnique({
            where: { id },
            include: {
                parent: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        nameAr: true
                    }
                },
                children: {
                    select: {
                        id: true,
                        code: true,
                        name: true,
                        nameAr: true,
                        type: true,
                        balance: true
                    }
                }
            }
        });

        if (!account) {
            throw new Error('Account not found');
        }

        return account;
    }

    /**
     * Get account by code
     */
    async getAccountByCode(code: string) {
        const account = await prisma.account.findUnique({
            where: { code },
            include: {
                parent: true,
                children: true
            }
        });

        if (!account) {
            throw new Error('Account not found');
        }

        return account;
    }

    /**
     * Create new account
     */
    async createAccount(data: CreateAccountInput) {
        // Check if code already exists
        const existing = await prisma.account.findUnique({
            where: { code: data.code }
        });

        if (existing) {
            throw new Error('Account code already exists');
        }

        // If parentId is provided, verify it exists
        if (data.parentId) {
            const parent = await prisma.account.findUnique({
                where: { id: data.parentId }
            });

            if (!parent) {
                throw new Error('Parent account not found');
            }

            // Verify parent has the same type or is a root type
            if (parent.type !== data.type) {
                throw new Error('Account type must match parent account type');
            }
        }

        const account = await prisma.account.create({
            data,
            include: {
                parent: true,
                children: true
            }
        });

        return account;
    }

    /**
     * Update account
     */
    async updateAccount(id: string, data: UpdateAccountInput) {
        // Check if account exists
        const existing = await this.getAccountById(id);

        // If updating code, check it's not a duplicate
        if (data.code && data.code !== existing.code) {
            const duplicate = await prisma.account.findUnique({
                where: { code: data.code }
            });

            if (duplicate) {
                throw new Error('Account code already exists');
            }
        }

        // If updating parentId, verify it exists and prevent circular reference
        if (data.parentId) {
            if (data.parentId === id) {
                throw new Error('Account cannot be its own parent');
            }

            const parent = await prisma.account.findUnique({
                where: { id: data.parentId }
            });

            if (!parent) {
                throw new Error('Parent account not found');
            }

            // Check if new parent is a descendant (would create circular reference)
            const isDescendant = await this.isDescendantOf(data.parentId, id);
            if (isDescendant) {
                throw new Error('Cannot set a descendant as parent (circular reference)');
            }
        }

        const account = await prisma.account.update({
            where: { id },
            data,
            include: {
                parent: true,
                children: true
            }
        });

        return account;
    }

    /**
     * Delete account (only if no transactions)
     */
    async deleteAccount(id: string) {
        // Check if account exists
        const account = await this.getAccountById(id);

        // Check if account has children
        if (account.children && account.children.length > 0) {
            throw new Error('Cannot delete account with child accounts');
        }

        // Check if account has any journal entries
        const journalLineCount = await prisma.journalLine.count({
            where: { accountId: id }
        });

        if (journalLineCount > 0) {
            throw new Error('Cannot delete account with existing transactions');
        }

        await prisma.account.delete({
            where: { id }
        });

        return { message: 'Account deleted successfully' };
    }

    /**
     * Get account balance (real-time calculation from journal entries)
     */
    async getAccountBalance(id: string, asOfDate?: Date, tx?: any) {
        const client = tx || prisma;
        const where: any = {
            accountId: id,
            entry: {
                isPosted: true // Only count posted entries
            }
        };

        if (asOfDate) {
            where.entry.date = { lte: asOfDate };
        }

        const lines = await client.journalLine.findMany({
            where,
            select: {
                debit: true,
                credit: true
            }
        });

        const totalDebit = lines.reduce((sum: number, line: any) => sum + Number(line.debit), 0);
        const totalCredit = lines.reduce((sum: number, line: any) => sum + Number(line.credit), 0);

        // Get account type to determine balance calculation
        const account = await this.getAccountById(id);

        // For Assets and Expenses: Balance = Debit - Credit
        // For Liabilities, Equity, and Revenue: Balance = Credit - Debit
        let balance = 0;
        if (account.type === 'ASSET' || account.type === 'EXPENSE') {
            balance = totalDebit - totalCredit;
        } else {
            balance = totalCredit - totalDebit;
        }

        return {
            accountId: id,
            accountCode: account.code,
            accountName: account.name,
            accountType: account.type,
            totalDebit,
            totalCredit,
            balance,
            asOfDate
        };
    }

    /**
     * Update account balance (called after posting journal entry)
     * Now with recursive update for parent accounts
     */
    async updateAccountBalance(id: string, tx?: any) {
        const client = tx || prisma;
        const balanceData = await this.getAccountBalance(id, undefined, tx);

        const updatedAccount = await client.account.update({
            where: { id },
            data: {
                balance: balanceData.balance
            }
        });

        // RECURSIVE UPDATE: If this account has a parent, update the parent's balance too
        if (updatedAccount.parentId) {
            await this.updateParentBalance(updatedAccount.parentId, tx);
        }

        return balanceData;
    }

    /**
     * Helper: Update parent balance by summing all its children
     */
    private async updateParentBalance(parentId: string, tx?: any) {
        const client = tx || prisma;

        // 1. Get all children balances
        const children = await client.account.findMany({
            where: { parentId },
            select: { balance: true }
        });

        const totalBalance = children.reduce((sum: number, child: any) => sum + Number(child.balance), 0);

        // 2. Update parent
        const parent = await client.account.update({
            where: { id: parentId },
            data: { balance: totalBalance }
        });

        // 3. Continue up the tree if there's another parent
        if (parent.parentId) {
            await this.updateParentBalance(parent.parentId, tx);
        }
    }

    /**
     * Helper: Check if accountId is a descendant of potentialAncestorId
     */
    private async isDescendantOf(accountId: string, potentialAncestorId: string): Promise<boolean> {
        const account = await prisma.account.findUnique({
            where: { id: accountId },
            select: { parentId: true }
        });

        if (!account || !account.parentId) {
            return false;
        }

        if (account.parentId === potentialAncestorId) {
            return true;
        }

        return this.isDescendantOf(account.parentId, potentialAncestorId);
    }

    /**
     * Get accounts by type
     */
    async getAccountsByType(type: string) {
        return prisma.account.findMany({
            where: {
                type: type as any,
                isActive: true
            },
            orderBy: { code: 'asc' }
        });
    }
}

export default new AccountService();
