// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, Search, Trash2, Edit3, X, Users,
    GraduationCap, CheckCircle2, Download, Upload,
    CreditCard, BookOpen, SlidersHorizontal, MapPin, Phone,
    Calendar, Mail, User, ShieldCheck, Activity, Layers, ChevronLeft,
    Grid, List, RefreshCcw
} from 'lucide-react';
import { studentService, Student, CreateStudentInput } from '../services/student.service';
import { academicService } from '../services/academic.service';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import StudentFormModal from '../components/StudentFormModal';
import StudentAcademicRecord from '../components/StudentAcademicRecord';

import './AcademicStudents.css';

export default function AcademicStudents() {
    // --- STATE ---
    const [students, setStudents] = useState<Student[]>([]);
    const [programs, setPrograms] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterGender, setFilterGender] = useState('all');
    const [filterProgram, setFilterProgram] = useState('all');
    const [filterClass, setFilterClass] = useState('all');

    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // UI States
    const [showModal, setShowModal] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [academicRecordId, setAcademicRecordId] = useState<string | null>(null);

    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<any>(null);

    // Form State (for Modal)
    const [formData, setFormData] = useState<CreateStudentInput>({
        firstNameEn: '', lastNameEn: '', firstNameAr: '', lastNameAr: '',
        gender: 'male', status: 'active',
    });

    // --- INITIALIZATION ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [sRes, pRes, cRes] = await Promise.all([
                studentService.getStudents(),
                academicService.getPrograms(),
                academicService.getClasses()
            ]);
            if (sRes.success) setStudents(sRes.data?.students || []);
            if (pRes.success) setPrograms(pRes.data?.programs || []);
            if (cRes.success) setClasses(cRes.data?.classes || []);
        } catch (err) {
            setToast({ type: 'error', message: 'فشل تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    // --- COMPUTED ---
    const filtered = useMemo(() => {
        return students.filter(s => {
            const matchesSearch =
                s.firstNameAr?.includes(searchTerm) ||
                s.lastNameAr?.includes(searchTerm) ||
                s.firstNameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.lastNameEn?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.studentNumber.includes(searchTerm);

            const matchesStatus = filterStatus === 'all' || s.status === filterStatus;
            const matchesGender = filterGender === 'all' || s.gender === filterGender;

            const enrollment = s.enrollments?.[0];
            const studentProgramId = enrollment?.class?.programId || enrollment?.class?.program?.id;
            const studentClassId = enrollment?.classId || enrollment?.class?.id;

            const matchesProgram = filterProgram === 'all' || studentProgramId === filterProgram;
            const matchesClass = filterClass === 'all' || studentClassId === filterClass;

            return matchesSearch && matchesStatus && matchesGender && matchesProgram && matchesClass;
        });
    }, [students, searchTerm, filterStatus, filterGender, filterProgram, filterClass]);

    const stats = useMemo(() => ({
        total: students.length,
        active: students.filter(s => s.status === 'active').length,
        graduated: students.filter(s => s.status === 'graduated').length
    }), [students]);

    // --- ACTIONS ---
    const resetForm = () => {
        setFormData({
            firstNameEn: '', lastNameEn: '', firstNameAr: '', lastNameAr: '',
            fullNameId: '', fullNamePassport: '', certificateName: '',
            dateOfBirth: '', gender: 'male', nationality: '',
            nationalId: '', passportNumber: '', passportExpiryDate: '',
            email: '', phone: '', phone2: '', address: '', city: '', country: '',
            emergencyContactName: '', emergencyContactPhone: '',
            registrationNumberPearson: '', enrolmentNumberAlsalam: '', registrationDateAlsalam: '',
            specialization: '', certificateCourseTitle: '', notificationCourseTitle: '',
            qualificationLevel: '', awardType: undefined, yearOfAward: '',
            admissionDate: '', enrollmentDate: '', status: 'active',
            platformUsername: '', platformPassword: '',
        });
        setEditingStudent(null);
    };

    const handleStatusUpdate = async (studentId: string, currentStatus: string) => {
        const statuses = ['active', 'inactive', 'graduated', 'withdrawn', 'suspended'];
        const currentIndex = statuses.indexOf(currentStatus);
        const nextStatus = statuses[(currentIndex + 1) % statuses.length];

        try {
            setLoading(true);
            const res = await studentService.updateStudent(studentId, { status: nextStatus } as any);
            if (res.success) {
                setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status: nextStatus } : s));
                setToast({ type: 'success', message: `تم تغيير الحالة إلى: ${getStatusTheme(nextStatus).label}` });
            }
        } catch (err) {
            setToast({ type: 'error', message: 'فشل تحديث الحالة' });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = async (student?: Student) => {
        if (student) {
            try {
                setLoading(true);
                const res = await studentService.getStudent(student.id);
                const full = res.data?.student || student;
                setEditingStudent(full);

                const enroll = full.enrollments?.[0];
                const financial = (full as any).feeCalculations?.[0];
                const plan = financial?.installmentPlans?.[0];

                const tuitionItem = financial?.feeItems?.find((f: any) => f.type === 'TUITION');
                const regItem = financial?.feeItems?.find((f: any) => f.type === 'REGISTRATION');

                // Parse includeRegistrationInInstallments from internalNotes (backend pattern)
                let includeReg = true;
                try {
                    if (financial?.internalNotes) {
                        const notes = JSON.parse(financial.internalNotes);
                        includeReg = notes.includeRegistrationInInstallments ?? true;
                    }
                } catch (e) { }

                setFormData({
                    ...full,
                    dateOfBirth: full.dateOfBirth?.split('T')[0] || '',
                    passportExpiryDate: full.passportExpiryDate?.split('T')[0] || '',
                    registrationDateAlsalam: full.registrationDateAlsalam?.split('T')[0] || '',
                    admissionDate: full.enrollmentDate?.split('T')[0] || '',
                    enrollmentDate: full.enrollmentDate?.split('T')[0] || '',
                    email: full.user?.email || full.email || '',
                    phone: full.user?.phone || full.phone || '',
                    status: full.status || 'active',
                    programId: enroll?.class?.programId || enroll?.class?.program?.id || '',
                    classId: enroll?.class?.id || '',

                    // Financials
                    tuitionFee: tuitionItem ? Number(tuitionItem.amount) : undefined,
                    registrationFee: regItem ? Number(regItem.amount) : undefined,
                    initialPayment: financial?.paidAmount ? Number(financial.paidAmount) : undefined,
                    discountValue: financial?.discountAmount ? Number(financial.discountAmount) : undefined,
                    discountType: financial?.discountAmount > 0 ? 'fixed' : 'percentage', // rough guess or check backend
                    isTaxExempt: full.isTaxExempt || false,

                    // Installments
                    installmentCount: plan?.numberOfMonths || undefined,
                    firstInstallmentDate: plan?.startDate?.split('T')[0] || '',
                    includeRegistrationInInstallments: includeReg,
                    registrationFeeDate: plan?.installments?.find((ins: any) => ins.installmentNumber === 0)?.dueDate?.split('T')[0] || '',
                });
                setShowModal(true);
            } catch (err) {
                setToast({ type: 'error', message: 'خطأ في تحميل بيانات الطالب' });
            } finally {
                setLoading(false);
            }
        } else {
            resetForm();
            setShowModal(true);
        }
    };

    const handleSubmit = async (data: CreateStudentInput) => {
        try {
            setLoading(true);
            if (editingStudent) {
                await studentService.updateStudent(editingStudent.id, data);
                setToast({ type: 'success', message: '✅ تم تحديث بيانات الطالب بنجاح' });
            } else {
                await studentService.createStudent(data);
                setToast({ type: 'success', message: '✅ تم إضافة الطالب بنجاح' });
            }
            setShowModal(false);
            loadData();
        } catch (err: any) {
            console.error('Submit student error:', err);

            // Detailed validation error handling
            let errorMsg = 'فشل الحفظ';

            if (err.response?.data?.error) {
                const apiError = err.response.data.error;
                if (apiError.code === 'VALIDATION_ERROR' && apiError.details) {
                    const fieldMap: { [key: string]: string } = {
                        firstNameAr: 'الاسم الأول (عربي)',
                        lastNameAr: 'الاسم الأخير (عربي)',
                        firstNameEn: 'الاسم الأول (إنجليزي)',
                        lastNameEn: 'الاسم الأخير (إنجليزي)',
                        studentNumber: 'رقم الطالب',
                        email: 'البريد الإلكتروني',
                        phone: 'رقم الهاتف'
                    };

                    const details = apiError.details.map((d: any) => {
                        const fieldName = fieldMap[d.path[0]] || d.path[0];
                        return `${fieldName}: ${d.message}`;
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

    const handleDelete = (student: Student) => {
        setConfirmDialog({
            title: 'حذف سجل الطالب',
            message: `هل أنت متأكد من حذف الطالب "${student.firstNameAr}"؟ هذا الإجراء لا يمكن التراجع عنه.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await studentService.deleteStudent(student.id);
                    setToast({ type: 'success', message: 'تم الحذف بنجاح' });
                    setStudents(prev => prev.filter(s => s.id !== student.id));
                    setShowDrawer(false);
                } catch (err) {
                    setToast({ type: 'error', message: 'فشل الحذف' });
                } finally {
                    setConfirmDialog(null);
                }
            }
        });
    };

    const handleExport = async () => {
        try {
            setLoading(true);
            const blob = await studentService.downloadExcel();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `students_${new Date().toISOString().split('T')[0]}.xlsx`;
            document.body.appendChild(a);
            a.click();
            a.remove();
        } catch (err) {
            setToast({ type: 'error', message: 'فشل التصدير' });
        } finally {
            setLoading(false);
        }
    };

    const getStatusTheme = (status: string) => {
        switch (status) {
            case 'active': return { color: '#00D4FF', bg: 'rgba(0, 212, 255, 0.1)', label: 'نشط' };
            case 'graduated': return { color: '#00FF99', bg: 'rgba(0, 255, 153, 0.1)', label: 'متخرج' };
            case 'suspended': return { color: '#FFB800', bg: 'rgba(255, 184, 0, 0.1)', label: 'موقوف' };
            case 'withdrawn': return { color: '#FF4D4D', bg: 'rgba(255, 77, 77, 0.1)', label: 'منسحب' };
            default: return { color: '#888', bg: '#222', label: status };
        }
    };

    return (
        <div className="ag-root">
            {/* ── HEADER ── */}
            <header className="ag-header">
                <div className="ag-header-left">
                    <h2 className="ag-title">
                        <Users size={20} />
                        سجل الطلاب
                    </h2>
                    <div className="ag-mini-stats">
                        <div className="ag-stat-pill">
                            <Activity size={14} />
                            <span className="ag-stat-val">{stats.total}</span>
                        </div>
                        <div className="ag-stat-pill">
                            <GraduationCap size={14} />
                            <span className="ag-stat-val">{stats.graduated}</span>
                        </div>
                    </div>
                </div>
                <div className="ag-header-right">
                    <div className="ag-mobile-controls">
                        <button className="ag-btn-icon" onClick={() => setShowMobileFilters(!showMobileFilters)}>
                            <SlidersHorizontal size={16} />
                        </button>
                    </div>

                    <div className="ag-view-switcher hide-mobile">
                        <button
                            className={`ag-view-btn ${viewMode === 'grid' ? 'active' : ''}`}
                            onClick={() => setViewMode('grid')}
                        >
                            <Grid size={16} />
                        </button>
                        <button
                            className={`ag-view-btn ${viewMode === 'table' ? 'active' : ''}`}
                            onClick={() => setViewMode('table')}
                        >
                            <List size={16} />
                        </button>
                    </div>

                    <button className="ag-btn ag-btn-ghost hide-mobile" onClick={handleExport}>
                        <Download size={16} />
                        تصدير
                    </button>

                    <button className="ag-btn ag-btn-ghost hide-mobile" onClick={() => document.getElementById('ag-import-input')?.click()}>
                        <Upload size={16} />
                        استيراد
                    </button>
                    <input
                        id="ag-import-input"
                        type="file"
                        accept=".xlsx, .xls"
                        style={{ display: 'none' }}
                        onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                                setLoading(true);
                                await studentService.uploadExcel(file);
                                setToast({ type: 'success', message: 'تم استيراد البيانات بنجاح' });
                                loadData();
                            } catch (err: any) {
                                setToast({ type: 'error', message: err.response?.data?.error?.message || 'فشل الاستيراد' });
                            } finally {
                                setLoading(false);
                                e.target.value = '';
                            }
                        }}
                    />

                    <button className="ag-btn ag-btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} />
                        <span className="hide-mobile">طالب جديد</span>
                    </button>
                </div>
            </header>

            <div className="ag-body">
                {/* ── SIDEBAR CONTROLS ── */}
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
                                    placeholder="بحث بالاسم أو الرقم..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="ag-filter-group">
                                <label className="ag-filter-label">الحالة الأكاديمية</label>
                                <select
                                    className="ag-select"
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">كل الحالات ({stats.total})</option>
                                    <option value="active">نشط ({students.filter(s => s.status === 'active').length})</option>
                                    <option value="graduated">متخرج ({students.filter(s => s.status === 'graduated').length})</option>
                                    <option value="suspended">موقوف ({students.filter(s => s.status === 'suspended').length})</option>
                                    <option value="withdrawn">منسحب ({students.filter(s => s.status === 'withdrawn').length})</option>
                                </select>
                            </div>

                            <div className="ag-filter-group">
                                <label className="ag-filter-label">الجنس</label>
                                <select
                                    className="ag-select"
                                    value={filterGender}
                                    onChange={e => setFilterGender(e.target.value)}
                                >
                                    <option value="all">الكل</option>
                                    <option value="male">ذكور</option>
                                    <option value="female">إناث</option>
                                </select>
                            </div>

                            <div className="ag-filter-group">
                                <label className="ag-filter-label">البرنامج الدراسي</label>
                                <select
                                    className="ag-select"
                                    value={filterProgram}
                                    onChange={e => {
                                        setFilterProgram(e.target.value);
                                        setFilterClass('all'); // Reset class when program changes
                                    }}
                                >
                                    <option value="all">كل البرامج</option>
                                    {programs.map(p => (
                                        <option key={p.id} value={p.id}>{p.nameAr}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="ag-filter-group">
                                <label className="ag-filter-label">الفصل الدراسي</label>
                                <select
                                    className="ag-select"
                                    value={filterClass}
                                    onChange={e => setFilterClass(e.target.value)}
                                >
                                    <option value="all">كل الفصول</option>
                                    {classes
                                        .filter(c => filterProgram === 'all' || c.programId === filterProgram)
                                        .map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))
                                    }
                                </select>
                            </div>
                        </div>
                    </aside>
                </>

                {/* ── MAIN CONTENT ── */}
                <main className="ag-main">
                    {loading && students.length === 0 ? (
                        <div className="ag-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="ag-card ap-skeleton" style={{ height: '160px' }} />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="ag-empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--hz-text-muted)' }}>
                            <Users size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p>لا يوجد طلاب يطابقون بحثك</p>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="ag-table-container">
                            <table className="ag-table">
                                <thead>
                                    <tr>
                                        <th>الطالب</th>
                                        <th>الرقم الدراسي</th>
                                        <th>البرنامج</th>
                                        <th>الحالة</th>
                                        <th>المدفوع</th>
                                        <th>إجراء</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(student => {
                                        const stTheme = getStatusTheme(student.status);
                                        const enrollment = student.enrollments?.[0];
                                        return (
                                            <tr key={student.id} onClick={() => { setSelectedStudent(student); setShowDrawer(true); }}>
                                                <td>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                        <div className="ag-table-avatar">
                                                            {student.gender === 'female' ? '👩‍🎓' : '👨‍🎓'}
                                                        </div>
                                                        <div>
                                                            <div className="ag-table-title">{student.firstNameAr} {student.lastNameAr}</div>
                                                            <div className="ag-table-sub">{student.firstNameEn} {student.lastNameEn}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td><code className="ag-table-code">{student.studentNumber}</code></td>
                                                <td>{enrollment?.class?.program?.nameAr || '—'}</td>
                                                <td>
                                                    <span className="ag-table-badge" style={{ background: stTheme.bg, color: stTheme.color }}>
                                                        {stTheme.label}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ fontWeight: 800, color: 'var(--hz-text-bright)' }}>
                                                        {(student as any).feeCalculations?.[0]?.paidAmount || 0}
                                                        <span style={{ fontSize: '0.65rem', marginRight: '4px', color: 'var(--hz-text-muted)' }}>د.ل</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <button className="ag-btn-icon" onClick={(e) => { e.stopPropagation(); handleOpenModal(student); }}>
                                                        <Edit3 size={14} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="ag-grid">
                            {filtered.map(student => {
                                const stTheme = getStatusTheme(student.status);
                                const enrollment = student.enrollments?.[0];
                                return (
                                    <div
                                        key={student.id}
                                        className="ag-card"
                                        style={{ '--ac-color': stTheme.color } as any}
                                        onClick={() => { setSelectedStudent(student); setShowDrawer(true); }}
                                    >
                                        <div className="ag-card-status-wrap">
                                            <span className="ag-card-badge" style={{ background: stTheme.bg, color: stTheme.color }}>
                                                {stTheme.label}
                                            </span>
                                            <button
                                                className="ag-btn-icon ag-status-toggle"
                                                title="تغيير الحالة سريعاً"
                                                onClick={(e) => { e.stopPropagation(); handleStatusUpdate(student.id, student.status); }}
                                            >
                                                <RefreshCcw size={12} />
                                            </button>
                                        </div>

                                        <div className="ag-card-head">
                                            <div className="ag-avatar">
                                                {student.gender === 'female' ? '👩‍🎓' : '👨‍🎓'}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h3 className="ag-card-title">{student.firstNameAr} {student.lastNameAr}</h3>
                                                <div className="ag-card-sub">{student.firstNameEn} {student.lastNameEn}</div>
                                            </div>
                                        </div>

                                        <div className="ag-card-info">
                                            <div className="ag-info-item">
                                                <span className="ag-info-label">الرقم الدراسي</span>
                                                <span className="ag-info-val">{student.studentNumber}</span>
                                            </div>
                                            <div className="ag-info-item">
                                                <span className="ag-info-label">البرنامج</span>
                                                <span className="ag-info-val">{enrollment?.class?.program?.nameAr || '—'}</span>
                                            </div>
                                        </div>

                                        <div className="ag-card-foot">
                                            <div className="ag-card-kpi">
                                                <Phone size={14} />
                                                <strong>{student.phone || '—'}</strong>
                                            </div>
                                            <div className="ag-card-kpi">
                                                <CreditCard size={14} />
                                                <strong>{(student as any).feeCalculations?.[0]?.paidAmount || 0}</strong>
                                                <span>د.ل</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </main>
            </div>

            {/* ── STUDENT DRAWER ── */}
            {showDrawer && selectedStudent && createPortal(
                <>
                    <div className="ag-drawer-overlay" onClick={() => setShowDrawer(false)} />
                    <div className="ag-drawer">
                        <div className="ag-drawer-head">
                            <h3 className="ag-drawer-title">ملف الطالب</h3>
                            <button className="ag-btn-icon" onClick={() => setShowDrawer(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="ag-drawer-body">
                            <div style={{ textAlign: 'center', marginBottom: '1rem' }}>
                                <div className="ag-avatar" style={{ width: 80, height: 80, fontSize: '2.5rem', margin: '0 auto 12px' }}>
                                    {selectedStudent.gender === 'female' ? '👩‍🎓' : '👨‍🎓'}
                                </div>
                                <h2 style={{ fontSize: '1.2rem', fontWeight: 900, color: 'var(--hz-text-bright)', margin: 0 }}>
                                    {selectedStudent.firstNameAr} {selectedStudent.lastNameAr}
                                </h2>
                                <p style={{ color: 'var(--hz-text-muted)', fontSize: '0.9rem', margin: '4px 0' }}>{selectedStudent.studentNumber}</p>
                            </div>

                            <div className="ag-fin-grid">
                                <div className="ag-fin-card">
                                    <span className="ag-fin-lbl">إجمالي الرسوم</span>
                                    <span className="ag-fin-val">{(selectedStudent as any).feeCalculations?.[0]?.totalAmount || 0}</span>
                                </div>
                                <div className="ag-fin-card">
                                    <span className="ag-fin-lbl">المدفوع</span>
                                    <span className="ag-fin-val" style={{ color: 'var(--hz-cyan)' }}>{(selectedStudent as any).feeCalculations?.[0]?.paidAmount || 0}</span>
                                </div>
                                <div className="ag-fin-card">
                                    <span className="ag-fin-lbl">المتبقي</span>
                                    <span className="ag-fin-val" style={{ color: '#FF4D4D' }}>
                                        {((selectedStudent as any).feeCalculations?.[0]?.totalAmount || 0) - ((selectedStudent as any).feeCalculations?.[0]?.paidAmount || 0)}
                                    </span>
                                </div>
                            </div>

                            <div className="ag-data-row">
                                <span className="ag-data-label">التواصل</span>
                                <div className="ag-data-value" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={14} color="var(--hz-cyan)" /> {selectedStudent.phone || 'لا يوجد رقم'}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={14} color="var(--hz-cyan)" /> {selectedStudent.user?.email || selectedStudent.email || 'لا يوجد بريد'}</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MapPin size={14} color="var(--hz-cyan)" /> {selectedStudent.address || 'غير محدد'}</div>
                                </div>
                            </div>

                            <div className="ag-data-row">
                                <span className="ag-data-label">الأكاديمي</span>
                                <div className="ag-data-value">
                                    <div style={{ fontWeight: 800 }}>{selectedStudent.enrollments?.[0]?.class?.program?.nameAr || 'غير مسجل في برنامج'}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--hz-text-muted)', marginTop: '4px' }}>
                                        الفصل: {selectedStudent.enrollments?.[0]?.class?.name || '—'}
                                    </div>
                                </div>
                            </div>

                            <button className="ag-btn ag-btn-ghost" style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }} onClick={() => setAcademicRecordId(selectedStudent.id)}>
                                <BookOpen size={16} />
                                عرض السجل الأكاديمي الشامل
                            </button>
                        </div>
                        <div className="ag-drawer-foot">
                            <button className="ag-btn ag-btn-primary" style={{ flex: 2 }} onClick={() => handleOpenModal(selectedStudent)}>
                                <Edit3 size={16} />
                                تعديل البيانات
                            </button>
                            <button className="ag-btn ag-btn-ghost" style={{ flex: 1, color: '#FF4D4D', border: '1px solid rgba(255, 77, 77, 0.2)' }} onClick={() => handleDelete(selectedStudent)}>
                                <Trash2 size={16} />
                                حذف
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* ── MODALS & DIALOGS ── */}
            {showModal && createPortal(
                <StudentFormModal
                    show={showModal}
                    onClose={() => { setShowModal(false); setEditingStudent(null); }}
                    onSubmit={handleSubmit}
                    initialData={formData}
                    isEditing={!!editingStudent}
                    loading={loading}
                    programs={programs}
                    classes={classes}
                />,
                document.body
            )}

            {!!academicRecordId && createPortal(
                <StudentAcademicRecord
                    studentId={academicRecordId || ''}
                    isOpen={!!academicRecordId}
                    onClose={() => setAcademicRecordId(null)}
                />,
                document.body
            )}

            {toast && createPortal(
                <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />,
                document.body
            )}
            {confirmDialog && createPortal(
                <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />,
                document.body
            )}
        </div>
    );
}
