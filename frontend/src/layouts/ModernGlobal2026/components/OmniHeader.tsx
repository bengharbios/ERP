import React from 'react';
import { Search, Bell, Grid, User } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export function OmniHeader() {
    const location = useLocation();

    // Basic breadcrumb logic
    const pathnames = location.pathname.split('/').filter((x) => x);

    return (
        <header className="mg26-header">
            {/* 1. Breadcrumbs / Context */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mg26-space-md)', flex: 1 }}>
                <div style={{ color: 'var(--mg26-text-muted)', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>الرئيسية</span>
                    {pathnames.map((value, index) => {
                        const last = index === pathnames.length - 1;
                        return (
                            <React.Fragment key={index}>
                                <span> / </span>
                                <span style={{ color: last ? 'var(--mg26-primary)' : 'inherit', fontWeight: last ? '600' : '400' }}>
                                    {decodeURIComponent(value)}
                                </span>
                            </React.Fragment>
                        );
                    })}
                </div>
            </div>

            {/* 2. Global Search (Omni-bar) */}
            <div style={{
                flex: 2,
                maxWidth: '600px',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--mg26-space-md)',
                backgroundColor: 'rgba(0,0,0,0.03)',
                padding: 'var(--mg26-space-sm) var(--mg26-space-xl)',
                borderRadius: 'var(--mg26-radius-pill)',
                border: '1px solid var(--mg26-border-subtle)',
                cursor: 'text'
            }}>
                <Search size={18} color="var(--mg26-text-muted)" />
                <span style={{ color: 'var(--mg26-text-muted)', fontSize: '14px' }}>ابحث عن طالب، موظف، أو صفحة... (CTRL + K)</span>
            </div>

            {/* 3. Global Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--mg26-space-xl)', flex: 1, justifyContent: 'flex-end' }}>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mg26-text-secondary)' }}>
                    <Bell size={20} />
                </button>
                <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--mg26-text-secondary)' }}>
                    <Grid size={20} />
                </button>
                <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: 'var(--mg26-radius-pill)',
                    backgroundColor: 'var(--mg26-primary-soft)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--mg26-primary)'
                }}>
                    <User size={20} />
                </div>
            </div>
        </header >
    );
}
