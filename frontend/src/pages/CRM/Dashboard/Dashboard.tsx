import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { leadApi, activityApi } from '../../../services/crm.service';
import { BarChart3, TrendingUp, Users, Target, Plus, Calendar } from 'lucide-react';


interface DashboardStats {
    leadsCount: number;
    opportunitiesCount: number;
    wonCount: number;
    totalRevenue: number;
    activitiesOverdue: number;
    activitiesToday: number;
}

const Dashboard: React.FC = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState<DashboardStats>({
        leadsCount: 0,
        opportunitiesCount: 0,
        wonCount: 0,
        totalRevenue: 0,
        activitiesOverdue: 0,
        activitiesToday: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);

            // Fetch leads
            const leadsRes = await leadApi.getAll({ type: 'lead' });
            const opportunitiesRes = await leadApi.getAll({ type: 'opportunity' });

            // Fetch activities
            const overdueRes = await activityApi.getAll({ filter: 'overdue' });
            const todayRes = await activityApi.getAll({ filter: 'today' });

            setStats({
                leadsCount: leadsRes.data.length,
                opportunitiesCount: opportunitiesRes.data.length,
                wonCount: opportunitiesRes.data.filter((o: any) => o.stage?.isWon).length,
                totalRevenue: opportunitiesRes.data
                    .filter((o: any) => o.stage?.isWon)
                    .reduce((sum: number, o: any) => sum + Number(o.expectedRevenue || 0), 0),
                activitiesOverdue: overdueRes.data.length,
                activitiesToday: todayRes.data.length
            });
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="crm-loading">
                <div className="crm-spinner"></div>
            </div>
        );
    }

    return (
        <div className="crm-dashboard">
            <div className="crm-header">
                <h1>🎯 لوحة التحكم</h1>
                <div className="crm-header-actions">
                    <button
                        className="crm-btn crm-btn-primary"
                        onClick={() => navigate('/crm/leads')}
                    >
                        <Plus size={18} />
                        <span>عميل محتمل جديد</span>
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="crm-grid">
                <div className="crm-card" onClick={() => navigate('/crm/leads')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: '#fef3c7', borderRadius: '12px' }}>
                            <Users size={24} color="#f97316" />
                        </div>
                        <span className="crm-badge crm-badge-info">{stats.leadsCount} عميل</span>
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a1a1a' }}>العملاء المحتملون</h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>إجمالي العملاء الجدد</p>
                </div>

                <div className="crm-card" onClick={() => navigate('/crm/pipeline')} style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: '#dbeafe', borderRadius: '12px' }}>
                            <Target size={24} color="#2563eb" />
                        </div>
                        <span className="crm-badge crm-badge-info">{stats.opportunitiesCount} فرصة</span>
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a1a1a' }}>الفرص</h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>الفرص النشطة</p>
                </div>

                <div className="crm-card" style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: '#d1fae5', borderRadius: '12px' }}>
                            <TrendingUp size={24} color="#10b981" />
                        </div>
                        <span className="crm-badge crm-badge-success">{stats.wonCount} فوز</span>
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a1a1a' }}>الصفقات المكتملة</h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>معدل النجاح: {stats.opportunitiesCount > 0 ? Math.round((stats.wonCount / stats.opportunitiesCount) * 100) : 0}%</p>
                </div>

                <div className="crm-card" style={{ cursor: 'pointer' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                        <div style={{ padding: '0.75rem', background: '#ede9fe', borderRadius: '12px' }}>
                            <BarChart3 size={24} color="#7c3aed" />
                        </div>
                        <span className="crm-badge crm-badge-success">{stats.totalRevenue.toLocaleString()} AED</span>
                    </div>
                    <h3 style={{ margin: '0 0 0.5rem 0', color: '#1a1a1a' }}>الإيرادات المحققة</h3>
                    <p style={{ margin: 0, color: '#6b7280', fontSize: '0.875rem' }}>من الصفقات المكتملة</p>
                </div>
            </div>

            {/* Activities Alert */}
            {(stats.activitiesOverdue > 0 || stats.activitiesToday > 0) && (
                <div className="crm-card" style={{ marginBottom: '2rem' }}>
                    <h3 style={{ margin: '0 0 1rem 0', color: '#1a1a1a' }}>📅 الأنشطة المستحقة</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                        {stats.activitiesOverdue > 0 && (
                            <div
                                onClick={() => navigate('/crm/activities')}
                                style={{
                                    padding: '1rem',
                                    background: '#fee2e2',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    border: '2px solid #ef4444'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="activity-pulse overdue"></span>
                                    <strong style={{ color: '#991b1b' }}>{stats.activitiesOverdue} متأخرة</strong>
                                </div>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#7f1d1d' }}>
                                    تحتاج لمتابعة عاجلة
                                </p>
                            </div>
                        )}

                        {stats.activitiesToday > 0 && (
                            <div
                                onClick={() => navigate('/crm/activities')}
                                style={{
                                    padding: '1rem',
                                    background: '#fef3c7',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    border: '2px solid #f59e0b'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <span className="activity-pulse today"></span>
                                    <strong style={{ color: '#92400e' }}>{stats.activitiesToday} اليوم</strong>
                                </div>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#78350f' }}>
                                    مخططة لهذا اليوم
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className="crm-card">
                <h3 style={{ margin: '0 0 1rem 0', color: '#1a1a1a' }}>⚡ إجراءات سريعة</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <button
                        className="crm-btn crm-btn-secondary"
                        style={{ justifyContent: 'center' }}
                        onClick={() => navigate('/crm/leads')}
                    >
                        <Users size={18} />
                        <span>عرض العملاء المحتملين</span>
                    </button>

                    <button
                        className="crm-btn crm-btn-secondary"
                        style={{ justifyContent: 'center' }}
                        onClick={() => navigate('/crm/pipeline')}
                    >
                        <Target size={18} />
                        <span>خط الأنابيب</span>
                    </button>

                    <button
                        className="crm-btn crm-btn-secondary"
                        style={{ justifyContent: 'center' }}
                        onClick={() => navigate('/crm/teams')}
                    >
                        <Users size={18} />
                        <span>فرق المبيعات</span>
                    </button>

                    <button
                        className="crm-btn crm-btn-secondary"
                        style={{ justifyContent: 'center' }}
                        onClick={() => navigate('/crm/activities')}
                    >
                        <Calendar size={18} />
                        <span>الأنشطة</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
