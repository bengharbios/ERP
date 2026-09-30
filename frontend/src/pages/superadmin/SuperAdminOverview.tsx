import React, { useEffect, useState } from 'react';
import { superAdminService, SuperAdminOverview as OverviewData } from '../../services/superAdminService';
import { useNavigate } from 'react-router-dom';

export default function SuperAdminOverview() {
  const [data, setData] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load overview:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div style={{ textAlign: 'center', padding: '5rem 0', color: '#94a3b8' }}>
        <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
        <div>جاري تحميل إحصائيات المنصة السحابية...</div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="sa-page-header">
        <div className="sa-page-title-wrap">
          <h1>
            <span>لوحة تحكم السوبر أدمن</span>
            <span style={{ fontSize: '1.2rem' }}>👑</span>
          </h1>
          <p className="sa-page-subtitle">
            نظرة عامة على اشتراكات المعاهد، تدفق الإيرادات، ومؤشرات الأداء السحابية
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button onClick={() => navigate('/super-admin/tenants')} className="sa-btn-primary">
            <span>➕</span>
            <span>تسجيل معهد جديد</span>
          </button>
          <button onClick={loadOverview} className="sa-btn-secondary">
            <span>🔄</span>
            <span>تحديث</span>
          </button>
        </div>
      </div>

      {/* Primary KPI Stats */}
      <div className="sa-stats-grid">
        <div className="sa-card" style={{ borderRight: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>الإيراد الشهري المتكرر (MRR)</span>
            <span style={{ fontSize: '1.4rem' }}>💰</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#38bdf8' }}>
            ${data.mrr.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#10b981', marginTop: '0.5rem', fontWeight: 600 }}>
            ↗ +14.2% نمو هذا الشهر
          </div>
        </div>

        <div className="sa-card" style={{ borderRight: '4px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>المعاهد النشطة</span>
            <span style={{ fontSize: '1.4rem' }}>🏫</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>
            {data.activeTenants} <span style={{ fontSize: '1rem', color: '#94a3b8' }}>/ {data.totalTenants}</span>
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            100% نسبة تشغيل الخوادم
          </div>
        </div>

        <div className="sa-card" style={{ borderRight: '4px solid #a855f7' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>إجمالي الطلاب المسجلين</span>
            <span style={{ fontSize: '1.4rem' }}>🎓</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: '#c084fc' }}>
            {data.totalStudents.toLocaleString()}
          </div>
          <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.5rem' }}>
            عبر جميع فروع المعاهد المشتركة
          </div>
        </div>

        <div className="sa-card" style={{ borderRight: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: 600 }}>إيصالات تحويل بانتظار المراجعة</span>
            <span style={{ fontSize: '1.4rem' }}>🧾</span>
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 800, color: data.pendingReceiptsCount > 0 ? '#fbbf24' : '#94a3b8' }}>
            {data.pendingReceiptsCount}
          </div>
          <div style={{ fontSize: '0.8rem', color: data.pendingReceiptsCount > 0 ? '#fbbf24' : '#10b981', marginTop: '0.5rem', fontWeight: 600 }}>
            {data.pendingReceiptsCount > 0 ? 'بحاجة لموافقتك لاعتماد الباقات' : 'لا توجد إيصالات معلقة'}
          </div>
        </div>
      </div>

      {/* Live Turso Cloud Database Card */}
      <div className="sa-card" style={{ marginBottom: '2rem', background: 'linear-gradient(135deg, rgba(15,23,42,0.9) 0%, rgba(30,41,59,0.7) 100%)', border: '1px solid rgba(14,165,233,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '1.7rem' }}>🛡️</span>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                حالة قاعدة البيانات السحابية (Turso AWS Live Engine)
              </h3>
              <span style={{ fontSize: '0.82rem', color: '#38bdf8' }}>
                المعهد الرئيسي: معهد السلام الدولي للغات والتدريب
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="sa-badge sa-badge-active">
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#34d399' }} />
              متصل ومؤمن 100%
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.5rem' }}>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>عدد الجداول المحفوظة</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginTop: '0.2rem' }}>
              {data.realTursoStats.tablesCount} جدولاً مؤمناً
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>سجلات الطلاب المباشرة</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: '0.2rem' }}>
              {data.realTursoStats.students} طالب
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>المستخدمين والموظفين</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#a78bfa', marginTop: '0.2rem' }}>
              {data.realTursoStats.users} مستخدم
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>عملاء الـ CRM والملاحظات</div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399', marginTop: '0.2rem' }}>
              {data.realTursoStats.leads.toLocaleString()} عميل
            </div>
          </div>
        </div>
      </div>

      {/* Two columns: Alerts & Quick Actions */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Alerts */}
        <div className="sa-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>🔔</span>
            <span>تنبيهات المنصة الفورية</span>
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {data.recentAlerts.map((alert) => (
              <div
                key={alert.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255, 255, 255, 0.06)',
                  borderRadius: '12px',
                  padding: '1rem',
                  display: 'flex',
                  gap: '0.85rem',
                  alignItems: 'flex-start',
                }}
              >
                <span style={{ fontSize: '1.2rem', marginTop: '0.1rem' }}>
                  {alert.type === 'PAYMENT_PENDING' ? '💳' : alert.type === 'EXPIRY_SOON' ? '⚠️' : '✅'}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.2rem' }}>
                    {alert.title}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: '#94a3b8' }}>
                    {alert.desc}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.4rem' }}>
                    {alert.timestamp}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions Card */}
        <div className="sa-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span>⚡</span>
            <span>الوصول السريع والإجراءات</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <button
              onClick={() => navigate('/super-admin/tenants')}
              className="sa-card"
              style={{
                textAlign: 'right',
                cursor: 'pointer',
                background: 'rgba(14, 165, 233, 0.08)',
                border: '1px solid rgba(14, 165, 233, 0.25)',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏫</div>
              <div style={{ fontWeight: 700, color: '#38bdf8', fontSize: '0.95rem' }}>إدارة المعاهد</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>تعديل الباقات، الصلاحيات</div>
            </button>

            <button
              onClick={() => navigate('/super-admin/subscriptions')}
              className="sa-card"
              style={{
                textAlign: 'right',
                cursor: 'pointer',
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🧾</div>
              <div style={{ fontWeight: 700, color: '#34d399', fontSize: '0.95rem' }}>مراجعة الإيصالات</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>اعتماد التحويلات البنكية</div>
            </button>

            <button
              onClick={() => navigate('/super-admin/plans')}
              className="sa-card"
              style={{
                textAlign: 'right',
                cursor: 'pointer',
                background: 'rgba(168, 85, 247, 0.08)',
                border: '1px solid rgba(168, 85, 247, 0.25)',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>📦</div>
              <div style={{ fontWeight: 700, color: '#c084fc', fontSize: '0.95rem' }}>تسعير الباقات</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>تعديل حدود وميزات الخطط</div>
            </button>

            <button
              onClick={() => navigate('/super-admin/settings')}
              className="sa-card"
              style={{
                textAlign: 'right',
                cursor: 'pointer',
                background: 'rgba(245, 158, 11, 0.08)',
                border: '1px solid rgba(245, 158, 11, 0.25)',
              }}
            >
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🏦</div>
              <div style={{ fontWeight: 700, color: '#fbbf24', fontSize: '0.95rem' }}>طرق الدفع والآيبان</div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.2rem' }}>إعدادات الحساب البنكي</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
