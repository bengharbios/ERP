import React, { useState, useEffect } from 'react';
import { leadApi, stageApi } from '../../../services/crm.service';

interface Stage {
    id: string;
    name: string;
    probability: number;
    sequence: number;
}

interface Opportunity {
    id: string;
    name: string;
    expectedRevenue?: number;
    probability: number;
    contactName?: string;
    phone?: string;
    stageId: string;
}

const Pipeline: React.FC = () => {
    const [stages, setStages] = useState<Stage[]>([]);
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [stagesRes, oppsRes] = await Promise.all([
                stageApi.getAll(),
                leadApi.getAll({ type: 'opportunity' })
            ]);

            setStages(stagesRes.data.sort((a: Stage, b: Stage) => a.sequence - b.sequence));
            setOpportunities(oppsRes.data);
        } catch (error) {
            console.error('Error fetching pipeline data:', error);
        } finally {
            setLoading(false);
        }
    };

    const getOpportunitiesForStage = (stageId: string) => {
        return opportunities.filter(opp => opp.stageId === stageId);
    };

    const getStageTotal = (stageId: string) => {
        return getOpportunitiesForStage(stageId).reduce(
            (sum, opp) => sum + Number(opp.expectedRevenue || 0),
            0
        );
    };

    if (loading) {
        return <div className="crm-loading"><div className="crm-spinner"></div></div>;
    }

    return (
        <div className="crm-pipeline">
            <div className="crm-header">
                <h1>📊 خط الأنابيب - Pipeline</h1>
                <div className="crm-header-actions">
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>إجمالي الفرص</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#f97316' }}>
                            {opportunities.reduce((sum, opp) => sum + Number(opp.expectedRevenue || 0), 0).toLocaleString()} AED
                        </div>
                    </div>
                </div>
            </div>

            {/* Kanban Board */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(${stages.length}, minmax(280px, 1fr))`,
                gap: '1rem',
                overflowX: 'auto',
                paddingBottom: '1rem'
            }}>
                {stages.map(stage => {
                    const stageOpps = getOpportunitiesForStage(stage.id);
                    const stageTotal = getStageTotal(stage.id);

                    return (
                        <div key={stage.id} style={{ minWidth: '280px' }}>
                            {/* Stage Header */}
                            <div className="crm-card" style={{ marginBottom: '0.75rem', padding: '1rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>{stage.name}</h4>
                                    <span className="crm-badge crm-badge-info">{stageOpps.length}</span>
                                </div>
                                <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                                    {stage.probability}% احتمالية
                                </div>
                                <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#10b981', marginTop: '0.25rem' }}>
                                    {stageTotal.toLocaleString()} AED
                                </div>
                            </div>

                            {/* Opportunities in Stage */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {stageOpps.map(opp => (
                                    <div
                                        key={opp.id}
                                        className="crm-card"
                                        style={{
                                            padding: '0.75rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onClick={() => window.location.href = `/crm/leads/${opp.id}`}
                                    >
                                        <div style={{ fontWeight: '600', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                                            {opp.name}
                                        </div>
                                        {opp.contactName && (
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.25rem' }}>
                                                👤 {opp.contactName}
                                            </div>
                                        )}
                                        {opp.phone && (
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                                📞 {opp.phone}
                                            </div>
                                        )}
                                        {opp.expectedRevenue && (
                                            <div style={{
                                                fontSize: '1rem',
                                                fontWeight: '700',
                                                color: '#10b981',
                                                borderTop: '1px solid #f3f4f6',
                                                paddingTop: '0.5rem'
                                            }}>
                                                {Number(opp.expectedRevenue).toLocaleString()} AED
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {stageOpps.length === 0 && (
                                    <div style={{
                                        padding: '2rem 0.5rem',
                                        textAlign: 'center',
                                        color: '#9ca3af',
                                        fontSize: '0.875rem'
                                    }}>
                                        لا توجد فرص
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Pipeline;
