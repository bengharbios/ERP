import React from 'react';
import { HorizonTopbar, HorizonMobileBar } from './components/RapidosHeader';
import './RapidosLayout.css';
import './HorizonPages.css';

interface RapidosLayoutProps {
    children: React.ReactNode;
}

export function RapidosLayout({ children }: RapidosLayoutProps) {
    return (
        <div className="hz-root">
            <div className="hz-app">
                {/* Top Navigation */}
                <HorizonTopbar />

                {/* Content */}
                <main className="hz-main">
                    {children}
                </main>

                {/* Footer */}
                <footer className="hz-footer">
                    <div className="hz-footer-brand">
                        <div className="hz-footer-logo">⚡</div>
                        <span className="hz-footer-text">
                            © {new Date().getFullYear()} Rapidos Horizon — نظام إدارة المعهد
                        </span>
                    </div>
                    <div className="hz-footer-links">
                        {['الدعم الفني', 'سياسة الخصوصية', 'الشروط والأحكام'].map(link => (
                            <span key={link} className="hz-footer-link">{link}</span>
                        ))}
                    </div>
                    <div className="hz-footer-status">
                        <span className="hz-footer-status-dot" />
                        <span>جميع الأنظمة تعمل بكفاءة</span>
                    </div>
                </footer>

                {/* Mobile Bottom Bar */}
                <HorizonMobileBar />
            </div>
        </div>
    );
}
