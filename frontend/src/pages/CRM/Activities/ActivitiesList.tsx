import React, { useState, useEffect } from 'react';
import { activityApi } from '../../../services/crm.service';
import { Plus, Phone, Users, Mail, FileText, Filter, CheckCircle } from 'lucide-react';

interface Activity {
    id: string;
    summary: string;
    dateDeadline: string;
    status: string;
    calculatedStatus: string;
    type: { name: string; icon: string };
    lead?: { name: string; id: string };
    user: { username: string };
}

const ActivitiesList: React.FC = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'overdue' | 'today' | 'planned'>('all');

    useEffect(() => {
        fetchActivities();
    }, [filter]);

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const response = await activityApi.getAll({ filter: filter === 'all' ? undefined : filter });
            setActivities(response.data);
        } catch (error) {
            console.error('Error fetching activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleMarkDone = async (id: string) => {
        try {
            await activityApi.markDone(id);
            fetchActivities();
        } catch (error) {
            console.error('Error marking activity as done:', error);
        }
    };

    const getActivityIcon = (iconName: string) => {
        switch (iconName) {
            case 'Phone': return <Phone size={18} />;
            case 'Users': return <Users size={18} />;
            case 'Mail': return <Mail size={18} />;
            default: return <FileText size={18} />;
        }
    };

    const getStatusColor = (calculatedStatus: string) => {
        switch (calculatedStatus) {
            case 'overdue': return '#ef4444';
            case 'today': return '#f59e0b';
            case 'DONE': return '#10b981';
            default: return '#3b82f6';
        }
    };

    if (loading) {
        return <div className="crm-loading"><div className="crm-spinner"></div></div>;
    }

    const stats = {
        all: activities.length,
        overdue: activities.filter(a => a.calculatedStatus === 'overdue').length,
        today: activities.filter(a => a.calculatedStatus === 'today').length,
        planned: activities.filter(a => a.calculatedStatus === 'planned').length
    };

    return (
        <div className="crm-activities-list">
            <div className="crm-header">
                <h1>📅 الأنشطة</h1>
                <div className="crm-header-actions">
                    <button className="crm-btn crm-btn-primary">
                        <Plus size={18} />
                        <span>نشاط جديد</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { key: 'all', label: 'الكل', count: stats.all, color: '#3b82f6' },
                    { key: 'overdue', label: 'متأخرة', count: stats.overdue, color: '#ef4444' },
                    { key: 'today', label: 'اليوم', count: stats.today, color: '#f59e0b' },
                    { key: 'planned', label: 'مخططة', count: stats.planned, color: '#10b981' }
                ].map(({ key, label, count, color }) => (
                    <button
                        key={key}
                        className={`crm-btn ${filter === key ? 'crm-btn-primary' : 'crm-btn-secondary'}`}
                        onClick={() => setFilter(key as any)}
                        style={{ position: 'relative' }}
                    >
                        <Filter size={18} />
                        <span>{label}</span>
                        <span
                            className="crm-badge"
                            style={{
                                background: filter === key ? 'white' : color + '20',
                                color: filter === key ? color : color,
                                marginRight: '0.5rem'
                            }}
                        >
                            {count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Activities List */}
            <div className="crm-list">
                {activities.length === 0 ? (
                    <div style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                        لا توجد أنشطة في هذا الفلتر
                    </div>
                ) : (
                    activities.map(activity => (
                        <div
                            key={activity.id}
                            className="crm-list-item"
                            style={{
                                gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr 120px',
                                padding: '1rem',
                                borderRight: `4px solid ${getStatusColor(activity.calculatedStatus)}`
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{
                                    padding: '0.5rem',
                                    background: `${getStatusColor(activity.calculatedStatus)}20`,
                                    borderRadius: '8px',
                                    color: getStatusColor(activity.calculatedStatus)
                                }}>
                                    {getActivityIcon(activity.type.icon)}
                                </div>
                            </div>

                            <div>
                                <div style={{ fontWeight: '600', marginBottom: '0.25rem' }}>
                                    {activity.summary || 'نشاط بدون عنوان'}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {activity.type.name}
                                </div>
                            </div>

                            <div>
                                {activity.lead ? (
                                    <div
                                        style={{ cursor: 'pointer', color: '#f97316', fontWeight: '500' }}
                                        onClick={() => window.location.href = `/crm/leads/${activity.lead!.id}`}
                                    >
                                        {activity.lead.name}
                                    </div>
                                ) : (
                                    <span style={{ color: '#9ca3af' }}>-</span>
                                )}
                            </div>

                            <div>
                                <div>{new Date(activity.dateDeadline).toLocaleDateString('ar-AE')}</div>
                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                    {new Date(activity.dateDeadline).toLocaleTimeString('ar-AE', {
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </div>
                            </div>

                            <div>{activity.user.username}</div>

                            <div>
                                {activity.status === 'PLANNED' ? (
                                    <button
                                        className="crm-btn crm-btn-secondary"
                                        style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
                                        onClick={() => handleMarkDone(activity.id)}
                                    >
                                        <CheckCircle size={16} />
                                        <span>تم</span>
                                    </button>
                                ) : (
                                    <span className="crm-badge crm-badge-success">
                                        ✓ منجز
                                    </span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ActivitiesList;
