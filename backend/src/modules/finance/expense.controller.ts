import { Response } from 'express';
import { AuthRequest } from '../../common/utils/jwt';
import { expenseService } from './expense.service';
import {
    createExpenseSchema,
    updateExpenseSchema,
    createExpenseCategorySchema,
    updateExpenseCategorySchema,
} from './expense.validation';
import prisma from '../../common/db/prisma';

// --- Expense Categories ---

export const getCategories = async (_req: AuthRequest, res: Response) => {
    try {
        const categories = await expenseService.getAllCategories();
        return res.json({ success: true, data: { categories } });
    } catch (error: any) {
        console.error('Get categories error:', error instanceof Error ? error.message : error);
        return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
    }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const validatedData = createExpenseCategorySchema.parse(req.body);
        const category = await expenseService.createCategory(validatedData);
        return res.status(201).json({ success: true, data: { category } });
    } catch (error: any) {
        console.error('Create category error:', error instanceof Error ? error.message : error);
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, error: { message: 'Validation error', details: error.errors } });
        }
        return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
    }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const validatedData = updateExpenseCategorySchema.parse(req.body);
        const category = await expenseService.updateCategory(id, validatedData);
        return res.json({ success: true, data: { category } });
    } catch (error: any) {
        console.error('Update category error:', error instanceof Error ? error.message : error);
        return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
    }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await expenseService.deleteCategory(id);
        return res.json({ success: true, message: 'Category deleted successfully' });
    } catch (error: any) {
        console.error('Delete category error:', error instanceof Error ? error.message : error);
        return res.status(400).json({ success: false, error: { message: error.message } });
    }
};

// --- Expenses ---

export const getExpenses = async (req: AuthRequest, res: Response) => {
    try {
        const { categoryId, startDate, endDate } = req.query;
        const expenses = await expenseService.getAllExpenses({
            categoryId: categoryId as string,
            startDate: startDate as string,
            endDate: endDate as string,
        });
        return res.json({ success: true, data: { expenses } });
    } catch (error: any) {
        console.error('Get expenses error:', error instanceof Error ? error.message : error);
        return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
    }
};

export const getExpenseDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const expense = await expenseService.getExpenseById(id);
        if (!expense) return res.status(404).json({ success: false, error: { message: 'Expense not found' } });
        return res.json({ success: true, data: { expense } });
    } catch (error: any) {
        console.error('Get expense details error:', error instanceof Error ? error.message : error);
        return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
    }
};

export const createExpense = async (req: AuthRequest, res: Response) => {
    try {
        const validatedData = createExpenseSchema.parse(req.body);
        const expense = await expenseService.createExpense(validatedData, req.user?.id);

        // Audit Log
        if (req.user) {
            await prisma.auditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'EXPENSE_CREATED',
                    resourceType: 'Expense',
                    resourceId: expense.id,
                    afterData: {
                        amount: expense.amount,
                        categoryId: expense.categoryId,
                        description: expense.description,
                    },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        return res.status(201).json({ success: true, data: { expense } });
    } catch (error: any) {
        console.error('Create expense error:', error instanceof Error ? error.message : error);
        if (error.name === 'ZodError') {
            return res.status(400).json({ success: false, error: { message: 'Validation error', details: error.errors } });
        }
        return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
    }
};

export const updateExpense = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const validatedData = updateExpenseSchema.parse(req.body);
        const expense = await expenseService.updateExpense(id, validatedData);
        return res.json({ success: true, data: { expense } });
    } catch (error: any) {
        console.error('Update expense error:', error instanceof Error ? error.message : error);
        return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
    }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await expenseService.deleteExpense(id);
        return res.json({ success: true, message: 'Expense deleted successfully' });
    } catch (error: any) {
        console.error('Delete expense error:', error instanceof Error ? error.message : error);
        return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
    }
};

export const getStats = async (_req: AuthRequest, res: Response) => {
    try {
        const stats = await expenseService.getExpenseStats();
        return res.json({ success: true, data: { stats } });
    } catch (error: any) {
        console.error('Get stats error:', error instanceof Error ? error.message : error);
        return res.status(500).json({ success: false, error: { message: 'Internal server error' } });
    }
};
