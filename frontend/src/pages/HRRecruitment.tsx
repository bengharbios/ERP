// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import {
    Briefcase, Search, Plus, Filter,
    X, Users, Edit, FileText, Download,
    Printer, Trash2, CheckCircle2, AlertCircle,
    ChevronRight, ChevronLeft, Building2,
    Calendar, Mail, Phone, MoreHorizontal,
    ArrowUpRight, Target, Inbox
} from 'lucide-react';
import { hrmsService } from '../services/hrms.service';
import { hrService } from '../services/hr.service';
import { useSettingsStore } from '../store/settingsStore';
import { Toast, ToastType } from '../components/Toast';
import './HRRecruitment.css';

/**
 * TALENT ACQUISITION ENGINE (Rapidos 2026)
 * Smart Job Posting & Application Workflow
 */

export default function HRRecruitment() {
    const [activeTab, setActiveTab] = useState<'jobs' | 'applications'>('jobs');
    const [jobs, setJobs] = useState<any[]>([]);
    const [applications, setApplications] = useState<any[]>([]);
    const [departments, setDepartments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Modals ---
    const [showJobModal, setShowJobModal] = useState(false);
    const [jobFormData, setJobFormData] = useState({
        title: '', description: '', departmentId: '', deadline: ''
    });

    // --- Toast ---
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [jobsRes, deptsRes] = await Promise.all([
                hrmsService.getJobs(),
                hrService.getDepartments()
            ]);
            setJobs(jobsRes.data || []);
            setDepartments(deptsRes.data || []);

            if (activeTab === 'applications') {
                const appsRes = await hrmsService.getApplications();
                setApplications(appsRes.data || []);
            }
        } catch (error) {
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
                setToast({ type: 'success', message: '✅ تم نشر الوظيفة بنجاح' });
                setShowJobModal(false);
                setJobFormData({ title: '', description: '', departmentId: '', deadline: '' });
                fetchData();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل نشر الوظيفة' });
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
            setToast({ type: 'error', message: '❌ فشل التحديث' });
        }
    };

    const stats = useMemo(() => ({
        activeJobs: jobs.filter(j => j.status === 'active').length,
        totalJobs: jobs.length,
        newApps: applications.filter(a => a.status === 'applied').length,
        totalApps: applications.length
    }), [jobs, applications]);

    return (
        <div className="rc-root" style={{ height: 'calc(100vh - 160px)' }}>
            <div className="rc-header">
                <div className="rc-title">
                    <Briefcase size={20} /> التوظيف واستقطاب المواهب
                </div>
                <div className="rc-actions">
                    <button className="ag-btn ag-btn-primary" onClick={() => setShowJobModal(true)}>
                        <Plus size={16} /> إضافة وظيفة شاغرة
                    </button>
                </div>
            </div>

            <div className="rc-tabs">
                <div className={`rc-tab ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>الوظائف الشاغرة</div>
                <div className={`rc-tab ${activeTab === 'applications' ? 'active' : ''}`} onClick={() => setActiveTab('applications')}>طلبات التوظيف</div>
            </div>

            <div className="rc-stats hide-mobile">
                <div className="rc-stat-card">
                    <span className="rc-stat-label">الوظائف النشطة</span>
                    <span className="rc-stat-val" style={{ color: '#DD6B20' }}>{stats.activeJobs}</span>
                </div>
                <div className="rc-stat-card">
                    <span className="rc-stat-label">إجمالي الاحتياج</span>
                    <span className="rc-stat-val">{stats.totalJobs}</span>
                </div>
                <div className="rc-stat-card">
                    <span className="rc-stat-label">طلبات غير مقروءة</span>
                    <span className="rc-stat-val" style={{ color: '#00F5A0' }}>{stats.newApps}</span>
                </div>
                <div className="rc-stat-card">
                    <span className="rc-stat-label">إجمالي المرشحين</span>
                    <span className="rc-stat-val">{stats.totalApps}</span>
                </div>
            </div>

            <main className="rc-main">
                {loading ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}><div className="loading-spinner"></div></div>
                ) : activeTab === 'jobs' ? (
                    <div className="rc-grid">
                        {jobs.map(job => (
                            <div key={job.id} className="rc-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ background: 'rgba(221, 107, 32, 0.1)', color: '#DD6B20', padding: '10px', borderRadius: '12px' }}>
                                        <Target size={20} />
                                    </div>
                                    <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '4px 8px', borderRadius: '6px', background: job.status === 'active' ? 'rgba(0, 245, 160, 0.1)' : 'rgba(255, 77, 106, 0.1)', color: job.status === 'active' ? '#00F5A0' : '#FF4D6A' }}>
                                        {job.status === 'active' ? 'نشط' : 'مغلق'}
                                    </span>
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 900, color: 'var(--hz-text-bright)', marginBottom: '4px' }}>{job.title}</h3>
                                    <p style={{ fontSize: '0.7rem', color: 'var(--hz-text-muted)' }}>{job.department?.nameAr || 'قسم عام'}</p>
                                </div>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--hz-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Inbox size={12} /> {job._count?.applications || 0} مرشح
                                    </div>
                                    <div style={{ fontSize: '0.7rem', color: 'var(--hz-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <Calendar size={12} /> {job.deadline ? new Date(job.deadline).toLocaleDateString('ar-SA') : 'مفتوح'}
                                    </div>
                                </div>
                                <button className="ag-btn ag-btn-ghost" style={{ marginTop: 'auto', width: '100%', justifyContent: 'center' }} onClick={() => setActiveTab('applications')}>
                                    عرض الطلبات <ArrowUpRight size={14} style={{ marginRight: '8px' }} />
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="rc-table-wrap">
                        <table className="rc-table">
                            <thead>
                                <tr>
                                    <th>المرشح</th>
                                    <th>الوظيفة</th>
                                    <th>تاريخ التقديم</th>
                                    <th>الحالة</th>
                                    <th>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map(app => (
                                    <tr key={app.id} className="rc-row">
                                        <td data-label="المرشح">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--hz-surface-2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#DD6B20', fontWeight: '900' }}>
                                                    {app.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div style={{ fontWeight: '800', color: 'var(--hz-text-bright)' }}>{app.name}</div>
                                                    <div style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)' }}>{app.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td data-label="الوظيفة">{app.job?.title}</td>
                                        <td data-label="التاريخ">{new Date(app.createdAt).toLocaleDateString('ar-SA')}</td>
                                        <td data-label="الحالة">
                                            <select
                                                value={app.status}
                                                onChange={(e) => updateAppStatus(app.id, e.target.value)}
                                                className="ag-input"
                                                style={{ padding: '4px 12px', fontSize: '0.75rem', border: 'none', background: 'var(--hz-surface-2)' }}
                                            >
                                                <option value="applied">تم التقديم</option>
                                                <option value="interview">مقابلة</option>
                                                <option value="hired">مقبول</option>
                                                <option value="rejected">مرفوض</option>
                                            </select>
                                        </td>
                                        <td data-label="إجراءات">
                                            <button className="ag-btn-icon"><FileText size={14} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </main>

            {/* --- JOB MODAL (THABAT AL-FORM) --- */}
            {showJobModal && (
                <div className="ag-modal-overlay">
                    <div className="ag-modal" style={{ maxWidth: '550px' }}>
                        <div className="ag-modal-head">
                            <h2 style={{ fontSize: '1.1rem', fontWeight: '900' }}>نشر وظيفة شاغرة</h2>
                            <button className="ag-btn-icon" onClick={() => setShowJobModal(false)}><X size={20} /></button>
                        </div>
                        <form onSubmit={handleCreateJob}>
                            <div className="ag-modal-body">
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--hz-text-muted)' }}>مسمى الوظيفة</label>
                                        <input type="text" className="ag-input" required placeholder="مثال: منسق برامج، مدرب تقني..." value={jobFormData.title} onChange={e => setJobFormData({ ...jobFormData, title: e.target.value })} />
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--hz-text-muted)' }}>القسم</label>
                                            <select className="ag-input" required value={jobFormData.departmentId} onChange={e => setJobFormData({ ...jobFormData, departmentId: e.target.value })}>
                                                <option value="">اختر القسم</option>
                                                {departments.map(d => <option key={d.id} value={d.id}>{d.nameAr}</option>)}
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--hz-text-muted)' }}>الموعد النهائي</label>
                                            <input type="date" className="ag-input" value={jobFormData.deadline} onChange={e => setJobFormData({ ...jobFormData, deadline: e.target.value })} />
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        <label style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--hz-text-muted)' }}>الوصف والمتطلبات</label>
                                        <textarea className="ag-input" rows={4} style={{ height: 'auto' }} placeholder="أدخل تفاصيل الوظيفة والشروط..." value={jobFormData.description} onChange={e => setJobFormData({ ...jobFormData, description: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="ag-modal-foot">
                                <button type="button" className="ag-btn ag-btn-ghost" onClick={() => setShowJobModal(false)}>إلغاء</button>
                                <button type="submit" className="ag-btn ag-btn-primary">نشر الوظيفة الآن</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
