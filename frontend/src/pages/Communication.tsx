import React, { useState, useEffect } from 'react';
import { hrmsService } from '../services/hrms.service';
import { hrService } from '../services/hr.service';
import { Toast, ToastType } from '../components/Toast';
import './Employees.css';

const Communication: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'announcements' | 'meetings' | 'events'>('announcements');
    const [data, setData] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    const [formData, setFormData] = useState<any>({
        title: '',
        description: '',
        departmentId: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        date: new Date().toISOString().split('T')[0],
        time: '',
        location: ''
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const deptRes = await hrService.getDepartments();
            if (deptRes.success) setDepartments(deptRes.data || []);

            let res;
            if (activeTab === 'announcements') res = await hrmsService.getAnnouncements();
            else if (activeTab === 'meetings') res = await hrmsService.getMeetings();
            else if (activeTab === 'events') res = await hrmsService.getEvents();

            if (res && res.success) {
                setData(res.data || []);
            } else {
                setData([]);
            }
        } catch (error) {
            console.error('Error fetching communications:', error);
            setToast({ type: 'error', message: '❌ فشل تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let res;
            if (activeTab === 'announcements') res = await hrmsService.createAnnouncement(formData);
            else if (activeTab === 'meetings') res = await hrmsService.createMeeting(formData);
            else if (activeTab === 'events') res = await hrmsService.createEvent(formData);

            if (res && res.success) {
                setToast({ type: 'success', message: '✅ تمت العملية بنجاح' });
                setShowModal(false);
                setFormData({
                    title: '',
                    description: '',
                    departmentId: '',
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date().toISOString().split('T')[0],
                    date: new Date().toISOString().split('T')[0],
                    time: '',
                    location: ''
                });
                fetchData();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشلت العملية' });
        }
    };


    return (
        <div className="next-gen-page-container">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">📢</div>
                        <div className="branding-text">
                            <h1>التواصل والفعاليات</h1>
                            <p className="hide-on-mobile">Corporate Communications & Events Hub</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="view-switcher hide-on-mobile">
                            <button className={activeTab === 'announcements' ? 'active' : ''} onClick={() => setActiveTab('announcements')}>📢 إعلانات</button>
                            <button className={activeTab === 'meetings' ? 'active' : ''} onClick={() => setActiveTab('meetings')}>🤝 اجتماعات</button>
                            <button className={activeTab === 'events' ? 'active' : ''} onClick={() => setActiveTab('events')}>🎉 فعاليات</button>
                        </div>
                        <button onClick={() => setShowModal(true)} className="btn-modern btn-orange-gradient">
                            <span className="plus-icon">+</span>
                            <span className="hide-on-mobile">إضافة {activeTab === 'announcements' ? 'إعلان' : activeTab === 'meetings' ? 'اجتماع' : 'فعالية'}</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container-wide main-content">
                <section className="stats-grid">
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">نشط حالياً</span>
                            <span className="stat-value">{data.length}</span>
                        </div>
                        <div className="stat-icon-bg blue">🔔</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">المستهدفين</span>
                            <span className="stat-value">الكل</span>
                        </div>
                        <div className="stat-icon-bg green">👥</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">آخر تحديث</span>
                            <span className="stat-value" style={{ fontSize: '1rem' }}>اليوم</span>
                        </div>
                        <div className="stat-icon-bg purple">🆕</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">الحالة</span>
                            <span className="stat-value" style={{ fontSize: '1rem' }}>مفعل</span>
                        </div>
                        <div className="stat-icon-bg orange">🛡️</div>
                    </div>
                </section>

                <div className="content-transition-wrapper">
                    {loading ? (
                        <div className="loading-state-modern">
                            <div className="spinner"></div>
                            <p>جاري تحميل البيانات...</p>
                        </div>
                    ) : (
                        <div className="programs-grid-2026">
                            {data.map(item => (
                                <div key={item.id} className="next-gen-card">
                                    <div className="card-top">
                                        <div className="emp-avatar-container">
                                            <div className="avatar-placeholder">
                                                {activeTab === 'announcements' ? '📢' : activeTab === 'meetings' ? '🤝' : '🎉'}
                                            </div>
                                        </div>
                                        <div className="card-actions-mini">
                                            <span className="status-pill active">
                                                {activeTab === 'announcements' ? (item.department?.nameAr || 'عام') : item.location || 'مقر'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="card-info">
                                        <h3 className="card-title">{item.title}</h3>
                                        <p className="description-text" style={{ marginTop: '0.8rem', fontSize: '0.9rem', color: '#64748b', lineHeight: 1.6 }}>
                                            {item.description}
                                        </p>

                                        <div className="card-tags" style={{ marginTop: 'auto', paddingTop: '1.2rem' }}>
                                            <span className="tag-pill">📅 {new Date(item.startDate || item.date).toLocaleDateString('ar-SA')}</span>
                                            {item.time && <span className="tag-pill">🕒 {item.time}</span>}
                                        </div>
                                    </div>

                                    <div className="card-footer" style={{ marginTop: '1rem', borderTop: '1px solid #f1f5f9', paddingTop: '1rem' }}>
                                        <button className="btn-full-profile" style={{ justifyContent: 'center' }}>👁️ عرض التفاصيل الكاملة</button>
                                    </div>
                                </div>
                            ))}
                            {data.length === 0 && (
                                <div className="empty-state-modern" style={{ gridColumn: '1 / -1' }}>
                                    <div className="empty-icon">📭</div>
                                    <h2>لا توجد سجلات حالياً</h2>
                                    <p>سيتم عرض الاجتماعات والفعاليات هنا بمجرد إضافتها.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content side-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', borderRadius: '30px' }}>
                        <div className="modal-header">
                            <h2>إضافة {activeTab === 'announcements' ? 'إعلان' : activeTab === 'meetings' ? 'اجتماع' : 'فعالية'} جديد</h2>
                            <button onClick={() => setShowModal(false)} className="close-btn">×</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modern-form" style={{ padding: '2rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>العنوان</label>
                                <input
                                    type="text"
                                    required
                                    className="filter-select"
                                    style={{ width: '100%', padding: '0 1rem' }}
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            {activeTab === 'announcements' && (
                                <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>القسم المستهدف (اختياري)</label>
                                    <select
                                        className="filter-select"
                                        style={{ width: '100%' }}
                                        value={formData.departmentId}
                                        onChange={e => setFormData({ ...formData, departmentId: e.target.value })}
                                    >
                                        <option value="">جميع الأقسام</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                                    </select>
                                </div>
                            )}

                            {activeTab === 'meetings' && (
                                <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                    <div className="form-group">
                                        <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>الموقع / القاعة</label>
                                        <input
                                            type="text"
                                            className="filter-select"
                                            style={{ width: '100%', padding: '0 1rem' }}
                                            value={formData.location}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                            placeholder="قاعة الاجتماعات 1"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>الوقت</label>
                                        <input
                                            type="time"
                                            className="filter-select"
                                            style={{ width: '100%', padding: '0 1rem' }}
                                            value={formData.time}
                                            onChange={e => setFormData({ ...formData, time: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>{activeTab === 'announcements' || activeTab === 'events' ? 'تاريخ البدء' : 'التاريخ'}</label>
                                    <input
                                        type="date"
                                        required
                                        className="filter-select"
                                        style={{ width: '100%', padding: '0 1rem' }}
                                        value={formData.startDate || formData.date}
                                        onChange={e => setFormData({ ...formData, startDate: e.target.value, date: e.target.value })}
                                    />
                                </div>
                                {(activeTab === 'announcements' || activeTab === 'events') && (
                                    <div className="form-group">
                                        <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>تاريخ الانتهاء</label>
                                        <input
                                            type="date"
                                            className="filter-select"
                                            style={{ width: '100%', padding: '0 1rem' }}
                                            value={formData.endDate}
                                            onChange={e => setFormData({ ...formData, endDate: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>التفاصيل والمحتوى</label>
                                <textarea
                                    className="filter-select"
                                    style={{ width: '100%', height: '120px', padding: '1rem' }}
                                    required
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="modal-footer" style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowModal(false)} className="btn-modern btn-outline">إلغاء</button>
                                <button type="submit" className="btn-modern btn-orange-gradient">نشر الخبر / الفعالية</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Communication;
