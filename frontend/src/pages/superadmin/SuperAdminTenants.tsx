import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { superAdminService, TenantItem } from '../../services/superAdminService';
import { useAuthStore } from '../../store/authStore';

// ─── ERP Module Definitions ────────────────────────────────────────────────
const ALL_MODULES = [
  { key: 'ACADEMIC',  label: 'الأكاديمية',         icon: '🎓', desc: 'البرامج، الفصول، الطلاب، الجداول، الواجبات' },
  { key: 'FINANCE',   label: 'المالية',             icon: '💰', desc: 'الرسوم، الفواتير، سندات القبض، التقارير' },
  { key: 'HR',        label: 'الموارد البشرية',     icon: '👥', desc: 'الموظفون، الرواتب، الإجازات، الحضور' },
  { key: 'CRM',       label: 'إدارة المبيعات CRM', icon: '🎯', desc: 'العملاء المحتملون، خطوط المبيعات' },
  { key: 'MARKETING', label: 'التسويق',            icon: '📢', desc: 'الحملات الإعلانية، تتبع المصادر' },
  { key: 'SETTINGS',  label: 'الإعدادات',           icon: '⚙️', desc: 'المستخدمون، الأدوار، الإعدادات العامة' },
];
const DEFAULT_MODULES = ALL_MODULES.map(m => m.key);

const statusLabel = (s: string) =>
  ({ ACTIVE: 'نشط', TRIAL: 'تجريبي', SUSPENDED: 'معلق', EXPIRED: 'منتهي' }[s] ?? s);
const statusColor = (s: string) =>
  ({ ACTIVE: '#34d399', TRIAL: '#fbbf24', SUSPENDED: '#f87171', EXPIRED: '#64748b' }[s] ?? '#64748b');
const statusBg = (s: string) =>
  ({ ACTIVE: 'rgba(52,211,153,0.12)', TRIAL: 'rgba(251,191,36,0.12)', SUSPENDED: 'rgba(248,113,113,0.12)', EXPIRED: 'rgba(100,116,139,0.12)' }[s] ?? 'transparent');

type ModalType = 'details' | 'edit' | 'delete' | 'add' | 'credentials' | null;

interface NewTenantForm { name: string; slug: string; adminName: string; adminEmail: string; adminPassword: string; phone: string; plan: string; billingCycle: string; status: string; renewDate: string; }

const EMPTY_NEW: NewTenantForm = { name: '', slug: '', adminName: '', adminEmail: '', adminPassword: '', phone: '', plan: 'PRO', billingCycle: 'MONTHLY', status: 'ACTIVE', renewDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0] };

