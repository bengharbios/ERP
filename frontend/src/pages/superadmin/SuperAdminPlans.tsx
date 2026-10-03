import React, { useEffect, useState } from 'react';
import { superAdminService, PlanItem } from '../../services/superAdminService';
import { Package, Plus, Trash2, CheckCircle2, ShieldCheck, Sparkles, Check, X } from 'lucide-react';

export const AVAILABLE_MODULES = [
  { id: 'academic', labelAr: '🎓 النظام الأكاديمي', desc: 'الطلاب، الفصول، المواد، والامتحانات' },
  { id: 'finance', labelAr: '💰 المالية والمحاسبة', desc: 'الفواتير، سندات القبض والصرف، وشجرة الحسابات' },
  { id: 'hr', labelAr: '👥 الموارد البشرية HRMS', desc: 'الموظفين، العقود، مسيرات الرواتب، والإجازات' },
  { id: 'crm', labelAr: '📈 التسويق و CRM', desc: 'إدارة المهتمين Leads وبوت تيليجرام التفاعلي' },
  { id: 'ai', labelAr: '🤖 المساعد الذكي AI', desc: 'تحليلات الأداء ومقترحات الذكاء الاصطناعي' },
  { id: 'biometrics', labelAr: '⏱️ أجهزة البصمة', desc: 'ربط أجهزة الحضور والانصراف البيومترية' },
  { id: 'whitelabel', labelAr: '🏷️ العلامة البيضاء', desc: 'تخصيص الهوية والشعار والنطاق الخاص' },
];

