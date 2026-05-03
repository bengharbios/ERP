// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
    Clock, Search, Plus, Filter,
    X, Edit2, Trash2,
    Sun, Moon, Layers, Calendar,
    Timer, Coffee, FileText, Download,
    Printer
} from 'lucide-react';
import { hrmsService } from '../services/hrms.service';
import { Toast, ToastType } from '../components/Toast';
import {
    HzPageHeader, HzStat, HzStatsGrid, HzBtn,
    HzBadge, HzModal, HzInput, HzSelect, HzLoader, HzEmpty
} from '../layouts/Rapidos2026/components/RapidosUI';
import './HRShifts.css';

/**
 * INTELLIGENT SHIFT SCHEDULER (Rapidos 2026)
 * Real-time Roster Management & Split Shifts
 */

export default function HRShifts() {
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    const initialFormState = {
        nameAr: '',
        nameEn: '',
        startTime: '',
        endTime: '',
        type: 'M',
        isSplit: false,
        startTime2: '',
        endTime2: '',
        breakDuration: 0,
        totalHours: 0
    };

    const [formData, setFormData] = useState(initialFormState);

    useEffect(() => {
        fetchShifts();
    }, []);

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const res = await hrmsService.getShifts();
            setShifts(res.data || []);
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل تحميل المناوبات' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (shift: any) => {
        setEditingShiftId(shift.id);
        setFormData({
            nameAr: shift.nameAr,
            nameEn: shift.nameEn || '',
            startTime: shift.startTime,
            endTime: shift.endTime,
            type: shift.type || 'M',
            isSplit: !!shift.isSplit,
            startTime2: shift.startTime2 || '',
            endTime2: shift.endTime2 || '',
            breakDuration: shift.breakDuration || 0,
            totalHours: shift.totalHours || 0
        });
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('هل أنت متأكد من حذف هذه المناوبة؟')) return;
        try {
            const res = await hrmsService.deleteShift(id);
            if (res.success) {
                setToast({ type: 'success', message: '✅ تم حذف المناوبة' });
                fetchShifts();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل الحذف' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            const calcMins = (start: string, end: string) => {
                if (!start || !end) return 0;
                const [h1, m1] = start.split(':').map(Number);
                const [h2, m2] = end.split(':').map(Number);
                let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                if (diff < 0) diff += 1440;
                return diff;
            };
            const m1 = calcMins(formData.startTime, formData.endTime);
            const m2 = formData.isSplit ? calcMins(formData.startTime2, formData.endTime2) : 0;
            const finalTotalHours = Math.max(0, (m1 + m2 - (formData.breakDuration || 0)) / 60);

            const submissionData = { ...formData, totalHours: finalTotalHours };

            const res = editingShiftId
                ? await hrmsService.updateShift(editingShiftId, submissionData)
                : await hrmsService.createShift(submissionData);

            if (res.success) {
                setToast({ type: 'success', message: '✅ تم حفظ المناوبة بنجاح' });
                setShowModal(false);
                setFormData(initialFormState);
                setEditingShiftId(null);
                fetchShifts();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل حفظ البيانات' });
        }
    };

    const stats = useMemo(() => ({
        total: shifts.length,
        morning: shifts.filter(s => s.type === 'M').length,
        evening: shifts.filter(s => s.type === 'E').length,
        split: shifts.filter(s => s.isSplit).length
    }), [shifts]);

    return (
        <div style={{ padding: '0 24px 24px' }}>
            {/* Header Area */}
            <HzPageHeader
                title="إدارة المناوبات"
                subtitle="جدولة فترات العمل وأوقات الدوام الرسمي"
                icon={<Clock size={24} />}
                actions={
                    <>
                        <HzBtn variant="secondary" className="hide-mobile" onClick={() => window.print()} icon={<Printer size={16} />}>
                            تصدير التقرير
                        </HzBtn>
                        <HzBtn variant="primary" onClick={() => { setEditingShiftId(null); setFormData(initialFormState); setShowModal(true); }} icon={<Plus size={16} />}>
                            إضافة مناوبة عمل
                        </HzBtn>
                    </>
                }
            />

            {/* Stats Area */}
            <HzStatsGrid>
                <HzStat icon={<Timer size={20} />} value={stats.total} label="إجمالي المناوبات" color="gold" />
                <HzStat icon={<Sun size={20} />} value={stats.morning} label="فترات صباحية" color="neon" />
                <HzStat icon={<Moon size={20} />} value={stats.evening} label="فترات مسائية" color="coral" />
                <HzStat icon={<Layers size={20} />} value={stats.split} label="نظام فترتين (Split)" color="plasma" />
            </HzStatsGrid>

            {/* Table Area */}
            <main className="hz-main-content">
                {loading && shifts.length === 0 ? (
                    <HzLoader />
                ) : (
                    <div className="hz-table-wrap">
                        <table className="hz-table">
                            <thead>
                                <tr>
                                    <th>اسم المناوبة</th>
                                    <th>النوع</th>
                                    <th>ساعات العمل</th>
                                    <th>النظام</th>
                                    <th className="hide-mobile">الموظفين</th>
                                    <th className="text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {shifts.map(shift => (
                                    <tr key={shift.id}>
                                        <td data-label="المناوبة">
                                            <div style={{ fontWeight: 800 }}>{shift.nameAr}</div>
                                            <div className="hz-text-muted" style={{ fontSize: '0.75rem' }}>{shift.nameEn}</div>
                                        </td>
                                        <td data-label="النوع">
                                            <HzBadge color={shift.type === 'M' ? 'neon' : shift.type === 'E' ? 'coral' : 'plasma'}>
                                                {shift.type === 'M' ? 'صباحي' : shift.type === 'E' ? 'مسائي' : 'مدمج'}
                                            </HzBadge>
                                        </td>
                                        <td data-label="الأوقات">
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                <HzBadge color="dim">{shift.startTime} - {shift.endTime}</HzBadge>
                                                {shift.isSplit && <HzBadge color="gold">فترة 2: {shift.startTime2} - {shift.endTime2}</HzBadge>}
                                            </div>
                                        </td>
                                        <td data-label="النظام">
                                            <div style={{ fontWeight: 700 }}>{shift.totalHours.toFixed(2)} ساعة</div>
                                            {shift.breakDuration > 0 && <div className="hz-text-muted" style={{ fontSize: '0.75rem' }}>استراحة: {shift.breakDuration} دقيقة</div>}
                                        </td>
                                        <td className="hide-mobile" data-label="الموظفين">
                                            <HzBadge color="dim">{shift._count?.employees || 0} موظف</HzBadge>
                                        </td>
                                        <td className="text-center">
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                <HzBtn variant="ghost" size="icon" onClick={() => handleEdit(shift)}><Edit2 size={14} /></HzBtn>
                                                <HzBtn variant="danger" size="icon" onClick={() => handleDelete(shift.id)}><Trash2 size={14} /></HzBtn>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {shifts.length === 0 && !loading && (
                                    <tr>
                                        <td colSpan={6}>
                                            <HzEmpty title="لا توجد مناوبات" description="ابدأ بإضافة أول مناوبة عمل للمؤسسة." />
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* Edit/Create Modal (Thabat Al-Form) */}
            <HzModal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingShiftId ? 'تعديل مناوبة عمل' : 'إضافة مناوبة عمل جديدة'}
                footer={
                    <>
                        <HzBtn variant="secondary" onClick={() => setShowModal(false)}>تراجع</HzBtn>
                        <HzBtn variant="primary" onClick={() => handleSubmit()} style={{ marginRight: 'auto' }}>
                            {editingShiftId ? 'تحديث المناوبة' : 'حفظ المناوبة'}
                        </HzBtn>
                    </>
                }
            >
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <HzInput label="اسم المناوبة (AR)" value={formData.nameAr} onChange={v => setFormData({ ...formData, nameAr: v })} required />
                    <HzInput label="Name (EN)" value={formData.nameEn} onChange={v => setFormData({ ...formData, nameEn: v })} />

                    <HzInput label="وقت البدء" type="time" value={formData.startTime} onChange={v => setFormData({ ...formData, startTime: v })} required />
                    <HzInput label="وقت النهاية" type="time" value={formData.endTime} onChange={v => setFormData({ ...formData, endTime: v })} required />

                    <HzSelect
                        label="نوع الدوام"
                        value={formData.type}
                        onChange={v => setFormData({ ...formData, type: v })}
                        options={[
                            { value: 'M', label: 'صباحي (Morning)' },
                            { value: 'E', label: 'مسائي (Evening)' },
                            { value: 'C', label: 'مدمج (Combined)' },
                        ]}
                    />
                    <HzInput label="مدة الاستراحة (دقائق)" type="number" value={String(formData.breakDuration)} onChange={v => setFormData({ ...formData, breakDuration: parseInt(v) || 0 })} />

                    <div style={{ gridColumn: 'span 2', background: 'var(--hz-surface-2)', padding: '16px', borderRadius: '12px', border: '1px solid var(--hz-border-soft)' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer', fontWeight: 800 }}>
                            <input type="checkbox" style={{ width: '18px', height: '18px' }} checked={formData.isSplit} onChange={e => setFormData({ ...formData, isSplit: e.target.checked })} />
                            نظام فترتين (Split Shift)
                        </label>
                        <p className="hz-text-muted" style={{ fontSize: '0.75rem', marginTop: '8px', marginRight: '32px' }}>يستخدم هذا النظام للموظفين الذين يعملون على فترتين منفصلتين خلال نفس اليوم.</p>
                    </div>

                    {formData.isSplit && (
                        <>
                            <HzInput label="بدء الفترة الثانية" type="time" value={formData.startTime2} onChange={v => setFormData({ ...formData, startTime2: v })} required={formData.isSplit} />
                            <HzInput label="نهاية الفترة الثانية" type="time" value={formData.endTime2} onChange={v => setFormData({ ...formData, endTime2: v })} required={formData.isSplit} />
                        </>
                    )}
                </div>
            </HzModal>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
