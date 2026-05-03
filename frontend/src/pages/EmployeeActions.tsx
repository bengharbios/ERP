import React, { useState, useEffect } from 'react';
import { hrmsService } from '../services/hrms.service';
import { hrService } from '../services/hr.service';
import { Toast, ToastType } from '../components/Toast';
import './Employees.css';

type ActionTab = 'awards' | 'warnings' | 'complaints' | 'promotions';

const EmployeeActions: React.FC = () => {
    const [activeTab, setActiveTab] = useState<ActionTab>('awards');
    const [data, setData] = useState<any[]>([]);
    const [employees, setEmployees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showActionModal, setShowActionModal] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    const [formData, setFormData] = useState<any>({
        employeeId: '',
        awardType: '',
        warningBy: '',
        subject: '',
        complaintAgainst: '',
        date: new Date().toISOString().split('T')[0],
        gift: '',
        description: '',
        designation: '',
        promotionDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const empRes = await hrService.getEmployees();
            if (empRes.success) setEmployees(empRes.data || []);

            let res;
            if (activeTab === 'awards') res = await hrmsService.getAwards();
            else if (activeTab === 'warnings') res = await hrmsService.getWarnings();
            else if (activeTab === 'complaints') res = await hrmsService.getComplaints();

            if (res && res.success) {
                setData(res.data || []);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Error fetching actions:', error);
            setToast({ type: 'error', message: '❌ فشل تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let res;
            if (activeTab === 'awards') res = await hrmsService.createAward(formData);
            else if (activeTab === 'warnings') res = await hrmsService.createWarning(formData);
            else if (activeTab === 'complaints') res = await hrmsService.createComplaint(formData);
            else if (activeTab === 'promotions') res = await hrmsService.processPromotion(formData);

            if (res && res.success) {
                setToast({ type: 'success', message: '✅ تمت العملية بنجاح' });
                setShowActionModal(false);
                fetchData();
            }
        } catch (error: any) {
            setToast({ type: 'error', message: `❌ ${error.response?.data?.error?.message || 'فشلت العملية'}` });
        }
    };


    return (
        <div className="next-gen-page-container">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">⚖️</div>
                        <div className="branding-text">
                            <h1>إجراءات الموظفين</h1>
                            <p className="hide-on-mobile">Official Employee Actions & Records</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="view-switcher hide-on-mobile">
                            <button className={activeTab === 'awards' ? 'active' : ''} onClick={() => setActiveTab('awards')}>🏆 الجوائز</button>
                            <button className={activeTab === 'warnings' ? 'active' : ''} onClick={() => setActiveTab('warnings')}>⚠️ إنذارات</button>
                            <button className={activeTab === 'complaints' ? 'active' : ''} onClick={() => setActiveTab('complaints')}>📝 شكاوى</button>
                            <button className={activeTab === 'promotions' ? 'active' : ''} onClick={() => setActiveTab('promotions')}>📈 ترقيات</button>
                        </div>
                        <button onClick={() => setShowActionModal(true)} className="btn-modern btn-orange-gradient">
                            <span className="plus-icon">+</span>
                            <span className="hide-on-mobile">تسجيل {activeTab === 'awards' ? 'جائزة' : activeTab === 'warnings' ? 'إنذار' : activeTab === 'complaints' ? 'شكوى' : 'ترقية'}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container-wide main-content">
                <section className="stats-grid">
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">إجمالي السجلات</span>
                            <span className="stat-value">{data.length}</span>
                        </div>
                        <div className="stat-icon-bg blue">📊</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">الموظفين المعنيين</span>
                            <span className="stat-value">{new Set(data.map(d => d.employeeId)).size}</span>
                        </div>
                        <div className="stat-icon-bg purple">👥</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">آخر تحديث</span>
                            <span className="stat-value" style={{ fontSize: '1rem' }}>{data[0]?.date ? new Date(data[0].date).toLocaleDateString('ar-SA') : '-'}</span>
                        </div>
                        <div className="stat-icon-bg green">📅</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">الحالة العامة</span>
                            <span className="stat-value" style={{ fontSize: '1rem' }}>مستقرة</span>
                        </div>
                        <div className="stat-icon-bg orange">🛡️</div>
                    </div>
                </section>

                <div className="content-transition-wrapper">
                    {loading ? (
                        <div className="loading-state-modern">
                            <div className="spinner"></div>
                            <p>جاري تحميل السجلات...</p>
                        </div>
                    ) : (
                        <div className="next-gen-table-container">
                            <table className="modern-data-table">
                                <thead>
                                    <tr>
                                        <th>الموظف</th>
                                        <th>{activeTab === 'awards' ? 'نوع الجائزة' : activeTab === 'warnings' ? 'الموضوع' : activeTab === 'complaints' ? 'الموضوع' : 'المسمى الجديد'}</th>
                                        <th className="text-center">التاريخ</th>
                                        <th>{activeTab === 'awards' ? 'الهدية' : activeTab === 'complaints' ? 'مقدم الشكوى' : 'التفاصيل'}</th>
                                        <th className="text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map(item => (
                                        <tr key={item.id}>
                                            <td>
                                                <div className="table-user-info">
                                                    <div className="user-avatar-small">👤</div>
                                                    <div>
                                                        <div className="table-primary-text">{item.employee?.user?.firstName || 'موظف'} {item.employee?.user?.lastName || ''}</div>
                                                        <div className="table-secondary-text">{item.employee?.employeeCode || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{activeTab === 'awards' ? item.awardType : item.subject || item.designation}</td>
                                            <td className="text-center">
                                                <span className="code-pill">{new Date(item.date || item.promotionDate).toLocaleDateString('ar-SA')}</span>
                                            </td>
                                            <td>
                                                {activeTab === 'awards' ? (item.awardType || '-') :
                                                    activeTab === 'complaints' ? ((item.complainer?.user?.firstName || '-') + ' ' + (item.complainer?.user?.lastName || '')) :
                                                        (item.description?.substring(0, 30) || '-') + '...'}
                                            </td>
                                            <td className="text-center">
                                                <div className="table-row-actions">
                                                    <button className="edit-btn-icon">👁️</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center" style={{ padding: '3rem' }}>لا توجد سجلات حالية لهذه الفئة.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {showActionModal && (
                <div className="modal-overlay" onClick={() => setShowActionModal(false)}>
                    <div className="modal-content side-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', borderRadius: '30px' }}>
                        <div className="modal-header">
                            <h2>تسجيل {activeTab === 'awards' ? 'جائزة' : activeTab === 'warnings' ? 'إنذار' : activeTab === 'complaints' ? 'شكوى' : 'ترقية'}</h2>
                            <button onClick={() => setShowActionModal(false)} className="close-btn">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modern-form" style={{ padding: '2rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>الموظف المعني</label>
                                <select
                                    required
                                    className="filter-select"
                                    style={{ width: '100%' }}
                                    value={formData.employeeId}
                                    onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                >
                                    <option value="">اختر الموظف</option>
                                    {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.user.firstName} {emp.user.lastName} ({emp.employeeCode})</option>)}
                                </select>
                            </div>

                            {activeTab === 'awards' && (
                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>نوع الجائزة</label>
                                        <input type="text" className="filter-select" style={{ width: '100%', padding: '0 1rem' }} required onChange={e => setFormData({ ...formData, awardType: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>الهدية</label>
                                        <input type="text" className="filter-select" style={{ width: '100%', padding: '0 1rem' }} onChange={e => setFormData({ ...formData, gift: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'warnings' && (
                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>الموضوع</label>
                                        <input type="text" className="filter-select" style={{ width: '100%', padding: '0 1rem' }} required onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>بواسطة</label>
                                        <input type="text" className="filter-select" style={{ width: '100%', padding: '0 1rem' }} required onChange={e => setFormData({ ...formData, warningBy: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            {activeTab === 'complaints' && (
                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>الموضوع</label>
                                        <input type="text" className="filter-select" style={{ width: '100%', padding: '0 1rem' }} required onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>مشكو ضده</label>
                                        <select className="filter-select" style={{ width: '100%' }} onChange={e => setFormData({ ...formData, complaintAgainst: e.target.value })}>
                                            <option value="">اختر الموظف</option>
                                            {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.user.firstName} {emp.user.lastName}</option>)}
                                        </select>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'promotions' && (
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>المسمى الوظيفي الجديد</label>
                                    <input type="text" className="filter-select" style={{ width: '100%', padding: '0 1rem' }} required onChange={e => setFormData({ ...formData, designation: e.target.value })} />
                                </div>
                            )}

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>التاريخ</label>
                                <input type="date" className="filter-select" style={{ width: '100%', padding: '0 1rem' }} value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value, promotionDate: e.target.value })} />
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>الوصف / الملاحظات</label>
                                <textarea className="filter-select" style={{ width: '100%', height: '100px', padding: '1rem' }} onChange={e => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <div className="modal-footer" style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowActionModal(false)} className="btn-modern btn-outline">إلغاء</button>
                                <button type="submit" className="btn-modern btn-orange-gradient">حفظ السجل</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeeActions;
