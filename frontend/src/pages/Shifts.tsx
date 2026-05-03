import React, { useState, useEffect } from 'react';
import { hrmsService } from '../services/hrms.service';
import { Toast, ToastType } from '../components/Toast';
import './Employees.css';

const Shifts: React.FC = () => {
    const [shifts, setShifts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [editingShiftId, setEditingShiftId] = useState<string | null>(null);

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
        try {
            setLoading(true);
            const res = await hrmsService.getShifts();
            if (res.success) {
                setShifts(res.data || []);
            }
        } catch (error) {
            console.error('Error fetching shifts:', error);
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
            setLoading(true);
            const res = await hrmsService.deleteShift(id);
            if (res.success) {
                setToast({ type: 'success', message: '✅ تم حذف المناوبة بنجاح' });
                fetchShifts();
            }
        } catch (error: any) {
            setToast({
                type: 'error',
                message: error.response?.data?.error?.message || '❌ فشل حذف المناوبة'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setLoading(true);
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
                setToast({
                    type: 'success',
                    message: editingShiftId ? '✅ تم تحديث المناوبة بنجاح' : '✅ تم إضافة المناوبة بنجاح'
                });
                setShowModal(false);
                setFormData(initialFormState);
                setEditingShiftId(null);
                fetchShifts();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل حفظ المناوبة' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="next-gen-page-container">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">🔄</div>
                        <div className="branding-text">
                            <h1>إدارة المناوبات</h1>
                            <p className="hide-on-mobile">Shift Scheduling & Working Hours</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button onClick={() => {
                            setEditingShiftId(null);
                            setFormData(initialFormState);
                            setShowModal(true);
                        }} className="btn-modern btn-orange-gradient">
                            <span className="plus-icon">+</span>
                            <span className="hide-on-mobile">إضافة مناوبة جديدة</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container-wide main-content">
                <section className="stats-grid">
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">إجمالي المناوبات</span>
                            <span className="stat-value">{shifts.length}</span>
                        </div>
                        <div className="stat-icon-bg blue">⏱️</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">المناوبات النشطة</span>
                            <span className="stat-value">{shifts.length}</span>
                        </div>
                        <div className="stat-icon-bg green">✅</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">الموظفين الموزعين</span>
                            <span className="stat-value">{shifts.reduce((acc, s) => acc + (s._count?.employees || 0), 0)}</span>
                        </div>
                        <div className="stat-icon-bg purple">👥</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">نظام الدوام</span>
                            <span className="stat-value" style={{ fontSize: '1rem' }}>ثنائي/ثلاثي</span>
                        </div>
                        <div className="stat-icon-bg orange">⚙️</div>
                    </div>
                </section>

                <div className="content-transition-wrapper">
                    {loading && shifts.length === 0 ? (
                        <div className="loading-state-modern">
                            <div className="spinner"></div>
                            <p>جاري تحميل البيانات...</p>
                        </div>
                    ) : (
                        <div className="next-gen-table-container">
                            <table className="modern-data-table">
                                <thead>
                                    <tr>
                                        <th>اسم المناوبة</th>
                                        <th className="text-center">النوع</th>
                                        <th className="text-center">وقت البدء</th>
                                        <th className="text-center">وقت النهاية</th>
                                        <th className="text-center">عدد الموظفين</th>
                                        <th className="text-center">الحالة</th>
                                        <th className="text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {shifts.map(shift => (
                                        <tr key={shift.id}>
                                            <td>
                                                <div className="table-user-info">
                                                    <div className="user-avatar-small">⏱️</div>
                                                    <div>
                                                        <div className="table-primary-text">{shift.nameAr}</div>
                                                        <div className="table-secondary-text">{shift.nameEn}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className={`status-pill ${shift.type === 'M' ? 'active' : shift.type === 'E' ? 'pending' : shift.type === 'C' ? 'purple' : 'orange'}`}>
                                                    {shift.type === 'M' ? 'صباحي' : shift.type === 'E' ? 'مسائي' : shift.type === 'C' ? 'مدمج' : 'مخصص'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span className="code-pill blue-pill" style={{ background: '#E0F2FE', color: '#0369A1' }}>{shift.startTime}</span>
                                                    {shift.isSplit && <span className="code-pill blue-pill" style={{ background: '#E0F2FE', color: '#0369A1', borderStyle: 'dashed' }}>ف2: {shift.startTime2}</span>}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                    <span className="code-pill pink-pill" style={{ background: '#FCE7F3', color: '#BE185D' }}>{shift.endTime}</span>
                                                    {shift.isSplit && <span className="code-pill pink-pill" style={{ background: '#FCE7F3', color: '#BE185D', borderStyle: 'dashed' }}>ف2: {shift.endTime2}</span>}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <div className="table-secondary-text">
                                                    {shift._count?.employees || 0} موظف
                                                    {shift.isSplit && <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>نظام فترتين</div>}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className="status-pill active">نشط</span>
                                            </td>
                                            <td className="text-center">
                                                <div className="table-row-actions">
                                                    <button onClick={() => handleEdit(shift)} className="edit-btn-icon" title="تعديل">✎</button>
                                                    <button onClick={() => handleDelete(shift.id)} className="edit-btn-icon" title="حذف" style={{ color: '#E53E3E' }}>🗑</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {shifts.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="text-center" style={{ padding: '3rem' }}>
                                                لا توجد مناوبات عمل مسجلة حالياً.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content side-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', borderRadius: '30px' }}>
                        <div className="modal-header">
                            <h2>{editingShiftId ? 'تعديل مناوبة عمل' : 'إضافة مناوبة عمل جديدة'}</h2>
                            <button onClick={() => setShowModal(false)} className="close-btn">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modern-form" style={{ padding: '2rem' }}>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>اسم المناوبة (عربي)</label>
                                    <input
                                        type="text"
                                        required
                                        className="filter-select"
                                        style={{ width: '100%', padding: '0 1rem' }}
                                        value={formData.nameAr}
                                        onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>Name (English)</label>
                                    <input
                                        type="text"
                                        className="filter-select"
                                        style={{ width: '100%', padding: '0 1rem' }}
                                        value={formData.nameEn}
                                        onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>وقت البدء</label>
                                    <input
                                        type="time"
                                        required
                                        className="filter-select"
                                        style={{ width: '100%', padding: '0 1rem' }}
                                        value={formData.startTime}
                                        onChange={e => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>وقت النهاية</label>
                                    <input
                                        type="time"
                                        required
                                        className="filter-select"
                                        style={{ width: '100%', padding: '0 1rem' }}
                                        value={formData.endTime}
                                        onChange={e => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>نوع المناوبة</label>
                                <select
                                    required
                                    className="filter-select"
                                    style={{ width: '100%', padding: '0 1rem' }}
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value })}
                                >
                                    <option value="M">صباحي (Morning)</option>
                                    <option value="E">مسائي (Evening)</option>
                                    <option value="C">مدمج (Combined)</option>
                                    <option value="X">مخصص (Custom)</option>
                                </select>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem', background: '#F8FAFC', padding: '1rem', borderRadius: '15px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 800 }}>
                                    <input
                                        type="checkbox"
                                        checked={formData.isSplit}
                                        onChange={e => setFormData({ ...formData, isSplit: e.target.checked })}
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                    نظام فترتين (Split Shift)
                                </label>
                                <p style={{ fontSize: '0.8rem', color: '#64748B', marginTop: '5px', marginRight: '30px' }}>تفعيل هذا الخيار يسمح بتسجيل أوقات عمل لمهمتين منفصلتين في اليوم.</p>
                            </div>

                            {formData.isSplit && (
                                <div className="form-row content-fade-in" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', padding: '1rem', background: '#FFF7ED', borderRadius: '15px', border: '1px dashed #FDBA74' }}>
                                    <div className="form-group">
                                        <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block', color: '#C2410C' }}>بدء الفترة الثانية</label>
                                        <input
                                            type="time"
                                            required={formData.isSplit}
                                            className="filter-select"
                                            style={{ width: '100%', padding: '0 1rem' }}
                                            value={formData.startTime2}
                                            onChange={e => setFormData({ ...formData, startTime2: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block', color: '#C2410C' }}>نهاية الفترة الثانية</label>
                                        <input
                                            type="time"
                                            required={formData.isSplit}
                                            className="filter-select"
                                            style={{ width: '100%', padding: '0 1rem' }}
                                            value={formData.endTime2}
                                            onChange={e => setFormData({ ...formData, endTime2: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem', background: '#F0F9FF', padding: '1rem', borderRadius: '15px' }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block', color: '#0369A1' }}>مدة الاستراحة (دقائق)</label>
                                    <input
                                        type="number"
                                        className="filter-select"
                                        style={{ width: '100%', padding: '0 1rem' }}
                                        value={formData.breakDuration}
                                        onChange={e => {
                                            const val = parseInt(e.target.value) || 0;
                                            setFormData({ ...formData, breakDuration: val });
                                        }}
                                    />
                                    <p style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>يتم خصمها من إجمالي ساعات العمل.</p>
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block', color: '#0369A1' }}>إجمالي الساعات المتوقع</label>
                                    <div style={{ padding: '0.75rem 1rem', background: '#FFF', borderRadius: '10px', border: '1px solid #BAE6FD', fontWeight: 900, fontSize: '1.2rem', color: '#0284C7', textAlign: 'center' }}>
                                        {(() => {
                                            const calcMins = (start: string, end: string) => {
                                                if (!start || !end) return 0;
                                                const [h1, m1] = start.split(':').map(Number);
                                                const [h2, m2] = end.split(':').map(Number);
                                                let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
                                                if (diff < 0) diff += 1440; // Midnight cross
                                                return diff;
                                            };
                                            const m1 = calcMins(formData.startTime, formData.endTime);
                                            const m2 = formData.isSplit ? calcMins(formData.startTime2, formData.endTime2) : 0;
                                            const total = (m1 + m2 - formData.breakDuration) / 60;
                                            const finalVal = Math.max(0, total).toFixed(2);
                                            // Update hidden sync if needed or just display
                                            return `${finalVal} ساعة`;
                                        })()}
                                    </div>
                                    <p style={{ fontSize: '0.7rem', color: '#64748B', marginTop: '4px' }}>صافي العمل بعد خصم الاستراحة.</p>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-modern btn-outline">إلغاء</button>
                                <button type="submit" className="btn-modern btn-orange-gradient" disabled={loading}>
                                    {loading ? 'جاري الحفظ...' : 'حفظ المناوبة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Shifts;
