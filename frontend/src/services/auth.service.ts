import { apiClient, ApiResponse } from './api';

export interface User {
    id: string;
    username: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    profilePicture?: string;
    role?: string;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterRequest {
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
}

export interface LoginResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export const authService = {
    async login(credentials: LoginRequest): Promise<ApiResponse<LoginResponse>> {
        return apiClient.post('/auth/login', credentials);
    },

    async register(data: RegisterRequest): Promise<ApiResponse<{ user: User; message: string }>> {
        return apiClient.post('/auth/register', data);
    },

    async logout(): Promise<ApiResponse<{ message: string }>> {
        return apiClient.post('/auth/logout');
    },

    async getMe(): Promise<ApiResponse<{ user: User }>> {
        return apiClient.get('/auth/me');
    },

    async changePassword(data: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
        return apiClient.post('/auth/change-password', data);
    },

    async refreshToken(refreshToken: string): Promise<ApiResponse<{ accessToken: string }>> {
        return apiClient.post('/auth/refresh-token', { refreshToken });
    },
};
