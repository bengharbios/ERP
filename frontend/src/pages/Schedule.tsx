// @ts-nocheck
import { useState, useEffect, createPortal } from 'react';
import { scheduleService, Lecture } from '../services/schedule.service';
import { classService } from '../services/class.service';
import LectureModal from '../components/LectureModal';
import { format, startOfWeek, addDays, isSameDay, differenceInDays } from 'date-fns';
import { ar } from 'date-fns/locale';
import {
    CalendarDays, List, Calendar, Clock, ChevronLeft, ChevronRight,
    Search, SlidersHorizontal, X, User, BookOpen, CheckCircle2,
    Timer, Target, ArrowLeft, RefreshCw
} from 'lucide-react';

import './Schedule.css';

// ── Color helpers ──
const getLecColor = (lec: Lecture): string => {
    if (lec.status === 'postponed') return '#3182CE';
    if (lec.status === 'cancelled') return '#E53E3E';
    if (lec.status === 'completed') return '#38A169';
    if (lec.sequenceNumber === 1) return '#00D4FF';
    if (lec.sequenceNumber === lec.unit?.totalLectures) return '#FF6B6B';
    return '#00D4FF';
};

const getLecStatusClass = (lec: Lecture): string => {
    if (lec.status === 'postponed') return 'status-postponed';
    if (lec.status === 'cancelled') return 'status-cancelled';
    if (lec.status === 'completed') return 'status-completed';
    return '';
};

const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; cls: string }> = {
        scheduled: { label: 'مجدولة', cls: 'scheduled' },
        completed: { label: 'مكتملة', cls: 'completed' },
        postponed: { label: 'مؤجلة', cls: 'postponed' },
        cancelled: { label: 'ملغية', cls: 'cancelled' },
    };
    return map[status] || { label: status, cls: 'scheduled' };
};

