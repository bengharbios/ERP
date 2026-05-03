// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { classService } from '../services/class.service';
import { academicService } from '../services/academic.service';
import { studentService } from '../services/student.service';
import { ClassFormModal } from '../components/ClassFormModal';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
    School,
    Calendar,
    Search,
    Plus,
    Grid,
    List,
    Users,
    TrendingUp,
    Clock,
    MapPin,
    BookOpen,
    Eye,
    Edit3,
    Trash2,
    RefreshCcw,
    X,
    SlidersHorizontal,
    Activity,
    Layers,
    ChevronLeft,
    MonitorPlay,
    Download,
    Upload,
    MoreVertical
} from 'lucide-react';

import './Classes.css';

export default function Classes() {
    // --- STATE ---
    const [classes, setClasses] = useState<any[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [instructors, setInstructors] = useState<any[]>([]);
    const [students, setStudents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterProgram, setFilterProgram] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const [showModal, setShowModal] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [selectedClass, setSelectedClass] = useState<any | null>(null);
    const [editingClass, setEditingClass] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const [showStudentModal, setShowStudentModal] = useState(false);
    const [enrolledStudents, setEnrolledStudents] = useState<any[]>([]);
    const [studentSearch, setStudentSearch] = useState('');

    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<any>(null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const [formData, setFormData] = useState({
        code: '',
        name: '',
        programId: '',
        studyMode: 'IN_PERSON',
        studyDays: [],
        lectureStartTime: '09:00',
        lectureDuration: 120,
        startDate: '',
        endDate: '',
        maxStudents: 30,
        classroom: '',
        status: 'active',
        instructorId: '',
        units: []
    });

    // --- INITIALIZATION ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [cRes, pRes, iRes, sRes] = await Promise.all([
                classService.getClasses(),
                academicService.getPrograms(),
                classService.getInstructors(),
                studentService.getStudents()
            ]);
            if (cRes.success) setClasses(cRes.data?.classes || []);
            if (pRes.success) setPrograms(pRes.data?.programs || []);
            if (iRes.success) setInstructors(iRes.data?.users || []);
            if (sRes.success) setStudents(sRes.data?.students || []);
        } catch (err) {
            setToast({ type: 'error', message: 'فشل تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    // --- COMPUTED ---
    const filtered = useMemo(() => {
        return classes.filter(c => {
            const matchesSearch =
                c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.code?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesProgram = filterProgram === 'all' || c.programId === filterProgram;
            const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

            return matchesSearch && matchesProgram && matchesStatus;
        });
    }, [classes, searchTerm, filterProgram, filterStatus]);

    const stats = useMemo(() => ({
        total: classes.length,
        active: classes.filter(c => c.status === 'active' || !c.status).length,
        avgOccupancy: classes.length > 0
            ? Math.round(classes.reduce((s, c) => s + ((c._count?.studentEnrollments || 0) / (c.maxStudents || 30)) * 100, 0) / classes.length)
            : 0
    }), [classes]);

    // --- ACTIONS ---
    const resetForm = () => {
        setFormData({
            code: '', name: '', programId: '', studyMode: 'IN_PERSON',
            studyDays: [], lectureStartTime: '09:00', lectureDuration: 120,
            startDate: '', endDate: '', maxStudents: 30,
            classroom: '', status: 'active', instructorId: '', units: []
        });
        setIsEditing(false);
        setEditingClass(null);
    };

    const handleEdit = (cls: any) => {
        setEditingClass(cls);
        setIsEditing(true);
        setFormData({
            code: cls.code,
            name: cls.name,
            programId: cls.programId,
            studyMode: cls.studyMode,
            studyDays: cls.studyDays || [],
            lectureStartTime: cls.lectureStartTime,
            lectureDuration: cls.lectureDuration || 120,
            startDate: cls.startDate ? cls.startDate.split('T')[0] : '',
            endDate: cls.endDate ? cls.endDate.split('T')[0] : '',
            maxStudents: cls.maxStudents || 30,
            classroom: cls.classroom || '',
            status: cls.status || 'active',
            instructorId: cls.instructorId || '',
            units: cls.units?.map(u => ({
                unitId: u.unitId,
                totalLectures: u.totalLectures,
                instructorId: u.instructorId || ''
            })) || []
        });
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        setConfirmDialog({
            title: 'حذف الفصل الدراسي',
            message: 'هل أنت متأكد من حذف هذا الفصل؟ سيتم حذف كافة الارتباطات والبيانات ذات الصلة.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await classService.deleteClass(id);
                    setToast({ type: 'success', message: 'تم الحذف بنجاح' });
                    setClasses(prev => prev.filter(c => c.id !== id));
                    setShowDrawer(false);
                } catch (err) {
                    setToast({ type: 'error', message: 'فشل حذف الفصل' });
                } finally {
                    setConfirmDialog(null);
                }
            }
        });
    };

    const handleSubmit = async (data: any) => {
        // Front-end Validation
        if (data.code.trim().length < 2) {
            setToast({ type: 'error', message: '❌ يجب أن يكون رمز الفصل حرفين على الأقل' });
            return;
        }
        if (data.name.trim().length < 3) {
            setToast({ type: 'error', message: '❌ يجب أن يكون اسم الفصل 3 أحرف على الأقل' });
            return;
        }

        try {
            setLoading(true);
            const res = isEditing
                ? await classService.updateClass(editingClass.id, data)
                : await classService.createClass(data);

            if (res.success) {
                setToast({ type: 'success', message: isEditing ? '✅ تم التحديث بنجاح' : '✅ تم إضافة الفصل بنجاح' });
                setShowModal(false);
                loadData();
            }
        } catch (err: any) {
            console.error('Submit class error:', err);

            // Detailed validation error handling
            let errorMsg = 'فشل الحفظ';

            if (err.response?.data?.error) {
                const apiError = err.response.data.error;
                if (apiError.code === 'VALIDATION_ERROR' && apiError.details) {
                    const fieldMap: { [key: string]: string } = {
                        name: 'اسم الفصل',
                        code: 'الرمز',
                        programId: 'البرنامج',
                        startDate: 'تاريخ البدء',
                        durationMonths: 'المدة'
                    };

                    const details = apiError.details.map((d: any) => {
                        const fieldName = fieldMap[d.path[0]] || d.path[0];
                        return `${fieldName}: ${d.message === 'String must contain at least 3 character(s)' ? 'يجب أن يكون 3 أحرف على الأقل' : d.message}`;
                    }).join(', ');

                    errorMsg = `خطأ في البيانات: ${details}`;
                } else {
                    errorMsg = apiError.message || errorMsg;
                }
            } else if (err.message) {
                errorMsg = err.message;
            }

            setToast({ type: 'error', message: `❌ ${errorMsg}` });
        } finally {
            setLoading(false);
        }
    };

    const openStudentManagement = async (cls: any) => {
        setSelectedClass(cls);
        try {
            setLoading(true);
            const res = await classService.getClassStudents(cls.id);
            setEnrolledStudents(res.data.students || []);
            setShowStudentModal(true);
        } catch (err) {
            setToast({ type: 'error', message: 'فشل تحميل قائمة الطلاب' });
        } finally {
            setLoading(false);
        }
    };

    const handleEnrollStudent = async (studentId: string) => {
        try {
            await classService.enrollStudent(selectedClass.id, studentId);
            setToast({ type: 'success', message: 'تم إضافة الطالب للفصل' });
            const res = await classService.getClassStudents(selectedClass.id);
            setEnrolledStudents(res.data.students || []);
            loadData(); // refresh stats
        } catch (err) {
            setToast({ type: 'error', message: 'فشل إضافة الطالب' });
        }
    };

    const handleRemoveStudent = async (studentId: string) => {
        try {
            await classService.removeStudent(selectedClass.id, studentId);
            setToast({ type: 'success', message: 'تم إزالة الطالب' });
            const res = await classService.getClassStudents(selectedClass.id);
            setEnrolledStudents(res.data.students || []);
            loadData(); // refresh stats
        } catch (err) {
            setToast({ type: 'error', message: 'فشل إزالة الطالب' });
        }
    };

    const formatTime = (time: string) => {
        if (!time) return '—';
        try {
            const [h, m] = time.split(':');
            const hrs = parseInt(h);
            const ampm = hrs >= 12 ? 'م' : 'ص';
            const h12 = hrs % 12 || 12;
            return `${h12}:${m} ${ampm}`;
        } catch (e) { return time; }
    };

    const getDayArabic = (day: string) => {
        const days = {
            'SATURDAY': 'السبت', 'SUNDAY': 'الأحد', 'MONDAY': 'الاثنين',
            'TUESDAY': 'الثلاثاء', 'WEDNESDAY': 'الأربعاء', 'THURSDAY': 'الخميس', 'FRIDAY': 'الجمعة'
        };
        return days[day] || day;
    };

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'active': return { color: '#00D4FF', bg: 'rgba(0, 212, 255, 0.1)', label: 'نشط' };
            case 'inactive': return { color: '#FF4D4D', bg: 'rgba(255, 77, 77, 0.1)', label: 'غير نشط' };
            default: return { color: '#00D4FF', bg: 'rgba(0, 212, 255, 0.1)', label: 'نشط' };
        }
    };

    const handleFormChange = (newFormData: any) => setFormData(newFormData);
    const toggleUnit = (unitId: string) => {
        const currentUnits = [...formData.units];
        const idx = currentUnits.findIndex(u => u.unitId === unitId);
        if (idx > -1) currentUnits.splice(idx, 1);
        else currentUnits.push({ unitId, totalLectures: 12, instructorId: '' });
        setFormData({ ...formData, units: currentUnits });
    };
    const handleUnitLectureChange = (unitId: string, val: number) => {
        const units = formData.units.map(u => u.unitId === unitId ? { ...u, totalLectures: val } : u);
        setFormData({ ...formData, units });
    };
    const handleUnitInstructorChange = (unitId: string, instructorId: string) => {
        const units = formData.units.map(u => u.unitId === unitId ? { ...u, instructorId } : u);
        setFormData({ ...formData, units });
    };
    const toggleStudyDay = (day: string) => {
        const studyDays = formData.studyDays.includes(day)
            ? formData.studyDays.filter(d => d !== day)
            : [...formData.studyDays, day];
        setFormData({ ...formData, studyDays });
    };

    return (
        <div className="ag-root">
            {/* --- HEADER --- */}
            <header className="ag-header">
                <div className="ag-header-left">
                    <h2 className="ag-title">
                        <School size={20} />
                        الفصول الدراسية
                    </h2>
                    <div className="ag-mini-stats">
                        <div className="ag-stat-pill">
                            <Layers size={14} />
                            <span className="ag-stat-val">{stats.total}</span>
                        </div>
                        <div className="ag-stat-pill">
                            <Activity size={14} />
                            <span className="ag-stat-val">{stats.active}</span>
                        </div>
                    </div>
                </div>

                <div className="ag-header-right">
                    <div className="ag-mobile-controls" style={{ display: 'none' }}>
                        <button className="ag-btn-icon" onClick={() => setShowMobileFilters(!showMobileFilters)}>
                            <SlidersHorizontal size={16} />
                        </button>
                    </div>

                    <div className="ag-view-switcher hide-mobile">
                        <button className={`ag-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><Grid size={16} /></button>
                        <button className={`ag-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}><List size={16} /></button>
                    </div>

                    <button className="ag-btn ag-btn-primary" onClick={() => { resetForm(); setShowModal(true); }}>
                        <Plus size={16} />
                        <span className="hide-mobile">فصل جديد</span>
                    </button>
                </div>
            </header>

            <div className="ag-body">
                {/* --- SIDEBAR --- */}
                <>
                    <div className={`ag-sidebar-overlay ${showMobileFilters ? 'show' : ''}`} onClick={() => setShowMobileFilters(false)} />
                    <aside className={`ag-sidebar ${showMobileFilters ? 'show' : ''}`}>
                        <div className="ag-sidebar-head">
                            <span className="ag-sidebar-head-title">الفلاتر</span>
                            <button className="ag-sidebar-head-close" onClick={() => setShowMobileFilters(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="ag-sidebar-pane">
                            <div className="ag-search">
                                <Search size={16} />
                                <input
                                    type="text"
                                    placeholder="بحث..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="ag-filter-group">
                                <label className="ag-filter-label">الحالة</label>
                                <select className="ag-select" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                                    <option value="all">كل الحالات</option>
                                    <option value="active">نشطة</option>
                                    <option value="inactive">غير نشطة</option>
                                </select>
                            </div>

                            <div className="ag-filter-group">
                                <label className="ag-filter-label">البرنامج الدراسي</label>
                                <select className="ag-select" value={filterProgram} onChange={e => setFilterProgram(e.target.value)}>
                                    <option value="all">كل البرامج</option>
                                    {programs.map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                                </select>
                            </div>
                        </div>
                    </aside>
                </>

                {/* --- CONTENT --- */}
                <main className="ag-main">
                    {loading && classes.length === 0 ? (
                        <div className="ag-grid">
                            {[1, 2, 3, 4].map(i => <div key={i} className="ag-card ap-skeleton" style={{ height: '220px' }} />)}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="ag-empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--hz-text-muted)', minHeight: '400px' }}>
                            <School size={64} style={{ marginBottom: '1.5rem', opacity: 0.1 }} />
                            <h3>لا توجد فصول مطابقة</h3>
                            <p>جرب تغيير معايير البحث أو الفلترة</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="ag-grid">
                            {filtered.map(cls => {
                                const stTheme = getStatusTheme(cls.status);
                                const studentCount = cls._count?.studentEnrollments || 0;
                                const occupancy = Math.min((studentCount / (cls.maxStudents || 30)) * 100, 100);

                                return (
                                    <div key={cls.id} className="ag-card" onClick={() => { setSelectedClass(cls); setShowDrawer(true); }}>
                                        <div className="ag-card-actions">
                                            <button className="ag-action-btn" onClick={(e) => { e.stopPropagation(); setSelectedClass(cls); setShowDrawer(true); }}><Eye size={16} /></button>
                                            <button className="ag-action-btn" onClick={(e) => { e.stopPropagation(); openStudentManagement(cls); }}><Users size={16} /></button>
                                            <button className="ag-action-btn" onClick={(e) => { e.stopPropagation(); handleEdit(cls); }}><Edit3 size={16} /></button>
                                            <button className="ag-action-btn danger" onClick={(e) => { e.stopPropagation(); handleDelete(cls.id); }}><Trash2 size={16} /></button>
                                        </div>

                                        <div className="ag-card-status-wrap">
                                            <span className="ag-card-badge" style={{ background: stTheme.bg, color: stTheme.color }}>{stTheme.label}</span>
                                        </div>

                                        <div className="ag-card-head">
                                            <div className="ag-avatar"><Layers size={20} color="var(--hz-cyan)" /></div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ color: 'var(--hz-cyan)', fontSize: '0.7rem', fontWeight: 900, fontFamily: 'var(--hz-font-en)' }}>{cls.code}</div>
                                                <h3 className="ag-card-title">{cls.name}</h3>
                                                <div className="ag-card-sub">{cls.program?.nameAr}</div>
                                            </div>
                                        </div>

                                        <div className="ag-card-info">
                                            <div className="ag-info-item"><span className="ag-info-label">الطلاب</span><span className="ag-info-val">{studentCount} / {cls.maxStudents}</span></div>
                                            <div className="ag-info-item"><span className="ag-info-label">القاعة</span><span className="ag-info-val">{cls.classroom || '—'}</span></div>
                                            <div className="ag-info-item"><span className="ag-info-label">المحاضر</span><span className="ag-info-val" style={{ maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cls.instructor?.name || '—'}</span></div>
                                            <div className="ag-info-item"><span className="ag-info-label">الوقت</span><span className="ag-info-val">{formatTime(cls.lectureStartTime)}</span></div>
                                        </div>

                                        <div className="ag-card-foot">
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem' }}>
                                                <span style={{ color: 'var(--hz-text-muted)' }}>نسبة الإشغال</span>
                                                <span style={{ color: 'var(--hz-text-bright)', fontWeight: 800 }}>{Math.round(occupancy)}%</span>
                                            </div>
                                            <div style={{ height: '4px', background: 'var(--hz-surface-2)', borderRadius: '2px', overflow: 'hidden' }}>
                                                <div style={{ width: `${occupancy}%`, height: '100%', background: occupancy > 90 ? 'var(--hz-coral)' : 'var(--hz-cyan)', borderRadius: '2px' }} />
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="ag-table-container">
                            <table className="ag-table">
                                <thead>
                                    <tr>
                                        <th>الفصل الدراسي</th>
                                        <th>الرمز</th>
                                        <th>البرنامج</th>
                                        <th>الطلاب</th>
                                        <th>الحالة</th>
                                        <th>إجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(cls => (
                                        <tr key={cls.id} onClick={() => { setSelectedClass(cls); setShowDrawer(true); }}>
                                            <td>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <div className="ag-table-avatar"><Layers size={16} /></div>
                                                    <div className="ag-table-title">{cls.name}</div>
                                                </div>
                                            </td>
                                            <td><code className="ag-table-code">{cls.code}</code></td>
                                            <td>{cls.program?.nameAr}</td>
                                            <td>{cls._count?.studentEnrollments || 0} / {cls.maxStudents}</td>
                                            <td><span className="ag-table-badge" style={{ background: getStatusTheme(cls.status).bg, color: getStatusTheme(cls.status).color }}>{getStatusTheme(cls.status).label}</span></td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="ag-btn-icon" onClick={(e) => { e.stopPropagation(); openStudentManagement(cls); }}><Users size={14} /></button>
                                                    <button className="ag-btn-icon" onClick={(e) => { e.stopPropagation(); handleEdit(cls); }}><Edit3 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            {/* --- DRAWER --- */}
            {showDrawer && selectedClass && createPortal(
                <>
                    <div className="ag-drawer-overlay" onClick={() => setShowDrawer(false)} />
                    <div className="ag-drawer">
                        <div className="ag-drawer-head">
                            <h3 className="ag-drawer-title">تفاصيل الفصل</h3>
                            <button className="ag-btn-icon" onClick={() => setShowDrawer(false)}><X size={18} /></button>
                        </div>
                        <div className="ag-drawer-body">
                            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
                                <div className="ag-avatar" style={{ width: 80, height: 80, margin: '0 auto 12px', background: 'var(--hz-surface-3)' }}>
                                    <School size={40} color="var(--hz-cyan)" />
                                </div>
                                <h2 style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--hz-text-bright)', margin: 0 }}>{selectedClass.name}</h2>
                                <p style={{ color: 'var(--hz-cyan)', fontSize: '0.85rem', fontWeight: 800 }}>{selectedClass.code}</p>
                            </div>

                            <div className="ag-fin-grid">
                                <div className="ag-fin-card"><span className="ag-fin-lbl">الطلاب</span><span className="ag-fin-val">{selectedClass._count?.studentEnrollments || 0}</span></div>
                                <div className="ag-fin-card"><span className="ag-fin-lbl">المقاعد</span><span className="ag-fin-val" style={{ color: 'var(--hz-cyan)' }}>{selectedClass.maxStudents}</span></div>
                                <div className="ag-fin-card"><span className="ag-fin-lbl">المتوفر</span><span className="ag-fin-val" style={{ color: 'var(--hz-neon)' }}>{selectedClass.maxStudents - (selectedClass._count?.studentEnrollments || 0)}</span></div>
                            </div>

                            <div className="ag-data-row">
                                <span className="ag-data-label">البرنامج الدراسي</span>
                                <div className="ag-data-value">{selectedClass.program?.nameAr}</div>
                            </div>

                            <div className="ag-data-row">
                                <span className="ag-data-label">الجدول الدراسي</span>
                                <div className="ag-data-value">
                                    {selectedClass.studyDays.map(d => getDayArabic(d)).join(' ، ')} | {formatTime(selectedClass.lectureStartTime)}
                                </div>
                            </div>

                            <div className="ag-data-row">
                                <span className="ag-data-label">المحاضر المسؤول</span>
                                <div className="ag-data-value">{selectedClass.instructor?.name || '—'}</div>
                            </div>

                            <button className="ag-btn ag-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} onClick={() => openStudentManagement(selectedClass)}>
                                <Users size={16} />
                                إدارة سجل الطلاب
                            </button>
                        </div>
                        <div className="ag-drawer-foot">
                            <button className="ag-btn ag-btn-primary" style={{ flex: 2 }} onClick={() => handleEdit(selectedClass)}><Edit3 size={16} /> تعديل البيانات</button>
                            <button className="ag-btn ag-btn-ghost" style={{ flex: 1, color: 'var(--hz-coral)' }} onClick={() => handleDelete(selectedClass.id)}><Trash2 size={16} /></button>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* --- MODALS --- */}
            {showModal && createPortal(
                <ClassFormModal show={showModal} onClose={() => { setShowModal(false); resetForm(); }} onSubmit={handleSubmit} formData={formData} isEditing={isEditing} programs={programs} onChange={handleFormChange} toggleUnit={toggleUnit} onUnitLectureChange={handleUnitLectureChange} onUnitInstructorChange={handleUnitInstructorChange} toggleStudyDay={toggleStudyDay} instructors={instructors} />,
                document.body
            )}

            {showStudentModal && selectedClass && createPortal(
                <div className="ag-modal-overlay" onClick={() => setShowStudentModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head">
                            <div className="ag-modal-title"><Users size={20} color="var(--hz-cyan)" /> <h3>طلاب: {selectedClass.name}</h3></div>
                            <button className="ag-btn-icon" onClick={() => setShowStudentModal(false)}><X size={18} /></button>
                        </div>
                        <div className="ag-modal-body">
                            <div className="ag-search" style={{ marginBottom: '1.5rem' }}>
                                <Search size={16} />
                                <input type="text" placeholder="بحث عن طالب..." value={studentSearch} onChange={e => setStudentSearch(e.target.value)} />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {enrolledStudents.filter(s => !studentSearch || `${s.user?.firstName} ${s.user?.lastName} ${s.studentNumber}`.toLowerCase().includes(studentSearch.toLowerCase())).map(s => (
                                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--hz-surface)', borderRadius: '12px', border: '1px solid var(--hz-border-subtle)' }}>
                                        <div><div style={{ fontWeight: 800, color: 'var(--hz-text-bright)' }}>{s.user?.firstName} {s.user?.lastName}</div><div style={{ fontSize: '0.7rem', color: 'var(--hz-text-muted)' }}>{s.studentNumber}</div></div>
                                        <button className="ag-btn" style={{ background: 'var(--hz-coral-glow)', color: 'var(--hz-coral)', border: 'none', height: '28px' }} onClick={() => handleRemoveStudent(s.id)}>إزالة</button>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: '2rem', borderTop: '1px solid var(--hz-border-soft)', paddingTop: '1.5rem' }}>
                                <h4 style={{ color: 'var(--hz-cyan)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: 800 }}>إضافة طالب جديد للفصل</h4>
                                {students.filter(s => !enrolledStudents.find(e => e.id === s.id) && (!studentSearch || `${s.firstNameAr} ${s.lastNameAr} ${s.studentNumber}`.toLowerCase().includes(studentSearch.toLowerCase()))).slice(0, 5).map(s => (
                                    <div key={s.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: 'var(--hz-surface-2)', borderRadius: '12px', marginBottom: '6px', border: '1px solid var(--hz-border-subtle)' }}>
                                        <div style={{ fontWeight: 700 }}>{s.firstNameAr} {s.lastNameAr}</div>
                                        <button className="ag-btn" style={{ background: 'var(--hz-neon-glow)', color: 'var(--hz-neon)', border: 'none', height: '28px' }} onClick={() => handleEnrollStudent(s.id)}>إضافة</button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {confirmDialog && createPortal(<ConfirmDialog title={confirmDialog.title} message={confirmDialog.message} type={confirmDialog.type} onConfirm={confirmDialog.onConfirm} onCancel={() => setConfirmDialog(null)} />, document.body)}
            {toast && createPortal(<Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />, document.body)}
        </div>
    );
}
