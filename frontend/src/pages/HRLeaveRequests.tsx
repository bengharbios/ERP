// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
    Palmtree, Search, Filter,
    X, Users, CheckCircle2, AlertCircle,
    Calendar, Clock, MoreVertical,
    Check, Ban, MessageSquare, SlidersHorizontal,
    LayoutGrid, List, Printer
} from 'lucide-react';
import { hrService, LeaveRequest } from '../services/hr.service';
import { useSettingsStore } from '../store/settingsStore';
import { Toast, ToastType } from '../components/Toast';
import './HRLeaveRequests.css';

/**
 * INTELLIGENT LEAVE MANAGEMENT (Rapidos 2026)
 * Real-time Approvals & Workflow Tracking
 */

export default function HRLeaveRequests() {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);

    // --- Actions ---
    const [actionModal, setActionModal] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null);
    const [actionComment, setActionComment] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // --- Toast ---
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    useEffect(() => {
        fetchLeaves();
    }, [filterStatus]);

    const fetchLeaves = async () => {
        setLoading(true);
        try {
            const params: any = {};
            if (filterStatus !== 'all') params.status = filterStatus;
            const res = await hrService.getLeaves(params);
            setLeaves(res.data || []);
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل في تحميل الطلبات' });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!actionModal) return;
        setActionLoading(true);
        try {
            const status = actionModal.type === 'approve' ? 'approved' : 'rejected';
            const res = await hrService.updateLeaveStatus(actionModal.id, status, actionComment);
            if (res.success) {
                setToast({ type: 'success', message: '✅ تم تحديث حالة الطلب بنجاح' });
                setActionModal(null);
                setActionComment('');
                fetchLeaves();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ حدث خطأ أثناء التحديث' });
        } finally {
            setActionLoading(false);
        }
    };

    const stats = useMemo(() => ({
        pending: leaves.filter(l => l.status === 'pending').length,
        approved: leaves.filter(l => l.status === 'approved').length,
        rejected: leaves.filter(l => l.status === 'rejected').length,
        total: leaves.length
    }), [leaves]);

    const SidebarContent = () => (
        <div className="lr-filter-pane">
            <div className="lr-filter-group">
                <span className="lr-filter-label">حسب الحالة</span>
                <div className="lr-filter-chip !flex-row-reverse" style={{ display: 'flex', flexDirection: 'row-reverse' }}>
                    <div className={`lr-filter-chip ${filterStatus === 'all' ? 'active' : ''}`} onClick={() => setFilterStatus('all')}>
                        <span>الكل</span>
                        <span className="lr-count-badge">{stats.total}</span>
                    </div>
                </div>
                <div className={`lr-filter-chip ${filterStatus === 'pending' ? 'active' : ''}`} onClick={() => setFilterStatus('pending')}>
                    <span>قيد الانتظار</span>
                    <span className="lr-count-badge" style={{ background: '#FF7E5F' }}>{stats.pending}</span>
                </div>
                <div className={`lr-filter-chip ${filterStatus === 'approved' ? 'active' : ''}`} onClick={() => setFilterStatus('approved')}>
                    <span>تمت الموافقة</span>
                    <span className="lr-count-badge" style={{ background: '#00F5A0' }}>{stats.approved}</span>
                </div>
                <div className={`lr-filter-chip ${filterStatus === 'rejected' ? 'active' : ''}`} onClick={() => setFilterStatus('rejected')}>
                    <span>المرفوضة</span>
                    <span className="lr-count-badge" style={{ background: '#FF4D6A' }}>{stats.rejected}</span>
                </div>
            </div>

            <div className="lr-filter-group" style={{ marginTop: 'auto' }}>
                <div style={{ background: 'rgba(200, 75, 255, 0.05)', padding: '16px', borderRadius: '12px', border: '1px solid var(--hz-border-soft)' }}>
                    <p style={{ fontSize: '0.65rem', fontWeight: '800', color: 'var(--hz-text-muted)', marginBottom: '8px' }}>نظام سير العمل (Workflow)</p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--hz-text-secondary)' }}>تتم مراجعة الطلبات واعتمادها آلياً ضمن سياسة المؤسسة لعام 2026.</p>
                </div>
            </div>
        </div>
    );

    return (
        <div className="lr-root" style={{ height: 'calc(100vh - 160px)' }}>
            <div className="lr-header">
                <div className="lr-title">
                    <Palmtree size={20} /> إدارة طلبات الإجازة
                </div>
                <div className="lr-actions">
                    <button className="ag-btn-icon mobile-only" onClick={() => setShowMobileSidebar(true)}>
                        <SlidersHorizontal size={18} />
                    </button>
                    <button className="ag-btn ag-btn-ghost hide-mobile" onClick={() => window.print()}>
                        <Printer size={16} /> تصدير السجل
                    </button>
                </div>
            </div>

            <div className="lr-stats hide-mobile">
                <div className="lr-stat-pill">
                    <div className="lr-stat-icon" style={{ background: 'rgba(255, 126, 95, 0.1)', color: '#FF7E5F' }}><Clock size={16} /></div>
                    <div className="lr-stat-label">المعلقة:</div>
                    <div className="lr-stat-val" style={{ color: '#FF7E5F' }}>{stats.pending}</div>
                </div>
                <div className="lr-stat-pill">
                    <div className="lr-stat-icon" style={{ background: 'rgba(0, 245, 160, 0.1)', color: '#00F5A0' }}><CheckCircle2 size={16} /></div>
                    <div className="lr-stat-label">الموافق عليها اليوم:</div>
                    <div className="lr-stat-val" style={{ color: '#00F5A0' }}>{stats.approved}</div>
                </div>
                <div className="lr-stat-pill">
                    <div className="lr-stat-icon" style={{ background: 'var(--hz-surface-2)', color: 'var(--hz-text-muted)' }}><Users size={16} /></div>
                    <div className="lr-stat-label">إجمالي الطلبات (هذا الشهر):</div>
                    <div className="lr-stat-val">{stats.total}</div>
                </div>
            </div>

            <div className="lr-container">
                <aside className={`lr-sidebar ${showMobileSidebar ? 'show' : ''}`}>
                    <div className="ag-modal-head mobile-only">
                        <span style={{ fontWeight: 800 }}>تصفية الطلبات</span>
                        <button className="ag-btn-icon" onClick={() => setShowMobileSidebar(false)}><X size={18} /></button>
                    </div>
                    <SidebarContent />
                </aside>

                <main className="lr-main">
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="loading-spinner"></div></div>
                    ) : (
                        <div className="lr-table-wrap">
                            <table className="lr-table">
                                <thead>
                                    <tr>
                                        <th>الموظف</th>
                                        <th>نوع الإجازة</th>
                                        <th>الفترة الزمانية</th>
                                        <th>المدة</th>
                                        <th>الحالة</th>
                                        <th>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaves.map(item => {
                                        const typeLabel = item.type === 'annual' ? 'سنوية' : item.type === 'sick' ? 'مرضية' : item.type === 'unpaid' ? 'بدون راتب' : 'طواريء';
                                        const duration = Math.ceil((new Date(item.endDate).getTime() - new Date(item.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;

                                        return (
                                            <tr key={item.id} className="lr-row">
                                                <td data-label="الموظف">
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--hz-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '900', color: 'var(--hz-plasma)' }}>
                                                            {item.employee?.user?.firstName?.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div style={{ fontWeight: '800', color: 'var(--hz-text-bright)' }}>{item.employee?.user?.firstName} {item.employee?.user?.lastName}</div>
                                                            <div style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)' }}>{item.employee?.employeeCode}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td data-label="النوع">
                                                    <span className="lr-type-tag">{typeLabel}</span>
                                                </td>
                                                <td data-label="الفترة">
                                                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>
                                                        {new Date(item.startDate).toLocaleDateString('ar-SA')}
                                                        <span style={{ color: 'var(--hz-text-muted)', margin: '0 8px' }}>←</span>
                                                        {new Date(item.endDate).toLocaleDateString('ar-SA')}
                                                    </div>
                                                </td>
                                                <td data-label="المدة">
                                                    <span style={{ fontWeight: 800, color: 'var(--hz-text-bright)' }}>{duration} يوم</span>
                                                </td>
                                                <td data-label="الحالة">
                                                    <span className={`lr-status ${item.status}`}>
                                                        {item.status === 'pending' ? 'قيد الانتظار' : item.status === 'approved' ? 'مقبول' : 'مرفوض'}
                                                    </span>
                                                </td>
                                                <td data-label="إجراءات">
                                                    <div style={{ display: 'flex', gap: '8px' }}>
                                                        {item.status === 'pending' ? (
                                                            <>
                                                                <button className="ag-btn-icon" style={{ color: '#00F5A0' }} onClick={() => setActionModal({ id: item.id, type: 'approve' })}><Check size={16} /></button>
                                                                <button className="ag-btn-icon" style={{ color: '#FF4D6A' }} onClick={() => setActionModal({ id: item.id, type: 'reject' })}><Ban size={16} /></button>
                                                            </>
                                                        ) : (
                                                            <button className="ag-btn-icon"><MessageSquare size={14} /></button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                    {leaves.length === 0 && (
                                        <tr><td colSpan={6} style={{ textAlign: 'center', padding: '100px', color: 'var(--hz-text-muted)' }}>لا توجد طلبات إجازة في هذا القسم.</td></tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            {/* --- ACTION MODAL (THABAT AL-FORM) --- */}
            {actionModal && (
                <div className="ag-modal-overlay">
                    <div className="ag-modal" style={{ maxWidth: '450px' }}>
                        <div className="ag-modal-head">
                            <h2 style={{ fontSize: '1.2rem', fontWeight: '900', color: actionModal.type === 'approve' ? '#00F5A0' : '#FF4D6A' }}>
                                {actionModal.type === 'approve' ? 'اعتماد الإجازة' : 'رفض الطلب'}
                            </h2>
                            <button className="ag-btn-icon" onClick={() => setActionModal(null)}><X size={20} /></button>
                        </div>
                        <div className="ag-modal-body">
                            <p style={{ color: 'var(--hz-text-secondary)', marginBottom: '16px' }}>
                                هل أنت متأكد من تنفيذ هذا الإجراء؟ سيتم إخطار الموظف آلياً بالقرار.
                            </p>
                            <div className="lr-filter-group">
                                <label className="lr-filter-label">ملاحظات المدير (اختياري)</label>
                                <textarea
                                    className="ag-input"
                                    rows={3}
                                    style={{ background: 'var(--hz-void)', border: '1px solid var(--hz-border-soft)' }}
                                    value={actionComment}
                                    onChange={e => setActionComment(e.target.value)}
                                    placeholder="اكتب سبب الرفض أو تعليمات إضافية..."
                                />
                            </div>
                        </div>
                        <div className="ag-modal-foot">
                            <button className="ag-btn ag-btn-ghost" onClick={() => setActionModal(null)}>تراجع</button>
                            <button
                                className="ag-btn ag-btn-primary"
                                style={{ background: actionModal.type === 'approve' ? '#00F5A0' : '#FF4D6A', color: '#000' }}
                                onClick={handleAction}
                                disabled={actionLoading}
                            >
                                {actionLoading ? 'جاري التنفيذ...' : 'تأكيد الإجراء'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
