
import React, { useState, useEffect } from 'react';
import { settingsService } from '../services/settings.service';
import './HRSettings.css';

const daysOfWeek = [
    { id: 'Sunday', label: 'الأحد' },
    { id: 'Monday', label: 'الأثنين' },
    { id: 'Tuesday', label: 'الثلاثاء' },
    { id: 'Wednesday', label: 'الأربعاء' },
    { id: 'Thursday', label: 'الخميس' },
    { id: 'Friday', label: 'الجمعة' },
    { id: 'Saturday', label: 'السبت' }
];

const HRSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
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
        try {
            const res = await settingsService.getSettings();
            if (res.data?.settings) {
                // Parse hrWorkingDays if it's a string/json
                const rawDays = res.data.settings.hrWorkingDays;
                const parsedDays = Array.isArray(rawDays) ? rawDays : (typeof rawDays === 'string' ? JSON.parse(rawDays) : settings.hrWorkingDays);

                setSettings({
                    ...settings,
                    ...res.data.settings,
                    hrWorkingDays: parsedDays
                });
            }
        } catch (err) {
            console.error('Error fetching HR settings:', err);
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
            alert('تم حفظ إعدادات الموارد البشرية بنجاح!');
        } catch (err) {
            console.error('Error saving HR settings:', err);
            alert('حدث خطأ أثناء الحفظ');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="hr-settings-container">جاري تحميل الإعدادات...</div>;

    return (
        <div className="hr-settings-container">
            <header className="settings-header">
                <h1>إعدادات القوى العاملة والحضور</h1>
                <p>قم بتشكيل سياسات العمل، أوقات الدوام، وقواعد الانضباط وفق المعايير العالمية</p>
            </header>

            <div className="settings-grid">
                {/* Working Days & Hours */}
                <div className="settings-card">
                    <div className="card-title">
                        <i>🗓️</i>
                        <h2>أوقات العمل وأيام الأسبوع</h2>
                    </div>

                    <div className="input-group">
                        <label>أيام العمل الأسبوعية</label>
                        <div className="days-selector">
                            {daysOfWeek.map(day => (
                                <div
                                    key={day.id}
                                    className={`day-chip ${settings.hrWorkingDays.includes(day.id) ? 'active' : ''}`}
                                    onClick={() => toggleDay(day.id)}
                                >
                                    {day.label}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="input-group">
                            <label>وقت بدء العمل الرسمي</label>
                            <input
                                type="time"
                                value={settings.hrWorkStartTime}
                                onChange={(e) => setSettings({ ...settings, hrWorkStartTime: e.target.value })}
                            />
                        </div>
                        <div className="input-group">
                            <label>وقت نهاية العمل الرسمي</label>
                            <input
                                type="time"
                                value={settings.hrWorkEndTime}
                                onChange={(e) => setSettings({ ...settings, hrWorkEndTime: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="switch-group">
                        <label style={{ fontWeight: 700 }}>تفعيل نظام المناوبات (Shifts)</label>
                        <input
                            type="checkbox"
                            style={{ width: '24px', height: '24px', accentColor: '#ff9d00' }}
                            checked={settings.hrShiftEnabled}
                            onChange={(e) => setSettings({ ...settings, hrShiftEnabled: e.target.checked })}
                        />
                    </div>
                </div>

                {/* Late Arrival & Attendance Policy */}
                <div className="settings-card">
                    <div className="card-title">
                        <i>⏱️</i>
                        <h2>سياسة الانضباط والتأخير</h2>
                    </div>

                    <div className="input-group">
                        <label>فترة السماح عند الدخول (دقائق)</label>
                        <input
                            type="number"
                            value={settings.hrLateGracePeriod}
                            onChange={(e) => setSettings({ ...settings, hrLateGracePeriod: parseInt(e.target.value) })}
                        />
                        <small style={{ color: 'var(--text-muted)' }}>الموظف لا يعتبر متأخراً إذا سجل دخوله خلال هذه الفترة</small>
                    </div>

                    <div className="input-group">
                        <label>حد اعتبار الموظف "غائباً" (دقائق)</label>
                        <input
                            type="number"
                            value={settings.hrAbsenceThreshold}
                            onChange={(e) => setSettings({ ...settings, hrAbsenceThreshold: parseInt(e.target.value) })}
                        />
                        <small style={{ color: 'var(--text-muted)' }}>إذا تجاوز التأخير هذه المدة، يتم تسجيل اليوم كغياب تلقائياً</small>
                    </div>

                    <div className="input-group">
                        <label>قيمة الخصم عن كل ساعة تأخير (ر.س)</label>
                        <input
                            type="number"
                            value={settings.hrLateHourDeduction}
                            onChange={(e) => setSettings({ ...settings, hrLateHourDeduction: parseFloat(e.target.value) })}
                        />
                    </div>

                    {settings.hrLateHourDeduction > 0 && (
                        <div className="deduction-preview">
                            <span>⚠️</span>
                            سيقوم النظام تلقائياً بخصم {settings.hrLateHourDeduction} ريال من الراتب الأساسي مقابل كل 60 دقيقة تأخير إجمالية.
                        </div>
                    )}
                </div>
            </div>

            <div className="actions-bar">
                <button
                    className="btn-save"
                    onClick={handleSave}
                    disabled={saving}
                >
                    {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات الإستراتيجية'}
                </button>
            </div>
        </div>
    );
};

export default HRSettings;