export default function SuperAdminPlans() {
  const [plans, setPlans] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Plan Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newPlan, setNewPlan] = useState<Partial<PlanItem>>({
    id: '',
    type: 'CUSTOM',
    nameAr: '',
    nameEn: '',
    monthlyPriceUSD: 149,
    annualPriceUSD: 1490,
    maxStudents: 300,
    maxUsers: 15,
    features: ['نظام متكامل شامل', 'دعم فني مخصص'],
    modules: ['academic', 'finance'],
    isPopular: false,
  });
  const [newFeatureInput, setNewFeatureInput] = useState('');

  useEffect(() => {
    loadPlans();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadPlans = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getPlans();
      // Ensure each plan has modules array
      const normalized = res.map((p) => ({
        ...p,
        modules: p.modules || (p.type === 'FREE' ? ['academic'] : p.type === 'STARTER' ? ['academic', 'finance'] : p.type === 'PRO' ? ['academic', 'finance', 'hr', 'crm'] : ['academic', 'finance', 'hr', 'crm', 'ai', 'biometrics', 'whitelabel']),
      }));
      setPlans(normalized);
    } catch (err) {
      console.error('Failed to load plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePriceChange = (
    index: number,
    field: 'monthlyPriceUSD' | 'annualPriceUSD' | 'maxStudents' | 'maxUsers' | 'nameAr' | 'nameEn',
    val: any
  ) => {
    const updated = [...plans];
    updated[index] = { ...updated[index], [field]: val };
    setPlans(updated);
  };

  const togglePlanModule = (planIndex: number, moduleId: string) => {
    const updated = [...plans];
    const currentModules = updated[planIndex].modules || [];
    if (currentModules.includes(moduleId)) {
      updated[planIndex].modules = currentModules.filter((m) => m !== moduleId);
    } else {
      updated[planIndex].modules = [...currentModules, moduleId];
    }
    setPlans(updated);
  };

  const togglePopular = (planIndex: number) => {
    const updated = [...plans];
    updated[planIndex].isPopular = !updated[planIndex].isPopular;
    setPlans(updated);
  };

  const handleSaveAll = async () => {
    try {
      setSaving(true);
      await superAdminService.updatePlans(plans);
      showToast('✅ تم حفظ الباقات وتحديث صلاحيات الموديولات بنجاح!');
    } catch (err) {
      showToast('❌ حدث خطأ أثناء حفظ الباقات');
    } finally {
      setSaving(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.nameAr) return;

    const planId = 'plan_' + (newPlan.nameEn?.toLowerCase().replace(/\s+/g, '_') || Date.now());
    const finalPlan: PlanItem = {
      id: planId,
      type: (newPlan.type || 'CUSTOM').toUpperCase(),
      nameAr: newPlan.nameAr || 'باقة جديدة',
      nameEn: newPlan.nameEn || 'New Plan',
      monthlyPriceUSD: Number(newPlan.monthlyPriceUSD) || 0,
      annualPriceUSD: Number(newPlan.annualPriceUSD) || 0,
      maxStudents: Number(newPlan.maxStudents) || 100,
      maxUsers: Number(newPlan.maxUsers) || 5,
      features: newPlan.features || ['ميزات الباقة المخصصة'],
      modules: newPlan.modules || ['academic'],
      isPopular: Boolean(newPlan.isPopular),
    };

    const updated = [...plans, finalPlan];
    setPlans(updated);
    setShowAddModal(false);
    try {
      await superAdminService.updatePlans(updated);
      showToast('✅ تم إنشاء الباقة الجديدة وإضافتها بنجاح!');
    } catch {
      showToast('فشل حفظ الباقة على الخادم');
    }
  };

  const handleDeletePlan = async (planId: string) => {
    if (['plan_free', 'plan_starter', 'plan_pro', 'plan_business'].includes(planId)) {
      alert('لا يمكن حذف الباقات الأساسية للنظام');
      return;
    }
    if (!window.confirm('هل أنت متأكد من حذف هذه الباقة؟')) return;
    const updated = plans.filter((p) => p.id !== planId);
    setPlans(updated);
    try {
      await superAdminService.updatePlans(updated);
      showToast('🗑️ تم حذف الباقة بنجاح');
    } catch {
      showToast('فشل تحديث القائمة');
    }
  };

  const addFeatureToNewPlan = () => {
    if (!newFeatureInput.trim()) return;
    setNewPlan((prev) => ({
      ...prev,
      features: [...(prev.features || []), newFeatureInput.trim()],
    }));
    setNewFeatureInput('');
  };

  const removeFeatureFromNewPlan = (idx: number) => {
    setNewPlan((prev) => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== idx),
    }));
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '5rem 0', color: '#94a3b8' }}>جاري تحميل الباقات...</div>;
  }

  return (
    <div>
      {/* Toast Notification */}
      {toastMsg && (
        <div style={{
          position: 'fixed',
          top: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          background: '#0F172A',
          border: '1px solid #38BDF8',
          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          color: '#FFFFFF',
          padding: '12px 24px',
          borderRadius: '12px',
          fontWeight: 700,
          fontSize: '0.95rem'
        }}>
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="sa-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
        <div className="sa-page-title-wrap">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px', margin: 0, fontSize: '1.8rem', color: '#FFFFFF' }}>
            <span>إدارة الباقات والتحكم بالأقسام والمزايا</span>
            <Package size={28} color="#38BDF8" />
          </h1>
          <p className="sa-page-subtitle" style={{ margin: '6px 0 0', color: '#94A3B8', fontSize: '0.9rem' }}>
            حدد أسعار الباقات وحدودها، ومكّن أو عطّل الأقسام والموديولات (Feature Gating) لكل باقة تلقائياً
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowAddModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 18px',
              borderRadius: '10px',
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38BDF8',
              fontWeight: 700,
              cursor: 'pointer'
            }}
          >
            <Plus size={18} />
            <span>إضافة باقة جديدة</span>
          </button>

          <button
            onClick={handleSaveAll}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 22px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 700,
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.4)'
            }}
          >
            <CheckCircle2 size={18} />
            <span>{saving ? 'جاري الحفظ...' : 'حفظ جميع التعديلات'}</span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        {plans.map((plan, idx) => (
          <div
            key={plan.id}
            style={{
              position: 'relative',
              borderRadius: '16px',
              padding: '24px',
              background: plan.isPopular ? 'rgba(6, 182, 212, 0.08)' : 'rgba(15, 23, 42, 0.75)',
              border: plan.isPopular ? '2px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
              boxShadow: '0 8px 30px rgba(0, 0, 0, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between'
            }}
          >
            {/* Top Badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <button
                type="button"
                onClick={() => togglePopular(idx)}
                style={{
                  background: plan.isPopular ? 'linear-gradient(135deg, #0d9488, #06b6d4)' : 'rgba(255,255,255,0.06)',
                  color: plan.isPopular ? '#FFFFFF' : '#94A3B8',
                  border: 'none',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '0.75rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                <Sparkles size={14} />
                <span>{plan.isPopular ? '⭐ الأكثر طلباً' : 'تحديد كشائعة'}</span>
              </button>

              {!['plan_free', 'plan_starter', 'plan_pro', 'plan_business'].includes(plan.id) && (
                <button
                  type="button"
                  onClick={() => handleDeletePlan(plan.id)}
                  title="حذف الباقة"
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#EF4444',
                    cursor: 'pointer',
                    padding: '4px'
                  }}
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>

            {/* Plan Title & Code */}
            <div style={{ marginBottom: '1.25rem' }}>
              <input
                type="text"
                value={plan.nameAr}
                onChange={(e) => handlePriceChange(idx, 'nameAr', e.target.value)}
                style={{
                  width: '100%',
                  fontSize: '1.3rem',
                  fontWeight: 800,
                  color: '#FFFFFF',
                  background: 'transparent',
                  border: 'none',
                  borderBottom: '1px dashed rgba(255,255,255,0.2)',
                  outline: 'none',
                  marginBottom: '4px'
                }}
              />
              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{plan.nameEn} ({plan.type})</div>
            </div>

            {/* Prices */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                  شهرياً ($ USD):
                </label>
                <input
                  type="number"
                  value={plan.monthlyPriceUSD}
                  onChange={(e) => handlePriceChange(idx, 'monthlyPriceUSD', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#38BDF8',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    outline: 'none'
                  }}
                />
              </div>

              <div style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '10px' }}>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94A3B8', marginBottom: '4px' }}>
                  سنوياً ($ USD):
                </label>
                <input
                  type="number"
                  value={plan.annualPriceUSD}
                  onChange={(e) => handlePriceChange(idx, 'annualPriceUSD', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px 8px',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#34D399',
                    fontWeight: 700,
                    fontSize: '1.1rem',
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Capacity Limits */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.5rem', background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8' }}>أقصى عدد طلاب:</label>
                <input
                  type="number"
                  value={plan.maxStudents}
                  onChange={(e) => handlePriceChange(idx, 'maxStudents', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94A3B8' }}>أقصى موظفين:</label>
                <input
                  type="number"
                  value={plan.maxUsers}
                  onChange={(e) => handlePriceChange(idx, 'maxUsers', Number(e.target.value))}
                  style={{
                    width: '100%',
                    padding: '6px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#FFFFFF',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>
            </div>

            {/* Feature Gating: Enabled Modules Checkboxes */}
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', color: '#F59E0B', fontWeight: 800, marginBottom: '0.75rem' }}>
                <ShieldCheck size={16} />
                <span>الأقسام والموديولات المفعلة (Feature Gating):</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {AVAILABLE_MODULES.map((mod) => {
                  const isChecked = (plan.modules || []).includes(mod.id);
                  return (
                    <label
                      key={mod.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '8px 10px',
                        borderRadius: '8px',
                        background: isChecked ? 'rgba(16, 185, 129, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                        border: isChecked ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(255, 255, 255, 0.05)',
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => togglePlanModule(idx, mod.id)}
                        style={{ accentColor: '#10B981', cursor: 'pointer', width: '16px', height: '16px' }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, color: isChecked ? '#A7F3D0' : '#94A3B8' }}>
                          {mod.labelAr}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Highlights Features List */}
            <div>
              <div style={{ fontSize: '0.8rem', color: '#CBD5E1', fontWeight: 700, marginBottom: '0.5rem' }}>
                مزايا الباقة النصية:
              </div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {plan.features.map((feat, fidx) => (
                  <li key={fidx} style={{ fontSize: '0.82rem', color: '#94A3B8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <span style={{ color: '#10B981' }}>✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: Add New Plan */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '20px'
        }}>
          <div style={{
            width: '100%',
            maxWidth: '560px',
            maxHeight: '90vh',
            overflowY: 'auto',
            background: '#0F172A',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '20px',
            padding: '28px',
            color: '#FFFFFF'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>إضافة باقة اشتراك جديدة</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleCreatePlan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>اسم الباقة بالعربية *</label>
                  <input
                    type="text"
                    required
                    value={newPlan.nameAr}
                    onChange={(e) => setNewPlan({ ...newPlan, nameAr: e.target.value })}
                    placeholder="مثال: باقة النخبة"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>الاسم بالإنجليزية</label>
                  <input
                    type="text"
                    value={newPlan.nameEn}
                    onChange={(e) => setNewPlan({ ...newPlan, nameEn: e.target.value })}
                    placeholder="مثال: Elite Plan"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>السعر الشهري ($ USD)</label>
                  <input
                    type="number"
                    value={newPlan.monthlyPriceUSD}
                    onChange={(e) => setNewPlan({ ...newPlan, monthlyPriceUSD: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#38BDF8' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>السعر السنوي ($ USD)</label>
                  <input
                    type="number"
                    value={newPlan.annualPriceUSD}
                    onChange={(e) => setNewPlan({ ...newPlan, annualPriceUSD: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#34D399' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>الحد الأقصى للطلاب</label>
                  <input
                    type="number"
                    value={newPlan.maxStudents}
                    onChange={(e) => setNewPlan({ ...newPlan, maxStudents: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>الحد الأقصى للمستخدمين</label>
                  <input
                    type="number"
                    value={newPlan.maxUsers}
                    onChange={(e) => setNewPlan({ ...newPlan, maxUsers: Number(e.target.value) })}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF' }}
                  />
                </div>
              </div>

              {/* Modules selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#F59E0B', marginBottom: '8px' }}>
                  الأقسام والموديولات المشمولة في الباقة:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {AVAILABLE_MODULES.map((mod) => {
                    const isChecked = (newPlan.modules || []).includes(mod.id);
                    return (
                      <label
                        key={mod.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px',
                          borderRadius: '8px',
                          background: isChecked ? 'rgba(16, 185, 129, 0.15)' : 'rgba(255,255,255,0.04)',
                          cursor: 'pointer',
                          fontSize: '0.8rem'
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            const cur = newPlan.modules || [];
                            setNewPlan({
                              ...newPlan,
                              modules: isChecked ? cur.filter((m) => m !== mod.id) : [...cur, mod.id],
                            });
                          }}
                        />
                        <span>{mod.labelAr}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Custom features bullets */}
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', color: '#CBD5E1', marginBottom: '4px' }}>ميزات نصية إضافية:</label>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="text"
                    value={newFeatureInput}
                    onChange={(e) => setNewFeatureInput(e.target.value)}
                    placeholder="مثال: نسخ احتياطي آلي يومي"
                    style={{ flex: 1, padding: '8px 12px', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.15)', color: '#FFF' }}
                  />
                  <button
                    type="button"
                    onClick={addFeatureToNewPlan}
                    style={{ padding: '8px 14px', borderRadius: '8px', background: '#0284C7', color: '#FFF', border: 'none', cursor: 'pointer' }}
                  >
                    إضافة
                  </button>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                  {(newPlan.features || []).map((f, i) => (
                    <span
                      key={i}
                      style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: 'rgba(255,255,255,0.08)',
                        fontSize: '0.78rem',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <span>{f}</span>
                      <X size={12} style={{ cursor: 'pointer', color: '#F87171' }} onClick={() => removeFeatureFromNewPlan(i)} />
                    </span>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '10px 18px', borderRadius: '8px', background: 'rgba(255,255,255,0.1)', color: '#FFF', border: 'none', cursor: 'pointer' }}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  style={{ padding: '10px 22px', borderRadius: '8px', background: '#0284C7', color: '#FFF', border: 'none', fontWeight: 700, cursor: 'pointer' }}
                >
                  إنشاء وحفظ الباقة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