export default function Schedule() {
    const [lectures, setLectures] = useState<Lecture[]>([]);
    const [filteredLectures, setFilteredLectures] = useState<Lecture[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'weekly' | 'list' | 'timeline'>('weekly');
    const [currentWeek, setCurrentWeek] = useState(new Date());
    const [searchQuery, setSearchQuery] = useState('');
    const [showSidebar, setShowSidebar] = useState(false);

    // Modal
    const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
    const [showLectureModal, setShowLectureModal] = useState(false);

    // Stats
    const [stats, setStats] = useState({ todayCount: 0, totalHours: 0, activeClasses: 0, completionRate: 0 });

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { filterLectures(); }, [lectures, searchQuery, currentWeek, selectedClassId]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [lecturesRes, classesRes] = await Promise.all([
                scheduleService.getLectures(),
                classService.getClasses().catch(() => ({ data: { classes: [] } }))
            ]);

            let lecturesData: Lecture[] = [];
            if (Array.isArray(lecturesRes)) lecturesData = lecturesRes;
            else if (lecturesRes?.data?.lectures) lecturesData = lecturesRes.data.lectures;
            else if (lecturesRes?.data) lecturesData = Array.isArray(lecturesRes.data) ? lecturesRes.data : [];
            setLectures(lecturesData);

            let classesData: any[] = [];
            if (Array.isArray(classesRes)) classesData = classesRes;
            else if (classesRes?.data?.classes) classesData = classesRes.data.classes;
            else if (classesRes?.data) classesData = Array.isArray(classesRes.data) ? classesRes.data : [];
            setClasses(classesData);
        } catch (e) {
            console.error(e);
            setLectures([]); setClasses([]);
        } finally {
            setLoading(false);
        }
    };

    const handleClassChange = async (classId: string) => {
        setSelectedClassId(classId);
        if (!classId) { setSelectedClass(null); if (viewMode === 'timeline') setViewMode('weekly'); return; }
        const cls = classes.find((c: any) => c.id === classId);
        if (cls?.studyMode === 'SELF_PACED') {
            setViewMode('timeline');
            setLoading(true);
            try {
                const res = await classService.getClass(classId);
                const classData = res.data?.data?.class || res.data?.class || res.data;
                setSelectedClass(classData);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        } else {
            setSelectedClass(cls);
            if (viewMode === 'timeline') setViewMode('weekly');
        }
    };

    const filterLectures = () => {
        let filtered = lectures;
        if (searchQuery) {
            filtered = filtered.filter(l =>
                l.unit?.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.unit?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                l.class?.name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (selectedClassId) {
            filtered = filtered.filter(l => l.classId === selectedClassId || l.class?.id === selectedClassId);
        }
        setFilteredLectures(filtered);
        calcStats(filtered);
    };

    const calcStats = (lecs: Lecture[]) => {
        const todayCount = lecs.filter(l => isSameDay(new Date(l.scheduledDate), new Date())).length;
        const totalMins = lecs.reduce((acc, l) => {
            const s = new Date(l.scheduledStartTime), e = new Date(l.scheduledEndTime);
            if (isNaN(s.getTime()) || isNaN(e.getTime())) return acc;
            return acc + (e.getTime() - s.getTime()) / 60000;
        }, 0);
        const totalHours = Math.round((totalMins / 60) * 10) / 10;
        const uniqueClasses = new Set(lecs.map(l => l.classId || l.class?.id).filter(Boolean)).size;
        const completed = lecs.filter(l => l.status === 'completed').length;
        const rate = lecs.length > 0 ? Math.round((completed / lecs.length) * 100) : 0;
        setStats({ todayCount, totalHours, activeClasses: uniqueClasses, completionRate: rate });
    };

    const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(currentWeek, { weekStartsOn: 6 }), i));
    const goNext = () => setCurrentWeek(prev => addDays(prev, 7));
    const goPrev = () => setCurrentWeek(prev => addDays(prev, -7));

    const handleLectureClick = (lec: Lecture) => { setSelectedLecture(lec); setShowLectureModal(true); };
    const handleCloseModal = () => { setSelectedLecture(null); setShowLectureModal(false); };

    const handlePostpone = async (id: string, reason: string) => {
        await scheduleService.postponeLecture(id, reason);
        await fetchData();
    };
    const handleCancel = async (id: string, reason: string) => {
        await scheduleService.cancelLecture(id, reason);
        await fetchData();
    };
    const handleUndo = async (id: string) => {
        const lec = lectures.find(l => l.id === id);
        if (!lec) throw new Error('not found');
        if (lec.status === 'postponed') await scheduleService.undoPostponeLecture(id);
        else if (lec.status === 'cancelled') await scheduleService.undoCancelLecture(id);
        await fetchData();
    };

    // ── Sidebar content ──
    const SidebarContent = () => (
        <div className="sc-sidebar-pane">
            {/* Search */}
            <div>
                <span className="sc-filter-label">البحث</span>
                <div className="sc-search">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder="بحث عن محاضرة..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="sc-divider" />

            {/* Class filter */}
            <div>
                <span className="sc-filter-label">الفصل الدراسي</span>
                <select
                    className="sc-select"
                    value={selectedClassId}
                    onChange={e => handleClassChange(e.target.value)}
                >
                    <option value="">كافة الفصول</option>
                    {classes.map(cls => (
                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                </select>
            </div>

            <div className="sc-divider" />

            {/* View mode */}
            {selectedClass?.studyMode !== 'SELF_PACED' && (
                <div>
                    <span className="sc-filter-label">طريقة العرض</span>
                    <div className="sc-view-switcher">
                        <button
                            className={`sc-view-btn ${viewMode === 'weekly' ? 'active' : ''}`}
                            onClick={() => setViewMode('weekly')}
                        >
                            <Calendar size={14} />
                            أسبوعي
                        </button>
                        <button
                            className={`sc-view-btn ${viewMode === 'list' ? 'active' : ''}`}
                            onClick={() => setViewMode('list')}
                        >
                            <List size={14} />
                            قائمة
                        </button>
                    </div>
                </div>
            )}

            <div className="sc-divider" />

            {/* Refresh */}
            <button className="sc-btn sc-btn-ghost" style={{ width: '100%', justifyContent: 'center' }} onClick={fetchData}>
                <RefreshCw size={14} />
                تحديث البيانات
            </button>
        </div>
    );

    return (
        <div className="sc-root">
            {/* ── HEADER ── */}
            <header className="sc-header">
                <div className="sc-header-left">
                    <h1 className="sc-title">
                        <CalendarDays size={20} />
                        الجدول الدراسي
                    </h1>
                    <div className="sc-mini-stats">
                        <span className="sc-stat-pill">
                            <span className="sc-stat-val">{filteredLectures.length}</span>
                            محاضرة
                        </span>
                        <span className="sc-stat-pill">
                            <span className="sc-stat-val">{stats.activeClasses}</span>
                            فصل
                        </span>
                        <span className="sc-stat-pill">
                            <span className="sc-stat-val">{stats.completionRate}%</span>
                            إنجاز
                        </span>
                    </div>
                </div>

                <div className="sc-header-right">
                    <button className="sc-btn-icon" title="تصفية" onClick={() => setShowSidebar(s => !s)}>
                        <SlidersHorizontal size={15} />
                    </button>
                    <button className="sc-btn-icon" title="تحديث" onClick={fetchData}>
                        <RefreshCw size={15} />
                    </button>
                </div>
            </header>

            {/* ── BODY ── */}
            <div className="sc-body">
                {/* Sidebar */}
                <>
                    <div
                        className={`sc-sidebar-overlay ${showSidebar ? 'show' : ''}`}
                        onClick={() => setShowSidebar(false)}
                    />
                    <aside className={`sc-sidebar ${showSidebar ? 'show' : ''}`}>
                        <SidebarContent />
                    </aside>
                </>

                {/* Main */}
                <main className="sc-main">
                    {/* Stats strip */}
                    <div className="sc-stats-strip">
                        <div className="sc-stat-card">
                            <span className="sc-stat-num" style={{ color: 'var(--hz-cyan)' }}>{stats.todayCount}</span>
                            <span className="sc-stat-lbl">اليوم</span>
                        </div>
                        <div className="sc-stat-card">
                            <span className="sc-stat-num" style={{ color: '#FDA4AF' }}>{stats.totalHours}</span>
                            <span className="sc-stat-lbl">ساعة</span>
                        </div>
                        <div className="sc-stat-card">
                            <span className="sc-stat-num" style={{ color: '#86EFAC' }}>{stats.activeClasses}</span>
                            <span className="sc-stat-lbl">فصل نشط</span>
                        </div>
                        <div className="sc-stat-card">
                            <span className="sc-stat-num" style={{ color: '#C4B5FD' }}>{stats.completionRate}%</span>
                            <span className="sc-stat-lbl">إنجاز</span>
                        </div>
                    </div>

                    {/* Week navigation (weekly mode only) */}
                    {viewMode === 'weekly' && (
                        <div className="sc-week-nav">
                            <button className="sc-nav-btn" onClick={goPrev}>
                                <ChevronRight size={16} />
                            </button>
                            <span className="sc-week-label">
                                {format(weekDays[0], 'd MMM', { locale: ar })}
                                {' — '}
                                {format(weekDays[6], 'd MMM yyyy', { locale: ar })}
                            </span>
                            <button className="sc-nav-btn" onClick={goNext}>
                                <ChevronLeft size={16} />
                            </button>
                        </div>
                    )}

                    {/* Content area */}
                    <div className="sc-content">
                        {loading ? (
                            <div className="sc-loading">
                                <div className="sc-spinner" />
                                جاري التحميل...
                            </div>
                        ) : viewMode === 'timeline' ? (
                            /* ── TIMELINE VIEW ── */
                            <div className="sc-timeline">
                                <div className="sc-timeline-header">
                                    <div className="sc-timeline-title">
                                        <Timer size={18} style={{ color: 'var(--hz-cyan)' }} />
                                        الجدول الزمني — <span style={{ color: 'var(--hz-cyan)', marginRight: 4 }}>{selectedClass?.name}</span>
                                    </div>
                                    <div className="sc-timeline-pills">
                                        <div className="sc-tl-pill">
                                            <Calendar size={12} />
                                            <span>بداية:</span>
                                            <strong>
                                                {selectedClass?.startDate
                                                    ? format(new Date(selectedClass.startDate), 'dd MMM yyyy', { locale: ar })
                                                    : '—'}
                                            </strong>
                                        </div>
                                        <div className="sc-tl-pill">
                                            <Target size={12} />
                                            <span>نهاية:</span>
                                            <strong>
                                                {selectedClass?.expectedEndDate
                                                    ? format(new Date(selectedClass.expectedEndDate), 'dd MMM yyyy', { locale: ar })
                                                    : '—'}
                                            </strong>
                                        </div>
                                    </div>
                                </div>

                                <div className="sc-timeline-list">
                                    {selectedClass?.unitSchedules?.map((sch: any, idx: number) => {
                                        const start = new Date(sch.startDate);
                                        const end = new Date(sch.endDate);
                                        const duration = differenceInDays(end, start);
                                        const isCompleted = end < new Date();
                                        const isActive = start <= new Date() && end >= new Date();
                                        return (
                                            <div key={sch.id} className={`sc-tl-row ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}>
                                                <div className="sc-tl-index">{idx + 1}</div>
                                                <div className="sc-tl-content">
                                                    <p className="sc-tl-unit-name">{sch.unit.nameAr}</p>
                                                    <div className="sc-tl-dates">
                                                        <div className="sc-tl-date-group">
                                                            <Calendar size={13} />
                                                            <span>{format(start, 'dd MMM', { locale: ar })}</span>
                                                        </div>
                                                        <ArrowLeft size={12} style={{ color: 'var(--hz-text-muted)', opacity: 0.5 }} />
                                                        <div className="sc-tl-date-group">
                                                            <Target size={13} />
                                                            <span>{format(end, 'dd MMM yyyy', { locale: ar })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="sc-tl-meta">
                                                    <div className="sc-tl-duration">
                                                        <Clock size={12} />
                                                        {duration} يوم
                                                    </div>
                                                    <span className={`sc-tl-status ${isActive ? 'active' : isCompleted ? 'completed' : 'upcoming'}`}>
                                                        {isActive ? 'جاري الآن' : isCompleted ? 'مكتمل' : 'قادم'}
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {(!selectedClass?.unitSchedules || selectedClass.unitSchedules.length === 0) && (
                                        <div className="sc-empty">
                                            <div className="sc-empty-icon">📅</div>
                                            <p className="sc-empty-title">لا يوجد جدول زمني</p>
                                            <p className="sc-empty-sub">لم يتم تحديد جدول وحدات لهذا الفصل</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        ) : viewMode === 'weekly' ? (
                            /* ── WEEKLY VIEW ── */
                            <div className="sc-weekly">
                                <div className="sc-week-grid">
                                    {weekDays.map((day, i) => {
                                        const dayLecs = filteredLectures.filter(l =>
                                            isSameDay(new Date(l.scheduledDate), day)
                                        );
                                        const isToday = isSameDay(day, new Date());
                                        return (
                                            <div key={i} className="sc-day-col">
                                                {/* Day header */}
                                                <div className={`sc-day-header ${isToday ? 'today' : ''}`}>
                                                    <div className="sc-day-name">
                                                        {format(day, 'EEE', { locale: ar })}
                                                    </div>
                                                    <div className="sc-day-date">
                                                        {format(day, 'd MMM', { locale: ar })}
                                                    </div>
                                                </div>

                                                {/* Lectures */}
                                                {dayLecs.length > 0 ? dayLecs.map(lec => (
                                                    <div
                                                        key={lec.id}
                                                        className={`sc-lecture-card ${getLecStatusClass(lec)}`}
                                                        style={{ '--lec-color': getLecColor(lec) } as any}
                                                        onClick={() => handleLectureClick(lec)}
                                                    >
                                                        <div className="sc-lec-top">
                                                            <span className="sc-lec-code">{lec.unit?.code}</span>
                                                            <div className="sc-lec-badges">
                                                                {lec.status === 'postponed' && <span className="sc-lec-badge postponed">مؤجلة</span>}
                                                                {lec.status === 'cancelled' && <span className="sc-lec-badge cancelled">ملغية</span>}
                                                                {lec.status === 'completed' && <span className="sc-lec-badge completed">✓</span>}
                                                                <span className="sc-lec-seq">
                                                                    {lec.sequenceNumber}/{lec.unit?.totalLectures || '?'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="sc-lec-title">{lec.unit?.nameAr}</div>
                                                        <div className="sc-lec-detail">
                                                            <User size={11} />
                                                            <span>
                                                                {lec.instructor
                                                                    ? `${lec.instructor.firstName} ${lec.instructor.lastName}`
                                                                    : 'غير محدد'}
                                                            </span>
                                                        </div>
                                                        <div className="sc-lec-detail">
                                                            <Clock size={11} />
                                                            <span dir="ltr">
                                                                {format(new Date(lec.scheduledStartTime), 'HH:mm')}
                                                                {' - '}
                                                                {format(new Date(lec.scheduledEndTime), 'HH:mm')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )) : (
                                                    <div className="sc-empty-slot">لا محاضرات</div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                        ) : (
                            /* ── LIST VIEW ── */
                            <div className="sc-list">
                                {filteredLectures.length === 0 ? (
                                    <div className="sc-empty">
                                        <div className="sc-empty-icon">📋</div>
                                        <p className="sc-empty-title">لا توجد محاضرات</p>
                                        <p className="sc-empty-sub">لم يتم العثور على محاضرات تطابق البحث</p>
                                    </div>
                                ) : (
                                    <table className="sc-list-table">
                                        <thead>
                                            <tr>
                                                <th>الفصل</th>
                                                <th>المادة</th>
                                                <th>التاريخ</th>
                                                <th>الوقت</th>
                                                <th>المحاضر</th>
                                                <th>الحالة</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredLectures.map(lec => {
                                                const badge = getStatusBadge(lec.status || 'scheduled');
                                                return (
                                                    <tr key={lec.id}>
                                                        <td>
                                                            <span className="sc-lec-class-pill">
                                                                <BookOpen size={11} />
                                                                {lec.class?.code || lec.class?.name || '—'}
                                                            </span>
                                                        </td>
                                                        <td className="sc-lec-name-cell">{lec.unit?.nameAr || '—'}</td>
                                                        <td style={{ color: 'var(--hz-text-secondary)', fontVariantNumeric: 'tabular-nums' }}>
                                                            {format(new Date(lec.scheduledDate), 'dd/MM/yyyy')}
                                                        </td>
                                                        <td dir="ltr" style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                                                            {format(new Date(lec.scheduledStartTime), 'HH:mm')}
                                                        </td>
                                                        <td style={{ color: 'var(--hz-text-secondary)' }}>
                                                            {lec.instructor
                                                                ? `${lec.instructor.firstName} ${lec.instructor.lastName}`
                                                                : '—'}
                                                        </td>
                                                        <td>
                                                            <span className={`sc-status-badge ${badge.cls}`}>{badge.label}</span>
                                                        </td>
                                                        <td>
                                                            <button
                                                                className="sc-btn sc-btn-ghost"
                                                                style={{ fontSize: '0.72rem', height: '28px' }}
                                                                onClick={() => handleLectureClick(lec)}
                                                            >
                                                                التفاصيل
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}
                    </div>
                </main>
            </div>

            {/* Lecture Modal */}
            {showLectureModal && createPortal(
                <LectureModal
                    lecture={selectedLecture}
                    isOpen={showLectureModal}
                    onClose={handleCloseModal}
                    onPostpone={handlePostpone}
                    onCancel={handleCancel}
                    onUndo={handleUndo}
                />,
                document.body
            )}
        </div>
    );
}
