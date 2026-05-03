import React, { useState, useEffect } from 'react';
import { hrmsService } from '../services/hrms.service';
import { hrService } from '../services/hr.service';
import { Toast, ToastType } from '../components/Toast';
import './Employees.css'; // Reuse premium styles

const Recruitment: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
    const [jobs, setJobs] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showJobModal, setShowJobModal] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [jobFormData, setJobFormData] = useState({
        title: '',
        description: '',
        departmentId: '',
        deadline: ''
    });

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [jobsRes, deptsRes] = await Promise.all([
                hrmsService.getJobs(),
                hrService.getDepartments()
            ]);

            if (jobsRes.success) setJobs(jobsRes.data || []);
            if (deptsRes.success) setDepartments(deptsRes.data || []);

            if (activeTab === 'applications') {
                const appsRes = await hrmsService.getApplications();
                if (appsRes.success) setApplications(appsRes.data || []);
            }
        } catch (error) {
            console.error('Error fetching recruitment data:', error);
            setToast({ type: 'error', message: '❌ فشل في تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateJob = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await hrmsService.createJob(jobFormData);
            if (res.success) {
                setToast({ type: 'success', message: '✅ تم إضافة الوظيفة بنجاح' });
                setShowJobModal(false);
                setJobFormData({ title: '', description: '', departmentId: '', deadline: '' });
                fetchData();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل إضافة الوظيفة' });
        }
    };

    const updateAppStatus = async (id: string, status: string) => {
        try {
            const res = await hrmsService.updateApplicationStatus(id, status);
            if (res.success) {
                setToast({ type: 'success', message: '✅ تم تحديث حالة الطلب' });
                fetchData();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل تحديث الحالة' });
        }
    };

    const stats = {
        totalJobs: jobs.length,
        activeJobs: jobs.filter(j => j.status === 'active').length,
        totalApps: applications.length,
        newApps: applications.filter(a => a.status === 'applied').length
    };

    return (
        <div className="next-gen-page-container">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">📂</div>
                        <div className="branding-text">
                            <h1>التوظيف والمهن</h1>
                            <p className="hide-on-mobile">Talent Acquisition & Career Management</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="view-switcher hide-on-mobile">
                            <button className={activeTab === 'jobs' ? 'active' : ''} onClick={() => setActiveTab('jobs')}>💼 الوظائف</button>
                            <button className={activeTab === 'applications' ? 'active' : ''} onClick={() => setActiveTab('applications')}>📄 الطلبات</button>
                        </div>
                        <button onClick={() => setShowJobModal(true)} className="btn-modern btn-orange-gradient">
                            <span className="plus-icon">+</span>
                            <span className="hide-on-mobile">إضافة وظيفة شاغرة</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container-wide main-content">
                <section className="stats-grid">
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">الوظائف النشطة</span>
                            <span className="stat-value">{stats.activeJobs}</span>
                        </div>
                        <div className="stat-icon-bg blue">💼</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">إجمالي الوظائف</span>
                            <span className="stat-value">{stats.totalJobs}</span>
                        </div>
                        <div className="stat-icon-bg purple">🏢</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">طلبات جديدة</span>
                            <span className="stat-value">{stats.newApps}</span>
                        </div>
                        <div className="stat-icon-bg green">📥</div>
                    </div>
                    <div className="stat-card-mini">
                        <div className="stat-info">
                            <span className="stat-label">إجمالي المتقدمين</span>
                            <span className="stat-value">{stats.totalApps}</span>
                        </div>
                        <div className="stat-icon-bg orange">👥</div>
                    </div>
                </section>

                <div className="content-transition-wrapper">
                    {loading ? (
                        <div className="loading-state-modern">
                            <div className="spinner"></div>
                            <p>جاري تحميل البيانات...</p>
                        </div>
                    ) : activeTab === 'jobs' ? (
                        <div className="programs-grid-2026">
                            {jobs.map(job => (
                                <div key={job.id} className="next-gen-card">
                                    <div className="card-top">
                                        <div className="emp-avatar-container">
                                            <div className="avatar-placeholder">💼</div>
                                            <span className={`status-badge-mini ${job.status}`}></span>
                                        </div>
                                        <div className="card-actions-mini">
                                            <button title="تعديل">✎</button>
                                        </div>
                                    </div>

                                    <div className="card-info">
                                        <h3 className="card-title">{job.title}</h3>
                                        <p className="card-subtitle">{job.department?.nameAr || 'قسم عام'}</p>

                                        <div className="card-tags">
                                            <span className="tag-pill">📅 {job.deadline ? new Date(job.deadline).toLocaleDateString('ar-SA') : 'مفتوح'}</span>
                                            <span className={`status-pill ${job.status}`}>
                                                {job.status === 'active' ? 'نشط' : 'مغلق'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="card-stats-grid">
                                        <div className="stat-item">
                                            <span className="stat-val">{job._count?.applications || 0}</span>
                                            <span className="stat-lbl">المرشحين</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-val">0</span>
                                            <span className="stat-lbl">مقابلات</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-val status-color">جديد</span>
                                            <span className="stat-lbl">الحالة</span>
                                        </div>
                                    </div>

                                    <div className="card-footer">
                                        <button className="btn-full-profile" onClick={() => setActiveTab('applications')}>👁️ عرض الطلبات المتصلة</button>
                                    </div>
                                </div>
                            ))}
                            {jobs.length === 0 && (
                                <div className="empty-state-modern">
                                    <div className="empty-icon">📢</div>
                                    <h2>لا توجد وظائف شاغرة</h2>
                                    <p>قم بإضافة وظيفة جديدة للبدء في استقبال طلبات التوظيف.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="next-gen-table-container">
                            <table className="modern-data-table">
                                <thead>
                                    <tr>
                                        <th>المرشح</th>
                                        <th>الوظيفة المستهدفة</th>
                                        <th className="text-center">تاريخ التقديم</th>
                                        <th className="text-center">الحالة</th>
                                        <th className="text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {applications.map(app => (
                                        <tr key={app.id}>
                                            <td>
                                                <div className="table-user-info">
                                                    <div className="user-avatar-small">👤</div>
                                                    <div>
                                                        <div className="table-primary-text">{app.name}</div>
                                                        <div className="table-secondary-text">{app.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>{app.job?.title || 'وظيفة محذوفة'}</td>
                                            <td className="text-center">
                                                <span className="code-pill">{new Date(app.createdAt).toLocaleDateString('ar-SA')}</span>
                                            </td>
                                            <td className="text-center">
                                                <select
                                                    value={app.status}
                                                    onChange={(e) => updateAppStatus(app.id, e.target.value)}
                                                    className={`status-pill ${app.status}`}
                                                    style={{ border: 'none', cursor: 'pointer', outline: 'none', appearance: 'none', textAlign: 'center' }}
                                                >
                                                    <option value="applied">تم التقديم</option>
                                                    <option value="interview">مقابلة</option>
                                                    <option value="hired">مقبول</option>
                                                    <option value="rejected">مرفوض</option>
                                                </select>
                                            </td>
                                            <td className="text-center">
                                                <div className="table-row-actions">
                                                    <button className="edit-btn-icon" title="عرض السيرة الذاتية">📄</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {applications.length === 0 && (
                                        <tr>
                                            <td colSpan={5} className="text-center" style={{ padding: '3rem' }}>
                                                لا توجد طلبات توظيف حالية.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Post Job Modal */}
            {showJobModal && (
                <div className="modal-overlay" onClick={() => setShowJobModal(false)}>
                    <div className="modal-content side-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px', borderRadius: '30px' }}>
                        <div className="modal-header">
                            <h2>إضافة وظيفة شاغرة جديدة</h2>
                            <button onClick={() => setShowJobModal(false)} className="close-btn">×</button>
                        </div>
                        <form onSubmit={handleCreateJob} className="modern-form" style={{ padding: '2rem' }}>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>مسمى الوظيفة</label>
                                <input
                                    type="text"
                                    required
                                    className="filter-select"
                                    style={{ width: '100%', padding: '0 1rem' }}
                                    placeholder="مثال: مدرس هندسة، مبرمج..."
                                    value={jobFormData.title}
                                    onChange={e => setJobFormData({ ...jobFormData, title: e.target.value })}
                                />
                            </div>
                            <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>القسم</label>
                                    <select
                                        required
                                        className="filter-select"
                                        style={{ width: '100%' }}
                                        value={jobFormData.departmentId}
                                        onChange={e => setJobFormData({ ...jobFormData, departmentId: e.target.value })}
                                    >
                                        <option value="">اختر القسم</option>
                                        {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>الموعد النهائي</label>
                                    <input
                                        type="date"
                                        className="filter-select"
                                        style={{ width: '100%', padding: '0 1rem' }}
                                        value={jobFormData.deadline}
                                        onChange={e => setJobFormData({ ...jobFormData, deadline: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="form-group" style={{ marginBottom: '2rem' }}>
                                <label style={{ fontWeight: 800, marginBottom: '0.5rem', display: 'block' }}>الوصف والمتطلبات</label>
                                <textarea
                                    className="filter-select"
                                    style={{ width: '100%', height: '120px', padding: '1rem' }}
                                    placeholder="أدخل متطلبات الوظيفة..."
                                    value={jobFormData.description}
                                    onChange={e => setJobFormData({ ...jobFormData, description: e.target.value })}
                                />
                            </div>
                            <div className="modal-footer" style={{ borderTop: '1px solid #eee', paddingTop: '1.5rem', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" onClick={() => setShowJobModal(false)} className="btn-modern btn-outline">إلغاء</button>
                                <button type="submit" className="btn-modern btn-orange-gradient">نشر الوظيفة</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Recruitment;
