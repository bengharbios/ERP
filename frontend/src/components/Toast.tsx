import { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
    type: ToastType;
    message: string;
    duration?: number;
    onClose: () => void;
}

const toastIcons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
};

const toastColors = {
    success: {
        bg: '#D1FAE5',
        border: '#10B981',
        text: '#065F46',
        icon: '#059669',
    },
    error: {
        bg: '#FEE2E2',
        border: '#EF4444',
        text: '#991B1B',
        icon: '#DC2626',
    },
    warning: {
        bg: '#FEF3C7',
        border: '#F59E0B',
        text: '#92400E',
        icon: '#D97706',
    },
    info: {
        bg: '#DBEAFE',
        border: '#3B82F6',
        text: '#1E40AF',
        icon: '#2563EB',
    },
};

export function Toast({ type, message, duration = 4000, onClose }: ToastProps) {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const colors = toastColors[type];

    return (
        <div
            style={{
                position: 'fixed',
                top: '1.5rem',
                right: '1.5rem',
                zIndex: 10000,
                minWidth: '320px',
                maxWidth: '500px',
                background: colors.bg,
                border: `2px solid ${colors.border}`,
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                animation: 'slideInRight 0.3s ease-out',
            }}
        >
            {/* Icon */}
            <div
                style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '50%',
                    background: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                    color: colors.icon,
                    fontWeight: '700',
                    flexShrink: 0,
                }}
            >
                {toastIcons[type]}
            </div>

            {/* Message */}
            <div style={{ flex: 1, color: colors.text, fontSize: '0.9375rem', lineHeight: '1.5' }}>
                {message}
            </div>

            {/* Close Button */}
            <button
                onClick={onClose}
                style={{
                    background: 'transparent',
                    border: 'none',
                    color: colors.text,
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '0.25rem',
                    opacity: 0.6,
                    transition: 'opacity 0.2s',
                    flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.6')}
            >
                ×
            </button>

            <style>{`
                @keyframes slideInRight {
                    from {
                        transform: translateX(120%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
