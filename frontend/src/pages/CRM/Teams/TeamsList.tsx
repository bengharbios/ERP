import React, { useState, useEffect } from 'react';
import { teamApi } from '../../../services/crm.service';
import { Users } from 'lucide-react';

interface Team {
    id: string;
    name: string;
    leader?: { username: string };
    metrics: {
        leadsCount: number;
        opportunitiesCount: number;
        wonCount: number;
        conversionRate: number;
        totalRevenue: number;
        membersCount: number;
    };
}

const TeamsList: React.FC = () => {
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            setLoading(true);
            const response = await teamApi.getAll();
            setTeams(response.data);
        } catch (error) {
            console.error('Error fetching teams:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="crm-loading"><div className="crm-spinner"></div></div>;
    }

    return (
        <div className="crm-teams-list">
            <div className="crm-header">
                <h1>🏆 فرق المبيعات</h1>
            </div>

            {teams.length === 0 ? (
                <div className="crm-card" style={{ padding: '3rem', textAlign: 'center', color: '#9ca3af' }}>
                    لا توجد فرق مبيعات بعد
                </div>
            ) : (
                <div className="crm-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
                    {teams.map(team => (
                        <div key={team.id} className="crm-card">
                            {/* Team Header */}
                            <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: '1.5rem',
                                paddingBottom: '1rem',
                                borderBottom: '2px solid #f3f4f6'
                            }}>
                                <div>
                                    <h3 style={{ margin: '0 0 0.25rem 0', fontSize: '1.25rem' }}>{team.name}</h3>
                                    <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                        👤 {team.leader?.username || 'غير مُعيّن'}
                                    </div>
                                </div>
                                <div style={{
                                    padding: '0.75rem',
                                    background: '#fef3c7',
                                    borderRadius: '12px'
                                }}>
                                    <Users size={24} color="#f97316" />
                                </div>
                            </div>

                            {/* Stats Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                        عملاء محتملون
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#3b82f6' }}>
                                        {team.metrics.leadsCount}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                        فرص
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b' }}>
                                        {team.metrics.opportunitiesCount}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                        صفقات منجزة
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#10b981' }}>
                                        {team.metrics.wonCount}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                        معدل التحويل
                                    </div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#8b5cf6' }}>
                                        {team.metrics.conversionRate}%
                                    </div>
                                </div>
                            </div>

                            {/* Revenue */}
                            <div style={{
                                marginTop: '1rem',
                                padding: '1rem',
                                background: '#d1fae5',
                                borderRadius: '8px'
                            }}>
                                <div style={{ fontSize: '0.875rem', color: '#065f46', marginBottom: '0.25rem' }}>
                                    💰 الإيرادات المحققة
                                </div>
                                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#047857' }}>
                                    {team.metrics.totalRevenue.toLocaleString()} AED
                                </div>
                            </div>

                            {/* Team Members */}
                            <div style={{
                                marginTop: '1rem',
                                padding: '0.75rem',
                                background: '#f9fafb',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}>
                                <Users size={16} color="#6b7280" />
                                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                    {team.metrics.membersCount} أعضاء
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default TeamsList;
