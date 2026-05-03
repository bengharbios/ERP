import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { ModernCard, ModernStat, ModernButton } from '../layouts/ModernGlobal2026/components/ModernUI';
import { GraduationCap, Users, BookOpen, CheckCircle, Calendar, FileText } from 'lucide-react';

export default function Dashboard() {
    const { user } = useAuthStore();
    const [stats] = useState({
        activePrograms: { value: 5, trend: '+2' },
        totalStudents: { value: 250, trend: '+12' },
        totalClasses: { value: 12, trend: '+1' },
        presentToday: { value: '92%', trend: '+5%' },
        upcomingEvents: 3,
        pendingAssignments: 15,
    });

    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        setIsVisible(true);
    }, []);

    return (
        <div style={{ padding: 'var(--mg26-space-2xl)', opacity: isVisible ? 1 : 0, transition: 'opacity 0.5s ease' }}>
            {/* 1. Page Title & Action Layer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--mg26-space-2xl)' }}>
                <div>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--mg26-text-main)', margin: 0 }}>نظرة عامة على النظام</h2>
                    <p style={{ color: 'var(--mg26-text-muted)', fontSize: '0.9rem', margin: '4px 0 0 0' }}>مرحباً {user?.firstName || 'المسؤول'}، إليك ملخص أداء المعهد اليوم.</p>
                </div>
                <div style={{ display: 'flex', gap: 'var(--mg26-space-md)' }}>
                    <ModernButton variant="outline" icon={<Calendar size={16} />}>الجدول الزمني</ModernButton>
                    <ModernButton variant="primary" icon={<CheckCircle size={16} />}>تسجيل حضور سريع</ModernButton>
                </div>
            </div>

            {/* 2. Global KPI Radar (Stats Grid) */}
            <div className="mg26-stat-grid">
                <ModernCard>
                    <ModernStat
                        label="البرامج النشطة"
                        value={stats.activePrograms.value}
                        trend={{ value: stats.activePrograms.trend, direction: 'up' }}
                    />
                </ModernCard>
                <ModernCard>
                    <ModernStat
                        label="إجمالي الطلاب"
                        value={stats.totalStudents.value}
                        trend={{ value: stats.totalStudents.trend, direction: 'up' }}
                    />
                </ModernCard>
                <ModernCard>
                    <ModernStat
                        label="الفصول الدراسية"
                        value={stats.totalClasses.value}
                        trend={{ value: stats.totalClasses.trend, direction: 'up' }}
                    />
                </ModernCard>
                <ModernCard>
                    <ModernStat
                        label="نسبة حضور اليوم"
                        value={stats.presentToday.value}
                        trend={{ value: stats.presentToday.trend, direction: 'up' }}
                    />
                </ModernCard>
            </div>

            {/* 3. Decision Panels (Insights Zone) */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--mg26-space-2xl)' }}>
                {/* Main Action Hub */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mg26-space-2xl)' }}>
                    <ModernCard title="🚀 الوصول السريع" subtitle="أهم الوظائف التي تحتاجها لإدارة المعهد">
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 'var(--mg26-space-md)' }}>
                            {[
                                { label: 'الطلاب', path: '/students', icon: <Users size={20} />, color: '#3182CE' },
                                { label: 'البرامج', path: '/programs', icon: <GraduationCap size={20} />, color: '#DD6B20' },
                                { label: 'الفصول', path: '/classes', icon: <BookOpen size={20} />, color: '#38A169' },
                                { label: 'المالية', path: '/finance', icon: <FileText size={20} />, color: '#805AD5' }
                            ].map((item, i) => (
                                <Link key={i} to={item.path} style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        padding: 'var(--mg26-space-xl)',
                                        borderRadius: 'var(--mg26-radius-md)',
                                        backgroundColor: 'rgba(0,0,0,0.02)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s'
                                    }} className="mg26-quick-action">
                                        <div style={{ color: item.color }}>{item.icon}</div>
                                        <span style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--mg26-text-secondary)' }}>{item.label}</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </ModernCard>

                    <ModernCard title="⚙️ الإحصائيات التحليلية" subtitle="مستوى التقدم في البرامج الدراسية">
                        <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', gap: 'var(--mg26-space-xl)', padding: 'var(--mg26-space-xl) 0' }}>
                            {[60, 85, 45, 90, 70, 30].map((h, i) => (
                                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
                                    <div style={{
                                        width: '100%',
                                        height: `${h}%`,
                                        background: 'linear-gradient(to top, var(--mg26-primary-soft), var(--mg26-primary))',
                                        borderRadius: '4px 4px 0 0'
                                    }}></div>
                                    <span style={{ fontSize: '10px', color: 'var(--mg26-text-muted)' }}>M{i + 1}</span>
                                </div>
                            ))}
                        </div>
                    </ModernCard>
                </div>

                {/* Secondary Sidebar (Events/Tasks) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mg26-space-2xl)' }}>
                    <ModernCard title="📅 أحداث قادمة">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mg26-space-lg)' }}>
                            {[
                                { date: '15', month: 'Feb', title: 'حفل التخرج', time: '04:00 PM' },
                                { date: '22', month: 'Feb', title: 'اجتماع المعلمين', time: '10:00 AM' }
                            ].map((ev, i) => (
                                <div key={i} style={{ display: 'flex', gap: 'var(--mg26-space-md)', alignItems: 'center' }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '10px',
                                        backgroundColor: 'var(--mg26-primary-soft)', color: 'var(--mg26-primary)',
                                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <span style={{ fontSize: '14px', fontWeight: '800' }}>{ev.date}</span>
                                        <span style={{ fontSize: '8px', fontWeight: '700', textTransform: 'uppercase' }}>{ev.month}</span>
                                    </div>
                                    <div>
                                        <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--mg26-text-main)' }}>{ev.title}</h4>
                                        <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--mg26-text-muted)' }}>{ev.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ModernCard>

                    <ModernCard title="📝 مهام عالقة">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--mg26-space-md)' }}>
                            {[
                                { title: 'مراجعة طلبات الانضمام', count: '5 طلبات' },
                                { title: 'إدخال نتائج المستوى 4', count: '8 فصول' }
                            ].map((task, i) => (
                                <div key={i} style={{
                                    padding: 'var(--mg26-space-md)',
                                    borderRadius: 'var(--mg26-radius-md)',
                                    borderRight: '3px solid var(--mg26-primary)',
                                    backgroundColor: 'rgba(0,0,0,0.01)'
                                }}>
                                    <h4 style={{ margin: 0, fontSize: '0.85rem', color: 'var(--mg26-text-main)' }}>{task.title}</h4>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--mg26-text-muted)' }}>{task.count}</span>
                                </div>
                            ))}
                        </div>
                    </ModernCard>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{
                __html: `
                .mg26-quick-action:hover {
                    background-color: var(--mg26-primary-soft) !important;
                    transform: translateY(-3px);
                    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
                }
            ` }} />
        </div>
    );
}
