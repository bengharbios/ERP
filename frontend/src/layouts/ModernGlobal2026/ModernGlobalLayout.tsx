import React from 'react';
import { ZenSidebar } from './components/ZenSidebar';
import { OmniHeader } from './components/OmniHeader';
import './ModernGlobalLayout.css';

interface ModernGlobalLayoutProps {
    children: React.ReactNode;
}

export function ModernGlobalLayout({ children }: ModernGlobalLayoutProps) {
    return (
        <div className="mg26-layout-wrapper mg26-root">
            {/* 1. Zen Sidebar Strategy */}
            <ZenSidebar />

            {/* 2. Main Work Area */}
            <div className="mg26-main">
                {/* 3. Omni Header Hub */}
                <OmniHeader />

                {/* 4. The Content Canvas */}
                <main className="mg26-content-canvas">
                    {children}
                </main>

                {/* 5. Minimal Global Footer */}
                <footer style={{
                    padding: 'var(--mg26-space-xl) var(--mg26-space-2xl)',
                    borderTop: '1px solid var(--mg26-border-subtle)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ color: 'var(--mg26-text-muted)', fontSize: '13px' }}>
                        &copy; {new Date().getFullYear()} معهد التقنية للتطوير - نظام إدارة المعهد المتطور
                    </div>
                    <div style={{ display: 'flex', gap: 'var(--mg26-space-xl)', color: 'var(--mg26-text-muted)', fontSize: '13px' }}>
                        <span style={{ cursor: 'pointer' }}>سياسة الخصوصية</span>
                        <span style={{ cursor: 'pointer' }}>شروط الاستخدام</span>
                        <span style={{ cursor: 'pointer' }}>الدعم الفني</span>
                    </div>
                </footer>
            </div>
        </div>
    );
}
