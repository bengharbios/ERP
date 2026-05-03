import prisma from '../../common/db/prisma';
import { Prisma } from '@prisma/client';

const Decimal = Prisma.Decimal;

export const expenseService = {
    // --- Expense Categories ---

    async getAllCategories() {
        return await prisma.expenseCategory.findMany({
            orderBy: { name: 'asc' },
        });
    },

    async getCategoryById(id: string) {
        return await prisma.expenseCategory.findUnique({
            where: { id },
        });
    },

    async createCategory(data: any) {
        return await prisma.expenseCategory.create({
            data,
        });
    },

    async updateCategory(id: string, data: any) {
        return await prisma.expenseCategory.update({
            where: { id },
            data,
        });
    },

    async deleteCategory(id: string) {
        // Check if category has expenses
        const count = await prisma.expense.count({
            where: { categoryId: id },
        });
        if (count > 0) {
            throw new Error('Cannot delete category with existing expenses');
        }
        return await prisma.expenseCategory.delete({
            where: { id },
        });
    },

    // --- Expenses ---

    async getAllExpenses(filters: { categoryId?: string; startDate?: string; endDate?: string } = {}) {
        const { categoryId, startDate, endDate } = filters;
        return await prisma.expense.findMany({
            where: {
                categoryId,
                expenseDate: {
                    gte: startDate ? new Date(startDate) : undefined,
                    lte: endDate ? new Date(endDate) : undefined,
                },
            },
            include: {
                category: true,
            },
            orderBy: { expenseDate: 'desc' },
        });
    },

    async getExpenseById(id: string) {
        return await prisma.expense.findUnique({
            where: { id },
            include: { category: true },
        });
    },

    async createExpense(data: any, userId?: string) {
        return await prisma.$transaction(async (tx) => {
            // 1. Generate sequential expense number
            const lastExpense = await tx.expense.findFirst({
                orderBy: { createdAt: 'desc' },
                select: { expenseNumber: true }
            });

            let nextNumber = 1;
            if (lastExpense?.expenseNumber) {
                const lastNum = parseInt(lastExpense.expenseNumber.replace('EXP-', ''));
                if (!isNaN(lastNum)) nextNumber = lastNum + 1;
            }
            const expenseNumber = `EXP-${String(nextNumber).padStart(6, '0')}`;

            // 2. Fetch global settings for tax if not provided
            let taxRate = data.taxRate;
            if (taxRate === undefined || taxRate === null) {
                const settings = await tx.settings.findUnique({ where: { id: 'singleton' } });
                taxRate = settings?.taxEnabled ? Number(settings.taxRate) : 0;
            }

            // 3. Calculate taxes
            const amount = new Decimal(data.amount);
            const rate = new Decimal(taxRate || 0);
            const taxAmount = amount.mul(rate).div(100);
            const totalAmount = amount.add(taxAmount);

            return await tx.expense.create({
                data: {
                    ...data,
                    expenseNumber,
                    amount,
                    taxRate: rate,
                    taxAmount,
                    totalAmount,
                    expenseDate: data.expenseDate ? new Date(data.expenseDate) : new Date(),
                    recordedBy: userId,
                },
            });
        });
    },

    async updateExpense(id: string, data: any) {
        return await prisma.$transaction(async (tx) => {
            const current = await tx.expense.findUnique({ where: { id } });
            if (!current) throw new Error('Expense not found');

            const updateData = { ...data };

            // Recalculate if amount or taxRate changes
            if (data.amount !== undefined || data.taxRate !== undefined) {
                const amount = new Decimal(data.amount ?? current.amount);
                const taxRate = new Decimal(data.taxRate ?? current.taxRate ?? 0);
                const taxAmount = amount.mul(taxRate).div(100);
                const totalAmount = amount.add(taxAmount);

                updateData.amount = amount;
                updateData.taxRate = taxRate;
                updateData.taxAmount = taxAmount;
                updateData.totalAmount = totalAmount;
            }

            if (data.expenseDate) updateData.expenseDate = new Date(data.expenseDate);

            return await tx.expense.update({
                where: { id },
                data: updateData,
            });
        });
    },

    async deleteExpense(id: string) {
        return await prisma.expense.delete({
            where: { id },
        });
    },

    async getExpenseStats() {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const [totalAllTime, totalThisMonth, categoryBreakdown] = await Promise.all([
            prisma.expense.aggregate({ _sum: { amount: true } }),
            prisma.expense.aggregate({
                where: { expenseDate: { gte: firstDayOfMonth } },
                _sum: { amount: true },
            }),
            prisma.expense.groupBy({
                by: ['categoryId'],
                _sum: { amount: true },
            }),
        ]);

        // Get category names for the breakdown
        const categories = await this.getAllCategories();
        const formattedBreakdown = categoryBreakdown.map(item => ({
            categoryId: item.categoryId,
            categoryName: categories.find(c => c.id === item.categoryId)?.name || 'Unknown',
            categoryNameAr: categories.find(c => c.id === item.categoryId)?.nameAr || 'غير معروف',
            total: item._sum.amount ? Number(item._sum.amount) : 0,
        }));

        return {
            totalAllTime: totalAllTime._sum.amount ? Number(totalAllTime._sum.amount) : 0,
            totalThisMonth: totalThisMonth._sum.amount ? Number(totalThisMonth._sum.amount) : 0,
            categoryBreakdown: formattedBreakdown,
        };
    },
};
