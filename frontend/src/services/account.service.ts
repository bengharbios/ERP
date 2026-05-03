import { apiClient } from './api';

export interface Account {
    id: string;
    code: string;
    name: string;
    nameAr: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    parentId?: string | null;
    balance: number;
    isActive: boolean;
    description?: string | null;
    createdAt: string;
    updatedAt: string;
    parent?: {
        id: string;
        code: string;
        name: string;
        nameAr: string;
    };
    children?: Account[];
}

export interface AccountBalance {
    accountId: string;
    accountCode: string;
    accountName: string;
    accountType: string;
    totalDebit: number;
    totalCredit: number;
    balance: number;
    asOfDate?: string;
}

export interface CreateAccountData {
    code: string;
    name: string;
    nameAr: string;
    type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    parentId?: string | null;
    balance?: number;
    isActive?: boolean;
    description?: string | null;
}

export interface UpdateAccountData extends Partial<CreateAccountData> { }

export interface GetAccountsParams {
    type?: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
    isActive?: boolean;
    search?: string;
    parentId?: string | null;
    includeBalance?: boolean;
}

class AccountService {
    private readonly BASE_PATH = '/accounting/accounts';

    /**
     * Get all accounts with optional filters
     */
    async getAccounts(params?: GetAccountsParams): Promise<Account[]> {
        const response = await apiClient.get(this.BASE_PATH, { params });
        return response.data;
    }

    /**
     * Get accounts in tree structure
     */
    async getAccountTree(): Promise<Account[]> {
        const response = await apiClient.get(`${this.BASE_PATH}/tree`);
        return response.data;
    }

    /**
     * Get account by ID
     */
    async getAccountById(id: string): Promise<Account> {
        const response = await apiClient.get(`${this.BASE_PATH}/${id}`);
        return response.data;
    }

    /**
     * Get account by code
     */
    async getAccountByCode(code: string): Promise<Account> {
        const response = await apiClient.get(`${this.BASE_PATH}/code/${code}`);
        return response.data;
    }

    /**
     * Create new account
     */
    async createAccount(data: CreateAccountData): Promise<Account> {
        const response = await apiClient.post(this.BASE_PATH, data);
        return response.data;
    }

    /**
     * Update account
     */
    async updateAccount(id: string, data: UpdateAccountData): Promise<Account> {
        const response = await apiClient.put(`${this.BASE_PATH}/${id}`, data);
        return response.data;
    }

    /**
     * Delete account
     */
    async deleteAccount(id: string): Promise<void> {
        await apiClient.delete(`${this.BASE_PATH}/${id}`);
    }

    /**
     * Get account balance
     */
    async getAccountBalance(id: string, asOfDate?: string): Promise<AccountBalance> {
        const params = asOfDate ? { asOfDate } : undefined;
        const response = await apiClient.get(`${this.BASE_PATH}/${id}/balance`, { params });
        return response.data;
    }

    /**
     * Get accounts by type
     */
    async getAccountsByType(
        type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE'
    ): Promise<Account[]> {
        const response = await apiClient.get(`${this.BASE_PATH}/type/${type}`);
        return response.data;
    }
}

export default new AccountService();
