import React from 'react';
import { useSettingsStore } from '../store/settingsStore';
import LegacyLayout from './Legacy/LegacyLayout';
import { ModernGlobalLayout } from './ModernGlobal2026/ModernGlobalLayout';
import { RapidosLayout } from './Rapidos2026/RapidosLayout';

interface LayoutProviderProps {
    children: React.ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
    // Use cachedTemplate (from localStorage) for instant render — no flash
    const cachedTemplate = useSettingsStore((state) => state.cachedTemplate);

    if (cachedTemplate === 'modern_global_2026') {
        return <ModernGlobalLayout>{children}</ModernGlobalLayout>;
    }

    if (cachedTemplate === 'rapidos_2026') {
        return <RapidosLayout>{children}</RapidosLayout>;
    }

    return <LegacyLayout>{children}</LegacyLayout>;
}

export default LayoutProvider;
