// @ts-nocheck
import { useState, useEffect, useMemo, createPortal } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
    CheckCircle2, Grid, List, LayoutGrid,
    Search, SlidersHorizontal, RefreshCw, FileDown,
    Clock, User, BookOpen, Calendar, X
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { academicService } from '../services/academic.service';
import { scheduleService } from '../services/schedule.service';
import { classService } from '../services/class.service';
import LectureModal from '../components/LectureModal';

import './Attendance.css';

// ── helpers ──
const getLecColor = (status: string): string => {
    if (status === 'completed') return '#38A169';
    if (status === 'postponed') return '#3182CE';
    if (status === 'cancelled') return '#E53E3E';
    return '#00D4FF';
};

const getStatusCls = (status: string) => {
    const m: Record<string, string> = {
        completed: 'completed',
        scheduled: 'scheduled',
        postponed: 'postponed',
        cancelled: 'cancelled',
    };
    return m[status] || 'scheduled';
};

const getStatusLabel = (status: string) => {
    const m: Record<string, string> = {
        completed: 'مكتملة',
        scheduled: 'مجدولة',
        postponed: 'مؤجلة',
        cancelled: 'ملغية',
    };
    return m[status] || status;
};

const getRateCls = (rate: number) => {
    if (rate >= 75) return 'high';
    if (rate >= 50) return 'mid';
    return 'low';
};

