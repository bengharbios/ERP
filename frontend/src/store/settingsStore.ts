import { create } from 'zustand';
import { settingsService, SystemSettings } from '../services/settings.service';

const TEMPLATE_CACHE_KEY = 'rd_active_template';

const THEME_KEY = 'rd_theme';

const getInitialTheme = (): 'dark' | 'light' => {
    const stored = localStorage.getItem(THEME_KEY) as 'dark' | 'light';
    if (stored) return stored;
    return 'dark'; // Default to dark as per Rapid Horizon 2030 design
};

interface SettingsState {
    settings: SystemSettings | null;
    loading: boolean;
    isLoaded: boolean;
    error: string | null;
    cachedTemplate: string;
    theme: 'dark' | 'light';
    fetchSettings: () => Promise<void>;
    updateSettings: (newSettings: any) => Promise<void>;
    toggleTheme: () => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    settings: null,
    loading: false,
    isLoaded: false,
    error: null,
    cachedTemplate: 'rapidos_2026',
    theme: getInitialTheme(),
    fetchSettings: async () => {
        try {
            set({ loading: true, error: null });
            const response = await settingsService.getSystemSettings();
            if (response.data && response.data.settings) {
                const s = response.data.settings;
                // Cache the template for instant access on next load
                if (s.activeTemplate) {
                    localStorage.setItem(TEMPLATE_CACHE_KEY, s.activeTemplate);
                }
                set({ settings: s, loading: false, isLoaded: true, cachedTemplate: s.activeTemplate || 'legacy' });
            } else {
                set({ error: 'Failed to load settings', loading: false, isLoaded: true });
            }
        } catch (error: any) {
            set({ error: error.message || 'An error occurred', loading: false, isLoaded: true });
            throw error;
        }
    },
    toggleTheme: () => {
        set((state) => {
            const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
            localStorage.setItem(THEME_KEY, nextTheme);
            document.documentElement.setAttribute('data-theme', nextTheme);
            return { theme: nextTheme };
        });
    },
    updateSettings: async (newSettings: any) => {
        try {
            set({ loading: true });
            const response = await settingsService.updateSystemSettings(newSettings);
            if (response.success && response.data) {
                const s = response.data.settings;
                if (s?.activeTemplate) {
                    localStorage.setItem(TEMPLATE_CACHE_KEY, s.activeTemplate);
                }
                set({ settings: s, loading: false, cachedTemplate: s?.activeTemplate || 'legacy' });
            } else {
                set({ error: 'Failed to update settings', loading: false });
            }
        } catch (error: any) {
            set({ error: error.message || 'An error occurred', loading: false });
            throw error;
        }
    },
}));
