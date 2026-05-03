// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
    Settings, Save, Calendar, Clock,
    AlertTriangle, ShieldCheck, Timer,
    CheckCircle2, Coffee, Moon, Sun,
    Zap, Lock, HelpCircle
} from 'lucide-react';
import { settingsService } from '../services/settings.service';
import { Toast, ToastType } from '../components/Toast';
import {
    HzPageHeader, HzStat, HzStatsGrid, HzBtn,
    HzBadge, HzInput, HzLoader
} from '../layouts/Rapidos2026/components/RapidosUI';
import './HRSettings2026.css';

const daysOfWeek = [
    { id: 'Sunday', label: 'الأحد', short: 'ح' },
    { id: 'Monday', label: 'الإثنين', short: 'ن' },
    { id: 'Tuesday', label: 'الثلاثاء', short: 'ث' },
    { id: 'Wednesday', label: 'الأربعاء', short: 'ر' },
    { id: 'Thursday', label: 'الخميس', short: 'خ' },
    { id: 'Friday', label: 'الجمعة', short: 'ج' },
    { id: 'Saturday', label: 'السبت', short: 'س' }
];

/**
 * HR STRATEGIC SETTINGS (Rapidos 2026)
 * Configuration for Working Hours, Late Policies, and Attendance Rules
 */

