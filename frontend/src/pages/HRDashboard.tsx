import React, { useState, useEffect } from 'react';
import { hrmsService } from '../services/hrms.service';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Toast, ToastType } from '../components/Toast';
import './Employees.css';

const HRDashboard: React.FC = () => {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [upcomingBirthdays, setUpcomingBirthdays] = useState<any[]>([]);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const navigate = useNavigate();

    const COLORS = ['#FF8C42', '#3182CE', '#38A169', '#E53E3E', '#805AD5'];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const res = await hrmsService.getDashboard();
            if (res.success) {
                setStats(res.data?.stats);
                setUpcomingBirthdays(res.data?.upcomingBirthdays || []);
            }
        } catch (error) {
            console.error('Error fetching HR stats:', error);
            setToast({ type: 'error', message: '❌ فشل تحميل بيانات لوحة التحكم' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="next-gen-page-container">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">📊</div>
                        <div className="branding-text">
                            <h1>لوحة تحكم HR</h1>
                            <p className="hide-on-mobile">Human Resources Analytics & Monitoring</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <button onClick={fetchData} className="btn-modern btn-outline">
                            <span>🔄 تحديث البيانات</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container-wide main-content">
                {loading ? (
                    <div className="loading-state-modern">
                        <div className="spinner"></div>
                        <p>جاري توليد التقارير والإحصائيات...</p>
                    </div>
                ) : (
                    <>
                        <section className="stats-grid">
                            <div className="stat-card-mini">
                                <div className="stat-info">
                                    <span className="stat-label">الموظفين</span>
                                    <span className="stat-value">{stats?.totalEmployees || 0}</span>
                                </div>
                                <div className="stat-icon-bg purple">👥</div>
                            </div>
                            <div className="stat-card-mini">
                                <div className="stat-info">
                                    <span className="stat-label">نسبة الحضور</span>
                                    <span className="stat-value">{Math.round(stats?.attendanceRate || 0)}%</span>
                                </div>
                                <div className="stat-icon-bg green">📈</div>
                            </div>
                            <div className="stat-card-mini">
                                <div className="stat-info">
                                    <span className="stat-label">وظائف شاغرة</span>
                                    <span className="stat-value">{stats?.activeJobs || 0}</span>
                                </div>
                                <div className="stat-icon-bg blue">📂</div>
                            </div>
                            <div className="stat-card-mini">
                                <div className="stat-info">
                                    <span className="stat-label">وثائق منتهية</span>
                                    <span className="stat-value" style={{ color: (stats?.expiredDocsCount || 0) > 0 ? '#E53E3E' : 'inherit' }}>
                                        {stats?.expiredDocsCount || 0}
                                    </span>
                                </div>
                                <div className="stat-icon-bg orange">⚠️</div>
                            </div>
                        </section>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '2rem', marginBottom: '2rem' }}>
                            <div className="next-gen-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                                <div className="card-top" style={{ marginBottom: '1rem' }}>
                                    <h3 className="card-title">🏢 توزيع الموظفين حسب الأقسام</h3>
                                </div>
                                <div style={{ flex: 1, minHeight: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={stats?.deptChart || []}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={60}
                                                outerRadius={100}
                                                paddingAngle={5}
                                                dataKey="value"
                                                nameKey="name"
                                            >
                                                {(stats?.deptChart || []).map((_: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="next-gen-card" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
                                <div className="card-top" style={{ marginBottom: '1rem' }}>
                                    <h3 className="card-title">📉 اتجاهات الحضور (آخر 7 أيام)</h3>
                                </div>
                                <div style={{ flex: 1, minHeight: 0 }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={stats?.attendanceTrend || []}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                                            <XAxis dataKey="date" axisLine={false} tickLine={false} />
                                            <YAxis axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: 'rgba(255, 140, 66, 0.05)' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }} />
                                            <Bar dataKey="count" fill="#FF8C42" radius={[6, 6, 0, 0]} barSize={30} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                            <div className="next-gen-card">
                                <div className="card-top">
                                    <h3 className="card-title">🎂 أعياد ميلاد قادمة</h3>
                                    <button onClick={() => navigate('/communication')} className="btn-modern btn-orange-gradient" style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}>إرسال تهنئة 🎊</button>
                                </div>
                                <div className="next-gen-table-container" style={{ marginTop: '1.5rem', background: 'transparent', boxShadow: 'none' }}>
                                    <table className="modern-data-table">
                                        <thead>
                                            <tr>
                                                <th>الموظف</th>
                                                <th>تاريخ الميلاد</th>
                                                <th className="text-center">الحالة</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {upcomingBirthdays.length > 0 ? upcomingBirthdays.map(emp => (
                                                <tr key={emp.id}>
                                                    <td>
                                                        <div className="table-user-info">
                                                            <div className="user-avatar-small">👤</div>
                                                            <div className="table-primary-text">{emp.user.firstName} {emp.user.lastName}</div>
                                                        </div>
                                                    </td>
                                                    <td>{new Date(emp.dateOfBirth).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long' })}</td>
                                                    <td className="text-center">
                                                        <span className="status-pill active">نشط</span>
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr><td colSpan={3} className="text-center" style={{ padding: '2rem' }}>لا توجد أعياد ميلاد قريبة مسجلة.</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            <div className="next-gen-card">
                                <div className="card-top">
                                    <h3 className="card-title">⚡ إجراءات سريعة</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginTop: '1.5rem' }}>
                                    <button onClick={() => navigate('/employees')} className="btn-modern btn-outline" style={{ justifyContent: 'flex-start' }}>
                                        <span style={{ fontSize: '1.2rem', marginLeft: '0.8rem' }}>👥</span> إضافة موظف جديد
                                    </button>
                                    <button onClick={() => navigate('/recruitment')} className="btn-modern btn-outline" style={{ justifyContent: 'flex-start' }}>
                                        <span style={{ fontSize: '1.2rem', marginLeft: '0.8rem' }}>📂</span> نشر وظيفة شاغرة
                                    </button>
                                    <button onClick={() => navigate('/staff-attendance')} className="btn-modern btn-outline" style={{ justifyContent: 'flex-start' }}>
                                        <span style={{ fontSize: '1.2rem', marginLeft: '0.8rem' }}>⏱️</span> تسجيل حضور يدوي
                                    </button>
                                    <button onClick={() => navigate('/payroll')} className="btn-modern btn-outline" style={{ justifyContent: 'flex-start' }}>
                                        <span style={{ fontSize: '1.2rem', marginLeft: '0.8rem' }}>💳</span> معالجة رواتب
                                    </button>
                                </div>

                                <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#F8FAFC', borderRadius: '20px', textAlign: 'center' }}>
                                    <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📅</div>
                                    <div style={{ fontWeight: 800, fontSize: '1.1rem' }}>{new Date().toLocaleDateString('ar-SA', { weekday: 'long' })}</div>
                                    <div style={{ color: '#64748B' }}>{new Date().toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );
};

export default HRDashboard;
