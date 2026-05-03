import { apiClient as api } from './api';

export const databaseService = {
    exportDatabase: async () => {
        const response = await api.get('/database/export');
        return response;
    },

    importDatabase: async (data: any) => {
        const response = await api.post('/database/import', { data });
        return response;
    },

    seedDemoData: async () => {
        const response = await api.post('/database/seed');
        return response;
    }
};