export default function HRSettings2026() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    const [settings, setSettings] = useState({
        hrWorkingDays: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"],
        hrWorkStartTime: "09:00",
        hrWorkEndTime: "17:00",
        hrLateGracePeriod: 15,
        hrAbsenceThreshold: 60,
        hrLateHourDeduction: 0,
        hrShiftEnabled: false
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await settingsService.getSettings();
            if (res.data?.settings) {
                const rawDays = res.data.settings.hrWorkingDays;
                const parsedDays = Array.isArray(rawDays) ? rawDays : (typeof rawDays === 'string' ? JSON.parse(rawDays) : settings.hrWorkingDays);

                setSettings({
                    ...settings,
                    ...res.data.settings,
                    hrWorkingDays: parsedDays
                });
            }
        } catch (err) {
            setToast({ type: 'error', message: '❌ فشل تحميل الإعدادات' });
        } finally {
            setLoading(false);
        }
    };

    const toggleDay = (dayId: string) => {
        const currentDays = [...settings.hrWorkingDays];
        if (currentDays.includes(dayId)) {
            setSettings({ ...settings, hrWorkingDays: currentDays.filter(d => d !== dayId) });
        } else {
            setSettings({ ...settings, hrWorkingDays: [...currentDays, dayId] });
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await settingsService.updateSettings(settings);
            setToast({ type: 'success', message: '✅ تم حفظ الإعدادات الإستراتيجية بنجاح' });
        } catch (err) {
            setToast({ type: 'error', message: '❌ فشل حفظ الإعدادات' });
        } finally {
            setSaving(false);
        }
    };

    const stats = useMemo(() => ({
        workingDaysCount: settings.hrWorkingDays.length,
        dailyHours: (() => {
            const [sh, sm] = settings.hrWorkStartTime.split(':').map(Number);
            const [eh, em] = settings.hrWorkEndTime.split(':').map(Number);
            let diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff < 0) diff += 1440;
            return (diff / 60).toFixed(1);
        })(),
        strictness: settings.hrLateGracePeriod <= 10 ? 'عالي' : 'متوازن'
    }), [settings]);

    if (loading) return <div style={{ padding: '40px' }}><HzLoader /></div>;

    return (
        <div style={{ padding: '0 24px 40px' }}>
            {/* Header Area */}
            <HzPageHeader
                title="إعدادات الموارد البشرية"
                subtitle="تشكيل سياسات العمل، أوقات الدوام، وقواعد الانضباط المؤسسي"
                icon={<Settings size={22} />}
                actions={
                    <HzBtn variant="primary" onClick={handleSave} disabled={saving} icon={<Save size={16} />}>
                        {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات الإستراتيجية'}
                    </HzBtn>
                }
            />

            {/* Quick Stats Grid */}
            <HzStatsGrid>
                <HzStat icon={<Calendar size={20} />} value={stats.workingDaysCount} label="أيام العمل/أسبوع" color="cyan" />
                <HzStat icon={<Clock size={20} />} value={`${stats.dailyHours} ساعة`} label="ساعات الدوام اليومي" color="neon" />
                <HzStat icon={<ShieldCheck size={20} />} value={stats.strictness} label="مستوى الانضباط" color="plasma" />
                <HzStat icon={<Timer size={20} />} value={`${settings.hrLateGracePeriod} د`} label="فترة السماح" color="gold" />
            </HzStatsGrid>

            <main className="hrs-root">
                {/* 1. Working Schedule Shelf */}
                <section className="hrs-shelf hz-anim">
                    <div className="hrs-shelf-header">
                        <Calendar size={18} color="var(--hz-cyan)" />
                        <span className="hrs-shelf-title">أوقات العمل وأيام الإسبوع</span>
                    </div>
                    <div className="hrs-shelf-body">
                        <div className="hz-form-group">
                            <label className="hz-label">أيام العمل الأسبوعية (اختر للموافقة)</label>
                            <div className="hrs-days-grid">
                                {daysOfWeek.map(day => {
                                    const active = settings.hrWorkingDays.includes(day.id);
                                    return (
                                        <div key={day.id} className={`hrs-day-card ${active ? 'active' : ''}`} onClick={() => toggleDay(day.id)}>
                                            <div className="hrs-day-icon">
                                                {day.id === 'Friday' ? <Moon size={14} /> : <Sun size={14} />}
                                            </div>
                                            <span className="hrs-day-label">{day.label}</span>
                                            {active && <CheckCircle2 size={12} style={{ marginTop: 'auto', color: 'var(--hz-cyan)' }} />}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="hz-divider" />

                        <div className="hz-grid-2">
                            <HzInput
                                label="وقت بدء العمل الرسمي"
                                type="time"
                                value={settings.hrWorkStartTime}
                                onChange={v => setSettings({ ...settings, hrWorkStartTime: v })}
                                icon={<Sun size={14} />}
                            />
                            <HzInput
                                label="وقت نهاية العمل الرسمي"
                                type="time"
                                value={settings.hrWorkEndTime}
                                onChange={v => setSettings({ ...settings, hrWorkEndTime: v })}
                                icon={<Moon size={14} />}
                            />
                        </div>

                        <div style={{ marginTop: '24px' }}>
                            <div className="hrs-switch-box">
                                <div className="hrs-switch-info">
                                    <div className="hrs-switch-title">تفعيل نظام المناوبات (Shifts Management)</div>
                                    <div className="hrs-switch-desc">السماح بتوزيع الموظفين على فترات عمل متغيرة (صباحي/مسائي/مدمج) بدلاً من الدوام الموحد.</div>
                                </div>
                                <input
                                    type="checkbox"
                                    style={{ width: '22px', height: '22px', accentColor: 'var(--hz-cyan)', cursor: 'pointer' }}
                                    checked={settings.hrShiftEnabled}
                                    onChange={e => setSettings({ ...settings, hrShiftEnabled: e.target.checked })}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 2. Attendance & Late Policy Shelf */}
                <section className="hrs-shelf hz-anim" style={{ animationDelay: '100ms' }}>
                    <div className="hrs-shelf-header">
                        <Timer size={18} color="var(--hz-gold)" />
                        <span className="hrs-shelf-title">سياسة الانضباط والتأخير الذكي</span>
                    </div>
                    <div className="hrs-shelf-body">
                        <div className="hz-grid-2">
                            <div className="hz-form-group">
                                <HzInput
                                    label="فترة السماح (Grace Period)"
                                    type="number"
                                    value={String(settings.hrLateGracePeriod)}
                                    onChange={v => setSettings({ ...settings, hrLateGracePeriod: parseInt(v) || 0 })}
                                />
                                <small className="hz-text-muted">عدد الدقائق التي لا يعتبر فيها الموظف "متأخراً" بعد بدء الدوام.</small>
                            </div>
                            <div className="hz-form-group">
                                <HzInput
                                    label="حد اعتبار الموظف غائباً"
                                    type="number"
                                    value={String(settings.hrAbsenceThreshold)}
                                    onChange={v => setSettings({ ...settings, hrAbsenceThreshold: parseInt(v) || 0 })}
                                />
                                <small className="hz-text-muted">إذا تجاوز التأخير هذه المدة، يسقط الموظف في حالة غياب تلقائي.</small>
                            </div>
                            <div className="hz-form-group">
                                <HzInput
                                    label="قيمة الخصم عن كل ساعة تأخير"
                                    type="number"
                                    value={String(settings.hrLateHourDeduction)}
                                    onChange={v => setSettings({ ...settings, hrLateHourDeduction: parseFloat(v) || 0 })}
                                    icon={<Zap size={14} />}
                                />
                                <small className="hz-text-muted">المبلغ المخصوم من الراتب الأساسي مقابل كل 60 دقيقة تأخير تراكمية.</small>
                            </div>

                            <div className="hz-form-group">
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--hz-text-muted)', fontSize: '0.8rem', marginTop: '28px' }}>
                                    <Lock size={14} />
                                    تطبق هذه القواعد تلقائياً عند استرداد بيانات البصمة.
                                </div>
                            </div>
                        </div>

                        {settings.hrLateHourDeduction > 0 && (
                            <div className="hrs-preview">
                                <AlertTriangle size={18} />
                                تنبيه الحسابات: سيقوم النظام بخصم {settings.hrLateHourDeduction} ريال عن كل ساعة تأخير في مسير الرواتب القادم.
                            </div>
                        )}
                    </div>
                </section>

                <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--hz-text-dim)', fontSize: '0.75rem', gap: '8px', marginTop: '12px' }}>
                    <HelpCircle size={14} />
                    كل التغييرات في هذه الصفحة تؤثر مباشرة على تقارير الحضور الذكي ومسيرات الرواتب.
                </div>
            </main>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
