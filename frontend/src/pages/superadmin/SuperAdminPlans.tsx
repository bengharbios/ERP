import React, { useEffect, useState } from 'react';
import { superAdminService, PlanItem } from '../../services/superAdminService';

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getPlans();
      setPlans(res);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (index: number, field: 'monthlyPriceUSD' | 'annualPriceUSD' | 'maxStudents' | 'maxUsers', val: number) => {
    const updated = [...plans];
    updated[index] = { ...updated[index], [field]: val };
    setPlans(updated);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      await superAdminService.updatePlans(plans);
      alert('✅ تم حفظ وتحديث أسعار وحدود الباقات بنجاح!');
    } catch (err) {
      alert('حدث خطأ أثناء حفظ الباقات');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem 0', color: '#94a3b8' }}>جاري تحميل الباقات...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="sa-page-header">
        <div className="sa-page-title-wrap">
          <h1>
            <span>إدارة وتخصيص باقات الاشتراك</span>
            <span style={{ fontSize: '1.2rem' }}>📦</span>
          </h1>
          <p className="sa-page-subtitle">
            التحكم في أسعار الباقات، حدود الطلاب والمستخدمين، والميزات المتاحة لكل باقة
          </p>
        </div>

        <button onClick={handleSaveAll} disabled={saving} className="sa-btn-primary">
          <span>💾</span>
          <span>{saving ? 'جاري الحفظ...' : 'حفظ تعديلات الباقات'}</span>
        </button>
      </div>

      {/* Plans Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
        {plans.map((plan, idx) => (
          <div
            key={plan.id}
            className="sa-card"
            style={{
              position: 'relative',
              border: plan.isPopular ? '2px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.08)',
              background: plan.isPopular ? 'rgba(6, 182, 212, 0.06)' : 'rgba(15, 23, 42, 0.65)',
            }}
          >
            {plan.isPopular && (
              <div
                style={{
                  position: 'absolute',
                  top: '-12px',
                  right: '20px',
                  background: 'linear-gradient(135deg, #0d9488 0%, #06b6d4 100%)',
                  color: '#ffffff',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  padding: '0.2rem 0.75rem',
                  borderRadius: '20px',
                  boxShadow: '0 0 10px rgba(6, 182, 212, 0.5)',
                }}
              >
                ⭐ الباقة الأكثر طلباً
              </div>
            )}

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff' }}>
                {plan.nameAr}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{plan.nameEn}</div>
            </div>

            {/* Price Inputs */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  السعر الشهري ($ USD):
                </label>
                <input
                  type="number"
                  value={plan.monthlyPriceUSD}
                  onChange={(e) => handlePriceChange(idx, 'monthlyPriceUSD', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#38bdf8',
                    fontWeight: 700,
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#94a3b8', marginBottom: '0.25rem' }}>
                  السعر السنوي ($ USD):
                </label>
                <input
                  type="number"
                  value={plan.annualPriceUSD}
                  onChange={(e) => handlePriceChange(idx, 'annualPriceUSD', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#34d399',
                    fontWeight: 700,
                    fontSize: '1rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Limits */}
            <div
              style={{
                background: 'rgba(0,0,0,0.25)',
                padding: '0.85rem',
                borderRadius: '10px',
                marginBottom: '1.25rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
              }}
            >
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8' }}>الحد الأقصى للطلاب:</label>
                <input
                  type="number"
                  value={plan.maxStudents}
                  onChange={(e) => handlePriceChange(idx, 'maxStudents', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8' }}>المستخدمين/الموظفين:</label>
                <input
                  type="number"
                  value={plan.maxUsers}
                  onChange={(e) => handlePriceChange(idx, 'maxUsers', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '0.35rem 0.5rem',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    fontFamily: 'inherit',
                  }}
                />
              </div>
            </div>

            {/* Features list */}
            <div>
              <div style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 700, marginBottom: '0.5rem' }}>
                الميزات المشمولة:
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {plan.features.map((feat, fidx) => (
                  <li key={fidx} style={{ fontSize: '0.82rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: '#10b981', fontSize: '0.9rem' }}>✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
