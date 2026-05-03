import React, { useEffect, useState } from 'react';
import {
    Users, GraduationCap, Wallet, TrendingUp, BookOpen, Layers,
    CalendarCheck, Bell, Zap, ArrowUpRight, ArrowDownRight,
    FileText, Clock, CheckCircle2, AlertCircle, BarChart3,
    UserCheck, Sparkles, ChevronLeft
} from 'lucide-react';
import {
    HzCard, HzCardHeader, HzCardTitle, HzPageHeader,
    HzStatsGrid, HzStat, HzBadge, HzBtn, HzSectionLabel
} from '../layouts/Rapidos2026/components/RapidosUI';
import { useNavigate } from 'react-router-dom';

/* ══════════════════════════════════════════
   QUICK ACTIONS
══════════════════════════════════════════ */
const QUICK_ACTIONS = [
    { icon: GraduationCap, label: 'طالب جديد', path: '/students', color: 'var(--hz-cyan)' },
    { icon: Wallet, label: 'سند قبض', path: '/receipt-vouchers', color: 'var(--hz-neon)' },
    { icon: CalendarCheck, label: 'تسجيل حضور', path: '/attendance', color: 'var(--hz-gold)' },
    { icon: FileText, label: 'كشف راتب', path: '/payroll', color: 'var(--hz-plasma)' },
    { icon: BookOpen, label: 'برنامج جديد', path: '/programs', color: 'var(--hz-coral)' },
];

/* ══════════════════════════════════════════
   RECENT ACTIVITY MOCK
══════════════════════════════════════════ */
const RECENT = [
    { icon: '👤', text: 'تم تسجيل طالب جديد', sub: 'أحمد محمد الخالد', time: 'منذ 5 دق', color: 'var(--hz-cyan)' },
    { icon: '💰', text: 'تم استلام دفعة رسوم', sub: 'SAR 2,400', time: 'منذ 20 دق', color: 'var(--hz-neon)' },
    { icon: '📋', text: 'إضافة جدول دراسي', sub: 'برنامج التسويق الرقمي', time: 'منذ 1 س', color: 'var(--hz-gold)' },
    { icon: '👨‍💼', text: 'موظف جديد تم تعيينه', sub: 'سارة العتيبي', time: 'منذ 2 س', color: 'var(--hz-plasma)' },
    { icon: '📊', text: 'تقرير شهري جاهز', sub: 'فبراير 2026', time: 'منذ 3 س', color: 'var(--hz-coral)' },
];

