import { apiClient } from './api';

export const hrmsService = {
    // Recruitment
    getJobs: () => apiClient.get('/hrms/jobs'),
    createJob: (data: any) => apiClient.post('/hrms/jobs', data),
    getApplications: (jobId?: string) => apiClient.get('/hrms/applications', { params: { jobId } }),
    updateApplicationStatus: (id: string, status: string) => apiClient.patch(`/hrms/applications/${id}/status`, { status }),

    // Employee Actions
    getAwards: () => apiClient.get('/hrms/awards'),
    createAward: (data: any) => apiClient.post('/hrms/awards', data),
    getWarnings: () => apiClient.get('/hrms/warnings'),
    createWarning: (data: any) => apiClient.post('/hrms/warnings', data),
    getComplaints: () => apiClient.get('/hrms/complaints'),
    createComplaint: (data: any) => apiClient.post('/hrms/complaints', data),
    processPromotion: (data: any) => apiClient.post('/hrms/promotions', data),
    processTransfer: (data: any) => apiClient.post('/hrms/transfers', data),
    processResignation: (data: any) => apiClient.post('/hrms/resignations', data),
    processTermination: (data: any) => apiClient.post('/hrms/terminations', data),

    // Communication
    getAnnouncements: () => apiClient.get('/hrms/announcements'),
    createAnnouncement: (data: any) => apiClient.post('/hrms/announcements', data),
    getMeetings: () => apiClient.get('/hrms/meetings'),
    createMeeting: (data: any) => apiClient.post('/hrms/meetings', data),
    getEvents: () => apiClient.get('/hrms/events'),
    createEvent: (data: any) => apiClient.post('/hrms/events', data),

    // Analytics
    getDashboard: () => apiClient.get('/hrms/dashboard'),

    // Shifts
    getShifts: () => apiClient.get('/hrms/shifts'),
    createShift: (data: any) => apiClient.post('/hrms/shifts', data),
    updateShift: (id: string, data: any) => apiClient.patch(`/hrms/shifts/${id}`, data),
    deleteShift: (id: string) => apiClient.delete(`/hrms/shifts/${id}`)
};
