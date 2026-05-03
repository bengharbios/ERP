import React, { useState, useEffect } from 'react';
import { hrService, LeaveRequest } from '../services/hr.service';
import { Toast, ToastType } from '../components/Toast';
import './Employees.css'; // Reuse existing styles

export default function LeaveRequests() {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [actionModal, setActionModal] = useState<{ id: string; type: 'approve' | 'reject' } | null>(null);
    const [actionComment, setActionComment] = useState('');

    useEffect(() => {
        fetchLeaves();
    }, [filterStatus]);

    const fetchLeaves = async () => {
        try {
            setLoading(true);
            const params: any = {};
            if (filterStatus !== 'all') params.status = filterStatus;

            const res = await hrService.getLeaves(params);
            if (res.success) {
                setLeaves(res.data);
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل في تحميل طلبات الإجازة' });
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async () => {
        if (!actionModal) return;

        try {
            const status = actionModal.type === 'approve' ? 'approved' : 'rejected';
            const res = await hrService.updateLeaveStatus(actionModal.id, status, actionComment);

            if (res.success) {
                setToast({ type: 'success', message: `✅ تم ${status === 'approved' ? 'الموافق' : 'الرفض'} بنجاح` });
                setActionModal(null);
                setActionComment('');
                fetchLeaves();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ حدث خطأ أثناء تنفيذ الإجراء' });
        }
    };

    const statusBadge = (status: string) => {
        const styles: any = {
            pending: { bg: '#FEFCBF', color: '#D69E2E', label: 'قيد الانتظار' },
            approved: { bg: '#C6F6D5', color: '#38A169', label: 'مقبول' },
            rejected: { bg: '#FED7D7', color: '#E53E3E', label: 'مرفوض' }
        };
        const s = styles[status] || styles.pending;
        return (
            <span style={{
                background: s.bg, color: s.color, padding: '0.25rem 0.75rem',
                borderRadius: '20px', fontSize: '0.85rem', fontWeight: 'bold'
            }}>
                {s.label}
            </span>
        );
    };

    const formatDate = (d: string) => new Date(d).toLocaleDateString('ar-SA');

    return (
        <div className="next-gen-page-container">
            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">🏖️</div>
                        <div className="branding-text">
                            <h1>إدارة الإجازات</h1>
                            <p className="hide-on-mobile">Leave Requests Management</p>
                        </div>
                    </div>
                </div>
            </header>

            <main className="container-wide main-content">
                {/* Stats Row */}
                <div className="stats-grid mb-6">
                    <div className="stat-card">
                        <div className="stat-icon orange">⏳</div>
                        <div className="stat-info">
                            <h3>الطلبات المعلقة</h3>
                            <p className="stat-value">{leaves.filter(l => l.status === 'pending').length}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon green">✅</div>
                        <div className="stat-info">
                            <h3>المقبولة</h3>
                            <p className="stat-value">{leaves.filter(l => l.status === 'approved').length}</p>
                        </div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-icon red">❌</div>
                        <div className="stat-info">
                            <h3>المرفوضة</h3>
                            <p className="stat-value">{leaves.filter(l => l.status === 'rejected').length}</p>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="filters-bar glass-effect mb-6" style={{ padding: '1rem', borderRadius: '12px', display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={() => setFilterStatus('all')}
                        className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: filterStatus === 'all' ? '#ED8936' : 'transparent', color: filterStatus === 'all' ? 'white' : '#4A5568' }}
                    >
                        الكل
                    </button>
                    <button
                        onClick={() => setFilterStatus('pending')}
                        className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: filterStatus === 'pending' ? '#ED8936' : 'transparent', color: filterStatus === 'pending' ? 'white' : '#4A5568' }}
                    >
                        قيد الانتظار
                    </button>
                    <button
                        onClick={() => setFilterStatus('approved')}
                        className={`filter-btn ${filterStatus === 'approved' ? 'active' : ''}`}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: filterStatus === 'approved' ? '#ED8936' : 'transparent', color: filterStatus === 'approved' ? 'white' : '#4A5568' }}
                    >
                        مقبول
                    </button>
                    <button
                        onClick={() => setFilterStatus('rejected')}
                        className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
                        style={{ padding: '0.5rem 1rem', borderRadius: '8px', border: 'none', cursor: 'pointer', background: filterStatus === 'rejected' ? '#ED8936' : 'transparent', color: filterStatus === 'rejected' ? 'white' : '#4A5568' }}
                    >
                        مرفوض
                    </button>
                </div>

                {/* Table */}
                <div className="next-gen-table-container">
                    {loading ? (
                        <div className="text-center p-8">جاري التحميل...</div>
                    ) : (
                        <table className="modern-data-table">
                            <thead>
                                <tr>
                                    <th>الموظف</th>
                                    <th>النوع</th>
                                    <th>من تاريخ</th>
                                    <th>إلى تاريخ</th>
                                    <th>المدة</th>
                                    <th>الحالة</th>
                                    <th>الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {leaves.length > 0 ? leaves.map(leave => (
                                    <tr key={leave.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#CBD5E0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {leave.employee?.user?.firstName?.[0] || '?'}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: 'bold' }}>{leave.employee?.user?.firstName} {leave.employee?.user?.lastName}</div>
                                                    <div style={{ fontSize: '0.8rem', color: '#718096' }}>{leave.employee?.employeeCode}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{leave.type === 'annual' ? 'سنوية' : leave.type === 'sick' ? 'مرضية' : leave.type === 'unpaid' ? 'بدون راتب' : 'طواريء'}</td>
                                        <td>{formatDate(leave.startDate)}</td>
                                        <td>{formatDate(leave.endDate)}</td>
                                        <td>
                                            {Math.ceil((new Date(leave.endDate).getTime() - new Date(leave.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} يوم
                                        </td>
                                        <td>{statusBadge(leave.status)}</td>
                                        <td>
                                            {leave.status === 'pending' && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <button
                                                        onClick={() => setActionModal({ id: leave.id, type: 'approve' })}
                                                        className="btn-icon check"
                                                        style={{ background: '#C6F6D5', color: '#22543D', border: 'none', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                                                        title="موافقة"
                                                    >
                                                        ✔
                                                    </button>
                                                    <button
                                                        onClick={() => setActionModal({ id: leave.id, type: 'reject' })}
                                                        className="btn-icon trash"
                                                        style={{ background: '#FED7D7', color: '#822727', border: 'none', padding: '0.4rem', borderRadius: '6px', cursor: 'pointer' }}
                                                        title="رفض"
                                                    >
                                                        ✖
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={7} className="text-center">لا توجد طلبات إجازة</td></tr>
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </main>

            {/* Action Modal */}
            {actionModal && (
                <div className="modal-overlay">
                    <div className="modal-container" style={{ maxWidth: '400px' }}>
                        <div className="modal-header">
                            <h3>{actionModal.type === 'approve' ? '✅ اعتماد الإجازة' : '❌ رفض الإجازة'}</h3>
                            <button onClick={() => setActionModal(null)} className="close-btn">×</button>
                        </div>
                        <div className="modal-body">
                            <p>هل أنت متأكد من {actionModal.type === 'approve' ? 'الموافقة على' : 'رفض'} هذا الطلب؟</p>
                            <textarea
                                className="form-control"
                                placeholder="أضف تعليقاً (اختياري)..."
                                value={actionComment}
                                onChange={e => setActionComment(e.target.value)}
                                rows={3}
                                style={{ width: '100%', marginTop: '1rem', padding: '0.5rem', border: '1px solid #E2E8F0', borderRadius: '6px' }}
                            ></textarea>
                        </div>
                        <div className="modal-footer">
                            <button onClick={() => setActionModal(null)} className="btn-secondary">إلغاء</button>
                            <button
                                onClick={handleAction}
                                className={`btn-primary ${actionModal.type === 'reject' ? 'bg-red-500' : 'bg-green-500'}`}
                                style={{ background: actionModal.type === 'reject' ? '#E53E3E' : '#38A169', color: 'white', border: 'none' }}
                            >
                                تأكيد
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