/* ══════════════════════════════════════════
   ANIMATED COUNTER HOOK
══════════════════════════════════════════ */
function useCounter(target: number, duration = 1400) {
    const [val, setVal] = useState(0);
    useEffect(() => {
        const start = Date.now();
        const tick = () => {
            const progress = Math.min((Date.now() - start) / duration, 1);
            const ease = 1 - Math.pow(1 - progress, 3);
            setVal(Math.round(ease * target));
            if (progress < 1) requestAnimationFrame(tick);
        };
        const raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [target, duration]);
    return val;
}

/* ══════════════════════════════════════════
   METRIC CARD with animated number
══════════════════════════════════════════ */
function MetricCard({ icon, value, label, sub, color, glow, delay = 0 }: any) {
    const count = useCounter(value);
    return (
        <div className="hz-metric-card hz-anim" style={{ animationDelay: `${delay}ms`, '--hz-stat-accent': color, '--hz-stat-glow': glow } as any}>
            <div className="hz-metric-icon" style={{ background: glow, border: `1px solid ${color}33`, color }}>
                {icon}
            </div>
            <div className="hz-metric-body">
                <div className="hz-metric-value" style={{ color }}>
                    {count.toLocaleString('ar-SA')}
                </div>
                <div className="hz-metric-label">{label}</div>
                {sub && <div className="hz-metric-sub">{sub}</div>}
            </div>
            <div className="hz-metric-glow" style={{ background: glow }} />
        </div>
    );
}

/* ══════════════════════════════════════════
   MAIN DASHBOARD
══════════════════════════════════════════ */
export default function Dashboard() {
    const navigate = useNavigate();
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء الخير' : 'مساء النور';

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* ── Welcome Banner ── */}
            <div className="hz-welcome hz-anim">
                <div className="hz-welcome-content">
                    <div className="hz-welcome-greeting">
                        <span className="hz-welcome-icon">⚡</span>
                        <div>
                            <h1 className="hz-welcome-title">{greeting}، مرحباً بك</h1>
                            <p className="hz-welcome-sub">
                                {now.toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                {' · '}نظام Horizon ERP 2030
                            </p>
                        </div>
                    </div>
                    <div className="hz-welcome-actions">
                        <button className="hz-btn hz-btn-primary" onClick={() => navigate('/students')}>
                            <GraduationCap size={16} /> تسجيل طالب
                        </button>
                        <button className="hz-btn hz-btn-secondary" onClick={() => navigate('/financial-reports')}>
                            <BarChart3 size={16} /> التقارير
                        </button>
                    </div>
                </div>
                {/* Background decorative elements */}
                <div className="hz-welcome-orb hz-welcome-orb-1" />
                <div className="hz-welcome-orb hz-welcome-orb-2" />
                <div className="hz-welcome-orb hz-welcome-orb-3" />
            </div>

            {/* ── Key Metrics ── */}
            <section>
                <HzSectionLabel>المؤشرات الرئيسية</HzSectionLabel>
                <div className="hz-metrics-grid">
                    <MetricCard icon={<GraduationCap size={22} />} value={847} label="إجمالي الطلاب" sub="↑ 12% الشهر الماضي" color="var(--hz-cyan)" glow="var(--hz-cyan-glow)" delay={0} />
                    <MetricCard icon={<BookOpen size={22} />} value={24} label="البرامج النشطة" color="var(--hz-gold)" glow="var(--hz-gold-glow)" delay={80} />
                    <MetricCard icon={<Wallet size={22} />} value={284500} label="الإيرادات الشهرية (ر.س)" color="var(--hz-neon)" glow="var(--hz-neon-glow)" delay={160} />
                    <MetricCard icon={<Users size={22} />} value={63} label="الموظفون الفعليون" color="var(--hz-plasma)" glow="var(--hz-plasma-glow)" delay={240} />
                </div>
            </section>

            {/* ── Quick Actions + Activity ── */}
            <div className="hz-dashboard-row">
                {/* Quick Actions */}
                <div className="hz-anim" style={{ animationDelay: '100ms', flex: '0 0 auto', minWidth: 0 }}>
                    <HzSectionLabel>الإجراءات السريعة</HzSectionLabel>
                    <div className="hz-quick-actions">
                        {QUICK_ACTIONS.map((a, i) => (
                            <button
                                key={a.path}
                                className="hz-quick-btn"
                                onClick={() => navigate(a.path)}
                                style={{ '--qa-color': a.color } as any}
                            >
                                <div className="hz-quick-icon">
                                    <a.icon size={20} />
                                </div>
                                <span>{a.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="hz-anim" style={{ flex: 1, minWidth: 0, animationDelay: '200ms' } as any}>
                    <HzSectionLabel>آخر النشاطات</HzSectionLabel>
                    <HzCard>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                            {RECENT.map((item, i) => (
                                <div key={i} className="hz-activity-item" style={{ '--act-color': item.color } as any}>
                                    <div className="hz-activity-icon-wrap">
                                        <span className="hz-activity-emoji">{item.icon}</span>
                                        {i < RECENT.length - 1 && <div className="hz-activity-line" />}
                                    </div>
                                    <div className="hz-activity-content">
                                        <div className="hz-activity-text">{item.text}</div>
                                        <div className="hz-activity-sub">{item.sub}</div>
                                    </div>
                                    <div className="hz-activity-time">{item.time}</div>
                                </div>
                            ))}
                        </div>
                    </HzCard>
                </div>
            </div>

            {/* ── Sections Overview  ── */}
            <section className="hz-anim" style={{ animationDelay: '300ms' }}>
                <HzSectionLabel>نظرة عامة على الأقسام</HzSectionLabel>
                <div className="hz-sections-grid">
                    {[
                        { label: 'الأكاديمية', sub: '847 طالب · 24 برنامج · 63 فصل', color: 'var(--hz-cyan)', path: '/programs', icon: GraduationCap, stat: '94%', statLabel: 'نسبة الحضور' },
                        { label: 'المالية', sub: 'إيرادات · رواتب · مصروفات', color: 'var(--hz-neon)', path: '/fees', icon: Wallet, stat: '284K', statLabel: 'إيرادات الشهر' },
                        { label: 'الموارد البشرية', sub: '63 موظف · 5 أقسام · حضور يومي', color: 'var(--hz-gold)', path: '/hr-dashboard', icon: UserCheck, stat: '97%', statLabel: 'نسبة الانتظام' },
                        { label: 'التسويق والتواصل', sub: 'عملاء · عروض · حملات · واتساب', color: 'var(--hz-plasma)', path: '/crm', icon: TrendingUp, stat: '38', statLabel: 'عميل محتمل' },
                    ].map((sec, i) => (
                        <div
                            key={sec.label}
                            className="hz-section-card"
                            onClick={() => navigate(sec.path)}
                            style={{ '--sc-color': sec.color } as any}
                        >
                            <div className="hz-section-card-icon">
                                <sec.icon size={24} />
                            </div>
                            <div className="hz-section-card-body">
                                <div className="hz-section-card-title">{sec.label}</div>
                                <div className="hz-section-card-sub">{sec.sub}</div>
                            </div>
                            <div className="hz-section-card-stat">
                                <div className="hz-section-card-stat-val">{sec.stat}</div>
                                <div className="hz-section-card-stat-label">{sec.statLabel}</div>
                            </div>
                            <ChevronLeft size={16} className="hz-section-card-arrow" />
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
