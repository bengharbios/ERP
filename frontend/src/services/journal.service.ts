import { apiClient } from './api';
import { Account } from './account.service';

export interface JournalLine {
    id: string;
    journalEntryId: string;
    accountId: string;
    description?: string | null;
    debit: number;
    credit: number;
    reference?: string | null;
    account?: Account;
}

export interface JournalEntry {
    id: string;
    entryNumber: string;
    date: string;
    description: string;
    reference?: string | null;
    isPosted: boolean;
    createdAt: string;
    updatedAt: string;
    lines: JournalLine[];
}

export interface CreateJournalLineData {
    accountId: string;
    description?: string;
    debit: number;
    credit: number;
    reference?: string;
}

export interface CreateJournalEntryData {
    date: string;
    description: string;
    reference?: string;
    lines: CreateJournalLineData[];
}

export interface GetJournalEntriesParams {
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    isPosted?: boolean;
    search?: string;
    page?: number;
    limit?: number;
}

class JournalService {
    private readonly BASE_PATH = '/accounting/journal-entries';

    /**
     * Get all journal entries with pagination and filters
     */
    async getJournalEntries(params?: GetJournalEntriesParams) {
        const response = await apiClient.get(this.BASE_PATH, { params });
        return response.data;
    }

    /**
     * Get journal entry by ID
     */
    async getJournalEntryById(id: string): Promise<JournalEntry> {
        const response = await apiClient.get(`${this.BASE_PATH}/${id}`);
        return response.data;
    }

    /**
     * Create new journal entry (Draft)
     */
    async createJournalEntry(data: CreateJournalEntryData): Promise<JournalEntry> {
        const response = await apiClient.post(this.BASE_PATH, data);
        return response.data;
    }

    /**
     * Post/Finalize journal entry
     */
    async postJournalEntry(id: string): Promise<JournalEntry> {
        const response = await apiClient.put(`${this.BASE_PATH}/${id}/post`);
        return response.data;
    }

    /**
     * Delete draft entry
     */
    async deleteJournalEntry(id: string): Promise<void> {
        await apiClient.delete(`${this.BASE_PATH}/${id}`);
    }
}

export default new JournalService();
