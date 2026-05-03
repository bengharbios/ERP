import React from 'react';
import { createPortal } from 'react-dom';
import './RapidosUI.css';

/* ══════════════════════════════════════════════
   TYPE DEFINITIONS
══════════════════════════════════════════════ */

type HzColor = 'cyan' | 'neon' | 'coral' | 'gold' | 'plasma' | 'dim';
type HzBtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'neon';
type HzBtnSize = 'sm' | 'md' | 'lg' | 'icon';

/* ══════════════════════════════════════════════
   CARD
══════════════════════════════════════════════ */
interface HzCardProps {
    children: React.ReactNode;
    className?: string;
    hoverable?: boolean;
    glow?: boolean;
    glass?: boolean;
    style?: React.CSSProperties;
    onClick?: () => void;
}

export function HzCard({ children, className = '', hoverable, glow, glass, style, onClick }: HzCardProps) {
    const cls = ['hz-card', hoverable && 'hoverable', glow && 'glow', glass && 'glass', className]
        .filter(Boolean).join(' ');
    return <div className={cls} style={style} onClick={onClick}>{children}</div>;
}

interface HzCardHeaderProps { children: React.ReactNode; }
export function HzCardHeader({ children }: HzCardHeaderProps) {
    return <div className="hz-card-header">{children}</div>;
}
interface HzCardTitleProps { children: React.ReactNode; subtitle?: string; }
export function HzCardTitle({ children, subtitle }: HzCardTitleProps) {
    return (
        <div>
            <h3 className="hz-card-title">{children}</h3>
            {subtitle && <p className="hz-card-subtitle">{subtitle}</p>}
        </div>
    );
}

/* ══════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════ */
interface HzStatProps {
    icon: React.ReactNode;
    value: string | number;
    label: string;
    trend?: { direction: 'up' | 'down'; label: string };
    color?: HzColor;
}

const COLOR_MAP: Record<HzColor, { accent: string; glow: string; iconBg: string }> = {
    cyan: { accent: 'var(--hz-cyan)', glow: 'var(--hz-cyan-glow)', iconBg: 'var(--hz-cyan-glow)' },
    neon: { accent: 'var(--hz-neon)', glow: 'var(--hz-neon-glow)', iconBg: 'var(--hz-neon-glow)' },
    coral: { accent: 'var(--hz-coral)', glow: 'var(--hz-coral-glow)', iconBg: 'var(--hz-coral-glow)' },
    gold: { accent: 'var(--hz-gold)', glow: 'var(--hz-gold-glow)', iconBg: 'var(--hz-gold-glow)' },
    plasma: { accent: 'var(--hz-plasma)', glow: 'var(--hz-plasma-glow)', iconBg: 'var(--hz-plasma-glow)' },
    dim: { accent: 'var(--hz-text-muted)', glow: 'transparent', iconBg: 'var(--hz-surface-2)' },
};

