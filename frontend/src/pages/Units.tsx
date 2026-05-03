import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, Plus, Library, Layers,
    Edit3, Trash2, X, Clock,
    CheckCircle2, FileText, SlidersHorizontal
} from 'lucide-react';
import { academicService, Unit, Program } from '../services/academic.service';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import './Units.css';

export default function Units() {
    // --- STORES & SETTINGS ---
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // --- STATE ---
    const [units, setUnits] = useState<Unit[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProgram, setFilterProgram] = useState('all');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // UI States
    const [showModal, setShowModal] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string; message: string; type: 'danger' | 'warning' | 'info'; onConfirm: () => void;
    } | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        code: '',
        nameAr: '',
        nameEn: '',
        description: '',
        creditHours: 3,
        totalLectures: 20,
        programIds: [] as string[]
    });

    // --- INITIALIZATION ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [uRes, pRes] = await Promise.all([
                academicService.getUnits(),
                academicService.getPrograms()
            ]);
            if (uRes.success) setUnits(uRes.data?.units || []);
            if (pRes.success) setPrograms(pRes.data?.programs || []);
        } catch (err) {
            setToast({ type: 'error', message: 'فشل تحميل البيانات الأكاديمية' });
        } finally {
            setLoading(false);
        }
    };

    // --- COMPUTED ---
    const filteredUnits = useMemo(() => {
        return units.filter(u => {
            const matchesSearch =
                u.nameAr.includes(searchTerm) ||
                u.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.code.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesProgram = filterProgram === 'all' ||
                u.programUnits?.some(pu => pu.program.id === filterProgram);

            return matchesSearch && matchesProgram;
        });
    }, [units, searchTerm, filterProgram]);

    const stats = useMemo(() => {
        return {
            total: units.length,
            hours: units.reduce((acc, u) => acc + (u.creditHours || 0), 0),
            lectures: units.reduce((acc, u) => acc + (u.totalLectures || 0), 0)
        };
    }, [units]);

    // --- ACTIONS ---
    const handleOpenModal = (unit?: Unit) => {
        if (unit) {
            setEditingUnit(unit);
            setFormData({
                code: unit.code,
                nameAr: unit.nameAr,
                nameEn: unit.nameEn,
                description: unit.description || '',
                creditHours: unit.creditHours || 0,
                totalLectures: unit.totalLectures || 0,
                programIds: unit.programUnits?.map(pu => pu.program.id) || []
            });
        } else {
            setEditingUnit(null);
            setFormData({
                code: '', nameAr: '', nameEn: '', description: '',
                creditHours: 3, totalLectures: 20, programIds: []
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Front-end Validation
        if (formData.code.trim().length < 2) {
            setToast({ type: 'error', message: '❌ يجب أن يكون رمز الوحدة حرفين على الأقل' });
            return;
        }
        if (formData.nameAr.trim().length < 3) {
            setToast({ type: 'error', message: '❌ يجب أن يكون اسم الوحدة (عربي) 3 أحرف على الأقل' });
            return;
        }
        if (formData.nameEn.trim().length < 3) {
            setToast({ type: 'error', message: '❌ يجب أن يكون اسم الوحدة (إنجليزي) 3 أحرف على الأقل' });
            return;
        }
        if (formData.totalLectures < 1) {
            setToast({ type: 'error', message: '❌ يجب أن يكون عدد المحاضرات محاضرة واحدة على الأقل' });
            return;
        }

        try {
            setLoading(true);
            let res: any;
            if (editingUnit) {
                res = await academicService.updateUnit(editingUnit.id, formData);
                if (res.success) {
                    setUnits(prev => prev.map(u => u.id === editingUnit.id ? res.data?.unit : u));
                    setToast({ type: 'success', message: '✅ تم تحديث الوحدة بنجاح' });
                }
            } else {
                res = await academicService.createUnit(formData);
                if (res.success) {
                    setUnits(prev => [res.data?.unit, ...prev]);
                    setToast({ type: 'success', message: '✅ تم إضافة الوحدة الجديدة' });
                }
            }
            if (res && res.success) {
                setShowModal(false);
                loadData(); // Reload to get relations correctly
            }
        } catch (err: any) {
            console.error('Submit unit error:', err);

            // Detailed validation error handling
            let errorMsg = 'خطأ في حفظ البيانات';

            if (err.response?.data?.error) {
                const apiError = err.response.data.error;
                if (apiError.code === 'VALIDATION_ERROR' && apiError.details) {
                    const fieldMap: { [key: string]: string } = {
                        nameAr: 'الاسم العربي',
                        nameEn: 'الاسم الإنجليزي',
                        code: 'الرمز',
                        totalLectures: 'عدد المحاضرات',
                        creditHours: 'الساعات المعتمدة'
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

    const handleDelete = (unit: Unit) => {
        setConfirmDialog({
            title: 'حذف الوحدة التعليمية',
            message: `هل أنت متأكد من حذف الوحدة "${unit.nameAr}"؟ هذا الإجراء قد يؤثر على البرامج المرتبطة.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const res = await academicService.deleteUnit(unit.id);
                    if (res.success) {
                        setUnits(prev => prev.filter(u => u.id !== unit.id));
                        setToast({ type: 'success', message: 'تم الحذف بنجاح' });
                        setShowDrawer(false);
                    }
                } catch (err) {
                    setToast({ type: 'error', message: 'فشل في حذف الوحدة' });
                } finally {
                    setConfirmDialog(null);
                }
            }
        });
    };

    const toggleProgramSelection = (pid: string) => {
        setFormData(prev => ({
            ...prev,
            programIds: prev.programIds.includes(pid)
                ? prev.programIds.filter(id => id !== pid)
                : [...prev.programIds, pid]
        }));
    };

    const getThemeForCode = (code: string) => {
        const c = code.toLowerCase();
        if (c.startsWith('cs') || c.startsWith('it')) return '--hz-cyan';
        if (c.startsWith('ba') || c.startsWith('mg')) return '--hz-gold';
        if (c.startsWith('eng')) return '--hz-plasma';
        if (c.startsWith('med') || c.startsWith('hs')) return '--hz-neon';
        return '--hz-cyan';
    };

    return (
        <div className="ag-root">
            {/* ── HEADER ── */}
            <header className="ag-header">
                <div className="ag-header-left">
                    <h2 className="ag-title">
                        <Library size={20} />
                        الوحدات التعليمية
                    </h2>
                    <div className="ag-mini-stats">
                        <div className="ag-stat-pill">
                            <Layers size={14} />
                            <span className="ag-stat-val">{stats.total}</span>
                        </div>
                        <div className="ag-stat-pill">
                            <Clock size={14} />
                            <span className="ag-stat-val">{stats.hours}</span>
                        </div>
                    </div>
                </div>
                <div className="ag-header-right">
                    <div className="ag-mobile-controls">
                        <button className="ag-btn-icon" onClick={() => setShowMobileFilters(!showMobileFilters)}>
                            <SlidersHorizontal size={16} />
                        </button>
                    </div>

                    <button className="ag-btn ag-btn-primary" onClick={() => handleOpenModal()}>
                        <Plus size={16} />
                        <span className="hide-mobile">إضافة وحدة</span>
                    </button>
                    <button className="ag-btn-icon hide-mobile" title="تحديث">
                        <CheckCircle2 size={16} onClick={loadData} />
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
                                    placeholder="بحث عن وحدة..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>

                            <div className="ag-filter-group">
                                <label className="ag-filter-label">البرامج الأكاديمية</label>
                                <select
                                    className="ag-select"
                                    value={filterProgram}
                                    onChange={e => setFilterProgram(e.target.value)}
                                >
                                    <option value="all">كافة البرامج ({units.length})</option>
                                    {programs.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nameAr} ({units.filter(u => u.programUnits?.some(pu => pu.program.id === p.id)).length})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </aside>
                </>

                {/* ── MAIN CONTENT ── */}
                <main className="ag-main">

                    {loading && units.length === 0 ? (
                        <div className="ag-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="ag-card ap-skeleton" style={{ height: '180px' }} />
                            ))}
                        </div>
                    ) : filteredUnits.length === 0 ? (
                        <div className="ag-empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--hz-text-muted)' }}>
                            <Layers size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p>لا يوجد نتائج تطابق بحثك</p>
                        </div>
                    ) : (
                        <div className="ag-grid">
                            {filteredUnits.map(unit => (
                                <div
                                    key={unit.id}
                                    className="ag-card"
                                    style={{ '--ac-color': `var(${getThemeForCode(unit.code)})` } as any}
                                    onClick={() => { setSelectedUnit(unit); setShowDrawer(true); }}
                                >
                                    <div className="ag-card-head">
                                        <div className="ag-card-main-info">
                                            <h3 className="ag-card-title">{unit.nameAr}</h3>
                                            <div className="ag-card-sub">{unit.nameEn}</div>
                                        </div>
                                        <span className="ag-card-code">{unit.code}</span>
                                    </div>

                                    <div className="ag-card-meta">
                                        {unit.programUnits?.slice(0, 3).map((pu, idx) => (
                                            <span key={idx} className="ag-card-badge">
                                                {pu.program.nameAr}
                                            </span>
                                        ))}
                                        {unit.programUnits && unit.programUnits.length > 3 && (
                                            <span className="ag-card-badge">+{unit.programUnits.length - 3}</span>
                                        )}
                                    </div>

                                    <div className="ag-card-foot">
                                        <div className="ag-card-kpi">
                                            <Clock size={14} />
                                            <strong>{unit.creditHours}</strong>
                                            <span>ساعة</span>
                                        </div>
                                        <div className="ag-card-kpi">
                                            <FileText size={14} />
                                            <strong>{unit.totalLectures}</strong>
                                            <span>محاضرة</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* ── UNIT DRAWER (Side Details) ── */}
            {showDrawer && selectedUnit && createPortal(
                <>
                    <div className="ag-drawer-overlay" onClick={() => setShowDrawer(false)} />
                    <div className="ag-drawer">
                        <div className="ag-drawer-head">
                            <h3 className="ag-drawer-title">تفاصيل الوحدة</h3>
                            <button className="ag-btn-icon" onClick={() => setShowDrawer(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="ag-drawer-body">
                            <div className="ag-data-row">
                                <span className="ag-data-label">رمز الوحدة</span>
                                <span className="ag-data-value" style={{ fontWeight: 800, color: 'var(--hz-cyan)' }}>{selectedUnit.code}</span>
                            </div>
                            <div className="ag-data-row">
                                <span className="ag-data-label">الاسم الكامل</span>
                                <span className="ag-data-value">{selectedUnit.nameAr}</span>
                                <span className="ag-data-value" style={{ marginTop: '4px', fontStyle: 'italic', fontSize: '0.8rem' }}>{selectedUnit.nameEn}</span>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="ag-data-row">
                                    <span className="ag-data-label">الساعات المعتمدة</span>
                                    <span className="ag-data-value">{selectedUnit.creditHours} ساعة</span>
                                </div>
                                <div className="ag-data-row">
                                    <span className="ag-data-label">إجمالي المحاضرات</span>
                                    <span className="ag-data-value">{selectedUnit.totalLectures} محاضرة</span>
                                </div>
                            </div>

                            {selectedUnit.description && (
                                <div className="ag-data-row">
                                    <span className="ag-data-label">الوصف</span>
                                    <span className="ag-data-value">{selectedUnit.description}</span>
                                </div>
                            )}

                            <div className="ag-data-row">
                                <span className="ag-data-label">البرامج المرتبطة</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                    {selectedUnit.programUnits?.map((pu, idx) => (
                                        <div key={idx} className="ag-card-badge" style={{ padding: '6px 10px', background: 'var(--hz-surface)' }}>
                                            {pu.program.nameAr} ({pu.program.code})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="ag-drawer-foot">
                            <button className="ag-btn ag-btn-primary" style={{ flex: 1 }} onClick={() => { setShowDrawer(false); handleOpenModal(selectedUnit); }}>
                                <Edit3 size={16} />
                                تعديل الوحدة
                            </button>
                            <button className="ag-btn ag-btn-ghost" style={{ color: 'var(--hz-coral)' }} onClick={() => handleDelete(selectedUnit)}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* ── EDIT/CREATE MODAL ── */}
            {showModal && createPortal(
                <div className="ag-modal-overlay">
                    <div className="ag-modal">
                        <div className="ag-modal-head">
                            <div className="ag-modal-title">
                                <Library size={20} color="var(--hz-cyan)" />
                                <h3>{editingUnit ? 'تعديل وحدة' : 'وحدة تعليمية جديدة'}</h3>
                            </div>
                            <button className="ag-btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="ag-modal-form" onSubmit={handleSubmit}>
                            <div className="ag-modal-body">
                                <div className="ag-form-row cols-2">
                                    <div className="ag-form-group">
                                        <label className="ag-label">رمز الوحدة</label>
                                        <input
                                            className="ag-input"
                                            placeholder="مثال: CS101"
                                            required
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                        />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">الساعات / المحاضرات</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input
                                                className="ag-input"
                                                type="number"
                                                placeholder="ساعات"
                                                value={formData.creditHours}
                                                onChange={e => setFormData({ ...formData, creditHours: parseInt(e.target.value) || 0 })}
                                            />
                                            <input
                                                className="ag-input"
                                                type="number"
                                                placeholder="محاضرات"
                                                value={formData.totalLectures}
                                                onChange={e => setFormData({ ...formData, totalLectures: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="ag-form-group">
                                    <label className="ag-label">اسم الوحدة (عربي)</label>
                                    <input
                                        className="ag-input"
                                        required
                                        value={formData.nameAr}
                                        onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                                    />
                                </div>

                                <div className="ag-form-group">
                                    <label className="ag-label">الاسم بالإنجليزية</label>
                                    <input
                                        className="ag-input"
                                        required
                                        value={formData.nameEn}
                                        onChange={e => setFormData({ ...formData, nameEn: e.target.value })}
                                    />
                                </div>

                                <div className="ag-form-group">
                                    <label className="ag-label">الارتباط بالبرامج</label>
                                    <div className="ag-selection-box">
                                        {programs.map(p => (
                                            <div
                                                key={p.id}
                                                className={`ag-selection-item ${formData.programIds.includes(p.id) ? 'selected' : ''}`}
                                                onClick={() => toggleProgramSelection(p.id)}
                                            >
                                                <div className="ag-selection-check">
                                                    {formData.programIds.includes(p.id) && '✓'}
                                                </div>
                                                <span className="ag-selection-text">{p.nameAr}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="ag-form-group">
                                    <label className="ag-label">الوصف</label>
                                    <textarea
                                        className="ag-input"
                                        style={{ height: '80px', paddingTop: '10px' }}
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="ag-modal-foot">
                                <button type="button" className="ag-btn ag-btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="ag-btn ag-btn-primary" style={{ flex: 2 }}>
                                    {editingUnit ? 'حفظ التغييرات' : 'إنشاء الوحدة'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}

            {/* --- GLOBAL COMPONENTS --- */}
            {toast && createPortal(
                <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />,
                document.body
            )}
            {confirmDialog && createPortal(
                <ConfirmDialog
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    type={confirmDialog.type}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />,
                document.body
            )}
        </div>
    );
}
