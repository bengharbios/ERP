// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
    Clock, Search, Plus, SlidersHorizontal,
    X, Users, Edit, MoreVertical, LayoutGrid,
    Calendar, Briefcase, GraduationCap, ChevronLeft,
    Download, Printer, Trash2, ShieldCheck, Eye,
    RefreshCw, Filter, CheckCircle2, AlertCircle, Coffee
} from 'lucide-react';
import { hrService, StaffAttendance, LeaveRequest, Employee, Department } from '../services/hr.service';
import { useSettingsStore } from '../store/settingsStore';
import { Toast, ToastType } from '../components/Toast';
import './HRStaffAttendance.css';

/**
 * SMART STAFF ATTENDANCE (Rapidos 2026)
 * Real-time Tracking & Biometric Sync
 */

export default function HRStaffAttendance() {
    const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Filters ---
    const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [isRangeSearch, setIsRangeSearch] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // --- Modal & Form ---
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [form, setForm] = useState({
        employeeId: '', date: new Date().toLocaleDateString('en-CA'),
        checkIn: '', checkOut: '', checkIn2: '', checkOut2: '',
        status: 'present', notes: ''
    });

    // --- Toast ---
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, [startDate, endDate, isRangeSearch]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const params = isRangeSearch ? { startDate, endDate } : { date: startDate };
            const [attRes, leaveRes, empRes, deptRes] = await Promise.all([
                hrService.getAttendance(params),
                hrService.getLeaves(),
                hrService.getEmployees(),
                hrService.getDepartments()
            ]);

            setAttendance(attRes.data || []);
            setLeaves(leaveRes.data || []);
            setEmployees(empRes.data || []);
            setDepartments(deptRes.data || []);
        } catch (error) {
            console.error('Fetch Error:', error);
            setToast({ type: 'error', message: '❌ فشل في جلب بيانات الحضور' });
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setLoading(true);
        try {
            const res = await hrService.syncBiometric();
            if (res.success) {
                setToast({ type: 'success', message: res.message });
                fetchData();
            }
        } catch (e) {
            setToast({ type: 'error', message: '❌ فشلت مزامنة البصمة' });
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (item: any) => {
        setForm({
            employeeId: item.employeeId,
            date: item.date,
            checkIn: item.checkIn ? new Date(item.checkIn).toLocaleTimeString('en-GB').slice(0, 5) : '',
            checkOut: item.checkOut ? new Date(item.checkOut).toLocaleTimeString('en-GB').slice(0, 5) : '',
            checkIn2: '', checkOut2: '', // Sessions logic inherited from legacy
            status: item.status,
            notes: item.notes || ''
        });
        setShowModal(true);
    };

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            const data = {
                ...form,
                checkIn: form.checkIn ? `${form.date}T${form.checkIn}` : undefined,
                checkOut: form.checkOut ? `${form.date}T${form.checkOut}` : undefined,
            };
            const res = await hrService.markAttendance(data);
            if (res.success) {
                setToast({ type: 'success', message: '✅ تم حفظ السجل بنجاح' });
                setShowModal(false);
                fetchData();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل في حفظ البيانات' });
        } finally {
            setModalLoading(false);
        }
    };

    const stats = useMemo(() => {
        return {
            total: employees.filter(e => e.status === 'active').length,
            present: Array.from(new Set(attendance.filter(a => a.status !== 'absent').map(a => a.employeeId))).length,
            late: attendance.filter(a => a.status === 'late').length,
            pendingLeaves: leaves.filter(l => l.status === 'pending').length
        };
    }, [employees, attendance, leaves]);

    const processedData = useMemo(() => {
        let base = [];
        if (isRangeSearch) {
            base = attendance;
        } else {
            base = employees.filter(e => e.status === 'active').map(emp => {
                const att = attendance.find(a => a.employeeId === emp.id);
                return {
                    id: att?.id || `temp-${emp.id}`,
                    employee: emp,
                    employeeId: emp.id,
                    date: startDate,
                    status: att ? att.status : 'absent',
                    checkIn: att?.checkIn,
                    checkOut: att?.checkOut,
                    totalWorkMinutes: att?.totalWorkMinutes || 0,
                    notes: att?.notes
                };
            });
        }

        return base.filter(a => {
            const name = `${a.employee?.user?.firstName} ${a.employee?.user?.lastName}`.toLowerCase();
            const matchesSearch = name.includes(searchTerm.toLowerCase()) || (a.employee?.employeeCode || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesDept = !filterDept || a.employee?.departmentId === filterDept;
            const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
            return matchesSearch && matchesDept && matchesStatus;
        });
    }, [attendance, employees, isRangeSearch, searchTerm, filterDept, filterStatus, startDate]);

    const SidebarContent = () => (
        <>
            <div className="ag-sidebar-head">
                <span className="ag-sidebar-head-title">تصفية السجلات</span>
                <button className="mobile-only ag-btn-icon" onClick={() => setShowMobileFilters(false)}>
                    <X size={18} />
                </button>
            </div>
            <div className="ag-sidebar-pane">
                <div className="ag-filter-group">
                    <span className="ag-filter-label">نوع البحث</span>
                    <div className="ag-input-row">
                        <button className={`ag-btn ${!isRangeSearch ? 'ag-btn-primary' : 'ag-btn-ghost'}`} onClick={() => setIsRangeSearch(false)}>يومي</button>
                        <button className={`ag-btn ${isRangeSearch ? 'ag-btn-primary' : 'ag-btn-ghost'}`} onClick={() => setIsRangeSearch(true)}>فترة</button>
                    </div>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">التاريخ</span>
                    <input type="date" className="ag-input" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    {isRangeSearch && <input type="date" className="ag-input" value={endDate} onChange={e => setEndDate(e.target.value)} />}
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">البحث عن موظف</span>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hz-text-muted)' }} />
                        <input type="text" className="ag-input" placeholder="الاسم أو الكود..." style={{ paddingLeft: '34px' }} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">القسم</span>
                    <select className="ag-select" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                        <option value="">كافة الأقسام</option>
                        {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                    </select>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">الحالة</span>
                    <select className="ag-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                        <option value="all">الكل</option>
                        <option value="present">حاضر</option>
                        <option value="late">متأخر</option>
                        <option value="absent">غائب</option>
                    </select>
                </div>

                <button className="ag-btn ag-btn-primary" style={{ marginTop: 'auto' }} onClick={handleSync}>
                    <RefreshCw size={16} /> مزامنة بيانات البصمة
                </button>
            </div>
        </>
    );

    const parseTimelineSessions = (notes: string) => {
        if (!notes) return [];
        const events = notes.split(' | ').filter(e => !e.startsWith('['));
        const sessions = [];
        let currentIn = '';
        let currentInLabel = '';
        events.forEach(event => {
            const timeMatch = event.match(/\((.*?)\)/);
            if (!timeMatch) return;
            const time = timeMatch[1];
            const label = event.split(' (')[0].trim();
            if (label.includes('دخول') || label.includes('عودة')) {
                if (currentIn) sessions.push({ in: currentIn, inLabel: currentInLabel, out: 'نشط', outLabel: '' });
                currentIn = time;
                currentInLabel = label;
            } else if (label.includes('خروج') || label.includes('انصراف') || label.includes('استراحة')) {
                sessions.push({ in: currentIn || '--:--', inLabel: currentInLabel || 'دخول', out: time, outLabel: label });
                currentIn = '';
                currentInLabel = '';
            }
        });
        if (currentIn) sessions.push({ in: currentIn, inLabel: currentInLabel, out: 'نشط', outLabel: '' });
        return sessions;
    };

    return (
        <div className="ag-root" style={{ height: 'calc(100vh - 160px)' }}>
            <div className="ag-header">
                <div className="ag-header-left">
                    <h1 className="ag-title">
                        <Clock size={20} /> الحضور والغياب الذكي
                    </h1>
                </div>
                <div className="ag-header-right">
                    <button className="ag-btn ag-btn-ghost hide-mobile" onClick={() => window.print()}>
                        <Printer size={16} /> طباعة التقرير
                    </button>
                    <button className="ag-btn-icon mobile-only" onClick={() => setShowMobileFilters(true)}>
                        <SlidersHorizontal size={16} />
                    </button>
                </div>
            </div>

            <div className="ag-stats-strip hide-mobile">
                <div className="ag-stat-pill">
                    <div className="ag-stat-icon"><Users size={16} /></div>
                    <div className="ag-stat-info">
                        <span className="ag-stat-label">القوة العاملة</span>
                        <span className="ag-stat-val">{stats.total}</span>
                    </div>
                </div>
                <div className="ag-stat-pill">
                    <div className="ag-stat-icon" style={{ color: '#00F5A0', background: 'rgba(0, 245, 160, 0.1)' }}><CheckCircle2 size={16} /></div>
                    <div className="ag-stat-info">
                        <span className="ag-stat-label">حضور اليوم</span>
                        <span className="ag-stat-val">{stats.present}</span>
                    </div>
                </div>
                <div className="ag-stat-pill">
                    <div className="ag-stat-icon" style={{ color: '#FF7E5F', background: 'rgba(255, 126, 95, 0.1)' }}><AlertCircle size={16} /></div>
                    <div className="ag-stat-info">
                        <span className="ag-stat-label">تأخير</span>
                        <span className="ag-stat-val">{stats.late}</span>
                    </div>
                </div>
                <div className="ag-stat-pill">
                    <div className="ag-stat-icon" style={{ color: '#C84BFF', background: 'rgba(200, 75, 255, 0.1)' }}><Coffee size={16} /></div>
                    <div className="ag-stat-info">
                        <span className="ag-stat-label">إجازات</span>
                        <span className="ag-stat-val">{stats.pendingLeaves}</span>
                    </div>
                </div>
            </div>

            <div className="ag-body">
                <div className={`ag-sidebar-overlay ${showMobileFilters ? 'show' : ''}`} onClick={() => setShowMobileFilters(false)} />
                <aside className={`ag-sidebar ${showMobileFilters ? 'show' : ''}`}>
                    <SidebarContent />
                </aside>

                <main className="ag-main">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="loading-spinner"></div></div>
                    ) : (
                        <div className="ag-table-wrap">
                            <table className="ag-table">
                                <thead>
                                    <tr>
                                        <th>الموظف</th>
                                        {isRangeSearch && <th>التاريخ</th>}
                                        <th>السجل الزمني</th>
                                        <th>المستهدف</th>
                                        <th>إنجاز العمل</th>
                                        <th>الاستراحة</th>
                                        <th>الحالة</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedData.map(item => {
                                        const timeline = parseTimelineSessions(item.notes || '');
                                        const targetHours = item.employee?.shift?.totalHours || 0;
                                        const progress = targetHours > 0 ? Math.min((item.totalWorkMinutes / (targetHours * 60)) * 100, 100) : 0;

                                        return (
                                            <tr key={item.id} className="ag-row">
                                                <td data-label="الموظف">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--hz-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'var(--hz-plasma)' }}>
                                                            {item.employee?.user?.firstName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '800', color: 'var(--hz-text-bright)', fontSize: '0.85rem' }}>{item.employee?.user?.firstName} {item.employee?.user?.lastName}</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)', fontWeight: '700' }}>{item.employee?.department?.nameAr} | {item.employee?.employeeCode}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                {isRangeSearch && <td data-label="التاريخ">{item.date}</td>}
                                                <td data-label="السجل الزمني">
                                                    <div className="ag-timeline-sessions">
                                                        {timeline.length > 0 ? timeline.slice(0, 2).map((s, i) => (
                                                            <div key={i} className="ag-session-chip">
                                                                <span className="ag-time-in">{s.inLabel || 'د دخول'}: {s.in}</span>
                                                                <span style={{ opacity: 0.3 }}>|</span>
                                                                <span className="ag-time-out">{s.outLabel || 'خروج'}: {s.out}</span>
                                                            </div>
                                                        )) : (
                                                            <div className="ag-session-chip" style={{ opacity: 0.5 }}>لا توجد سجلات بعد</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td data-label="المستهدف">
                                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                        <span style={{ fontWeight: '800', color: 'var(--hz-text-bright)' }}>{targetHours}س</span>
                                                        <span style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)' }}>خصم {item.employee?.shift?.breakDuration || 0}د</span>
                                                    </div>
                                                </td>
                                                <td data-label="إنجاز العمل">
                                                    <div className="ag-progress-box">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                            <span style={{ fontWeight: '900', color: 'var(--hz-text-bright)', fontSize: '0.8rem' }}>
                                                                {Math.floor(item.totalWorkMinutes / 60)}س {item.totalWorkMinutes % 60}د
                                                            </span>
                                                            <span className="ag-progress-text">{Math.round(progress)}%</span>
                                                        </div>
                                                        <div className="ag-progress-bar-bg">
                                                            <div className={`ag-progress-bar-fill ${progress >= 100 ? 'success' : progress > 50 ? '' : 'warning'}`} style={{ width: `${progress}%` }}></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="الاستراحة">
                                                    <span style={{ fontWeight: '700', color: (item.totalBreakMinutes || 0) > (item.employee?.shift?.breakDuration || 0) ? '#FF4D6A' : 'var(--hz-text-secondary)' }}>
                                                        {(item.totalBreakMinutes || 0)}د
                                                    </span>
                                                </td>
                                                <td data-label="الحالة">
                                                    <span className={`ag-status ${item.status}`}>
                                                        {item.status === 'present' ? 'حاضر' : item.status === 'late' ? 'متأخر' : 'غائب'}
                                                    </span>
                                                </td>
                                                <td data-label="إجراءات">
                                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                        <button className="ag-btn-icon" onClick={() => handleEdit(item)}><Edit size={14} /></button>
                                                        <button className="ag-btn-icon"><Eye size={14} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            {/* --- MODAL (THABAT AL-FORM) --- */}
            {showModal && (
                <div className="ag-modal-overlay">
                    <div className="ag-modal">
                        <div className="ag-modal-head">
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--hz-text-bright)' }}>تسجيل حضور يدوي</h2>
                            <button className="ag-btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleFormSubmit}>
                            <div className="ag-modal-body">
                                <div className="ag-filter-group">
                                    <label className="ag-filter-label">الموظف</label>
                                    <select className="ag-select" required value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })}>
                                        <option value="">اختر الموظف...</option>
                                        {employees.map(e => <option key={e.id} value={e.id}>{e.user?.firstName} {e.user?.lastName}</option>)}
                                    </select>
                                </div>
                                <div className="ag-input-row">
                                    <div className="ag-filter-group">
                                        <label className="ag-filter-label">التاريخ</label>
                                        <input type="date" className="ag-input" required value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                                    </div>
                                    <div className="ag-filter-group">
                                        <label className="ag-filter-label">الحالة</label>
                                        <select className="ag-select" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                                            <option value="present">حاضر</option>
                                            <option value="late">متأخر</option>
                                            <option value="absent">غائب</option>
                                            <option value="half_day">نصف يوم</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="ag-input-row">
                                    <div className="ag-filter-group">
                                        <label className="ag-filter-label">وقت الدخول</label>
                                        <input type="time" className="ag-input" value={form.checkIn} onChange={e => setForm({ ...form, checkIn: e.target.value })} />
                                    </div>
                                    <div className="ag-filter-group">
                                        <label className="ag-filter-label">وقت الانصراف</label>
                                        <input type="time" className="ag-input" value={form.checkOut} onChange={e => setForm({ ...form, checkOut: e.target.value })} />
                                    </div>
                                </div>
                                <div className="ag-filter-group">
                                    <label className="ag-filter-label">ملاحظات الإدارة</label>
                                    <textarea className="ag-input" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="أدخل أي ملاحظات حول الحضور..." />
                                </div>
                            </div>
                            <div className="ag-modal-foot">
                                <button type="button" className="ag-btn ag-btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="ag-btn ag-btn-primary" disabled={modalLoading}>
                                    {modalLoading ? 'جاري الحفظ...' : 'حفظ السجل'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            <style>{`
                .loading-spinner { width: 40px; height: 40px; border: 3px solid var(--hz-border-soft); border-top-color: var(--hz-plasma); border-radius: 50%; animation: spin 0.8s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
