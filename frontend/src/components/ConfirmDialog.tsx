export interface ConfirmDialogProps {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
    onCancel: () => void;
}

const dialogColors = {
    danger: {
        icon: '🗑️',
        iconBg: '#FEE2E2',
        iconColor: '#DC2626',
        confirmBg: '#DC2626',
        confirmHover: '#B91C1C',
    },
    warning: {
        icon: '⚠️',
        iconBg: '#FEF3C7',
        iconColor: '#D97706',
        confirmBg: '#F59E0B',
        confirmHover: '#D97706',
    },
    info: {
        icon: 'ℹ️',
        iconBg: '#DBEAFE',
        iconColor: '#2563EB',
        confirmBg: '#3B82F6',
        confirmHover: '#2563EB',
    },
};

export function ConfirmDialog({
    title,
    message,
    confirmText = 'تأكيد',
    cancelText = 'إلغاء',
    type = 'info',
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    const colors = dialogColors[type];

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(0,0,0,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9000,
                padding: '1rem',
                animation: 'fadeIn 0.2s ease-out',
            }}
            onClick={onCancel}
        >
            <div
                className="stat-card"
                style={{
                    maxWidth: '450px',
                    width: '100%',
                    animation: 'scaleIn 0.3s ease-out',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Icon */}
                <div
                    style={{
                        width: '64px',
                        height: '64px',
                        borderRadius: '50%',
                        background: colors.iconBg,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '2rem',
                        margin: '0 auto 1.5rem',
                    }}
                >
                    {colors.icon}
                </div>

                {/* Title */}
                <h2
                    style={{
                        fontSize: '1.375rem',
                        fontWeight: '600',
                        color: '#2D3748',
                        margin: '0 0 1rem 0',
                        textAlign: 'center',
                    }}
                >
                    {title}
                </h2>

                {/* Message */}
                <p
                    style={{
                        fontSize: '1rem',
                        color: '#718096',
                        lineHeight: '1.6',
                        margin: '0 0 2rem 0',
                        textAlign: 'center',
                        whiteSpace: 'pre-line',
                    }}
                >
                    {message}
                </p>

                {/* Buttons */}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button
                        onClick={onCancel}
                        className="btn btn-outline"
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            fontSize: '1rem',
                            padding: '0.75rem',
                        }}
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        style={{
                            flex: 1,
                            justifyContent: 'center',
                            fontSize: '1rem',
                            padding: '0.75rem',
                            background: colors.confirmBg,
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'all 0.2s',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = colors.confirmHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = colors.confirmBg)}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                @keyframes scaleIn {
                    from {
                        transform: scale(0.9);
                        opacity: 0;
                    }
                    to {
                        transform: scale(1);
                        opacity: 1;
                    }
                }
            `}</style>
        </div>
    );
}
