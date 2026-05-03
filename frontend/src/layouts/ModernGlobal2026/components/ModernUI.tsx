import React from 'react';
import './ModernUI.css';

interface ModernCardProps {
    title?: string;
    subtitle?: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
}

export const ModernCard: React.FC<ModernCardProps> = ({ title, subtitle, children, className = '', onClick }) => (
    <div className={`mg26-card ${onClick ? 'interactive' : ''} ${className}`} onClick={onClick}>
        {(title || subtitle) && (
            <div style={{ marginBottom: 'var(--mg26-space-lg)' }}>
                {title && <h3 className="mg26-card-title">{title}</h3>}
                {subtitle && <p className="mg26-card-subtitle">{subtitle}</p>}
            </div>
        )}
        {children}
    </div>
);

interface ModernStatProps {
    label: string;
    value: string | number;
    trend?: {
        value: string | number;
        direction: 'up' | 'down';
    };
}

export const ModernStat: React.FC<ModernStatProps> = ({ label, value, trend }) => (
    <div className="mg26-stat-card">
        <span className="mg26-stat-label">{label}</span>
        <span className="mg26-stat-value">{value}</span>
        {trend && (
            <div className={`mg26-stat-trend ${trend.direction}`}>
                {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
            </div>
        )}
    </div>
);

interface ModernTableProps {
    headers: string[];
    children: React.ReactNode;
}

export const ModernTable: React.FC<ModernTableProps> = ({ headers, children }) => (
    <div className="mg26-table-container">
        <table className="mg26-table">
            <thead>
                <tr>
                    {headers.map((h, i) => <th key={i}>{h}</th>)}
                </tr>
            </thead>
            <tbody>
                {children}
            </tbody>
        </table>
    </div>
);

interface ModernButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    icon?: React.ReactNode;
}

export const ModernButton: React.FC<ModernButtonProps> = ({ variant = 'primary', icon, children, className = '', ...props }) => (
    <button className={`mg26-btn mg26-btn-${variant} ${className}`} {...props}>
        {icon && <span>{icon}</span>}
        {children}
    </button>
);

export const ModernInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = ({ className = '', ...props }) => (
    <input className={`mg26-input ${className}`} {...props} />
);

export const ModernFormGroup: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
    <div className="mg26-form-group">
        <label className="mg26-label">{label}</label>
        {children}
    </div>
);

export const ModernLoader: React.FC = () => (
    <div className="mg26-loader-wrapper">
        <div className="mg26-loader"></div>
    </div>
);
