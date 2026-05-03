import { apiClient as api } from './api';

// --- TYPES ---
export interface Permission {
    id: string;
    resource: string;
    action: string;
    description?: string;
}

export interface Role {
    id: string;
    name: string;
    description?: string;
    isSystemRole: boolean;
    createdAt: string;
    rolePermissions: { permission: Permission }[];
    _count?: {
        userRoles: number;
    };
}

export interface User {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    isActive: boolean;
    emailVerified?: boolean;
    createdAt: string;
    userRoles: { role: Role; scopeType?: string; scopeId?: string }[];
}

export interface CreateUserDTO {
    username: string;
    email: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    roleId?: string;
    isActive?: boolean;
}

export interface CreateRoleDTO {
    name: string;
    description?: string;
    permissionIds: string[];
}

// --- SERVICE ---
const usersService = {
    // Users
    getUsers: async (params?: { page?: number; search?: string }) => {
        const response = await api.get('/users/users', params);
        return response;
    },

    createUser: async (data: CreateUserDTO) => {
        const payload = {
            ...data,
            roles: data.roleId ? [{ roleId: data.roleId }] : []
        };
        const response = await api.post('/users/users', payload);
        return response;
    },

    updateUser: async (id: string, data: Partial<CreateUserDTO>) => {
        const response = await api.put(`/users/users/${id}`, data);
        return response;
    },

    deleteUser: async (id: string) => {
        const response = await api.delete(`/users/users/${id}`);
        return response;
    },

    // Roles
    getRoles: async () => {
        const response = await api.get('/users/roles');
        return response;
    },

    createRole: async (data: CreateRoleDTO) => {
        const response = await api.post('/users/roles', data);
        return response;
    },

    updateRole: async (id: string, data: Partial<CreateRoleDTO>) => {
        const response = await api.put(`/users/roles/${id}`, data);
        return response;
    },

    deleteRole: async (id: string) => {
        const response = await api.delete(`/users/roles/${id}`);
        return response;
    },

    // Permissions
    getPermissions: async () => {
        const response = await api.get('/users/permissions');
        return response;
    },

    // Resources
    getResources: async () => {
        const response = await api.get('/users/permissions');
        return response;
    }
};

export default usersService;
