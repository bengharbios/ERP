// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
    FileText, Search, Plus, Grid, List,
    RefreshCw, Clock, Calendar, CheckCircle2,
    Edit3, Trash2, Users, X, SlidersHorizontal, ArrowLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { academicService } from '../services/academic.service';
import { assignmentsService, Assignment } from '../services/assignments.service';
import { AssignmentSubmissionsModal } from '../components/AssignmentSubmissionsModal';
import { AssignmentDetailsModal } from '../components/AssignmentDetailsModal';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

import './Assignments.css';

export default function Assignments() {
    // --- DATA ---
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [units, setUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- UI STATES ---
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [showSubmissions, setShowSubmissions] = useState(false);
    const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
    const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

    // --- FILTERS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterUnit, setFilterUnit] = useState('all');

    // --- FEEDBACK ---
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<any>(null);

    // --- FORM DATA ---
    const [formData, setFormData] = useState({
        unitId: '', title: '', description: '',
        submissionDeadline: '', totalMarks: 100,
        passThreshold: 50, status: 'draft'
    });

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [uRes, aRes] = await Promise.all([
                academicService.getUnits(),
                assignmentsService.getAssignments()
            ]);
            if (uRes.data) setUnits(uRes.data.units || []);
            if (aRes.data) setAssignments(aRes.data.assignments || []);
        } catch (err) {
            setToast({ type: 'error', message: 'فشل تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => {
        return assignments.filter(a => {
            const matchesSearch =
                (a.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (a.unit?.nameAr || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || a.status === filterStatus;
            const matchesUnit = filterUnit === 'all' || a.unitId === filterUnit;
            return matchesSearch && matchesStatus && matchesUnit;
        });
    }, [assignments, searchTerm, filterStatus, filterUnit]);

    const stats = useMemo(() => ({
        total: assignments.length,
        published: assignments.filter(a => a.status === 'published').length,
        draft: assignments.filter(a => a.status === 'draft').length,
    }), [assignments]);

    const handleEdit = (a: Assignment) => {
        setEditingAssignment(a);
        setFormData({
            unitId: a.unitId,
            title: a.title,
            description: a.description || '',
            submissionDeadline: a.submissionDeadline ? new Date(a.submissionDeadline).toISOString().split('T')[0] : '',
            totalMarks: a.totalMarks || 100,
            passThreshold: a.passThreshold || 50,
            status: a.status
        });
        setShowModal(true);
    };

    const handleDelete = (a: Assignment) => {
        setConfirmDialog({
            title: 'حذف التقييم',
            message: `هل أنت متأكد من حذف ${a.title}؟`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    await assignmentsService.deleteAssignment(a.id);
                    setToast({ type: 'success', message: 'تم الحذف بنجاح' });
                    loadData();
                } catch (e) {
                    setToast({ type: 'error', message: 'فشل الحذف' });
                }
                setConfirmDialog(null);
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        if (e) e.preventDefault();

        if (formData.title.trim().length < 3) {
            setToast({ type: 'error', message: 'يجب أن يكون عنوان الواجب 3 أحرف على الأقل' });
            return;
        }

        if (!formData.unitId) {
            setToast({ type: 'error', message: 'يرجى اختيار الوحدة' });
            return;
        }

        try {
            const payload = {
                unitId: formData.unitId,
                title: formData.title,
                description: formData.description,
                dueDate: formData.submissionDeadline || new Date().toISOString().split('T')[0],
                maxScore: formData.totalMarks,
                passThreshold: formData.passThreshold,
                status: formData.status
            };
            if (editingAssignment) {
                await assignmentsService.updateAssignment(editingAssignment.id, payload);
                setToast({ type: 'success', message: 'تم التحديث بنجاح' });
            } else {
                await assignmentsService.createAssignment(payload);
                setToast({ type: 'success', message: 'تم الإضافة بنجاح' });
            }
            setShowModal(false);
            loadData();
        } catch (error: any) {
            console.error('Submit error:', error);
            const errMsg = error.response?.data?.error?.message || error.response?.data?.message || 'حدث خطأ أثناء الحفظ';
            setToast({ type: 'error', message: errMsg });
        }
    };

    return (
        <div className="ag-root">
            {/* ── HEADER ── */}
            <header className="ag-header">
                <div className="ag-header-left">
                    <h2 className="ag-title">
                        <FileText size={20} />
                        الواجبات والمهام
                    </h2>

                    <div className="ag-mini-stats hide-mobile">
                        <div className="ag-stat-pill">
                            إجمالي الواجبات <span className="ag-stat-val">{stats.total}</span>
                        </div>
                        <div className="ag-stat-pill">
                            منشور <span className="ag-stat-val">{stats.published}</span>
                        </div>
                    </div>
                </div>

                <div className="ag-header-right">
                    <button className="ag-btn-icon show-mobile" onClick={() => setShowMobileFilters(true)}>
                        <SlidersHorizontal size={18} />
                    </button>

                    <div className="ag-view-switcher">
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

                    <button className="ag-btn ag-btn-primary" onClick={() => { setEditingAssignment(null); setFormData({ unitId: '', title: '', description: '', submissionDeadline: '', totalMarks: 100, passThreshold: 50, status: 'draft' }); setShowModal(true); }}>
                        <Plus size={16} />
                        <span className="hide-mobile">واجب جديد</span>
                    </button>
                </div>
            </header>

            <div className="ag-body">
                {/* ── SIDEBAR CONTROLS ── */}
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
                                    placeholder="بحث بعنوان الواجب..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="ag-filter-group">
                                <label className="ag-filter-label">الحالة</label>
                                <select
                                    className="ag-select"
                                    value={filterStatus}
                                    onChange={e => setFilterStatus(e.target.value)}
                                >
                                    <option value="all">كل الحالات</option>
                                    <option value="published">منشور</option>
                                    <option value="draft">مسودة</option>
                                    <option value="closed">منتهي</option>
                                </select>
                            </div>

                            <div className="ag-filter-group">
                                <label className="ag-filter-label">المادة الدراسية</label>
                                <select
                                    className="ag-select"
                                    value={filterUnit}
                                    onChange={e => setFilterUnit(e.target.value)}
                                >
                                    <option value="all">كل المواد</option>
                                    {units.map(u => (
                                        <option key={u.id} value={u.id}>{u.nameAr}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </aside>
                </>

                {/* ── MAIN CONTENT ── */}
                <main className="ag-main">
                    {loading ? (
                        <div className="ag-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="ag-card ap-skeleton" style={{ height: '160px' }} />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--hz-text-muted)' }}>
                            <FileText size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p>لا توجد واجبات مطابقة لبحثك</p>
                        </div>
                    ) : viewMode === 'table' ? (
                        <div className="ag-table-container">
                            <table className="ag-table">
                                <thead>
                                    <tr>
                                        <th>العنوان</th>
                                        <th>المادة</th>
                                        <th>الحالة</th>
                                        <th>الموعد</th>
                                        <th>التسليمات</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map(a => (
                                        <tr key={a.id} onClick={() => { setSelectedAssignment(a); setShowDetails(true); }}>
                                            <td>
                                                <div className="ag-table-title">{a.title}</div>
                                                <div className="ag-table-sub">{a.unit?.code}</div>
                                            </td>
                                            <td style={{ fontWeight: 800 }}>{a.unit?.nameAr}</td>
                                            <td>
                                                <span className={`ag-card-badge ${a.status}`}>
                                                    {a.status === 'published' ? 'منشور' : a.status === 'draft' ? 'مسودة' : 'منتهي'}
                                                </span>
                                            </td>
                                            <td dir="ltr">{a.submissionDeadline ? format(new Date(a.submissionDeadline), 'yyyy/MM/dd') : '—'}</td>
                                            <td style={{ fontWeight: 800 }}>{a.submissions || 0}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                                    <button className="ag-btn-icon" title="رصد الدرجات" onClick={() => { setSelectedAssignment(a); setShowSubmissions(true); }}><Users size={14} /></button>
                                                    <button className="ag-btn-icon" onClick={() => handleEdit(a)}><Edit3 size={14} /></button>
                                                    <button className="ag-btn-icon" style={{ color: '#FC8181' }} onClick={() => handleDelete(a)}><Trash2 size={14} /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="ag-grid">
                            {filtered.map(a => (
                                <div key={a.id} className="ag-card" onClick={() => { setSelectedAssignment(a); setShowDetails(true); }}>
                                    <div className="ag-card-status-wrap">
                                        <span className={`ag-card-badge ${a.status}`}>
                                            {a.status === 'published' ? 'منشور' : a.status === 'draft' ? 'مسودة' : 'منتهي'}
                                        </span>
                                    </div>
                                    <div className="ag-card-head">
                                        <div className="ag-avatar"><FileText size={24} /></div>
                                        <div>
                                            <h3 className="ag-card-title">{a.title}</h3>
                                            <span className="ag-card-sub" style={{ color: 'var(--hz-orange)' }}>{a.unit?.nameAr}</span>
                                        </div>
                                    </div>
                                    <div className="ag-card-info">
                                        <div className="ag-info-item">
                                            <span className="ag-info-label">الموعد النهائي</span>
                                            <span className="ag-info-val" dir="ltr">{a.submissionDeadline ? format(new Date(a.submissionDeadline), 'yyyy/MM/dd') : '—'}</span>
                                        </div>
                                        <div className="ag-info-item">
                                            <span className="ag-info-label">الدرجة الكلية</span>
                                            <span className="ag-info-val">{a.totalMarks}</span>
                                        </div>
                                    </div>
                                    <div className="ag-card-foot">
                                        <div className="ag-card-kpi">
                                            <Users size={14} /> <strong>{a.submissions || 0}</strong> تسليمات
                                        </div>
                                        <div style={{ display: 'flex', gap: '8px' }} onClick={e => e.stopPropagation()}>
                                            <button className="ag-btn-icon" onClick={() => handleEdit(a)}><Edit3 size={14} /></button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* ── MODALS ── */}
            {showModal && (
                <div className="ag-modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head">
                            <h3 className="ag-modal-title">{editingAssignment ? 'تعديل واجب' : 'إضافة واجب جديد'}</h3>
                            <button className="ag-btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="ag-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="ag-filter-group">
                                <label className="ag-filter-label">المادة الدراسية</label>
                                <select className="ag-select" required value={formData.unitId} onChange={e => setFormData({ ...formData, unitId: e.target.value })}>
                                    <option value="">اختر المادة...</option>
                                    {units.map(u => <option key={u.id} value={u.id}>{u.nameAr}</option>)}
                                </select>
                            </div>
                            <div className="ag-filter-group">
                                <label className="ag-filter-label">عنوان الواجب</label>
                                <input
                                    type="text"
                                    className="ag-select"
                                    style={{ backgroundImage: 'none', paddingLeft: '12px' }}
                                    required
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="ag-filter-group">
                                    <label className="ag-filter-label">الموعد النهائي</label>
                                    <input type="date" className="ag-select" style={{ backgroundImage: 'none', paddingLeft: '12px' }} value={formData.submissionDeadline} onChange={e => setFormData({ ...formData, submissionDeadline: e.target.value })} />
                                </div>
                                <div className="ag-filter-group">
                                    <label className="ag-filter-label">الحالة</label>
                                    <select className="ag-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}>
                                        <option value="draft">مسودة</option>
                                        <option value="published">منشور</option>
                                        <option value="closed">منتهي</option>
                                    </select>
                                </div>
                            </div>
                        </form>
                        <div className="ag-modal-foot">
                            <button className="ag-btn ag-btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                            <button className="ag-btn ag-btn-primary" onClick={handleSubmit}>حفظ التغييرات</button>
                        </div>
                    </div>
                </div>
            )}

            {showDetails && selectedAssignment && <AssignmentDetailsModal assignment={selectedAssignment} onClose={() => setShowDetails(false)} />}
            {showSubmissions && selectedAssignment && <AssignmentSubmissionsModal assignment={selectedAssignment} onClose={() => { setShowSubmissions(false); setSelectedAssignment(null); }} onRefresh={loadData} />}
            {confirmDialog && <ConfirmDialog {...confirmDialog} onCancel={() => setConfirmDialog(null)} />}
            {toast && <Toast {...toast} onClose={() => setToast(null)} />}
        </div>
    );
}