export default function Attendance() {
    const [searchParams] = useSearchParams();

    // UI
    const [viewMode, setViewMode] = useState<'grid' | 'table' | 'matrix'>('grid');
    const [showSidebar, setShowSidebar] = useState(false);
    const [loading, setLoading] = useState(true);

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClassId, setSelectedClassId] = useState(searchParams.get('classId') || '');

    // Data
    const [lectures, setLectures] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [matrixLectures, setMatrixLectures] = useState<any[]>([]);
    const [matrixStudents, setMatrixStudents] = useState<any[]>([]);
    const [selectedLecture, setSelectedLecture] = useState<any | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    useEffect(() => { fetchInitialData(); }, []);

    useEffect(() => {
        if (viewMode === 'matrix' && selectedClassId) {
            fetchMatrixData();
        } else {
            fetchDayLectures();
        }
    }, [selectedDate, selectedClassId, viewMode]);

    const fetchInitialData = async () => {
        try {
            const res = await classService.getClasses();
            setClasses(res.data?.classes || res.data || []);
        } catch (e) { console.error(e); }
    };

    const fetchMatrixData = async () => {
        if (!selectedClassId) return;
        setLoading(true);
        try {
            const start = new Date(selectedDate);
            const [lecturesRes, classRes] = await Promise.all([
                scheduleService.getLectures({
                    classId: selectedClassId,
                    startDate: startOfMonth(start).toISOString(),
                    endDate: endOfMonth(start).toISOString(),
                    includeAttendance: true
                }),
                academicService.getClassById(selectedClassId)
            ]);
            setMatrixLectures((lecturesRes.data as any)?.lectures || lecturesRes.data || []);
            setMatrixStudents(classRes.data?.data?.class?.students || classRes.data?.class?.students || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchDayLectures = async () => {
        setLoading(true);
        try {
            const res = await scheduleService.getLectures({
                classId: selectedClassId || undefined,
                startDate: selectedDate,
                endDate: selectedDate
            });
            setLectures((res.data as any)?.lectures || res.data || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filteredLectures = useMemo(() => lectures.filter(l =>
        l.unit?.nameAr?.includes(searchTerm) ||
        l.instructor?.firstName?.includes(searchTerm) ||
        l.class?.name?.includes(searchTerm)
    ), [lectures, searchTerm]);

    const stats = useMemo(() => ({
        total: lectures.length,
        completed: lectures.filter(l => l.status === 'completed').length,
        pending: lectures.filter(l => l.status === 'scheduled').length,
        postponed: lectures.filter(l => l.status === 'postponed').length,
    }), [lectures]);

    const openLecture = (lec: any) => { setSelectedLecture(lec); setIsModalOpen(true); };

    // ── Sidebar ──
    const SidebarContent = () => (
        <>
            <div className="at-sidebar-head">
                <span className="at-sidebar-head-title">الفلاتر</span>
                <button className="at-sidebar-head-close" onClick={() => setShowSidebar(false)}>
                    <X size={18} />
                </button>
            </div>
            <div className="at-sidebar-pane">
                <div>
                    <span className="at-filter-label">البحث</span>
                    <div className="at-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="بحث بالمادة أو المحاضر..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="at-divider" />

                <div>
                    <span className="at-filter-label">الفصل الدراسي</span>
                    <select className="at-select" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                        <option value="">كافة الفصول</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                <div>
                    <span className="at-filter-label">التاريخ</span>
                    <input
                        type="date"
                        className="at-date-input"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                    />
                </div>

                <div className="at-divider" />

                <div>
                    <span className="at-filter-label">طريقة العرض</span>
                    <div className="at-view-switcher">
                        <button className={`at-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                            <Grid size={13} /> بطاقات
                        </button>
                        <button className={`at-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
                            <List size={13} /> قائمة
                        </button>
                        <button className={`at-view-btn ${viewMode === 'matrix' ? 'active' : ''}`} onClick={() => setViewMode('matrix')}>
                            <LayoutGrid size={13} /> مصفوفة
                        </button>
                    </div>
                </div>

                <div className="at-divider" />

                <button className="at-btn at-btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={fetchDayLectures}>
                    <RefreshCw size={14} />
                    تحديث
                </button>
            </div>
        </>
    );

    return (
        <div className="at-root">
            {/* ── HEADER ── */}
            <header className="at-header">
                <div className="at-header-left">
                    <h1 className="at-title">
                        <CheckCircle2 size={20} />
                        رصد الحضور والغياب
                    </h1>
                    <div className="at-mini-stats">
                        <span className="at-stat-pill">
                            <span className="at-stat-val">{stats.total}</span>
                            محاضرة
                        </span>
                        <span className="at-stat-pill">
                            <span className="at-stat-val" style={{ background: 'rgba(56,161,105,0.15)', color: '#68D391' }}>{stats.completed}</span>
                            مكتملة
                        </span>
                        <span className="at-stat-pill">
                            <span className="at-stat-val">{stats.pending}</span>
                            بانتظار الرصد
                        </span>
                    </div>
                </div>

                <div className="at-header-right">
                    <button className="at-btn-icon" title="تصدير" onClick={() => console.log('export')}>
                        <FileDown size={15} />
                    </button>
                    <button className="at-btn-icon" title="تحديث" onClick={fetchDayLectures}>
                        <RefreshCw size={15} />
                    </button>
                    <button className="at-btn-icon" title="تصفية" onClick={() => setShowSidebar(s => !s)}>
                        <SlidersHorizontal size={15} />
                    </button>
                </div>
            </header>

            {/* ── BODY ── */}
            <div className="at-body">
                {/* Sidebar */}
                <>
                    <div className={`at-sidebar-overlay ${showSidebar ? 'show' : ''}`} onClick={() => setShowSidebar(false)} />
                    <aside className={`at-sidebar ${showSidebar ? 'show' : ''}`}>
                        <SidebarContent />
                    </aside>
                </>

                {/* Main */}
                <main className="at-main">
                    {/* Stats strip */}
                    <div className="at-stats-strip">
                        <div className="at-stat-card">
                            <span className="at-stat-num" style={{ color: 'var(--hz-cyan)' }}>{stats.total}</span>
                            <span className="at-stat-lbl">محاضرات</span>
                        </div>
                        <div className="at-stat-card">
                            <span className="at-stat-num" style={{ color: '#86EFAC' }}>{stats.completed}</span>
                            <span className="at-stat-lbl">مكتملة</span>
                        </div>
                        <div className="at-stat-card">
                            <span className="at-stat-num" style={{ color: '#FDA4AF' }}>{stats.pending}</span>
                            <span className="at-stat-lbl">بانتظار الرصد</span>
                        </div>
                        <div className="at-stat-card">
                            <span className="at-stat-num" style={{ color: '#FCD34D' }}>{stats.postponed}</span>
                            <span className="at-stat-lbl">مؤجلة</span>
                        </div>
                    </div>

                    {/* Content */}
                    <div className="at-content">
                        {loading ? (
                            <div className="at-loading">
                                <div className="at-spinner" />
                                جاري التحميل...
                            </div>
                        ) : viewMode === 'matrix' ? (
                            /* ── MATRIX VIEW ── */
                            <div className="at-matrix-view">
                                {!selectedClassId ? (
                                    <div className="at-matrix-prompt">
                                        <div className="at-matrix-prompt-icon">👥</div>
                                        <p className="at-matrix-prompt-title">يرجى اختيار فصل دراسي</p>
                                        <p className="at-matrix-prompt-sub">لعرض مصفوفة الحضور، حدد الفصل من قائمة التصفية</p>
                                        <button className="at-btn at-btn-ghost" onClick={() => setShowSidebar(true)}>
                                            <SlidersHorizontal size={14} />
                                            فتح التصفية
                                        </button>
                                    </div>
                                ) : matrixStudents.length === 0 ? (
                                    <div className="at-empty">
                                        <div className="at-empty-icon">📋</div>
                                        <p className="at-empty-title">لا يوجد طلاب</p>
                                        <p className="at-empty-sub">لم يتم العثور على طلاب في هذا الفصل</p>
                                    </div>
                                ) : (
                                    <table className="at-matrix-table">
                                        <thead>
                                            <tr>
                                                <th className="at-matrix-name-col">الطالب</th>
                                                {matrixLectures.map(lec => (
                                                    <th key={lec.id}>
                                                        <div>{format(new Date(lec.scheduledDate), 'dd/MM')}</div>
                                                        <div style={{ fontWeight: 600, opacity: 0.7 }}>{lec.unit?.code}</div>
                                                    </th>
                                                ))}
                                                <th>النسبة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {matrixStudents.map((student: any) => {
                                                let presentCount = 0;
                                                return (
                                                    <tr key={student.id}>
                                                        <td className="at-student-cell">
                                                            <div className="at-primary-cell">{student.firstNameAr} {student.lastNameAr}</div>
                                                            <div className="at-secondary-cell">{student.studentNumber}</div>
                                                        </td>
                                                        {matrixLectures.map(lec => {
                                                            const rec = lec.attendanceRecords?.find((r: any) => r.studentId === student.id);
                                                            const st = rec?.status || 'none';
                                                            if (st === 'present') presentCount++;
                                                            return (
                                                                <td key={`${student.id}-${lec.id}`}>
                                                                    <span className={`at-status-dot ${st}`}>
                                                                        {st === 'present' && '✓'}
                                                                        {st === 'absent' && '✕'}
                                                                        {st === 'late' && '⚡'}
                                                                        {st === 'excused' && 'ع'}
                                                                        {st === 'none' && '–'}
                                                                    </span>
                                                                </td>
                                                            );
                                                        })}
                                                        <td>
                                                            {(() => {
                                                                const rate = matrixLectures.length > 0
                                                                    ? Math.round((presentCount / matrixLectures.length) * 100) : 0;
                                                                return <span className={`at-rate-pill ${getRateCls(rate)}`}>{rate}%</span>;
                                                            })()}
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>

                        ) : viewMode === 'grid' ? (
                            /* ── GRID VIEW ── */
                            <div className="at-grid-view">
                                {filteredLectures.length === 0 ? (
                                    <div className="at-empty">
                                        <div className="at-empty-icon">📅</div>
                                        <p className="at-empty-title">لا توجد محاضرات</p>
                                        <p className="at-empty-sub">حاول تغيير التاريخ أو الفصل الدراسي</p>
                                    </div>
                                ) : (
                                    <div className="at-grid">
                                        {filteredLectures.map(lec => (
                                            <div
                                                key={lec.id}
                                                className="at-lecture-card"
                                                style={{ '--lec-color': getLecColor(lec.status) } as any}
                                                onClick={() => openLecture(lec)}
                                            >
                                                {/* Head */}
                                                <div className="at-card-head">
                                                    <div className="at-card-icon">
                                                        <BookOpen size={18} />
                                                    </div>
                                                    <div className="at-card-title-wrap">
                                                        <p className="at-card-name">{lec.unit?.nameAr || 'وحدة دراسية'}</p>
                                                        <p className="at-card-class">{lec.class?.name}</p>
                                                    </div>
                                                    <span className={`at-card-status-badge ${getStatusCls(lec.status)}`}>
                                                        {getStatusLabel(lec.status)}
                                                    </span>
                                                </div>

                                                {/* Details */}
                                                <div className="at-card-details">
                                                    <div className="at-card-detail-row">
                                                        <User size={12} />
                                                        {lec.instructor
                                                            ? `${lec.instructor.firstName} ${lec.instructor.lastName}`
                                                            : 'غير محدد'}
                                                    </div>
                                                    <div className="at-card-detail-row">
                                                        <Clock size={12} />
                                                        <span dir="ltr">
                                                            {lec.scheduledStartTime
                                                                ? format(new Date(lec.scheduledStartTime), 'HH:mm')
                                                                : '--:--'}
                                                            {lec.scheduledEndTime
                                                                ? ` - ${format(new Date(lec.scheduledEndTime), 'HH:mm')}`
                                                                : ''}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* KPIs */}
                                                <div className="at-card-kpis">
                                                    <div className="at-kpi">
                                                        <span className="at-kpi-val">
                                                            {lec.class?._count?.studentEnrollments > 0
                                                                ? Math.round(((lec._count?.attendanceRecords || 0) / lec.class._count.studentEnrollments) * 100)
                                                                : 0}%
                                                        </span>
                                                        <span className="at-kpi-lbl">الرصد</span>
                                                    </div>
                                                    <div className="at-kpi">
                                                        <span className="at-kpi-val">{lec._count?.attendanceRecords || 0}</span>
                                                        <span className="at-kpi-lbl">حضر</span>
                                                    </div>
                                                    <div className="at-kpi">
                                                        <span className="at-kpi-val">#{lec.sequenceNumber}</span>
                                                        <span className="at-kpi-lbl">الترتيب</span>
                                                    </div>
                                                </div>

                                                <button className="at-card-action" onClick={e => { e.stopPropagation(); openLecture(lec); }}>
                                                    <CheckCircle2 size={14} />
                                                    {lec.status === 'completed' ? 'تعديل الحضور' : 'رصد الحضور الآن'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                        ) : (
                            /* ── LIST VIEW ── */
                            <div className="at-list-view">
                                {filteredLectures.length === 0 ? (
                                    <div className="at-empty">
                                        <div className="at-empty-icon">📋</div>
                                        <p className="at-empty-title">لا توجد محاضرات</p>
                                        <p className="at-empty-sub">حاول تغيير التاريخ أو الفصل الدراسي</p>
                                    </div>
                                ) : (
                                    <table className="at-list-table">
                                        <thead>
                                            <tr>
                                                <th>#</th>
                                                <th>المادة / الوحدة</th>
                                                <th>المحاضر</th>
                                                <th>الفصل</th>
                                                <th>الوقت</th>
                                                <th>الحالة</th>
                                                <th>رصد</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLectures.map(lec => (
                                                <tr key={lec.id}>
                                                    <td>
                                                        <span className="at-seq-badge">#{lec.sequenceNumber}</span>
                                                    </td>
                                                    <td>
                                                        <div className="at-primary-cell">{lec.unit?.nameAr || 'وحدة'}</div>
                                                        <div className="at-secondary-cell">{lec.unit?.code}</div>
                                                    </td>
                                                    <td style={{ color: 'var(--hz-text-secondary)' }}>
                                                        {lec.instructor
                                                            ? `${lec.instructor.firstName} ${lec.instructor.lastName}`
                                                            : '—'}
                                                    </td>
                                                    <td style={{ color: 'var(--hz-text-secondary)' }}>
                                                        {lec.class?.name || '—'}
                                                    </td>
                                                    <td dir="ltr" style={{ fontVariantNumeric: 'tabular-nums', fontWeight: 700 }}>
                                                        {lec.scheduledStartTime
                                                            ? format(new Date(lec.scheduledStartTime), 'HH:mm')
                                                            : '--:--'}
                                                    </td>
                                                    <td>
                                                        <span className={`at-status-badge ${getStatusCls(lec.status)}`}>
                                                            {getStatusLabel(lec.status)}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <button className="at-action-btn" onClick={() => openLecture(lec)}>
                                                            {lec.status === 'completed' ? 'تعديل' : 'رصد'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Lecture Modal */}
            {isModalOpen && createPortal(
                <LectureModal
                    lecture={selectedLecture}
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    onPostpone={async () => { }}
                    onCancel={async () => { }}
                />,
                document.body
            )}
        </div>
    );
}
