// @ts-nocheck
import React, { useState, useEffect } from 'react';
import {
    TrendingUp, Target, Users,
    ArrowUpRight, ArrowDownRight,
    TrendingDown, BarChart3, PieChart as PieChartIcon,
    Calendar, Filter, RefreshCw
} from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis,
    CartesianGrid, Tooltip, ResponsiveContainer,
    AreaChart, Area, PieChart, Pie, Cell
} from 'recharts';
import { leadApi, stageApi, teamApi } from '../services/crm.service';
import {
    HzPageHeader, HzStat, HzStatsGrid, HzBtn,
    HzBadge, HzCard, HzLoader, HzStatsCard
} from '../layouts/Rapidos2026/components/RapidosUI';

/**
 * CRM INTELLIGENCE DASHBOARD (Rapidos 2026)
 * Real-time conversion tracking, funnel analysis & sales performance
 */

const COLORS = ['#00E5FF', '#00FF9D', '#FF5D5D', '#FFB800', '#9D5DFF'];

export default function CRMDashboard2026() {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalLeads: 0,
        totalValue: 0,
        conversionRate: 0,
        funnelData: [],
        performanceData: []
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [leadsRes, stagesRes] = await Promise.all([
                leadApi.getAll(),
                stageApi.getAll()
            ]);

            const leads = leadsRes.data || [];
            const stages = stagesRes.data || [];

            // Funnel Analysis
            const funnel = stages.map(s => ({
                name: s.nameAr,
                value: leads.filter(l => l.stageId === s.id).length
            }));

            setStats({
                totalLeads: leads.length,
                totalValue: leads.reduce((a, b) => a + (b.expectedRevenue || 0), 0),
                conversionRate: 18.5, // Mock
                funnelData: funnel,
                performanceData: [
                    { name: 'Jan', value: 4000 },
                    { name: 'Feb', value: 3000 },
                    { name: 'Mar', value: 2000 },
                    { name: 'Apr', value: 2780 },
                    { name: 'May', value: 1890 },
                    { name: 'Jun', value: 2390 },
                ]
            });
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <HzLoader />;

    return (
        <div style={{ padding: '0 24px 24px' }}>
            <HzPageHeader
                title="لوحة تحكم CRM"
                subtitle="تحسين الأداء البيعي وتحليل مسارات نمو العملاء"
                icon={<BarChart3 size={22} />}
                actions={
                    <>
                        <HzBtn variant="secondary" icon={<Filter size={16} />}>الفلترة الزمانية</HzBtn>
                        <HzBtn variant="ghost" icon={<RefreshCw size={16} />} onClick={fetchData} />
                    </>
                }
            />

            <HzStatsGrid>
                <HzStat icon={<Users size={20} />} value={stats.totalLeads} label="إجمالي العملاء" color="cyan" />
                <HzStat icon={<TrendingUp size={20} />} value={`${stats.totalValue.toLocaleString()} ر.س`} label="القيمة المتوقعة" color="neon" />
                <HzStat icon={<Target size={20} />} value={`${stats.conversionRate}%`} label="نسبة التحويل" color="plasma" />
            </HzStatsGrid>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', marginTop: '24px' }}>
                {/* 1. Sales Performance Area Chart */}
                <div style={{ gridColumn: 'span 8' }}>
                    <HzCard glow>
                        <div style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
                                <h3 style={{ fontSize: '1rem', fontWeight: 800 }}>أداء المبيعات الشهري</h3>
                                <HzBadge color="neon">نمو +12%</HzBadge>
                            </div>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={stats.performanceData}>
                                        <defs>
                                            <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="var(--hz-cyan)" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="var(--hz-cyan)" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="var(--hz-border-soft)" vertical={false} />
                                        <XAxis dataKey="name" stroke="var(--hz-text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="var(--hz-text-dim)" fontSize={12} tickLine={false} axisLine={false} />
                                        <Tooltip
                                            contentStyle={{ background: 'var(--hz-void)', border: '1px solid var(--hz-border-soft)', borderRadius: '12px' }}
                                            itemStyle={{ color: 'var(--hz-cyan)' }}
                                        />
                                        <Area type="monotone" dataKey="value" stroke="var(--hz-cyan)" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </HzCard>
                </div>

                {/* 2. Funnel Analysis Pie Chart */}
                <div style={{ gridColumn: 'span 4' }}>
                    <HzCard>
                        <div style={{ padding: '24px' }}>
                            <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '24px' }}>توزيع العملاء (Funnel)</h3>
                            <div style={{ height: '300px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={stats.funnelData}
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {stats.funnelData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ background: 'var(--hz-void)', border: '1px solid var(--hz-border-soft)', borderRadius: '12px' }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                                {stats.funnelData.map((entry, index) => (
                                    <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                                            <span style={{ fontSize: '0.8rem', color: 'var(--hz-text-muted)' }}>{entry.name}</span>
                                        </div>
                                        <span style={{ fontWeight: 800 }}>{entry.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </HzCard>
                </div>
            </div>
        </div>
    );
}
