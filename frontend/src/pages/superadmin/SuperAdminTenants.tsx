import React, { useEffect, useState } from 'react';
import { superAdminService, TenantItem } from '../../services/superAdminService';
import { useNavigate } from 'react-router-dom';

export default function SuperAdminTenants() {
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: '',
    slug: '',
    adminName: '',
    adminEmail: '',
    phone: '',
    plan: 'PRO' as const,
    billingCycle: 'MONTHLY' as const,
    status: 'ACTIVE' as const,
    renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });

  const navigate = useNavigate();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getTenants();
      setTenants(res);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusToggle = async (tenant: TenantItem) => {
    const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      await superAdminService.updateTenant(tenant.id, { status: newStatus });
      await loadTenants();
    } catch (err) {
      alert('حدث خطأ أثناء تعديل حالة المعهد');
    }
  };

  const handlePlanChange = async (tenantId: string, newPlan: any) => {
    try {
      await superAdminService.updateTenant(tenantId, { plan: newPlan });
      await loadTenants();
    } catch (err) {
      alert('حدث خطأ أثناء تغيير الباقة');
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await superAdminService.addTenant(newTenant);
      setShowAddModal(false);
      setNewTenant({
        name: '',
        slug: '',
        adminName: '',
        adminEmail: '',
        phone: '',
        plan: 'PRO',
        billingCycle: 'MONTHLY',
        status: 'ACTIVE',
        renewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });
      await loadTenants();
    } catch (err) {
      alert('حدث خطأ أثناء إضافة المعهد');
    }
  };

  const filteredTenants = tenants.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(search.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(search.toLowerCase()) ||
      t.slug.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div>
      {/* Header */}
      <div className="sa-page-header">
        <div className="sa-page-title-wrap">
          <h1>
            <span>إدارة المعاهد المشتركة</span>
            <span style={{ fontSize: '1.2rem' }}>🏫</span>
          </h1>
          <p className="sa-page-subtitle">
            التحكم الشامل في حسابات المعاهد، الباقات، الصلاحيات، وحالة الاشتراكات
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="sa-btn-primary">
          <span>➕</span>
          <span>تسجيل معهد جديد</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="sa-card" style={{ marginBottom: '1.5rem', padding: '1.25rem' }}>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              placeholder="🔍 بحث باسم المعهد، البريد، أو الرمز..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%',
                padding: '0.65rem 1rem',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#ffffff',
                fontFamily: 'inherit',
                fontSize: '0.9rem',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['ALL', 'ACTIVE', 'TRIAL', 'SUSPENDED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  border: statusFilter === st ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
                  background: statusFilter === st ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                  color: statusFilter === st ? '#38bdf8' : '#94a3b8',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  fontFamily: 'inherit',
                }}
              >
                {st === 'ALL' ? 'الكل' : st === 'ACTIVE' ? 'النشطة' : st === 'TRIAL' ? 'التجريبية' : 'المعلقة'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tenants Table */}
      <div className="sa-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th>اسم المعهد / المسؤول</th>
                <th>الباقة الحالية</th>
                <th>دورة الفوترة</th>
                <th>عدد الطلاب</th>
                <th>المستخدمين</th>
                <th>تاريخ التجديد</th>
                <th>الحالة</th>
                <th style={{ textAlign: 'center' }}>الإجراءات والتحكم</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                      {tenant.name}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                      {tenant.adminName} • {tenant.adminEmail}
                    </div>
                  </td>
                  <td>
                    <select
                      value={tenant.plan}
                      onChange={(e) => handlePlanChange(tenant.id, e.target.value)}
                      style={{
                        padding: '0.35rem 0.65rem',
                        borderRadius: '6px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        border: '1px solid rgba(255, 255, 255, 0.15)',
                        color: '#38bdf8',
                        fontFamily: 'inherit',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                      }}
                    >
                      <option value="FREE">FREE</option>
                      <option value="STARTER">STARTER</option>
                      <option value="PRO">PRO</option>
                      <option value="BUSINESS">BUSINESS</option>
                      <option value="ENTERPRISE">ENTERPRISE</option>
                    </select>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>
                      {tenant.billingCycle === 'ANNUAL' ? 'سنوي (وفر 20%)' : 'شهري'}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#34d399' }}>{tenant.studentCount}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}> طالب</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#a78bfa' }}>{tenant.userCount}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}> موظف</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>{tenant.renewDate}</span>
                  </td>
                  <td>
                    <span
                      className={`sa-badge ${
                        tenant.status === 'ACTIVE'
                          ? 'sa-badge-active'
                          : tenant.status === 'TRIAL'
                          ? 'sa-badge-trial'
                          : 'sa-badge-suspended'
                      }`}
                    >
                      {tenant.status === 'ACTIVE' ? 'نشط' : tenant.status === 'TRIAL' ? 'تجريبي' : 'معلق'}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => navigate('/dashboard')}
                        title="الدخول إلى لوحة المعهد (Impersonate)"
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: '8px',
                          background: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          fontFamily: 'inherit',
                        }}
                      >
                        👁️ دخول المعهد
                      </button>
                      <button
                        onClick={() => handleStatusToggle(tenant)}
                        title={tenant.status === 'ACTIVE' ? 'تعليق الحساب' : 'تفعيل الحساب'}
                        style={{
                          padding: '0.4rem 0.75rem',
                          borderRadius: '8px',
                          background: tenant.status === 'ACTIVE' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                          border: tenant.status === 'ACTIVE' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                          color: tenant.status === 'ACTIVE' ? '#f87171' : '#34d399',
                          cursor: 'pointer',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          fontFamily: 'inherit',
                        }}
                      >
                        {tenant.status === 'ACTIVE' ? '⏸️ تعليق' : '▶️ تفعيل'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Tenant Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="sa-card"
            style={{
              width: '100%',
              maxWidth: '540px',
              background: '#0a1320',
              border: '1px solid rgba(56, 189, 248, 0.3)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                ➕ تسجيل معهد جديد في المنصة
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateTenant}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                    اسم المعهد أو الأكاديمية:
                  </label>
                  <input
                    type="text"
                    required
                    value={newTenant.name}
                    onChange={(e) => setNewTenant({ ...newTenant, name: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '8px',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.12)',
                      color: '#ffffff',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                      الرمز الفريد (Slug):
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="institute-xyz"
                      value={newTenant.slug}
                      onChange={(e) => setNewTenant({ ...newTenant, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                      اسم مدير المعهد:
                    </label>
                    <input
                      type="text"
                      required
                      value={newTenant.adminName}
                      onChange={(e) => setNewTenant({ ...newTenant, adminName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                      البريد الإلكتروني للإدارة:
                    </label>
                    <input
                      type="email"
                      required
                      value={newTenant.adminEmail}
                      onChange={(e) => setNewTenant({ ...newTenant, adminEmail: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                      رقم الهاتف / الواتساب:
                    </label>
                    <input
                      type="text"
                      value={newTenant.phone}
                      onChange={(e) => setNewTenant({ ...newTenant, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                      الباقة المختارة:
                    </label>
                    <select
                      value={newTenant.plan}
                      onChange={(e) => setNewTenant({ ...newTenant, plan: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontFamily: 'inherit',
                      }}
                    >
                      <option value="FREE">FREE (تجريبي)</option>
                      <option value="STARTER">STARTER ($99)</option>
                      <option value="PRO">PRO ($249)</option>
                      <option value="BUSINESS">BUSINESS ($499)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                      دورة الدفع:
                    </label>
                    <select
                      value={newTenant.billingCycle}
                      onChange={(e) => setNewTenant({ ...newTenant, billingCycle: e.target.value as any })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '8px',
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        fontFamily: 'inherit',
                      }}
                    >
                      <option value="MONTHLY">شهري</option>
                      <option value="ANNUAL">سنوي (مع خصم)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="sa-btn-secondary"
                  >
                    إلغاء
                  </button>
                  <button type="submit" className="sa-btn-primary">
                    حفظ وتفعيل المعهد ✅
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
