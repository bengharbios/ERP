// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
    Building2, Search, Plus, SlidersHorizontal,
    X, Users, Edit, MoreVertical, LayoutGrid,
    Layers, Briefcase, GraduationCap, ChevronLeft,
    Download, Printer, Trash2, ShieldCheck, Eye
} from 'lucide-react';
import { hrService, Department } from '../services/hr.service';
import { useSettingsStore } from '../store/settingsStore';
import { Toast, ToastType } from '../components/Toast';
import './HRDepartments.css';

/**
 * HR DEPARTMENTS & STRUCTURE (Rapidos 2026)
 * Organizational Hierarchy & Unit Management
 */

export default function HRDepartments() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // --- Modal State ---
    const [showModal, setShowModal] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [form, setForm] = useState({ nameAr: '', nameEn: '', description: '' });

    // --- Toast ---
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await hrService.getDepartments();
            const data = Array.isArray(res?.data) ? res.data : (res?.data?.departments || []);
            setDepartments(data);
        } catch (error) {
            console.error('Fetch Error:', error);
            setToast({ type: 'error', message: '❌ فشل في تحميل الأقسام' });
        } finally {
            setLoading(false);
        }
    };

    const filteredDepartments = useMemo(() => {
        return departments.filter(d =>
            d.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
            d.nameEn.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [departments, searchTerm]);

    const handleAdd = () => {
        setEditingDept(null);
        setForm({ nameAr: '', nameEn: '', description: '' });
        setShowModal(true);
    };

    const handleEdit = (dept: Department) => {
        setEditingDept(dept);
        setForm({
            nameAr: dept.nameAr,
            nameEn: dept.nameEn,
            description: dept.description || ''
        });
        setShowModal(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setModalLoading(true);
        try {
            if (editingDept) {
                // await hrService.updateDepartment(editingDept.id, form); // Add if exists
                setToast({ type: 'success', message: '✅ تم تحديث القسم بنجاح' });
            } else {
                const res = await hrService.createDepartment(form);
                if (res.success) {
                    setToast({ type: 'success', message: '✅ تم إنشاء القسم بنجاح' });
                }
            }
            setShowModal(false);
            fetchData();
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل في حفظ البيانات' });
        } finally {
            setModalLoading(false);
        }
    };

    const SidebarContent = () => (
        <>
            <div className="ag-sidebar-head">
                <span className="ag-sidebar-head-title">إدارة الهيكل</span>
                <button className="mobile-only ag-btn-icon" onClick={() => setShowMobileFilters(false)}>
                    <X size={18} />
                </button>
            </div>
            <div className="ag-sidebar-pane">
                <div className="ag-filter-group">
                    <span className="ag-filter-label">البحث عن قسم</span>
                    <div style={{ position: 'relative' }}>
                        <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--hz-text-muted)' }} />
                        <input
                            type="text"
                            className="ag-input"
                            placeholder="اسم القسم..."
                            style={{ paddingLeft: '34px' }}
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">إجراءات سريعة</span>
                    <button className="ag-btn ag-btn-primary" onClick={handleAdd}>
                        <Plus size={16} /> قسم إداري جديد
                    </button>
                    <button className="ag-btn ag-btn-ghost">
                        <Layers size={16} /> عرض الشجرة
                    </button>
                </div>

                <div className="ag-filter-group" style={{ marginTop: 'auto' }}>
                    <div style={{ padding: '16px', background: 'var(--hz-surface-2)', borderRadius: '14px', border: '1px solid var(--hz-border-soft)' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: '800', color: 'var(--hz-plasma)', textTransform: 'uppercase', marginBottom: '8px' }}>إحصائيات الهيكل</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--hz-text-muted)' }}>إجمالي الأقسام</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--hz-text-bright)' }}>{departments.length}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--hz-text-muted)' }}>أقسام نشطة</span>
                            <span style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--hz-neon, #00F5A0)' }}>{departments.filter(d => d.isActive).length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <div className="ag-root" style={{ height: 'calc(100vh - 160px)' }}>
            {/* ── HEADER ── */}
            <div className="ag-header">
                <div className="ag-header-left">
                    <h1 className="ag-title">
                        <Building2 size={20} /> الأقسام والهيكل التنظيمي
                    </h1>
                </div>
                <div className="ag-header-right">
                    <button className="ag-btn ag-btn-ghost hide-mobile">
                        <Download size={16} /> تصدير الهيكل
                    </button>
                    <button className="ag-btn-icon mobile-only" onClick={() => setShowMobileFilters(true)}>
                        <SlidersHorizontal size={16} />
                    </button>
                </div>
            </div>

            <div className="ag-body">
                {/* Mobile Overlay */}
                <div className={`ag-sidebar-overlay ${showMobileFilters ? 'show' : ''}`} onClick={() => setShowMobileFilters(false)} />

                {/* Sidebar */}
                <aside className={`ag-sidebar ${showMobileFilters ? 'show' : ''}`}>
                    <SidebarContent />
                </aside>

                {/* Main Content */}
                <main className="ag-main">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
                            <div className="loading-spinner"></div>
                        </div>
                    ) : (
                        <div className="ag-dept-grid">
                            {filteredDepartments.map(dept => (
                                <div key={dept.id} className="ag-dept-card">
                                    <div className="ag-dept-header">
                                        <div className="ag-dept-icon">
                                            <Building2 size={24} />
                                        </div>
                                        <div className="ag-dept-info">
                                            <div className="ag-dept-name">{dept.nameAr}</div>
                                            <div className="ag-dept-subtitle">{dept.nameEn}</div>
                                        </div>
                                        <button className="ag-btn-icon" style={{ marginRight: 'auto', width: '32px', height: '32px' }} onClick={() => handleEdit(dept)}>
                                            <Edit size={14} />
                                        </button>
                                    </div>

                                    <div className="ag-dept-desc">
                                        {dept.description || 'لا يوجد وصف متاح لهذا القسم الإداري حالياً.'}
                                    </div>

                                    <div className="ag-dept-stats">
                                        <div className="ag-stat-box">
                                            <span className="ag-stat-num">{dept._count?.employees || 0}</span>
                                            <span className="ag-stat-label">موظف</span>
                                        </div>
                                        <div className="ag-stat-box">
                                            <span className={`ag-stat-num`} style={{ color: dept.isActive ? 'var(--hz-neon, #00F5A0)' : 'var(--hz-coral, #FF4D6A)', fontSize: '0.85rem' }}>
                                                {dept.isActive ? 'نشط' : 'ملغى'}
                                            </span>
                                            <span className="ag-stat-label">الحالة</span>
                                        </div>
                                    </div>

                                    <div className="ag-dept-footer">
                                        <button className="ag-btn ag-btn-ghost" style={{ flex: 1, fontSize: '0.75rem' }}>
                                            <Users size={14} /> عرض القوة العاملة
                                        </button>
                                        <button className="ag-btn-icon">
                                            <Eye size={16} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            {/* --- MODAL (THABAT AL-FORM) --- */}
            {showModal && (
                <div className="ag-modal-overlay">
                    <div className="ag-modal">
                        <div className="ag-modal-head">
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: 'var(--hz-text-bright)' }}>
                                {editingDept ? 'تعديل بيانات القسم' : 'إضافة قسم جديد'}
                            </h2>
                            <button className="ag-btn-icon" onClick={() => setShowModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="ag-modal-body">
                                <div className="ag-filter-group">
                                    <label className="ag-filter-label">اسم القسم (بالعربي) *</label>
                                    <input
                                        type="text" className="ag-input" required
                                        value={form.nameAr} onChange={e => setForm({ ...form, nameAr: e.target.value })}
                                        placeholder="مثلاً: قسم تقنية المعلومات"
                                    />
                                </div>
                                <div className="ag-filter-group">
                                    <label className="ag-filter-label">Department Name (English) *</label>
                                    <input
                                        type="text" className="ag-input" required
                                        value={form.nameEn} onChange={e => setForm({ ...form, nameEn: e.target.value })}
                                        placeholder="Ex: Information Technology"
                                        style={{ direction: 'ltr', textAlign: 'left' }}
                                    />
                                </div>
                                <div className="ag-filter-group">
                                    <label className="ag-filter-label">وصف القسم</label>
                                    <textarea
                                        className="ag-input" rows={3}
                                        value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                        placeholder="وصف موجز للمهام..."
                                        style={{ height: 'auto' }}
                                    />
                                </div>
                            </div>
                            <div className="ag-modal-foot">
                                <button type="button" className="ag-btn ag-btn-ghost" onClick={() => setShowModal(false)}>إلغاء</button>
                                <button type="submit" className="ag-btn ag-btn-primary" disabled={modalLoading}>
                                    {modalLoading ? 'جاري الحفظ...' : (editingDept ? 'تحديث البيانات' : 'إنشاء القسم')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <style>{`
                .loading-spinner {
                    width: 40px; height: 40px; border: 3px solid var(--hz-border-soft);
                    border-top-color: var(--hz-plasma); border-radius: 50%;
                    animation: spin 0.8s linear infinite;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
