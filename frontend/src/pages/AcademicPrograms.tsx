// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, Plus, Database, Layers,
    Edit3, Trash2, X, Clock,
    CheckCircle2, SlidersHorizontal, Activity,
    Archive, GripVertical, Settings
} from 'lucide-react';
import { academicService, Program } from '../services/academic.service';
import { settingsService } from '../services/settings.service';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

import {
    DndContext, closestCenter, KeyboardSensor, PointerSensor,
    useSensor, useSensors
} from '@dnd-kit/core';
import {
    arrayMove, SortableContext, sortableKeyboardCoordinates,
    verticalListSortingStrategy, useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import './AcademicPrograms.css';

/* ── Sortable Unit Item (Mirroring Units structure but for sorting inside Modal) ── */
function SortableUnitItem({ id, unit, isSelected, onToggle }: any) {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition }}
            className={`ag-unit-row ${isSelected ? 'selected' : ''}`}
        >
            <div {...attributes} {...listeners} className="ag-unit-drag">
                <GripVertical size={14} />
            </div>
            <div className="ag-unit-code">{unit.code}</div>
            <div className="ag-unit-name" onClick={() => onToggle(unit.id)}>
                {unit.nameAr}
            </div>
            <div className="ag-unit-check" onClick={() => onToggle(unit.id)}>
                {isSelected ? '✓' : ''}
            </div>
        </div>
    );
}

