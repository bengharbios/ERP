import axios, { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
}

export class ApiClient {
    public client: AxiosInstance;

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            withCredentials: true,
        });

        // Request interceptor to add auth token
        this.client.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('accessToken');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor to handle token refresh
        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError<ApiResponse>) => {
                const originalRequest = error.config as any;

                // 401 Unauthorized - Token might be expired
                if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
                    originalRequest._retry = true;

                    const refreshToken = localStorage.getItem('refreshToken');
                    if (refreshToken) {
                        try {
                            const response = await axios.post<ApiResponse<{ accessToken: string }>>(
                                `${API_BASE_URL}/auth/refresh-token`,
                                { refreshToken }
                            );

                            if (response.data.success && response.data.data) {
                                localStorage.setItem('accessToken', response.data.data.accessToken);

                                // Retry original request with new token
                                if (originalRequest.headers) {
                                    originalRequest.headers.Authorization = `Bearer ${response.data.data.accessToken}`;
                                }
                                return this.client(originalRequest);
                            }
                        } catch (refreshError) {
                            // Refresh failed, clear tokens and redirect to login
                            localStorage.removeItem('accessToken');
                            localStorage.removeItem('refreshToken');
                            window.location.href = '/login';
                        }
                    } else {
                        // No refresh token, go to login
                        window.location.href = '/login';
                    }
                }

                // 403 Forbidden - Permission denied (RBAC) - Don't retry, just bubble up the error
                // The UI should handle this by showing a "Permission Denied" message

                return Promise.reject(error);
            }
        );
    }

    async get<T = any>(url: string, configOrParams?: any): Promise<any> {
        let config: import('axios').AxiosRequestConfig = {};

        if (configOrParams) {
            // Check if it's already an axios config object
            if (configOrParams.params || configOrParams.responseType || configOrParams.headers) {
                config = configOrParams;
            } else {
                // Otherwise treat as params
                config = { params: configOrParams };
            }
        }

        const response = await this.client.get(url, config);
        return response.data;
    }

    async post<T = any>(url: string, data?: any, config?: import('axios').AxiosRequestConfig): Promise<any> {
        const response = await this.client.post(url, data, config);
        return response.data;
    }

    async put<T = any>(url: string, data?: any, config?: import('axios').AxiosRequestConfig): Promise<any> {
        const response = await this.client.put(url, data, config);
        return response.data;
    }

    async delete<T = any>(url: string, config?: import('axios').AxiosRequestConfig): Promise<any> {
        const response = await this.client.delete(url, config);
        return response.data;
    }

    async patch<T = any>(url: string, data?: any, config?: import('axios').AxiosRequestConfig): Promise<any> {
        const response = await this.client.patch(url, data, config);
        return response.data;
    }
}

export const apiClient = new ApiClient();
