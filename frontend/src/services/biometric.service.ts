import { apiClient as api } from './api';

export interface BiometricDevice {
    id: string;
    name: string;
    ipAddress: string;
    port: number;
    username: string;
    password?: string;
    protocol: string;
    lastSync?: string;
    isActive: boolean;
    connectionStatus?: 'online' | 'offline' | 'checking';
}

export const biometricService = {
    getDevices: async () => {
        return await api.get<BiometricDevice[]>('/hr/biometric/devices');
    },

    createDevice: async (data: Partial<BiometricDevice>) => {
        return await api.post<BiometricDevice>('/hr/biometric/devices', data);
    },

    updateDevice: async (id: string, data: Partial<BiometricDevice>) => {
        return await api.put<BiometricDevice>(`/hr/biometric/devices/${id}`, data);
    },

    deleteDevice: async (id: string) => {
        return await api.delete(`/hr/biometric/devices/${id}`);
    },

    testConnection: async (id: string) => {
        return await api.post(`/hr/biometric/devices/${id}/test`);
    },

    syncAttendance: async (id: string) => {
        return await api.post(`/hr/biometric/devices/${id}/sync`);
    },

    discoverDevices: async () => {
        return await api.get<Partial<BiometricDevice>[]>('/hr/biometric/discover');
    },

    syncEmployees: async (id: string) => {
        return await api.post(`/hr/biometric/devices/${id}/sync-employees`);
    }
};

export default biometricService;