export default function AcademicPrograms() {
    // --- STATE ---
    const [programs, setPrograms] = useState<Program[]>([]);
    const [levels, setLevels] = useState<any[]>([]);
    const [bodies, setBodies] = useState<any[]>([]);
    const [allUnits, setAllUnits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [search, setSearch] = useState('');
    const [filterLevel, setFilterLevel] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    const [showModal, setShowModal] = useState(false);
    const [showDrawer, setShowDrawer] = useState(false);
    const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<any>(null);

    // Form State
    const [form, setForm] = useState({
        code: '', nameAr: '', nameEn: '', description: '',
        levelId: '', awardingBodyId: '', durationMonths: 12, totalUnits: undefined
    });
    const [selectedUnits, setSelectedUnits] = useState<string[]>([]);
    const [saving, setSaving] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    // --- INITIALIZATION ---
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [pRes, lRes, bRes, uRes] = await Promise.all([
                academicService.getPrograms(),
                settingsService.getProgramLevels(true),
                settingsService.getAwardingBodies(true),
                academicService.getUnits(true),
            ]);
            if (pRes.success) setPrograms(pRes.data?.programs || []);
            if (lRes.success) setLevels(lRes.data?.levels || []);
            if (bRes.success) setBodies(bRes.data?.bodies || []);
            if (uRes.success) setAllUnits(uRes.data?.units || []);
        } catch (err) {
            setToast({ type: 'error', message: 'فشل مزامنة البيانات الأكاديمية' });
        } finally {
            setLoading(false);
        }
    };

    // --- COMPUTED ---
    const filtered = useMemo(() => {
        return programs.filter(p => {
            const matchesSearch = p.nameAr?.includes(search) || p.code?.toLowerCase().includes(search.toLowerCase());
            const matchesLevel = filterLevel === 'all' || (p as any).levelId === filterLevel;
            const matchesStatus = filterStatus === 'all' ||
                (filterStatus === 'active' && p.isActive) ||
                (filterStatus === 'inactive' && !p.isActive);
            return matchesSearch && matchesLevel && matchesStatus;
        });
    }, [programs, search, filterLevel, filterStatus]);

    const stats = useMemo(() => {
        return {
            total: programs.length,
            active: programs.filter(p => p.isActive).length,
            inactive: programs.filter(p => !p.isActive).length
        };
    }, [programs]);

    // Helpers
    const getLevelName = (p: any) => p.programLevel?.nameAr || levels.find(l => l.id === p.levelId)?.nameAr || 'غير محدد';
    const getBodyName = (p: any) => p.awardingBody?.nameAr || bodies.find(b => b.id === (p as any).awardingBodyId)?.nameAr || 'غير محدد';

    const getThemeForCode = (code: string | undefined) => {
        if (!code) return '--hz-cyan';
        const c = code.toLowerCase();
        if (c.startsWith('cs') || c.startsWith('it')) return '--hz-cyan';
        if (c.startsWith('ba') || c.startsWith('mg')) return '--hz-gold';
        if (c.startsWith('eng')) return '--hz-plasma';
        if (c.startsWith('med') || c.startsWith('hs')) return '--hz-neon';
        return '--hz-cyan';
    };

    // --- ACTIONS ---
    const handleOpenModal = (p?: Program) => {
        if (p) {
            setEditingProgram(p);
            setForm({
                code: p.code, nameAr: p.nameAr, nameEn: p.nameEn,
                description: (p as any).description || '',
                levelId: (p as any).levelId || '',
                awardingBodyId: (p as any).awardingBodyId || '',
                durationMonths: p.durationMonths,
                totalUnits: p.totalUnits
            });
            setSelectedUnits(p.programUnits?.map((pu: any) => pu.unitId) || []);
        } else {
            setEditingProgram(null);
            setForm({
                code: '', nameAr: '', nameEn: '', description: '',
                levelId: '', awardingBodyId: '', durationMonths: 12, totalUnits: undefined
            });
            setSelectedUnits([]);
        }
        setShowModal(true);
        setShowDrawer(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setSaving(true);
            const payload = {
                ...form,
                levelId: form.levelId || undefined,
                awardingBodyId: form.awardingBodyId || undefined,
                description: form.description || undefined,
                totalUnits: selectedUnits.length > 0 ? selectedUnits.length : (form.totalUnits || undefined),
                unitIds: selectedUnits.length > 0 ? selectedUnits : undefined,
            };

            let res;
            if (editingProgram) {
                res = await academicService.updateProgram(editingProgram.id, payload);
                if (res.success) setToast({ type: 'success', message: 'تم تحديث البرنامج بنجاح' });
            } else {
                res = await academicService.createProgram(payload);
                if (res.success) setToast({ type: 'success', message: 'تم إضافة البرنامج الجديد' });
            }

            if (res.success) {
                setShowModal(false);
                loadData();
            }
        } catch (err: any) {
            console.error('Submit Error:', err);
            let errorMsg = 'خطأ في حفظ البيانات';

            if (err.response?.data?.error) {
                const apiError = err.response.data.error;
                if (apiError.code === 'VALIDATION_ERROR' && apiError.details) {
                    const fieldMap: any = {
                        nameAr: 'الاسم العربي',
                        nameEn: 'الاسم الإنجليزي',
                        code: 'الرمز',
                        durationMonths: 'المدة',
                        totalUnits: 'التحصصات/الوحدات'
                    };
                    const details = apiError.details.map((d: any) => {
                        const field = fieldMap[d.path[0]] || d.path[0];
                        return `${field}: ${d.message}`;
                    }).join('\n');
                    errorMsg = `نواقص في البيانات:\n${details}`;
                } else {
                    errorMsg = apiError.message || errorMsg;
                }
            }
            setToast({ type: 'error', message: errorMsg });
        }
        finally {
            setSaving(false);
        }
    };

    const handleDelete = (p: Program) => {
        setConfirmDialog({
            title: 'حذف البرنامج الأكاديمي',
            message: `هل أنت متأكد من حذف البرنامج "${p.nameAr}"؟ هذا الإجراء سيؤدي إلى إزالة كافة الارتباطات.`,
            type: 'danger',
            onConfirm: async () => {
                try {
                    const res = await academicService.deleteProgram(p.id);
                    if (res.success) {
                        setPrograms(prev => prev.filter(x => x.id !== p.id));
                        setToast({ type: 'success', message: 'تم الحذف بنجاح' });
                        setShowDrawer(false);
                    }
                } catch (err) {
                    setToast({ type: 'error', message: 'فشل في حذف البرنامج' });
                } finally {
                    setConfirmDialog(null);
                }
            }
        });
    };

    const toggleUnitSelection = (uid: string) => {
        setSelectedUnits(prev => prev.includes(uid) ? prev.filter(id => id !== uid) : [...prev, uid]);
    };

    const handleDragEnd = (e: any) => {
        const { active, over } = e;
        if (active.id !== over?.id) {
            setSelectedUnits(items => {
                const oi = items.indexOf(active.id);
                const ni = items.indexOf(over!.id);
                return arrayMove(items, oi, ni);
            });
        }
    };

    return (
        <div className="ag-root">
            {/* ── HEADER ── */}
            <header className="ag-header">
                <div className="ag-header-left">
                    <h2 className="ag-title">
                        <Database size={20} />
                        البرامج الأكاديمية
                    </h2>
                    <div className="ag-mini-stats">
                        <div className="ag-stat-pill">
                            <Activity size={14} />
                            <span className="ag-stat-val">{stats.total}</span>
                        </div>
                        <div className="ag-stat-pill">
                            <CheckCircle2 size={14} />
                            <span className="ag-stat-val">{stats.active}</span>
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
                        <span className="hide-mobile">إضافة برنامج</span>
                    </button>
                </div>
            </header>

            <div className="ag-body">
                {/* ── SIDEBAR FILTERS ── */}
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
                                    placeholder="بحث عن برنامج..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                />
                            </div>

                            <div className="ag-filter-group">
                                <label className="ag-filter-label">الحالة</label>
                                <div className={`ag-chip ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
                                    <span>الكل</span>
                                    <span className="ag-chip-count">{stats.total}</span>
                                </div>
                                <div className={`ag-chip ${filterStatus === 'active' ? 'active' : ''}`} onClick={() => setFilterStatus('active')}>
                                    <span>نشط</span>
                                    <span className="ag-chip-count">{stats.active}</span>
                                </div>
                                <div className={`ag-chip ${filterStatus === 'inactive' ? 'active' : ''}`} onClick={() => setFilterStatus('inactive')}>
                                    <span>متوقف</span>
                                    <span className="ag-chip-count">{stats.inactive}</span>
                                </div>
                            </div>

                            <div className="ag-filter-group">
                                <label className="ag-filter-label">التصنيفات (المستوى)</label>
                                <div className={`ag-chip ${filterLevel === 'all' ? 'active' : ''}`} onClick={() => setFilterLevel('all')}>
                                    <span>جميع المستويات</span>
                                </div>
                                {levels.map(l => {
                                    const count = programs.filter(p => (p as any).levelId === l.id).length;
                                    if (count === 0 && filterLevel !== l.id) return null;
                                    return (
                                        <div key={l.id} className={`ag-chip ${filterLevel === l.id ? 'active' : ''}`} onClick={() => setFilterLevel(l.id)}>
                                            <span>{l.nameAr}</span>
                                            <span className="ag-chip-count">{count}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </aside>
                </>

                {/* ── MAIN CONTENT ── */}
                <main className="ag-main">
                    {loading && programs.length === 0 ? (
                        <div className="ag-grid">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="ag-card ap-skeleton" style={{ height: '140px' }} />
                            ))}
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="ag-empty-state" style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--hz-text-muted)' }}>
                            <Layers size={48} style={{ marginBottom: '1rem', opacity: 0.2 }} />
                            <p>لا يوجد نتائج تطابق بحثك</p>
                        </div>
                    ) : (
                        <div className="ag-grid">
                            {filtered.map(p => (
                                <div
                                    key={p.id}
                                    className="ag-card"
                                    style={{ '--ac-color': `var(${getThemeForCode(p.code)})` } as any}
                                    onClick={() => { setSelectedProgram(p); setShowDrawer(true); }}
                                >
                                    <div className="ag-card-head">
                                        <div style={{ flex: 1 }}>
                                            <h3 className="ag-card-title">{p.nameAr}</h3>
                                            <div className="ag-card-sub">{p.nameEn || '—'}</div>
                                        </div>
                                        <span className="ag-card-code">{p.code}</span>
                                    </div>

                                    <div className="ag-card-meta">
                                        <span className="ag-card-badge">{p.isActive ? 'نشط' : 'متوقف'}</span>
                                        <span className="ag-card-badge">{getLevelName(p)}</span>
                                    </div>

                                    <div className="ag-card-foot" style={{ display: 'flex', flexDirection: 'row', gap: '6px', flexWrap: 'nowrap', alignItems: 'center' }}>
                                        <div className="ag-card-kpi" style={{ flex: 1, justifyContent: 'center' }}>
                                            <Clock size={13} />
                                            <strong>{p.durationMonths}</strong>
                                            <span>شهر</span>
                                        </div>
                                        <div className="ag-card-kpi" style={{ flex: 1, justifyContent: 'center' }}>
                                            <Layers size={13} />
                                            <strong>{p.totalUnits || 0}</strong>
                                            <span>وحدة</span>
                                        </div>
                                        <div className="ag-card-kpi" style={{ flex: 1, justifyContent: 'center' }}>
                                            <Archive size={13} />
                                            <strong>{(p as any)._count?.classes || 0}</strong>
                                            <span>فصل</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* ── PROGRAM DRAWER ── */}
            {showDrawer && selectedProgram && createPortal(
                <>
                    <div className="ag-drawer-overlay" onClick={() => setShowDrawer(false)} />
                    <div className="ag-drawer">
                        <div className="ag-drawer-head">
                            <h3 className="ag-drawer-title">تفاصيل البرنامج</h3>
                            <button className="ag-btn-icon" onClick={() => setShowDrawer(false)}>
                                <X size={18} />
                            </button>
                        </div>
                        <div className="ag-drawer-body">
                            <div className="ag-data-row">
                                <span className="ag-data-label">الرمز والاسم</span>
                                <span className="ag-data-value" style={{ fontWeight: 800 }}>
                                    {selectedProgram.code} — {selectedProgram.nameAr}
                                </span>
                            </div>
                            <div className="ag-data-row">
                                <span className="ag-data-label">المستوى والجهة المانحة</span>
                                <span className="ag-data-value">
                                    {getLevelName(selectedProgram)} | {getBodyName(selectedProgram)}
                                </span>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                                <div className="ag-data-row">
                                    <span className="ag-data-label">المدة الزمنية</span>
                                    <span className="ag-data-value">{selectedProgram.durationMonths} شهر</span>
                                </div>
                                <div className="ag-data-row">
                                    <span className="ag-data-label">عدد الوحدات</span>
                                    <span className="ag-data-value">{selectedProgram.totalUnits || 0} وحدة</span>
                                </div>
                            </div>
                            {selectedProgram.description && (
                                <div className="ag-data-row">
                                    <span className="ag-data-label">الوصف</span>
                                    <span className="ag-data-value">{selectedProgram.description}</span>
                                </div>
                            )}
                            <div className="ag-data-row">
                                <span className="ag-data-label">الوحدات التعليمية المقترنة</span>
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                                    {selectedProgram.programUnits?.map((pu, idx) => (
                                        <div key={idx} className="ag-card-badge" style={{ padding: '6px 10px', background: 'var(--hz-surface)' }}>
                                            {pu.unit.nameAr} ({pu.unit.code})
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="ag-drawer-foot">
                            <button className="ag-btn ag-btn-primary" style={{ flex: 1 }} onClick={() => handleOpenModal(selectedProgram)}>
                                <Edit3 size={16} />
                                تعديل البرنامج
                            </button>
                            <button className="ag-btn ag-btn-ghost" style={{ color: 'var(--hz-coral)' }} onClick={() => handleDelete(selectedProgram)}>
                                <Trash2 size={16} />
                            </button>
                        </div>
                    </div>
                </>,
                document.body
            )}

            {/* ── PROGRAM MODAL ── */}
            {showModal && createPortal(
                <div className="ag-modal-overlay">
                    <div className="ag-modal">
                        <div className="ag-modal-head">
                            <div className="ag-modal-title">
                                <Settings size={20} color="var(--hz-cyan)" />
                                <h3>{editingProgram ? 'تعديل البرنامج' : 'برنامج أكاديمي جديد'}</h3>
                            </div>
                            <button className="ag-btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form className="ag-modal-form" onSubmit={handleSubmit}>
                            <div className="ag-modal-body">
                                <div className="ag-form-row cols-2">
                                    <div className="ag-form-group">
                                        <label className="ag-label">رمز البرنامج</label>
                                        <input
                                            className="ag-input"
                                            placeholder="مثال: DIP-CS"
                                            required
                                            value={form.code}
                                            onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">المدة الزمنية (أشهر)</label>
                                        <input
                                            className="ag-input"
                                            type="number"
                                            required
                                            value={form.durationMonths}
                                            onChange={e => setForm({ ...form, durationMonths: parseInt(e.target.value) || 1 })}
                                        />
                                    </div>
                                </div>

                                <div className="ag-form-row cols-2">
                                    <div className="ag-form-group">
                                        <label className="ag-label">اسم البرنامج (عربي)</label>
                                        <input
                                            className="ag-input"
                                            required
                                            value={form.nameAr}
                                            onChange={e => setForm({ ...form, nameAr: e.target.value })}
                                        />
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">اسم البرنامج (إنجليزي)</label>
                                        <input
                                            className="ag-input"
                                            required
                                            value={form.nameEn}
                                            onChange={e => setForm({ ...form, nameEn: e.target.value })}
                                            placeholder="Example: Computer Science"
                                        />
                                    </div>
                                </div>

                                <div className="ag-form-row cols-2">
                                    <div className="ag-form-group">
                                        <label className="ag-label">المستوى</label>
                                        <select className="ag-input" value={form.levelId} onChange={e => setForm({ ...form, levelId: e.target.value })}>
                                            <option value="">-- اختر المستوى --</option>
                                            {levels.map(l => <option key={l.id} value={l.id}>{l.nameAr}</option>)}
                                        </select>
                                    </div>
                                    <div className="ag-form-group">
                                        <label className="ag-label">الجهة المانحة</label>
                                        <select className="ag-input" value={form.awardingBodyId} onChange={e => setForm({ ...form, awardingBodyId: e.target.value })}>
                                            <option value="">-- اختر الجهة --</option>
                                            {bodies.map(b => <option key={b.id} value={b.id}>{b.nameAr}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="ag-form-group">
                                    <label className="ag-label">ربط الوحدات ({selectedUnits.length} مقترنة)</label>
                                    <div className="ag-units-list">
                                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                            <SortableContext items={selectedUnits} strategy={verticalListSortingStrategy}>
                                                {allUnits.map(unit => (
                                                    <SortableUnitItem
                                                        key={unit.id}
                                                        id={unit.id}
                                                        unit={unit}
                                                        isSelected={selectedUnits.includes(unit.id)}
                                                        onToggle={toggleUnitSelection}
                                                    />
                                                ))}
                                            </SortableContext>
                                        </DndContext>
                                    </div>
                                </div>

                                <div className="ag-form-group">
                                    <label className="ag-label">الوصف</label>
                                    <textarea
                                        className="ag-input"
                                        style={{ height: '60px', paddingTop: '10px' }}
                                        value={form.description}
                                        onChange={e => setForm({ ...form, description: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="ag-modal-foot">
                                <button type="button" className="ag-btn ag-btn-ghost" style={{ flex: 1 }} onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="ag-btn ag-btn-primary" style={{ flex: 2 }} disabled={saving}>
                                    {saving ? 'جاري الحفظ...' : (editingProgram ? 'حفظ التغييرات' : 'إنشاء البرنامج')}
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
