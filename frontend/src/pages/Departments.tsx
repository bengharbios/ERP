import { useState, useEffect } from 'react';
import { hrService, Department } from '../services/hr.service';
import { Toast, ToastType } from '../components/Toast';
import './Departments.css';

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    const [form, setForm] = useState({
        nameAr: '',
        nameEn: '',
        description: ''
    });

    useEffect(() => {
        fetchDepartments();
    }, []);

    const fetchDepartments = async () => {
        try {
            setLoading(true);
            const res = await hrService.getDepartments();
            if (res.success) {
                setDepartments(res.data);
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل في تحميل الأقسام' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await hrService.createDepartment(form);
            if (res.success) {
                setToast({ type: 'success', message: '✅ تم إنشاء القسم بنجاح' });
                setShowModal(false);
                setForm({ nameAr: '', nameEn: '', description: '' });
                fetchDepartments();
            }
        } catch (error) {
            setToast({ type: 'error', message: '❌ فشل في إنشاء القسم' });
        }
    };

    return (
        <div className="departments-page">
            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">🏢</div>
                        <div className="branding-text">
                            <h1>الأقسام والهيكل التنظيمي</h1>
                            <p className="hide-on-mobile">Organizational Structure & Hierarchy</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button onClick={() => setShowModal(true)} className="btn-modern btn-orange-gradient">
                            <span className="plus-icon">+</span>
                            <span className="hide-on-mobile">قسم جديد</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container-wide main-content">
                <div className="programs-grid-2026">
                    {loading ? (
                        <div className="empty-state-modern">جاري التحميل...</div>
                    ) : departments.length === 0 ? (
                        <div className="empty-state-modern">لا توجد أقسام مسجلة</div>
                    ) : departments.map(dept => (
                        <div key={dept.id} className="next-gen-card">
                            <div className="card-top">
                                <div className="branding-icon" style={{ background: '#F7FAFC', color: '#DD6B20', width: '40px', height: '40px', borderRadius: '12px', fontSize: '1.2rem' }}>📁</div>
                                <div className="card-actions-mini">
                                    <button>✎</button>
                                </div>
                            </div>

                            <div className="card-info">
                                <h3 className="card-title">{dept.nameAr}</h3>
                                <p className="card-subtitle">{dept.nameEn}</p>
                                <p style={{ fontSize: '0.8125rem', color: '#718096', marginBottom: '1rem' }}>{dept.description || 'لا يوجد وصف متاح لهذا القسم'}</p>
                            </div>

                            <div className="card-stats-grid">
                                <div className="stat-item">
                                    <span className="stat-val" style={{ color: '#3182CE' }}>{dept._count?.employees || 0}</span>
                                    <span className="stat-lbl">موظف</span>
                                </div>
                                <div className="stat-item highlight">
                                    <span className={`pill ${dept.isActive ? 'pill-green' : ''}`}>
                                        {dept.isActive ? 'نشط' : 'غير نشط'}
                                    </span>
                                    <span className="stat-lbl">الحالة</span>
                                </div>
                            </div>

                            <div className="card-footer">
                                <button className="edit-btn" style={{ width: '100%' }}>عرض الموظفين</button>
                            </div>
                        </div>
                    ))}
                </div>
            </main>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>إضافة قسم جديد</h2>
                            <button onClick={() => setShowModal(false)}>×</button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>اسم القسم (عربي)</label>
                                <input
                                    type="text"
                                    value={form.nameAr}
                                    onChange={e => setForm({ ...form, nameAr: e.target.value })}
                                    required
                                    placeholder="مثال: قسم الموارد البشرية"
                                />
                            </div>
                            <div className="form-group">
                                <label>Department Name (English)</label>
                                <input
                                    type="text"
                                    value={form.nameEn}
                                    onChange={e => setForm({ ...form, nameEn: e.target.value })}
                                    required
                                    placeholder="Ex: Human Resources"
                                />
                            </div>
                            <div className="form-group">
                                <label>الوصف</label>
                                <textarea
                                    value={form.description}
                                    onChange={e => setForm({ ...form, description: e.target.value })}
                                    rows={3}
                                />
                            </div>
                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">إلغاء</button>
                                <button type="submit" className="btn-primary">حفظ</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
        </div>
    );
}