export function HzStat({ icon, value, label, trend, color = 'cyan' }: HzStatProps) {
    const c = COLOR_MAP[color];
    return (
        <div
            className="hz-stat"
            style={{ '--hz-stat-accent': c.accent, '--hz-stat-glow': c.glow, '--hz-stat-icon-bg': c.iconBg } as any}
        >
            <div className="hz-stat-icon">{icon}</div>
            <div className="hz-stat-body">
                <div className="hz-stat-value">{value}</div>
                <div className="hz-stat-label">{label}</div>
                {trend && (
                    <div className={`hz-stat-trend ${trend.direction}`}>
                        {trend.direction === 'up' ? '↑' : '↓'} {trend.label}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════════
   BUTTON
══════════════════════════════════════════════ */
interface HzBtnProps {
    children: React.ReactNode;
    variant?: HzBtnVariant;
    size?: HzBtnSize;
    onClick?: () => void;
    disabled?: boolean;
    type?: 'button' | 'submit' | 'reset';
    className?: string;
    icon?: React.ReactNode;
}

export function HzBtn({
    children, variant = 'primary', size = 'md', onClick, disabled, type = 'button', className = '', icon
}: HzBtnProps) {
    const cls = [
        'hz-btn',
        `hz-btn-${variant}`,
        size !== 'md' && `hz-btn-${size}`,
        className
    ].filter(Boolean).join(' ');
    return (
        <button className={cls} onClick={onClick} disabled={disabled} type={type}>
            {icon && icon}
            {children}
        </button>
    );
}

/* ══════════════════════════════════════════════
   INPUT
══════════════════════════════════════════════ */
interface HzInputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (v: string) => void;
    icon?: React.ReactNode;
    type?: string;
    disabled?: boolean;
    required?: boolean;
}

export function HzInput({ label, placeholder, value, onChange, icon, type = 'text', disabled, required }: HzInputProps) {
    return (
        <div className="hz-form-group">
            {label && <label className="hz-label">{label}{required && ' *'}</label>}
            <div className="hz-input-wrapper">
                {icon && <span className="hz-input-icon">{icon}</span>}
                <input
                    type={type}
                    className={`hz-input${icon ? ' has-icon' : ''}`}
                    placeholder={placeholder}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                    required={required}
                />
            </div>
        </div>
    );
}

interface HzSelectProps {
    label?: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    disabled?: boolean;
}

export function HzSelect({ label, value, onChange, options, disabled }: HzSelectProps) {
    return (
        <div className="hz-form-group">
            {label && <label className="hz-label">{label}</label>}
            <select
                className="hz-select"
                value={value}
                onChange={e => onChange(e.target.value)}
                disabled={disabled}
            >
                {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
        </div>
    );
}

/* ══════════════════════════════════════════════
   TABLE
══════════════════════════════════════════════ */
interface Column<T> { key: keyof T | string; label: string; render?: (row: T) => React.ReactNode; }
interface HzTableProps<T> { columns: Column<T>[]; data: T[]; keyField: keyof T; loading?: boolean; }

export function HzTable<T>({ columns, data, keyField, loading }: HzTableProps<T>) {
    if (loading) return <HzLoader />;
    return (
        <div className="hz-table-wrap">
            <table className="hz-table">
                <thead>
                    <tr>
                        {columns.map(c => <th key={String(c.key)}>{c.label}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={columns.length} style={{ textAlign: 'center', padding: '40px', color: 'var(--hz-text-muted)' }}>
                                لا توجد بيانات
                            </td>
                        </tr>
                    ) : data.map(row => (
                        <tr key={String(row[keyField])}>
                            {columns.map(c => (
                                <td key={String(c.key)}>
                                    {c.render ? c.render(row) : String((row as any)[c.key] ?? '—')}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

/* ══════════════════════════════════════════════
   BADGE
══════════════════════════════════════════════ */
interface HzBadgeProps { children: React.ReactNode; color?: HzColor; }
export function HzBadge({ children, color = 'cyan' }: HzBadgeProps) {
    return <span className={`hz-badge hz-badge-${color}`}>{children}</span>;
}

/* ══════════════════════════════════════════════
   LOADER
══════════════════════════════════════════════ */
export function HzLoader() {
    return (
        <div className="hz-loader-wrap">
            <div className="hz-loader" />
        </div>
    );
}

/* ══════════════════════════════════════════════
   EMPTY STATE
══════════════════════════════════════════════ */
interface HzEmptyProps { icon?: string; title?: string; description?: string; action?: React.ReactNode; }
export function HzEmpty({ icon = '📭', title = 'لا توجد بيانات', description, action }: HzEmptyProps) {
    return (
        <div className="hz-empty">
            <div className="hz-empty-icon">{icon}</div>
            <h3>{title}</h3>
            {description && <p>{description}</p>}
            {action}
        </div>
    );
}

/* ══════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════ */
interface HzModalProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg';
    icon?: React.ReactNode;
}

export function HzModal({ open, onClose, title, children, footer, icon, size = 'md' }: HzModalProps) {
    if (!open) return null;
    return createPortal(
        <div className="hz-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <div className={`hz-modal sz-${size}`}>
                <div className="hz-modal-header">
                    <div className="hz-modal-title-group">
                        {icon && <span className="hz-modal-icon">{icon}</span>}
                        <h2 className="hz-modal-title">{title}</h2>
                    </div>
                    <button className="hz-modal-close" onClick={onClose}>✕</button>
                </div>
                <div className="hz-modal-body">{children}</div>
                {footer && <div className="hz-modal-footer">{footer}</div>}
            </div>
        </div>,
        document.body
    );
}

/* ══════════════════════════════════════════════
   PAGE HEADER
══════════════════════════════════════════════ */
interface HzPageHeaderProps {
    title: string;
    subtitle?: string;
    icon?: React.ReactNode;
    actions?: React.ReactNode;
}

export function HzPageHeader({ title, subtitle, icon, actions }: HzPageHeaderProps) {
    return (
        <div className="hz-page-header hz-anim">
            <div className="hz-page-title-group">
                {icon && <div className="hz-page-icon">{icon}</div>}
                <div>
                    <h1 className="hz-page-title">{title}</h1>
                    {subtitle && <p className="hz-page-subtitle">{subtitle}</p>}
                </div>
            </div>
            {actions && <div className="hz-page-actions">{actions}</div>}
        </div>
    );
}

/* ══════════════════════════════════════════════
   STATS GRID WRAPPER
══════════════════════════════════════════════ */
interface HzStatsGridProps { children: React.ReactNode; }
export function HzStatsGrid({ children }: HzStatsGridProps) {
    return <div className="hz-stats-grid">{children}</div>;
}

/* ══════════════════════════════════════════════
   SECTION LABEL
══════════════════════════════════════════════ */
interface HzSectionLabelProps { children: React.ReactNode; }
export function HzSectionLabel({ children }: HzSectionLabelProps) {
    return <div className="hz-section-label">{children}</div>;
}
