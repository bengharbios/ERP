import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, authService } from '../services/auth.service';

const SUPER_ADMIN_BACKUP_KEY = 'super_admin_session_backup';

interface AuthState {
    user: User | null;
    accessToken: string | null;
    refreshToken: string | null;
    isAuthenticated: boolean;
    isImpersonating: boolean;

    setAuth: (user: User, accessToken: string, refreshToken: string) => void;
    clearAuth: () => void;
    logout: () => void;
    updateUser: (user: User) => void;
    loadCurrentUserProfile: () => Promise<void>;

    // Impersonation: Enter a tenant's dashboard as their admin
    impersonate: (user: User, token: string) => void;
    // Restore super admin session after impersonation
    restoreSuperAdmin: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            accessToken: null,
            refreshToken: null,
            isAuthenticated: false,
            isImpersonating: false,

            setAuth: (user, accessToken, refreshToken) => {
                // Store tokens in localStorage for API client
                localStorage.setItem('accessToken', accessToken);
                localStorage.setItem('refreshToken', refreshToken);

                set({
                    user,
                    accessToken,
                    refreshToken,
                    isAuthenticated: true,
                    isImpersonating: false,
                });
            },

            clearAuth: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem(SUPER_ADMIN_BACKUP_KEY);

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    isImpersonating: false,
                });
            },

            logout: () => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem(SUPER_ADMIN_BACKUP_KEY);

                set({
                    user: null,
                    accessToken: null,
                    refreshToken: null,
                    isAuthenticated: false,
                    isImpersonating: false,
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
                        const state = get();
                        set({
                            user: {
                                ...res.data.user,
                                impersonated: state.isImpersonating,
                                tenantName: res.data.user.tenantName || state.user?.tenantName,
                                tenantSlug: res.data.user.tenantSlug || state.user?.tenantSlug,
                            }
                        });
                    }
                } catch (err) {
                    console.error('Error loading current user profile:', err);
                }
            },

            // Save super admin session and switch to tenant admin session
            impersonate: (tenantUser: User, token: string) => {
                const currentState = get();

                // Backup super admin session before impersonating
                const backup = {
                    user: currentState.user,
                    accessToken: currentState.accessToken,
                    refreshToken: currentState.refreshToken,
                };
                localStorage.setItem(SUPER_ADMIN_BACKUP_KEY, JSON.stringify(backup));

                // Switch to tenant admin token
                localStorage.setItem('accessToken', token);

                set({
                    user: { ...tenantUser, impersonated: true },
                    accessToken: token,
                    refreshToken: null,
                    isAuthenticated: true,
                    isImpersonating: true,
                });
            },

            // Restore the original super admin session
            restoreSuperAdmin: () => {
                try {
                    const backupRaw = localStorage.getItem(SUPER_ADMIN_BACKUP_KEY);
                    if (!backupRaw) {
                        window.location.href = '/super-admin/tenants';
                        return;
                    }

                    const backup = JSON.parse(backupRaw);
                    localStorage.setItem('accessToken', backup.accessToken || '');
                    if (backup.refreshToken) {
                        localStorage.setItem('refreshToken', backup.refreshToken);
                    }
                    localStorage.removeItem(SUPER_ADMIN_BACKUP_KEY);

                    set({
                        user: backup.user,
                        accessToken: backup.accessToken,
                        refreshToken: backup.refreshToken,
                        isAuthenticated: true,
                        isImpersonating: false,
                    });

                    window.location.href = '/super-admin/tenants';
                } catch (err) {
                    console.error('Failed to restore super admin session:', err);
                    window.location.href = '/super-admin/tenants';
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                isImpersonating: state.isImpersonating,
            }),
        }
    )
);
