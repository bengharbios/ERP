import React, { useState, useEffect } from 'react';
import { hrService, StaffAttendance, LeaveRequest, Employee } from '../services/hr.service';
import { Toast, ToastType } from '../components/Toast';
import './StaffAttendance.css';
import './Employees.css';

const formatTimeNoRounding = (dateStr: string | Date | undefined) => {
    if (!dateStr) return '--:--';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return String(dateStr); // Fallback if already formatted
    const h = d.getHours();
    const m = d.getMinutes();
    const displayH = h === 0 ? 12 : h > 12 ? h - 12 : h;
    const ampm = h >= 12 ? 'م' : 'ص';
    return `${displayH}:${m < 10 ? '0' + m : m} ${ampm}`;
};

const calculateLateMinutes = (checkIn: string | Date | null | undefined, employeeShift: any) => {
    if (!checkIn) return 0;
    const startTimeStr = employeeShift?.startTime || '09:00';
    const checkInDate = new Date(checkIn);
    const [startH, startM] = startTimeStr.split(':').map(Number);

    const shiftStart = new Date(checkInDate);
    shiftStart.setHours(startH, startM, 0, 0);

    const diff = (checkInDate.getTime() - shiftStart.getTime()) / (1000 * 60);
    return diff > 0 ? Math.floor(diff) : 0;
};

