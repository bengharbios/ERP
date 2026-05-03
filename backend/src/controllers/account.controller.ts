import { Request, Response } from 'express';
import accountService from '../services/account.service';
import {
    createAccountSchema,
    updateAccountSchema,
    getAccountsQuerySchema
} from '../validation/account.validation';

export class AccountController {
    /**
     * GET /api/accounting/accounts
     * Get all accounts with optional filters
     */
    async getAccounts(req: Request, res: Response) {
        try {
            const query = getAccountsQuerySchema.parse(req.query);
            const accounts = await accountService.getAccounts(query);

            res.json({
                success: true,
                data: accounts,
                count: accounts.length
            });
        } catch (error: any) {
            console.error('Error fetching accounts:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to fetch accounts'
            });
        }
    }

    /**
     * GET /api/accounting/accounts/tree
     * Get accounts in hierarchical tree structure
     */
    async getAccountTree(req: Request, res: Response) {
        try {
            const tree = await accountService.getAccountTree();

            res.json({
                success: true,
                data: tree
            });
        } catch (error: any) {
            console.error('Error fetching account tree:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch account tree'
            });
        }
    }

    /**
     * GET /api/accounting/accounts/:id
     * Get account by ID
     */
    async getAccountById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const account = await accountService.getAccountById(id);

            res.json({
                success: true,
                data: account
            });
        } catch (error: any) {
            console.error('Error fetching account:', error);
            const status = error.message === 'Account not found' ? 404 : 500;
            res.status(status).json({
                success: false,
                error: error.message || 'Failed to fetch account'
            });
        }
    }

    /**
     * GET /api/accounting/accounts/code/:code
     * Get account by code
     */
    async getAccountByCode(req: Request, res: Response) {
        try {
            const { code } = req.params;
            const account = await accountService.getAccountByCode(code);

            res.json({
                success: true,
                data: account
            });
        } catch (error: any) {
            console.error('Error fetching account:', error);
            const status = error.message === 'Account not found' ? 404 : 500;
            res.status(status).json({
                success: false,
                error: error.message || 'Failed to fetch account'
            });
        }
    }

    /**
     * POST /api/accounting/accounts
     * Create new account
     */
    async createAccount(req: Request, res: Response) {
        try {
            const data = createAccountSchema.parse(req.body);
            const account = await accountService.createAccount(data);

            res.status(201).json({
                success: true,
                data: account,
                message: 'Account created successfully'
            });
        } catch (error: any) {
            console.error('Error creating account:', error);
            const status = error.message.includes('already exists') ? 409 : 400;
            res.status(status).json({
                success: false,
                error: error.message || 'Failed to create account'
            });
        }
    }

    /**
     * PUT /api/accounting/accounts/:id
     * Update account
     */
    async updateAccount(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const data = updateAccountSchema.parse(req.body);
            const account = await accountService.updateAccount(id, data);

            res.json({
                success: true,
                data: account,
                message: 'Account updated successfully'
            });
        } catch (error: any) {
            console.error('Error updating account:', error);
            const status = error.message === 'Account not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: error.message || 'Failed to update account'
            });
        }
    }

    /**
     * DELETE /api/accounting/accounts/:id
     * Delete account (only if no transactions)
     */
    async deleteAccount(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const result = await accountService.deleteAccount(id);

            res.json({
                success: true,
                message: result.message
            });
        } catch (error: any) {
            console.error('Error deleting account:', error);
            const status = error.message === 'Account not found' ? 404 : 400;
            res.status(status).json({
                success: false,
                error: error.message || 'Failed to delete account'
            });
        }
    }

    /**
     * GET /api/accounting/accounts/:id/balance
     * Get account balance
     */
    async getAccountBalance(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const asOfDate = req.query.asOfDate ? new Date(req.query.asOfDate as string) : undefined;

            const balance = await accountService.getAccountBalance(id, asOfDate);

            res.json({
                success: true,
                data: balance
            });
        } catch (error: any) {
            console.error('Error fetching account balance:', error);
            res.status(500).json({
                success: false,
                error: error.message || 'Failed to fetch account balance'
            });
        }
    }

    /**
     * GET /api/accounting/accounts/type/:type
     * Get accounts by type
     */
    async getAccountsByType(req: Request, res: Response) {
        try {
            const { type } = req.params;
            const accounts = await accountService.getAccountsByType(type);

            res.json({
                success: true,
                data: accounts,
                count: accounts.length
            });
        } catch (error: any) {
            console.error('Error fetching accounts by type:', error);
            res.status(400).json({
                success: false,
                error: error.message || 'Failed to fetch accounts'
            });
        }
    }
}

export default new AccountController();
