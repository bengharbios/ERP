// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
    LayoutGrid, Plus, Edit2, Trash2,
    ArrowRightLeft, Sliders, CheckCircle,
    Star, Settings, TrendingUp, Info,
    Search, X, SlidersHorizontal, List,
    Archive, Trophy, Frown, RefreshCw,
    UserPlus, Columns, Check, AlertTriangle
} from 'lucide-react';
import { stageApi } from '../services/crm.service';
import { Toast, ToastType } from '../components/Toast';
import {
    HzModal, HzBtn, HzLoader, HzEmpty,
    HzInput, HzSelect
} from '../layouts/Rapidos2026/components/RapidosUI';

import './CRMStages2026.css';

/**
 * CRM STAGES MANAGEMENT (Rapidos 2026)
 */
export default function CRMStages2026() {
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    const [search, setSearch] = useState('');
    const [showSidebar, setShowSidebar] = useState(window.innerWidth > 1000);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    const [formData, setFormData] = useState({
        name: '',
        nameAr: '',
        sequence: '1',
        probability: '10',
        active: true,
        isWon: false,
        isLost: false,
        folded: false
    });

    useEffect(() => {
        fetchStages();
    }, []);

    const fetchStages = async () => {
        setLoading(true);
        try {
            const res = await stageApi.getAll();
            // Sort by sequence
            const data = (res.data || []).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
            setStages(data);
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل تحميل المراحل' });
        } finally {
            setLoading(false);
        }
    };

    const openModal = (stage?: any) => {
        if (stage) {
            setEditingId(stage.id);
            setFormData({
                name: stage.name || '',
                nameAr: stage.nameAr || '',
                sequence: String(stage.sequence || 0),
                probability: String(stage.probability || 0),
                active: stage.isActive !== false,
                isWon: stage.isWon === true,
                isLost: stage.isLost === true,
                folded: stage.isFolded === true
            });
        } else {
            setEditingId(null);
            setFormData({
                name: '',
                nameAr: '',
                sequence: String(stages.length + 1),
                probability: '10',
                active: true,
                isWon: false,
                isLost: false,
                folded: false
            });
        }
        setShowModal(true);
    };

    const handleSubmit = async () => {
        if (!formData.nameAr.trim()) {
            setToast({ type: 'error', message: '⚠️ الاسم العربي مطلوب' });
            return;
        }

        try {
            const payload = {
                ...formData,
                sequence: parseInt(formData.sequence) || 0,
                probability: parseInt(formData.probability) || 0
            };

            const res = editingId
                ? await stageApi.update(editingId, payload)
                : await stageApi.create(payload);

            if (res.data) {
                setToast({ type: 'success', message: '✅ تم حفظ المرحلة بنجاح' });
                setShowModal(false);
                fetchStages();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل حفظ المرحلة' });
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (!window.confirm(`هل أنت متأكد من حذف مرحلة "${name}"؟`)) return;

        try {
            await stageApi.delete(id);
            setToast({ type: 'success', message: '🗑️ تم الحذف بنجاح' });
            fetchStages();
        } catch (error: any) {
            const msg = error.response?.data?.error?.message || error.message || '❌ فشل حذف المرحلة';
            setToast({ type: 'error', message: msg });
        }
    };

    const handleToggleFold = async (stage: any) => {
        try {
            await stageApi.update(stage.id, { folded: !stage.isFolded });
            setToast({ type: 'success', message: stage.isFolded ? '📂 تم إلغاء طي المرحلة' : '📁 تم طي المرحلة' });
            fetchStages();
        } catch {
            setToast({ type: 'error', message: '❌ فشل تحديث حالة الطي' });
        }
    };

    const filteredStages = useMemo(() => {
        return stages.filter(s => {
            const hay = `${s.name} ${s.nameAr}`.toLowerCase();
            return !search || hay.includes(search.toLowerCase());
        });
    }, [stages, search]);

    const stats = useMemo(() => ({
        total: stages.length,
        active: stages.filter(s => s.isActive !== false).length,
        folded: stages.filter(s => s.isFolded).length
    }), [stages]);

    return (
        <div style={{ padding: '0 20px 20px' }}>
            <div className="crm-root crm-stages-root">
                {/* ── TOOLBAR ── */}
                <div className="crm-toolbar">
                    <h1 className="crm-toolbar-title">
                        <Sliders size={18} />
                        <span className="crm-toolbar-title-text">إدارة مراحل البيع</span>
                    </h1>

                    <div className="crm-toolbar-sep hide-on-mobile" />

                    <div className="crm-search-wrap">
                        <Search size={14} />
                        <input className="crm-search" placeholder="بحث عن مرحلة..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>

                    <div className="crm-stats-row hide-on-mobile">
                        <div className="crm-stat-pill">الكل <b>{stats.total}</b></div>
                        <div className="crm-stat-pill">نشط <b>{stats.active}</b></div>
                        {stats.folded > 0 && <div className="crm-stat-pill" style={{ color: 'var(--hz-orange)' }}>مطوية <b>{stats.folded}</b></div>}
                    </div>

                    <div className="crm-toolbar-end">
                        <div className="crm-view-switch hide-on-mobile">
                            <button className={`crm-view-btn ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}><LayoutGrid size={15} /></button>
                            <button className={`crm-view-btn ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}><List size={15} /></button>
                        </div>
                        <button className={`crm-icon-btn ${showSidebar ? 'active' : ''}`} onClick={() => setShowSidebar(!showSidebar)} title="الفلاتر">
                            <SlidersHorizontal size={15} />
                        </button>
                        <button className="crm-add-btn" onClick={() => openModal()}>
                            <Plus size={16} /> مرحلة جديدة
                        </button>
                    </div>
                </div>

                <div className="crm-body">
                    {/* SIDEBAR */}
                    {showSidebar && (
                        <aside className="crm-sidebar">
                            <div className="crm-sidebar-section">
                                <div className="crm-sidebar-label">عرض سريع</div>
                                <div style={{ display: 'grid', gap: 10 }}>
                                    <HzBtn variant="secondary" size="sm" onClick={() => setSearch('')}>كل المراحل</HzBtn>
                                    <HzBtn variant="secondary" size="sm" onClick={() => setSearch('فوز')}>مراحل الفوز</HzBtn>
                                    <HzBtn variant="secondary" size="sm" onClick={() => setSearch('خسارة')}>مراحل الخسارة</HzBtn>
                                </div>
                            </div>
                            <div className="crm-sidebar-section">
                                <div className="crm-sidebar-label">تلميحات</div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--hz-text-muted)', lineHeight: 1.5 }}>
                                    • اسحب المراحل في الـ Pipeline لترتيب تسلسله.<br />
                                    • المراحل المطوية توفر مساحة في الكانبان.<br />
                                    • مرحلة الفوز تطلق المؤثرات الاحتفالية.
                                </p>
                            </div>
                        </aside>
                    )}

                    <main className="crm-main">
                        {loading ? (
                            <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><HzLoader /></div>
                        ) : filteredStages.length === 0 ? (
                            <HzEmpty title="لا توجد مراحل" description="ابدأ بإنشاء مراحل البيع لتتبع فرصك." />
                        ) : viewMode === 'table' ? (
                            <div className="crm-table-wrap">
                                <div className="crm-table-inner">
                                    <table className="crm-table">
                                        <thead>
                                            <tr>
                                                <th>المرحلة</th>
                                                <th>التسلسل</th>
                                                <th>الاحتمالية</th>
                                                <th>الحالة</th>
                                                <th>إجراءات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredStages.map(stage => (
                                                <tr key={stage.id}>
                                                    <td>
                                                        <div className="crm-cell-name">
                                                            <div className="crm-cell-avatar">#{stage.sequence}</div>
                                                            <div>
                                                                <div className="crm-cell-name-text">{stage.nameAr || stage.name}</div>
                                                                <div style={{ fontSize: '0.7rem', opacity: 0.5 }}>{stage.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>{stage.sequence}</td>
                                                    <td>{stage.probability}%</td>
                                                    <td>
                                                        <div style={{ display: 'flex', gap: 4 }}>
                                                            {stage.isActive !== false && <span className="crm-tag" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--hz-green)' }}>نشط</span>}
                                                            {stage.isWon && <span className="crm-tag" style={{ background: 'rgba(255,184,0,0.1)', color: 'var(--hz-orange)' }}>فوز</span>}
                                                            {stage.isLost && <span className="crm-tag" style={{ background: 'rgba(255,70,70,0.1)', color: '#FF4646' }}>خسارة</span>}
                                                            {stage.isFolded && <span className="crm-tag" style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--hz-cyan)' }}>مطوية</span>}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <div className="crm-table-actions">
                                                            <button className="crm-icon-btn active" style={{ width: 28, height: 28 }} onClick={() => openModal(stage)}><Edit2 size={12} /></button>
                                                            <button className="crm-icon-btn" style={{ width: 28, height: 28, color: '#FF4646' }} onClick={() => handleDelete(stage.id, stage.nameAr)}><Trash2 size={12} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        ) : (
                            <div className="crm-kanban" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                {filteredStages.map(stage => (
                                    <div key={stage.id} className="crm-card" onClick={() => openModal(stage)}>
                                        <div className="stage-card-glow" />

                                        <div className="crm-card-header">
                                            <div className="crm-avatar">#{stage.sequence}</div>
                                            <div className="crm-card-meta">
                                                <div className="crm-card-name">{stage.nameAr || stage.name}</div>
                                                <div className="crm-card-sub">{stage.name || 'Untitled'}</div>
                                            </div>
                                            <div className="crm-card-actions">
                                                <Archive size={14} className={`crm-icon-fold ${stage.isFolded ? 'active' : ''}`}
                                                    onClick={(e) => { e.stopPropagation(); handleToggleFold(stage); }}
                                                    title={stage.isFolded ? "إلغاء الطي" : "طي المرحلة"} />
                                                <Trash2 size={14} className="crm-icon-trash"
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(stage.id, stage.nameAr); }}
                                                    title="حذف" />
                                            </div>
                                        </div>

                                        <div className="crm-card-contacts" style={{ marginTop: 5 }}>
                                            <div className="crm-contact-row">
                                                <TrendingUp size={14} />
                                                <span>احتمالية النجاح: <b>{stage.probability}%</b></span>
                                            </div>
                                        </div>

                                        <div className="crm-card-tags">
                                            {stage.isActive !== false ?
                                                <span className="crm-tag" style={{ background: 'rgba(0,255,136,0.1)', color: 'var(--hz-green)', border: '1px solid rgba(0,255,136,0.2)' }}>نشط</span> :
                                                <span className="crm-tag" style={{ background: 'rgba(255,255,255,0.05)', color: '#888', border: '1px solid rgba(255,255,255,0.1)' }}>ملغى</span>
                                            }
                                            {stage.isWon && <span className="crm-tag" style={{ background: 'rgba(255,184,0,0.1)', color: 'var(--hz-orange)', border: '1px solid rgba(255,184,0,0.2)' }}><Trophy size={10} style={{ marginRight: 4 }} /> فوز</span>}
                                            {stage.isLost && <span className="crm-tag" style={{ background: 'rgba(255,70,70,0.1)', color: '#FF4646', border: '1px solid rgba(255,70,70,0.2)' }}><Frown size={10} style={{ marginRight: 4 }} /> خسارة</span>}
                                            {stage.isFolded && <span className="crm-tag" style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--hz-cyan)', border: '1px solid rgba(0,212,255,0.2)' }}><Archive size={10} style={{ marginRight: 4 }} /> مطوية</span>}
                                        </div>

                                        <div className="crm-card-footer">
                                            <Settings size={12} style={{ opacity: 0.5 }} />
                                            <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>تعديل الإعدادات</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </main>
                </div>
            </div>

            {/* Stage Modal */}
            <HzModal
                open={showModal}
                onClose={() => setShowModal(false)}
                title={editingId ? 'تعديل المرحلة' : 'إضافة مرحلة جديدة'}
                icon={<Settings size={18} />}
                size="md"
                footer={<>
                    <HzBtn variant="secondary" onClick={() => setShowModal(false)}>تراجع</HzBtn>
                    <HzBtn variant="primary" onClick={handleSubmit} style={{ marginRight: 'auto' }}>
                        {editingId ? 'تحديث المرحلة' : 'إنشاء المرحلة'}
                    </HzBtn>
                </>}
            >
                <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '20px' }}>

                    <div className="hz-form-row cols-2">
                        <div className="hz-form-group">
                            <label className="hz-label">الاسم بالعربية</label>
                            <input className="hz-input" placeholder="مثال: تفاوض" value={formData.nameAr} onChange={e => setFormData({ ...formData, nameAr: e.target.value })} />
                        </div>
                        <div className="hz-form-group">
                            <label className="hz-label">الاسم بالفرنسية/الإنجليزية</label>
                            <input className="hz-input" placeholder="Negotiation" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} dir="ltr" />
                        </div>
                    </div>

                    <div className="hz-form-row cols-2">
                        <div className="hz-form-group">
                            <label className="hz-label">التسلسل (Sequence)</label>
                            <input className="hz-input" type="number" value={formData.sequence} onChange={e => setFormData({ ...formData, sequence: e.target.value })} />
                        </div>
                        <div className="hz-form-group">
                            <label className="hz-label">الاحتمالية الافتراضية (%)</label>
                            <div style={{ position: 'relative' }}>
                                <input className="hz-input" type="number" value={formData.probability} onChange={e => setFormData({ ...formData, probability: e.target.value })} />
                                <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', opacity: 0.5, fontSize: '0.8rem', fontWeight: 900 }}>%</div>
                            </div>
                        </div>
                    </div>

                    <div className="hz-form-row cols-2">
                        <div className={`stage-status-toggle ${formData.active ? 'active' : ''}`} onClick={() => setFormData({ ...formData, active: !formData.active })}>
                            <div className={`stage-status-dot ${formData.active ? 'active' : ''}`}
                                style={{ background: formData.active ? 'var(--hz-green)' : '#555' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>مرحلة نشطة</span>
                        </div>
                        <div className={`stage-status-toggle folded-toggle ${formData.folded ? 'active' : ''}`} onClick={() => setFormData({ ...formData, folded: !formData.folded })}>
                            <div className={`stage-status-dot ${formData.folded ? 'active' : ''}`}
                                style={{ background: formData.folded ? 'var(--hz-cyan)' : '#555' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>طي المرحلة (Folded)</span>
                        </div>
                    </div>

                    <div className="hz-form-row cols-2">
                        <div className={`stage-status-toggle won-toggle ${formData.isWon ? 'active' : ''}`} onClick={() => setFormData({ ...formData, isWon: !formData.isWon, isLost: false, probability: !formData.isWon ? '100' : formData.probability })}>
                            <div className={`stage-status-dot ${formData.isWon ? 'active' : ''}`}
                                style={{ background: formData.isWon ? 'var(--hz-orange)' : '#555' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>مرحلة فوز (Won)</span>
                        </div>
                        <div className={`stage-status-toggle lost-toggle ${formData.isLost ? 'active' : ''}`} onClick={() => setFormData({ ...formData, isLost: !formData.isLost, isWon: false, probability: !formData.isLost ? '0' : formData.probability })}>
                            <div className={`stage-status-dot ${formData.isLost ? 'active' : ''}`}
                                style={{ background: formData.isLost ? '#FF4646' : '#555' }} />
                            <span style={{ fontSize: '0.9rem', fontWeight: 800 }}>مرحلة خسارة (Lost)</span>
                        </div>
                    </div>

                    <div style={{
                        background: 'rgba(0, 212, 255, 0.03)',
                        border: '1px solid rgba(0, 212, 255, 0.1)',
                        borderRadius: 14,
                        padding: '16px 20px',
                        fontSize: '0.85rem',
                        color: 'var(--hz-text-secondary)',
                        lineHeight: 1.6,
                        textAlign: 'right'
                    }}>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Info size={16} color="var(--hz-cyan)" style={{ flexShrink: 0 }} />
                            <span>المراحل المطوية (Folded) تظهر بشكل مصغر في لوحة كانبان لتوفير مساحة، وتستخدم عادة للمراحل النهائية مثل "فوز" أو "خسارة".</span>
                        </div>
                    </div>

                </div>
            </HzModal>

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