const parseTimelineSessions = (notes: string) => {
    if (!notes) return [];
    // Filter out warning markers starting with [
    const events = notes.split(' | ').filter(e => !e.startsWith('['));
    const sessions: any[] = [];

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

const StaffAttendancePage: React.FC = () => {
    const [attendance, setAttendance] = useState<StaffAttendance[]>([]);
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAttendanceModal, setShowAttendanceModal] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [startDate, setStartDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [endDate, setEndDate] = useState(new Date().toLocaleDateString('en-CA'));
    const [isRangeSearch, setIsRangeSearch] = useState(false);
    const [departments, setDepartments] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDept, setFilterDept] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    const [attendanceForm, setAttendanceForm] = useState({
        employeeId: '',
        date: new Date().toLocaleDateString('en-CA'),
        checkIn: '',
        checkOut: '',
        checkIn2: '',
        checkOut2: '',
        status: 'present',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, [startDate, endDate, isRangeSearch]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const params: any = isRangeSearch
                ? { startDate, endDate }
                : { date: startDate };

            const [attRes, leaveRes, empRes, deptRes] = await Promise.all([
                hrService.getAttendance(params),
                hrService.getLeaves(),
                hrService.getEmployees(),
                hrService.getDepartments()
            ]);
            if (attRes.success) setAttendance(attRes.data || []);
            if (leaveRes.success) setLeaves(leaveRes.data || []);
            if (empRes.success) setEmployees(empRes.data || []);
            if (deptRes.success) setDepartments(deptRes.data || []);
        } catch (error) {
            console.error('Error fetching HR data:', error);
            setToast({ type: 'error', message: '❌ فشل في تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    const handleAttendanceSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const data = {
                ...attendanceForm,
                checkIn: attendanceForm.checkIn ? `${attendanceForm.date}T${attendanceForm.checkIn}` : undefined,
                checkOut: attendanceForm.checkOut ? `${attendanceForm.date}T${attendanceForm.checkOut}` : undefined,
                checkIn2: attendanceForm.checkIn2 ? `${attendanceForm.date}T${attendanceForm.checkIn2}` : undefined,
                checkOut2: attendanceForm.checkOut2 ? `${attendanceForm.date}T${attendanceForm.checkOut2}` : undefined
            };
            const res = await hrService.markAttendance(data);
            if (res.success) {
                setToast({ type: 'success', message: '✅ تم تسجيل الحضور بنجاح' });
                setShowAttendanceModal(false);
                fetchData();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل في تسجيل الحضور' });
        }
    };

    const handleReset = async () => {
        if (!window.confirm('هل أنت متأكد من حذف وإعادة ضبط سجل الحضور لهذا اليوم؟ سيتم مسح كافة البيانات المسجلة لهذا الموظف في هذا التاريخ.')) return;
        try {
            const data = {
                employeeId: attendanceForm.employeeId,
                date: attendanceForm.date,
                reset: true
            };
            const res = await hrService.markAttendance(data);
            if (res.success) {
                setToast({ type: 'success', message: '✅ تم إعادة ضبط السجل بنجاح' });
                setShowAttendanceModal(false);
                fetchData();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل في إعادة الضبط' });
        }
    };

    const stats = {
        totalWorkMinutes: attendance.reduce((acc, curr) => acc + (curr.totalWorkMinutes || 0), 0),
        totalEmployees: employees.filter(e => e.status === 'active').length,
        presentCount: Array.from(new Set(attendance.filter(a => a.status !== 'absent').map(a => a.employeeId))).length,
        pendingLeaves: leaves.filter(l => l.status === 'pending').length,
    };

    // --- LOGIC: DETAILED RENDER LIST ---
    const renderList = () => {
        if (isRangeSearch) {
            return attendance.filter(a => {
                const searchLower = searchTerm.toLowerCase();
                const fullName = `${a.employee?.user?.firstName} ${a.employee?.user?.lastName}`.toLowerCase();
                if (searchTerm && !fullName.includes(searchLower) && !a.employee?.employeeCode.toLowerCase().includes(searchLower)) return false;
                if (filterDept && a.employee?.departmentId !== filterDept) return false;
                if (filterStatus !== 'all' && a.status !== filterStatus) return false;
                return true;
            }).map(a => ({
                id: a.id,
                employee: a.employee,
                date: a.date,
                checkIn: a.checkIn,
                checkOut: a.checkOut,
                status: a.status,
                notes: a.notes,
                totalWorkMinutes: a.totalWorkMinutes,
                totalBreakMinutes: a.totalBreakMinutes,
                employeeId: a.employeeId
            }));
        } else {
            return employees.filter(emp => {
                const searchLower = searchTerm.toLowerCase();
                const fullName = `${emp.user?.firstName} ${emp.user?.lastName}`.toLowerCase();
                if (searchTerm && !fullName.includes(searchLower) && !emp.employeeCode.toLowerCase().includes(searchLower)) return false;
                if (filterDept && emp.departmentId !== filterDept) return false;
                const selDate = new Date(startDate);
                selDate.setHours(0, 0, 0, 0);
                if (emp.joiningDate && new Date(emp.joiningDate) > selDate) return false;
                if (emp.lastWorkingDate && new Date(emp.lastWorkingDate) < selDate) return false;
                return true;
            }).map(emp => {
                const att = attendance.find(a => a.employeeId === emp.id);
                const currentStatus = att ? att.status : 'absent';
                if (filterStatus !== 'all' && currentStatus !== filterStatus) return null;

                return {
                    id: att?.id || `temp-${emp.id}`,
                    employee: emp,
                    date: startDate,
                    checkIn: att?.checkIn,
                    checkOut: att?.checkOut,
                    status: currentStatus,
                    notes: att?.notes,
                    totalWorkMinutes: att?.totalWorkMinutes || 0,
                    totalBreakMinutes: att?.totalBreakMinutes || 0,
                    employeeId: emp.id
                };
            }).filter(item => item !== null);
        }
    };

    return (
        <div className="next-gen-page-container">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* --- HEADER --- */}
            <header className="glass-header">
                <div className="header-content">
                    <div className="header-branding">
                        <div className="branding-icon">⏱️</div>
                        <div className="branding-text">
                            <h1>إدارة حضور الموظفين</h1>
                            <p className="hide-on-mobile">Detailed Attendance Tracking & Reporting</p>
                        </div>
                        <div className="active-pill hide-on-mobile">
                            {isRangeSearch ? `فترة: ${startDate} إلى ${endDate}` : `تاريخ اليوم: ${startDate}`}
                        </div>
                    </div>

                    <div className="header-actions">
                        <button className="btn-modern btn-outline hide-on-mobile" onClick={() => window.print()}>
                            <span>📄</span> تصدير التقرير
                        </button>

                        <button
                            className="btn-modern btn-outline hide-on-mobile"
                            onClick={async () => {
                                setLoading(true);
                                try {
                                    const res = await hrService.syncBiometric();
                                    if (res.success) {
                                        setToast({ type: 'success', message: res.message });
                                        fetchData();
                                    }
                                } catch (e) {
                                    setToast({ type: 'error', message: 'فشلت المزامنة' });
                                } finally {
                                    setLoading(false);
                                }
                            }}
                        >
                            🔄 تحديث البيانات
                        </button>

                        <button onClick={() => setShowAttendanceModal(true)} className="btn-modern btn-orange-gradient">
                            <span className="plus-icon">+</span>
                            <span className="hide-on-mobile">تسجيل يدوي</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="main-content">
                {/* --- STATS GRID --- */}
                <section className="stats-grid">
                    <div className="stat-card-mini total">
                        <span className="stat-label">إجمالي الموظفين</span>
                        <span className="stat-value">{stats.totalEmployees}</span>
                    </div>
                    <div className="stat-card-mini active">
                        <span className="stat-label">المسجلين اليوم</span>
                        <span className="stat-value">{stats.presentCount}</span>
                    </div>
                    <div className="stat-card-mini late">
                        <span className="stat-label">ساعات العمل</span>
                        <span className="stat-value">{Math.floor(stats.totalWorkMinutes / 60)}س {stats.totalWorkMinutes % 60}د</span>
                    </div>
                    <div className="stat-card-mini absent">
                        <span className="stat-label">إجازات معلقة</span>
                        <span className="stat-value">{stats.pendingLeaves}</span>
                    </div>
                </section>

                <div className="content-transition-wrapper">
                    {/* --- FILTERS --- */}
                    <section className="filters-toolbar">
                        <div className="filters-group">
                            <button className={`btn-modern ${!isRangeSearch ? 'btn-orange-gradient' : 'btn-outline'}`} onClick={() => setIsRangeSearch(false)}>اليوم</button>
                            <button className={`btn-modern ${isRangeSearch ? 'btn-orange-gradient' : 'btn-outline'}`} onClick={() => setIsRangeSearch(true)}>التاريخ</button>

                            <div className="filter-separator hide-on-mobile"></div>

                            <div className="date-range-group">
                                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="filter-date-input" />
                                {isRangeSearch && (
                                    <>
                                        <span style={{ color: '#718096' }}>إلى</span>
                                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="filter-date-input" />
                                    </>
                                )}
                            </div>

                            <select className="filter-date-input" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                                <option value="">كافة الأقسام</option>
                                {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                            </select>

                            <select className="filter-date-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                <option value="all">كافة الحالات</option>
                                <option value="present">حاضر</option>
                                <option value="late">متأخر</option>
                                <option value="absent">غائب</option>
                            </select>
                        </div>

                        <div className="search-box-wrapper" style={{ flex: 1.5 }}>
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="بحث بالاسم أو الكود..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                style={{ background: 'transparent', border: 'none', color: '#2D3748', width: '100%', outline: 'none' }}
                            />
                        </div>
                    </section>

                    {/* --- TABLE (Flat Row Version) --- */}
                    <div className="next-gen-table-container">
                        <table className="modern-data-table">
                            <thead>
                                <tr>
                                    <th>الموظف</th>
                                    {isRangeSearch && <th>التاريخ</th>}
                                    <th className="hide-on-mobile">السجل الزمني</th>
                                    <th className="text-center">المستهدف</th>
                                    <th className="text-center">صافي العمل</th>
                                    <th className="text-center hide-on-mobile">الاستراحة (ق)</th>
                                    <th className="text-center">الحالة</th>
                                    <th className="hide-on-mobile">ملاحظات</th>
                                    <th className="text-center">إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={8} className="text-center" style={{ padding: '4rem' }}>جاري تحميل البيانات...</td></tr>
                                ) : renderList().length === 0 ? (
                                    <tr><td colSpan={8} className="text-center" style={{ padding: '4rem' }}>لا توجد بيانات مطابقة</td></tr>
                                ) : (renderList() as any[]).map(item => {
                                    let dotClass = 'offline';
                                    if (item.status !== 'absent') {
                                        if (item.notes?.includes('[يعمل]')) dotClass = 'active';
                                        else if (item.notes?.includes('[في استراحة]')) dotClass = 'break';
                                        else if (item.checkIn && !item.checkOut) dotClass = 'active';
                                    }

                                    return (
                                        <tr key={item.id} className="modern-row">
                                            <td>
                                                <div className="table-user-info">
                                                    <div className="user-avatar-small">
                                                        {item.employee?.user?.firstName?.charAt(0)}
                                                        <div className={`status-dot ${dotClass}`}></div>
                                                    </div>
                                                    <div>
                                                        <div className="table-primary-text">{item.employee?.user?.firstName} {item.employee?.user?.lastName}</div>
                                                        <div className="table-secondary-text">{item.employee?.department?.nameAr || 'قسم عام'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            {isRangeSearch && (
                                                <td>
                                                    <div className="table-primary-text">{new Date(item.date).toLocaleDateString('ar-EG', { numberingSystem: 'latn' })}</div>
                                                </td>
                                            )}
                                            <td className="hide-on-mobile">
                                                <div className="timeline-labels">
                                                    {parseTimelineSessions(item.notes).length > 0 ? (
                                                        parseTimelineSessions(item.notes).map((session, idx) => (
                                                            <div key={idx} className="timeline-session-pair" style={idx > 0 ? { borderTop: '1px dashed #E2E8F0', paddingTop: '4px', marginTop: '4px' } : {}}>
                                                                <div className="session-in">
                                                                    <span className="time-label in" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                                        {session.inLabel === 'عودة' ? '🔄' : '⬇️'} {session.inLabel}: {session.in}
                                                                    </span>
                                                                </div>
                                                                <div className="session-out">
                                                                    <span className="time-label out" style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                                        {session.outLabel === 'استراحة' ? '☕' : '⬆️'} {session.outLabel || 'نشط'}: {session.out}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <>
                                                            <span className="time-label in">⬇️ {formatTimeNoRounding(item.checkIn)}</span>
                                                            <span className="time-label out">⬆️ {item.checkOut ? formatTimeNoRounding(item.checkOut) : (item.status === 'absent' ? '--:--' : 'نشط')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className="section-title-mini hide-on-desktop">المستهدف:</span>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                                    <span className="code-pill blue-pill" style={{ background: '#F0F9FF', color: '#0369A1' }}>
                                                        {item.targetWorkHours || (item.employee?.shift?.totalHours || (item.employee?.shift as any)?.total_hours || 0)}س
                                                    </span>
                                                    {(item.targetBreakMinutes || item.employee?.shift?.breakDuration || 0) > 0 && (
                                                        <span style={{ fontSize: '0.65rem', color: '#64748B' }}>
                                                            خصم {item.targetBreakMinutes || item.employee?.shift?.breakDuration}د
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <span className="section-title-mini hide-on-desktop">الصافي:</span>
                                                {(() => {
                                                    const targetHours = item.targetWorkHours || item.employee?.shift?.totalHours || 0;
                                                    const isUnder = item.totalWorkMinutes < (targetHours * 60);
                                                    return (
                                                        <span className={`code-pill ${isUnder ? 'pink-pill' : 'green-pill'}`}
                                                            style={isUnder ? { background: '#FFF1F2', color: '#E11D48' } : {}}>
                                                            {item.totalWorkMinutes ? `${Math.floor(item.totalWorkMinutes / 60)}س ${item.totalWorkMinutes % 60}د` : '0د'}
                                                        </span>
                                                    );
                                                })()}
                                            </td>
                                            <td className="text-center hide-on-mobile">
                                                <span className={`table-secondary-text ${item.totalBreakMinutes && item.totalBreakMinutes > (item.targetBreakMinutes || item.employee?.shift?.breakDuration || 0) + 5 ? 'text-danger fw-bold' : ''}`}>
                                                    {item.totalBreakMinutes || 0}د
                                                    {item.totalBreakMinutes && item.totalBreakMinutes > (item.targetBreakMinutes || item.employee?.shift?.breakDuration || 0) + 5 && ' ⚠️'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                    <span className={`status-pill ${item.notes?.includes('[في استراحة]') ? 'break' :
                                                        (item.checkOut ? 'exited' : item.status)
                                                        }`}>
                                                        {item.notes?.includes('[في استراحة]') ? 'في استراحة' :
                                                            (item.checkOut ? 'انصرف' :
                                                                (item.status === 'present' ? 'حاضر' :
                                                                    item.status === 'late' ? 'متأخر' : 'غائب'))}
                                                    </span>
                                                    {item.status === 'late' && (
                                                        <span className="badge-late" style={{
                                                            fontSize: '0.7rem',
                                                            background: '#FEF2F2',
                                                            color: '#EF4444',
                                                            padding: '2px 6px',
                                                            borderRadius: '10px',
                                                            border: '1px solid #FEE2E2',
                                                            fontWeight: 700
                                                        }}>
                                                            +{(item.lateMinutes !== undefined && item.lateMinutes !== null) ? item.lateMinutes : calculateLateMinutes(item.checkIn, item.employee?.shift)}د تأخير
                                                        </span>
                                                    )}
                                                    {item.status === 'absent' && item.checkIn && (
                                                        <span className="badge-late" style={{
                                                            fontSize: '0.7rem',
                                                            background: '#FFF7ED',
                                                            color: '#EA580C',
                                                            padding: '2px 6px',
                                                            borderRadius: '10px',
                                                            border: '1px solid #FFEDD5',
                                                            fontWeight: 600
                                                        }}>
                                                            تجاوز حد التأخير
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="hide-on-mobile">
                                                <div className="table-secondary-text" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {item.notes || '-'}
                                                </div>
                                            </td>
                                            <td className="text-center">
                                                <button className="edit-btn-icon" onClick={() => {
                                                    const timeline = parseTimelineSessions(item.notes);

                                                    // Find best matches based on labels or windows
                                                    // Session 1 is usually the first row in timeline or labeled 'دخول 1'
                                                    const s1 = timeline.find(s => s.inLabel?.includes('1')) || timeline[0] || { in: '--:--', out: '--:--' };
                                                    // Session 2 is usually labeled 'دخول 2' or the row after S1
                                                    const s2 = timeline.find(s => s.inLabel?.includes('2') || s.inLabel === 'عودة' && timeline.indexOf(s) > 0) || (timeline.length > 1 ? timeline[1] : null);

                                                    setAttendanceForm({
                                                        employeeId: item.employeeId,
                                                        date: new Date(item.date).toLocaleDateString('en-CA'),
                                                        checkIn: s1.in !== '--:--' ? s1.in : '',
                                                        checkOut: s1.out !== '--:--' && s1.out !== 'نشط' ? s1.out : '',
                                                        checkIn2: s2?.in && s2.in !== '--:--' ? s2.in : '',
                                                        checkOut2: s2?.out && s2.out !== '--:--' && s2.out !== 'نشط' ? s2.out : '',
                                                        status: item.status === 'absent' ? 'present' : item.status,
                                                        notes: item.notes || ''
                                                    });
                                                    setShowAttendanceModal(true);
                                                }}>⚙️</button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {/* Modal */}
            {showAttendanceModal && (
                <div className="modal-overlay" onClick={() => setShowAttendanceModal(false)}>
                    <div className="modal-content side-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', borderRadius: '30px', padding: '2.5rem' }}>
                        <div className="modal-header">
                            <h2>تسجيل / تعديل الحضور</h2>
                            <button onClick={() => setShowAttendanceModal(false)} className="close-btn">×</button>
                        </div>
                        <form onSubmit={handleAttendanceSubmit} className="premium-form">
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>الموظف</label>
                                <select required className="premium-input-locked" style={{ width: '100%', background: '#f8fafc', pointerEvents: 'none' }} value={attendanceForm.employeeId} disabled>
                                    {employees.map(e => <option key={e.id} value={e.id}>{e.user?.firstName} {e.user?.lastName}</option>)}
                                </select>
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>التاريخ</label>
                                    <input type="date" className="premium-input" style={{ width: '100%' }} value={attendanceForm.date} onChange={e => setAttendanceForm({ ...attendanceForm, date: e.target.value })} required />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>الحالة</label>
                                    <select className="premium-input" style={{ width: '100%' }} value={attendanceForm.status} onChange={e => setAttendanceForm({ ...attendanceForm, status: e.target.value })}>
                                        <option value="present">حاضر</option>
                                        <option value="late">متأخر</option>
                                        <option value="absent">غائب</option>
                                        <option value="half_day">نصف يوم</option>
                                    </select>
                                </div>
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>
                                        {employees.find(e => e.id === attendanceForm.employeeId)?.shift?.isSplit ? 'دخول (فترة 1)' : 'وقت الحضور'}
                                    </label>
                                    <input type="time" className="premium-input" style={{ width: '100%' }} value={attendanceForm.checkIn} onChange={e => setAttendanceForm({ ...attendanceForm, checkIn: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>
                                        {employees.find(e => e.id === attendanceForm.employeeId)?.shift?.isSplit ? 'انصراف 1 / استراحة' : 'انصراف (يدوي)'}
                                    </label>
                                    <input type="time" className="premium-input" style={{ width: '100%' }} value={attendanceForm.checkOut} onChange={e => setAttendanceForm({ ...attendanceForm, checkOut: e.target.value })} />
                                </div>
                            </div>

                            {/* Session 2 (Optional/Split) */}
                            {(() => {
                                const emp = employees.find(e => e.id === attendanceForm.employeeId);
                                // Show if split OR if user wants to record a manual break for a single shift
                                return (
                                    <div className="form-row content-fade-in" style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: '1rem',
                                        marginBottom: '1.5rem',
                                        opacity: 1,
                                        background: emp?.shift?.isSplit ? '#F0F9FF' : '#F9FBFF',
                                        padding: '15px',
                                        borderRadius: '15px',
                                        border: emp?.shift?.isSplit ? '1px dashed #0369A1' : '1px solid #e2e8f0'
                                    }}>
                                        <div className="form-group">
                                            <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block', color: emp?.shift?.isSplit ? '#0369A1' : '#64748b' }}>
                                                {emp?.shift?.isSplit ? 'وقت العودة (فترة 2)' : 'العودة من الاستراحة'}
                                            </label>
                                            <input type="time" className="premium-input" style={{ width: '100%' }} value={attendanceForm.checkIn2} onChange={e => setAttendanceForm({ ...attendanceForm, checkIn2: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block', color: emp?.shift?.isSplit ? '#0369A1' : '#64748b' }}>
                                                {emp?.shift?.isSplit ? 'انصراف نهائي (فترة 2)' : 'الانصراف النهائي'}
                                            </label>
                                            <input type="time" className="premium-input" style={{ width: '100%' }} value={attendanceForm.checkOut2} onChange={e => setAttendanceForm({ ...attendanceForm, checkOut2: e.target.value })} />
                                        </div>
                                    </div>
                                );
                            })()}
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>ملاحظات</label>
                                <textarea className="premium-input" style={{ width: '100%', minHeight: '80px' }} value={attendanceForm.notes} onChange={e => setAttendanceForm({ ...attendanceForm, notes: e.target.value })} />
                            </div>
                            <div className="modal-footer" style={{ marginTop: '2rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={handleReset} className="btn-modern btn-outline" style={{ borderColor: '#ff4444', color: '#ff4444', marginRight: 'auto' }}>إعادة ضبط 🔄</button>
                                <button type="submit" className="btn-modern btn-orange-gradient">حفظ البيانات</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StaffAttendancePage;
