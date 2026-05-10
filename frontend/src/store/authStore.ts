import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authService } from '../services/auth.service';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;

    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    logout: () => void;
    updateUser: (user: User) => void;
    loadCurrentUserProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,

            setAuth: (user, accessToken, refreshToken) => {
                // Store tokens in localStorage for API client
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                });
            },

            clearAuth: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });
            },

            logout: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                });

                // Redirect to login
                window.location.href = '/login';
            },

            updateUser: (user) => {
                set({ user });
            },

            loadCurrentUserProfile: async () => {
                try {
                    const res = await authService.getMe();
                    if (res.success && res.data?.user) {
                        set({ user: res.data.user });
                    }
                } catch (err) {
                    console.error('Error loading current user profile:', err);
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
