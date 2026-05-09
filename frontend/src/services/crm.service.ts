import { apiClient as api } from './api';

// Lead API
export const leadApi = {
    getAll: (filters?: any) => api.get('/crm/leads', filters),
    getById: (id: string) => api.get(`/crm/leads/${id}`),
    create: (data: any) => api.post('/crm/leads', data),
    update: (id: string, data: any) => api.put(`/crm/leads/${id}`, data),
    delete: (id: string) => api.delete(`/crm/leads/${id}`),
    checkDuplicates: (id: string) => api.get(`/crm/leads/${id}/duplicates`),
    merge: (data: any) => api.post('/crm/leads/merge', data),
    convertToOpportunity: (id: string, data: any) =>
        api.post(`/crm/leads/${id}/convert`, data),
    convertToCustomer: (id: string, data: any) =>
        api.post(`/crm/leads/${id}/convert-customer`, data),
    syncGoogleSheets: (data: { spreadsheetUrl: string; range?: string }) =>
        api.post('/crm/google-sheets/sync', data)
};

// Activity API
export const activityApi = {
    getAll: (filters?: any) => api.get('/crm/activities', filters),
    getByLead: (leadId: string) => api.get('/crm/activities', { leadId }),
    getById: (id: string) => api.get(`/crm/activities/${id}`),
    create: (data: any) => api.post('/crm/activities', data),
    update: (id: string, data: any) => api.put(`/crm/activities/${id}`, data),
    markDone: (id: string, data?: any) => api.put(`/crm/activities/${id}/done`, data),
    delete: (id: string) => api.delete(`/crm/activities/${id}`),
    getTypes: () => api.get('/crm/activity-types')
};

// Activity Type API
export const activityTypeApi = {
    getAll: () => api.get('/crm/activity-types'),
    create: (data: any) => api.post('/crm/activity-types', data),
    update: (id: string, data: any) => api.put(`/crm/activity-types/${id}`, data),
    delete: (id: string) => api.delete(`/crm/activity-types/${id}`)
};

// Activity Plan API
export const activityPlanApi = {
    getAll: () => api.get('/crm/activity-plans'),
    create: (data: any) => api.post('/crm/activity-plans', data),
    update: (id: string, data: any) => api.put(`/crm/activity-plans/${id}`, data),
    delete: (id: string) => api.delete(`/crm/activity-plans/${id}`)
};

// Team API
export const teamApi = {
    getAll: () => api.get('/crm/teams'),
    getById: (id: string) => api.get(`/crm/teams/${id}`),
    create: (data: any) => api.post('/crm/teams', data),
    update: (id: string, data: any) => api.put(`/crm/teams/${id}`, data),
    delete: (id: string) => api.delete(`/crm/teams/${id}`)
};

// Stage API
export const stageApi = {
    getAll: () => api.get('/crm/stages'),
    create: (data: any) => api.post('/crm/stages', data),
    update: (id: string, data: any) => api.put(`/crm/stages/${id}`, data),
    delete: (id: string) => api.delete(`/crm/stages/${id}`)
};

export default {
    leadApi,
    activityApi,
    activityTypeApi,
    activityPlanApi,
    teamApi,
    stageApi
};