export default function SuperAdminTenants() {
  const navigate = useNavigate();
  const { impersonate } = useAuthStore();

  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [modalType, setModalType] = useState<ModalType>(null);
  const [activeTenant, setActiveTenant] = useState<TenantItem | null>(null);
  const [detailTenant, setDetailTenant] = useState<TenantItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [impersonatingId, setImpersonatingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<{name: string; status: string}>({ name: '', status: '' });
  const [modulesDraft, setModulesDraft] = useState<string[]>(DEFAULT_MODULES);
  const [newTenant, setNewTenant] = useState<NewTenantForm>(EMPTY_NEW);
  const [credentials, setCredentials] = useState<{name:string;username:string;email:string;password:string}|null>(null);
  const [copied, setCopied] = useState('');
  const [toast, setToast] = useState<{msg:string;ok:boolean}|null>(null);

  useEffect(() => { loadTenants(); }, []);

  const showToast = (msg: string, ok = true) => { setToast({msg,ok}); setTimeout(() => setToast(null), 3500); };

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getTenants();
      setTenants(Array.isArray(res) ? res : (res as any)?.data || []);
    } catch { showToast('فشل تحميل قائمة المعاهد', false); }
    finally { setLoading(false); }
  };

  const openDetails = async (t: TenantItem) => {
    setActiveTenant(t); setModalType('details');
    setDetailLoading(true); setDetailTenant(null);
    try {
      const full = await superAdminService.getTenantById(t.id);
      setDetailTenant(full);
      setModulesDraft(full.activeModules || DEFAULT_MODULES);
    } catch { setDetailTenant(t); setModulesDraft(t.activeModules || DEFAULT_MODULES); }
    finally { setDetailLoading(false); }
  };

  const openEdit = (t: TenantItem) => {
    setEditForm({ name: t.name, status: t.status });
    setModulesDraft(t.activeModules || DEFAULT_MODULES);
    setActiveTenant(t); setModalType('edit');
  };

  const closeModal = () => { setModalType(null); };

  const handleEnterTenant = async (t: TenantItem) => {
    try {
      setImpersonatingId(t.id);
      const result = await superAdminService.impersonateTenant(t.id);
      impersonate({ id: result.user.id, username: result.user.username, email: result.user.email, firstName: result.user.firstName || undefined, lastName: result.user.lastName || undefined, role: result.user.role, tenantId: result.user.tenantId, tenantName: result.user.tenantName, tenantSlug: result.user.tenantSlug, impersonated: true }, result.token);
      navigate('/dashboard');
    } catch (e: any) { showToast('فشل الدخول: ' + (e?.message || ''), false); }
    finally { setImpersonatingId(null); }
  };

  const handleStatusToggle = async (t: TenantItem) => {
    const ns: 'ACTIVE' | 'SUSPENDED' = t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try { await superAdminService.updateTenant(t.id, { status: ns }); showToast(ns === 'ACTIVE' ? 'تم تفعيل المعهد ✅' : 'تم تعليق المعهد ⏸️'); await loadTenants(); }
    catch { showToast('فشل تعديل الحالة', false); }
  };

  const saveEdit = async () => {
    if (!activeTenant) return; setSaving(true);
    try { await superAdminService.updateTenant(activeTenant.id, { name: editForm.name, status: editForm.status as TenantItem['status'], activeModules: modulesDraft }); showToast('تم الحفظ ✅'); closeModal(); await loadTenants(); }
    catch (e: any) { showToast(e?.message || 'فشل التعديل', false); }
    finally { setSaving(false); }
  };

  const saveModules = async () => {
    if (!detailTenant) return; setSaving(true);
    try { await superAdminService.updateTenant(detailTenant.id, { activeModules: modulesDraft }); setDetailTenant(p => p ? {...p, activeModules: modulesDraft} : p); showToast('تم تحديث الوحدات ✅'); }
    catch (e: any) { showToast(e?.message || 'فشل التحديث', false); }
    finally { setSaving(false); }
  };

  const confirmDelete = async () => {
    if (!activeTenant) return; setSaving(true);
    try { await superAdminService.deleteTenant(activeTenant.id); showToast('تم الحذف النهائي 🗑️'); closeModal(); await loadTenants(); }
    catch (e: any) { showToast(e?.message || 'فشل الحذف', false); }
    finally { setSaving(false); }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superAdminService.addTenant({
        name: newTenant.name,
        slug: newTenant.slug,
        adminName: newTenant.adminName,
        adminEmail: newTenant.adminEmail,
        phone: newTenant.phone,
        plan: newTenant.plan as TenantItem['plan'],
        status: newTenant.status as TenantItem['status'],
        billingCycle: newTenant.billingCycle as TenantItem['billingCycle'],
        renewDate: newTenant.renewDate,
      });
      const pwd = newTenant.adminPassword || '12345678';
      setCredentials({ name: newTenant.name, username: `admin_${newTenant.slug}`, email: newTenant.adminEmail, password: pwd });
      setNewTenant(EMPTY_NEW); setModalType('credentials'); await loadTenants();
    } catch (e: any) { showToast('فشل الإنشاء: ' + (e?.message || ''), false); }
  };

  const toggleModule = (key: string) => setModulesDraft(p => p.includes(key) ? p.filter(m => m !== key) : [...p, key]);
  const copy = (val: string, key: string) => { navigator.clipboard.writeText(val); setCopied(key); setTimeout(() => setCopied(''), 2000); };

  const filtered = tenants.filter(t => {
    const q = search.toLowerCase();
    return (t.name.toLowerCase().includes(q) || t.adminEmail.toLowerCase().includes(q) || t.slug.toLowerCase().includes(q))
      && (statusFilter === 'ALL' || t.status === statusFilter);
  });

  // ── Shared styles ──
  const input: React.CSSProperties = { width: '100%', padding: '0.6rem 0.85rem', borderRadius: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#f1f5f9', fontSize: '0.875rem', outline: 'none', direction: 'rtl', boxSizing: 'border-box' };
  const btn = (c: string): React.CSSProperties => ({ padding: '0.4rem 0.75rem', borderRadius: '8px', cursor: 'pointer', background: `${c}20`, border: `1px solid ${c}50`, color: c, fontWeight: 600, fontSize: '0.8rem', fontFamily: 'inherit', whiteSpace: 'nowrap' as const, transition: 'all 0.2s' });
  const bigBtn = (c: string): React.CSSProperties => ({ ...btn(c), padding: '0.6rem 1.25rem', fontWeight: 700 });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', direction: 'rtl' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '1.5rem', right: '50%', transform: 'translateX(50%)', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: 600, fontSize: '0.9rem', background: toast.ok ? '#065f46' : '#7f1d1d', color: toast.ok ? '#34d399' : '#fca5a5', border: `1px solid ${toast.ok ? '#34d399' : '#f87171'}`, zIndex: 9999, boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', margin: 0 }}>🏫 إدارة المعاهد المشتركة</h1>
          <p style={{ color: '#64748b', margin: '0.25rem 0 0', fontSize: '0.9rem' }}>التحكم الكامل في المعاهد: التفاصيل، وحدات ERP، الصلاحيات، والحالة</p>
        </div>
        <button onClick={() => setModalType('add')} className="sa-btn-primary">➕ تسجيل معهد جديد</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input placeholder="🔍 بحث..." value={search} onChange={e => setSearch(e.target.value)} style={{ flex: 1, minWidth: '200px', ...input }} />
        {['ALL','ACTIVE','TRIAL','SUSPENDED'].map(s => (
          <button key={s} onClick={() => setStatusFilter(s)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer', border: '1px solid', borderColor: statusFilter === s ? statusColor(s === 'ALL' ? 'ACTIVE' : s) : 'rgba(255,255,255,0.1)', background: statusFilter === s ? statusBg(s === 'ALL' ? 'ACTIVE' : s) : 'transparent', color: statusFilter === s ? statusColor(s === 'ALL' ? 'ACTIVE' : s) : '#64748b' }}>
            {s === 'ALL' ? 'الكل' : statusLabel(s)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', direction: 'rtl' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {['المعهد','البريد','الطلاب','الحالة','الإجراءات'].map(h => (
                <th key={h} style={{ padding: '0.85rem 1rem', color: '#64748b', fontWeight: 600, textAlign: 'right', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>⏳ جاري التحميل...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>لا توجد معاهد</td></tr>
            ) : filtered.map(t => (
              <tr key={t.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0, color: '#fff' }}>{t.name.charAt(0)}</div>
                    <div>
                      <div style={{ fontWeight: 700, color: '#f1f5f9' }}>{t.name}</div>
                      <div style={{ fontSize: '0.74rem', color: '#64748b' }}>/{t.slug}</div>
                    </div>
                  </div>
                </td>
                <td style={{ padding: '0.85rem 1rem', color: '#94a3b8', fontSize: '0.82rem' }}>{t.adminEmail}</td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{ fontWeight: 700, color: '#34d399' }}>{t.studentCount ?? 0}</span>
                  <span style={{ fontSize: '0.74rem', color: '#64748b' }}> طالب</span>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <span style={{ padding: '0.25rem 0.65rem', borderRadius: '20px', fontWeight: 600, fontSize: '0.75rem', color: statusColor(t.status), background: statusBg(t.status), border: `1px solid ${statusColor(t.status)}40` }}>
                    {statusLabel(t.status)}
                  </span>
                </td>
                <td style={{ padding: '0.85rem 1rem' }}>
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button onClick={() => openDetails(t)} style={btn('#6366f1')}>📋 تفاصيل</button>
                    <button onClick={() => handleEnterTenant(t)} disabled={impersonatingId === t.id} style={{ ...btn('#38bdf8'), opacity: impersonatingId === t.id ? 0.6 : 1 }}>
                      {impersonatingId === t.id ? '⏳' : '👁️'} دخول
                    </button>
                    <button onClick={() => handleStatusToggle(t)} style={btn(t.status === 'ACTIVE' ? '#f87171' : '#34d399')}>
                      {t.status === 'ACTIVE' ? '⏸️ تعليق' : '▶️ تفعيل'}
                    </button>
                    <button onClick={() => { setActiveTenant(t); setModalType('delete'); }} style={btn('#f87171')}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ═══ MODALS ═══ */}

      {/* DETAILS */}
      {modalType === 'details' && (
        <div onClick={e => { if (e.target === e.currentTarget) closeModal(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '820px', maxHeight: '90vh', overflow: 'auto', background: '#0a1320', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9' }}>📋 {activeTenant?.name}</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.3rem' }}>✕</button>
            </div>
            {detailLoading ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>⏳ جاري تحميل التفاصيل...</div>
            ) : detailTenant ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', gap: '0.75rem' }}>
                  {[
                    ['اسم المعهد', detailTenant.name], ['Slug', `/${detailTenant.slug}`],
                    ['المدير', detailTenant.adminName], ['البريد', detailTenant.adminEmail],
                    ['الهاتف', detailTenant.phone || '—'], ['الحالة', statusLabel(detailTenant.status)],
                    ['الطلاب', String(detailTenant.studentCount ?? 0)], ['الموظفون', String(detailTenant.userCount ?? 0)],
                    ['تاريخ الإنشاء', detailTenant.createdAt ? new Date(detailTenant.createdAt).toLocaleDateString('ar-SA') : '—'],
                    ['الدولة', detailTenant.country || '—'], ['العملة', detailTenant.currency || '—'],
                    ['حالة الاشتراك', detailTenant.subscriptionStatus || '—'],
                  ].map(([label, value]) => (
                    <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.07)' }}>
                      <div style={{ fontSize: '0.74rem', color: '#64748b', marginBottom: '0.2rem' }}>{label}</div>
                      <div style={{ fontWeight: 600, color: '#f1f5f9', fontSize: '0.9rem' }}>{value}</div>
                    </div>
                  ))}
                </div>

                {/* Module Toggler */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h4 style={{ margin: 0, color: '#f1f5f9', fontSize: '1rem' }}>⚙️ وحدات ERP النشطة</h4>
                    <button onClick={saveModules} disabled={saving} style={btn('#6366f1')}>{saving ? '...' : '💾 حفظ التغييرات'}</button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                    {ALL_MODULES.map(mod => {
                      const active = modulesDraft.includes(mod.key);
                      return (
                        <div key={mod.key} onClick={() => toggleModule(mod.key)} style={{ padding: '0.85rem 1rem', borderRadius: '12px', cursor: 'pointer', border: `1px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem', transition: 'all 0.2s' }}>
                          <div style={{ fontSize: '1.4rem' }}>{mod.icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 700, color: active ? '#a5b4fc' : '#94a3b8', fontSize: '0.87rem' }}>{mod.label}</div>
                            <div style={{ fontSize: '0.73rem', color: '#64748b', marginTop: '0.2rem', lineHeight: 1.4 }}>{mod.desc}</div>
                          </div>
                          <div style={{ width: '18px', height: '18px', borderRadius: '50%', background: active ? '#6366f1' : 'transparent', border: `2px solid ${active ? '#6366f1' : '#475569'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                            {active && <span style={{ fontSize: '0.6rem', color: '#fff' }}>✓</span>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <button onClick={() => openEdit(detailTenant)} style={bigBtn('#6366f1')}>✏️ تعديل البيانات</button>
                  <button onClick={() => handleEnterTenant(detailTenant)} disabled={impersonatingId === detailTenant.id} style={{ ...bigBtn('#38bdf8'), opacity: impersonatingId === detailTenant.id ? 0.6 : 1 }}>
                    {impersonatingId === detailTenant.id ? '⏳ جاري الدخول...' : '👁️ دخول المعهد'}
                  </button>
                  <button onClick={() => handleStatusToggle(detailTenant)} style={bigBtn(detailTenant.status === 'ACTIVE' ? '#f87171' : '#34d399')}>
                    {detailTenant.status === 'ACTIVE' ? '⏸️ تعليق الحساب' : '▶️ تفعيل الحساب'}
                  </button>
                  <button onClick={() => { setActiveTenant(detailTenant); setModalType('delete'); }} style={bigBtn('#f87171')}>🗑️ حذف نهائي</button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* EDIT */}
      {modalType === 'edit' && activeTenant && (
        <div onClick={e => { if (e.target === e.currentTarget) closeModal(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '560px', background: '#0a1320', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9' }}>✏️ تعديل بيانات المعهد</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.3rem' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>اسم المعهد</label>
                <input value={editForm.name} onChange={e => setEditForm(f => ({...f, name: e.target.value}))} style={input} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>الحالة</label>
                <select value={editForm.status} onChange={e => setEditForm(f => ({...f, status: e.target.value}))} style={input}>
                  <option value="ACTIVE">نشط</option>
                  <option value="SUSPENDED">معلق</option>
                  <option value="TRIAL">تجريبي</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.5rem' }}>وحدات ERP النشطة</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                  {ALL_MODULES.map(mod => {
                    const active = modulesDraft.includes(mod.key);
                    return (
                      <label key={mod.key} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', padding: '0.6rem 0.75rem', borderRadius: '8px', border: `1px solid ${active ? '#6366f1' : 'rgba(255,255,255,0.08)'}`, background: active ? 'rgba(99,102,241,0.12)' : 'rgba(255,255,255,0.03)' }}>
                        <input type="checkbox" checked={active} onChange={() => toggleModule(mod.key)} style={{ accentColor: '#6366f1' }} />
                        <span style={{ fontSize: '0.85rem', color: active ? '#a5b4fc' : '#94a3b8', fontWeight: 600 }}>{mod.icon} {mod.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button onClick={closeModal} style={btn('#64748b')}>إلغاء</button>
                <button onClick={saveEdit} disabled={saving} style={bigBtn('#6366f1')}>{saving ? '⏳ جاري الحفظ...' : '💾 حفظ التعديلات'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE */}
      {modalType === 'delete' && activeTenant && (
        <div onClick={e => { if (e.target === e.currentTarget) closeModal(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '440px', background: '#0a1320', border: '1px solid rgba(239,68,68,0.4)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: '#f1f5f9', marginBottom: '0.5rem' }}>تأكيد الحذف النهائي</div>
            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f87171', marginBottom: '1rem' }}>{activeTenant.name}</div>
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', padding: '0.75rem', color: '#fca5a5', fontSize: '0.85rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              هذا الإجراء لا يمكن التراجع عنه. سيتم حذف المعهد وجميع مستخدميه نهائياً.
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={closeModal} style={bigBtn('#64748b')}>إلغاء</button>
              <button onClick={confirmDelete} disabled={saving} style={bigBtn('#f87171')}>{saving ? '⏳...' : '🗑️ نعم، احذف نهائياً'}</button>
            </div>
          </div>
        </div>
      )}

      {/* ADD TENANT */}
      {modalType === 'add' && (
        <div onClick={e => { if (e.target === e.currentTarget) closeModal(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto', background: '#0a1320', border: '1px solid rgba(99,102,241,0.3)', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#f1f5f9' }}>➕ تسجيل معهد جديد</h3>
              <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontSize: '1.3rem' }}>✕</button>
            </div>
            <form onSubmit={handleCreateTenant} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                {([
                  ['اسم المعهد *', 'name', 'text', 'معهد الأمل', true],
                  ['Slug (رابط فريد) *', 'slug', 'text', 'amal-institute', true],
                  ['اسم المدير', 'adminName', 'text', 'محمد أحمد', false],
                  ['بريد المدير *', 'adminEmail', 'email', 'admin@institute.com', true],
                  ['كلمة المرور', 'adminPassword', 'password', 'افتراضي: 12345678', false],
                  ['رقم الهاتف', 'phone', 'text', '+971 50 000 0000', false],
                ] as [string,keyof NewTenantForm,string,string,boolean][]).map(([label,field,type,ph,req]) => (
                  <div key={field}>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>{label}</label>
                    <input required={req} type={type} value={newTenant[field]} placeholder={ph}
                      onChange={e => setNewTenant(f => ({...f, [field]: field === 'slug' ? e.target.value.toLowerCase().replace(/\s+/g,'-') : e.target.value}))}
                      style={input} />
                  </div>
                ))}
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>الباقة</label>
                  <select value={newTenant.plan} onChange={e => setNewTenant(f => ({...f, plan: e.target.value}))} style={input}>
                    {['FREE','STARTER','PRO','BUSINESS','ENTERPRISE'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: '#64748b', marginBottom: '0.35rem' }}>الحالة</label>
                  <select value={newTenant.status} onChange={e => setNewTenant(f => ({...f, status: e.target.value}))} style={input}>
                    <option value="ACTIVE">نشط</option>
                    <option value="TRIAL">تجريبي</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={closeModal} style={btn('#64748b')}>إلغاء</button>
                <button type="submit" style={bigBtn('#6366f1')}>✅ إنشاء المعهد</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREDENTIALS */}
      {modalType === 'credentials' && credentials && (
        <div onClick={e => { if (e.target === e.currentTarget) closeModal(); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ width: '100%', maxWidth: '460px', background: '#0a1320', border: '1px solid rgba(52,211,153,0.3)', borderRadius: '16px', padding: '1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem' }}>✅</div>
              <h3 style={{ margin: '0.5rem 0 0.25rem', fontSize: '1.1rem', fontWeight: 800, color: '#f1f5f9' }}>تم إنشاء المعهد بنجاح!</h3>
              <p style={{ color: '#64748b', fontSize: '0.85rem', margin: 0 }}>احفظ بيانات الدخول وأرسلها لمدير المعهد</p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
              {([['اسم المعهد', credentials.name,'name'], ['اسم المستخدم', credentials.username,'user'], ['البريد', credentials.email,'email'], ['كلمة المرور', credentials.password,'pwd']] as [string,string,string][]).map(([label,val,key]) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', padding: '0.75rem 1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '0.74rem', color: '#64748b' }}>{label}</div>
                    <div style={{ fontWeight: 700, color: '#f1f5f9', fontFamily: 'monospace' }}>{val}</div>
                  </div>
                  <button onClick={() => copy(val, key)} style={btn('#6366f1')}>{copied === key ? '✅' : '📋'}</button>
                </div>
              ))}
            </div>
            <button onClick={closeModal} style={{ ...bigBtn('#34d399'), width: '100%', textAlign: 'center' }}>إغلاق ✓</button>
          </div>
        </div>
      )}

    </div>
  );
}
