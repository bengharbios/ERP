import React, { useEffect, useState } from 'react';
import { superAdminService, BankReceiptItem, TenantItem } from '../../services/superAdminService';

export default function SuperAdminSubscriptions() {
  const [receipts, setReceipts] = useState<BankReceiptItem[]>([]);
  const [tenants, setTenants] = useState<TenantItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReceipt, setSelectedReceipt] = useState<BankReceiptItem | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [activeTab, setActiveTab] = useState<'RECEIPTS' | 'SUBSCRIPTIONS'>('RECEIPTS');

  useEffect(() => {
    loadSubscriptions();
  }, []);

  const loadSubscriptions = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getSubscriptions();
      setReceipts(res.receipts);
      setTenants(res.tenants);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (status: 'APPROVED' | 'REJECTED') => {
    if (!selectedReceipt) return;
    try {
      await superAdminService.reviewReceipt(selectedReceipt.id, status, reviewNote);
      setSelectedReceipt(null);
      setReviewNote('');
      await loadSubscriptions();
      alert(status === 'APPROVED' ? '✅ تم اعتماد الإيصال وتفعيل باقة المعهد بنجاح!' : '❌ تم رفض الإيصال وتنبيه المعهد.');
    } catch (err) {
      alert('حدث خطأ أثناء معالجة الإيصال');
    }
  };

  const pendingCount = receipts.filter((r) => r.status === 'PENDING').length;

  return (
    <div>
      {/* Header */}
      <div className="sa-page-header">
        <div className="sa-page-title-wrap">
          <h1>
            <span>إدارة الاشتراكات والتحويلات البنكية</span>
            <span style={{ fontSize: '1.2rem' }}>💳</span>
          </h1>
          <p className="sa-page-subtitle">
            تدقيق إيصالات التحويل البنكي اليدوية، اعتماد الاشتراكات، ومتابعة الفواتير
          </p>
        </div>

        {/* Tab switchers */}
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setActiveTab('RECEIPTS')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              border: activeTab === 'RECEIPTS' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
              background: activeTab === 'RECEIPTS' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'RECEIPTS' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontFamily: 'inherit',
            }}
          >
            <span>🧾 إيصالات بانتظار الاعتماد</span>
            {pendingCount > 0 && (
              <span
                style={{
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  padding: '0.15rem 0.45rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                }}
              >
                {pendingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('SUBSCRIPTIONS')}
            style={{
              padding: '0.6rem 1.2rem',
              borderRadius: '10px',
              border: activeTab === 'SUBSCRIPTIONS' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
              background: activeTab === 'SUBSCRIPTIONS' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'SUBSCRIPTIONS' ? '#38bdf8' : '#94a3b8',
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            📋 سجل الاشتراكات النشطة
          </button>
        </div>
      </div>

      {activeTab === 'RECEIPTS' ? (
        <div>
          {receipts.length === 0 ? (
            <div className="sa-card" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>🎉</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
                لا توجد إيصالات معلقة حالياً
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                عندما يقوم أي معهد برفع إيصال تحويل بنكي ستجده يظهر هنا فوراً لمراجعته واعتماده.
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '1.5rem' }}>
              {receipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="sa-card"
                  style={{
                    border: receipt.status === 'PENDING' ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid rgba(255,255,255,0.08)',
                    background: 'rgba(15, 23, 42, 0.8)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <div>
                      <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1.05rem' }}>
                        {receipt.tenantName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
                        باقة: <span style={{ color: '#38bdf8', fontWeight: 700 }}>{receipt.plan}</span>
                      </div>
                    </div>
                    <span
                      className={`sa-badge ${
                        receipt.status === 'PENDING'
                          ? 'sa-badge-trial'
                          : receipt.status === 'APPROVED'
                          ? 'sa-badge-active'
                          : 'sa-badge-suspended'
                      }`}
                    >
                      {receipt.status === 'PENDING' ? 'بانتظار الاعتماد' : receipt.status === 'APPROVED' ? 'معتمد ✅' : 'مرفوض ❌'}
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      borderRadius: '10px',
                      padding: '1rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.5rem',
                      fontSize: '0.85rem',
                      marginBottom: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>المبلغ المحول:</span>
                      <span style={{ fontWeight: 800, color: '#10b981', fontSize: '1.05rem' }}>
                        ${receipt.amount} {receipt.currency}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>اسم المحول:</span>
                      <span style={{ color: '#f1f5f9', fontWeight: 600 }}>{receipt.senderName}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>البنك المرسل منه:</span>
                      <span style={{ color: '#f1f5f9' }}>{receipt.senderBank}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>رقم العملية (Ref):</span>
                      <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{receipt.referenceNumber}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => setSelectedReceipt(receipt)}
                      className="sa-btn-primary"
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      🔍 فحص الإيصال واعتماده
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Active subscriptions table */
        <div className="sa-card" style={{ padding: 0, overflow: 'hidden' }}>
          <table className="sa-table">
            <thead>
              <tr>
                <th>المعهد</th>
                <th>الباقة الحالية</th>
                <th>المبلغ الدوري</th>
                <th>طريقة الدفع</th>
                <th>تاريخ التجديد القادم</th>
                <th>الحالة</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#f8fafc' }}>{t.name}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t.adminEmail}</div>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#38bdf8' }}>{t.plan}</span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 700, color: '#10b981' }}>
                      {t.plan === 'BUSINESS' ? '$499' : t.plan === 'PRO' ? '$249' : t.plan === 'STARTER' ? '$99' : '$0'}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>/{t.billingCycle === 'ANNUAL' ? 'سنة' : 'شهر'}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#cbd5e1' }}>🏦 تحويل بنكي مباشر</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.85rem', color: '#94a3b8' }}>{t.renewDate}</span>
                  </td>
                  <td>
                    <span className={`sa-badge ${t.status === 'ACTIVE' ? 'sa-badge-active' : 'sa-badge-trial'}`}>
                      {t.status === 'ACTIVE' ? 'نشط' : 'تجريبي'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Review Modal */}
      {selectedReceipt && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
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
              maxWidth: '600px',
              background: '#0a1320',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#ffffff', margin: 0 }}>
                📑 تدقيق إشعار التحويل البنكي
              </h3>
              <button
                onClick={() => setSelectedReceipt(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', fontSize: '1.5rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '0.5rem' }}>صورة إيصال التحويل المرفقة:</div>
              <div
                style={{
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)',
                  maxHeight: '260px',
                  background: '#000',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <img
                  src={selectedReceipt.receiptUrl}
                  alt="Receipt"
                  style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                />
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.04)',
                padding: '1rem',
                borderRadius: '10px',
                fontSize: '0.88rem',
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '0.75rem',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <span style={{ color: '#94a3b8' }}>المعهد: </span>
                <span style={{ fontWeight: 700, color: '#f1f5f9' }}>{selectedReceipt.tenantName}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>الباقة المطلوبة: </span>
                <span style={{ fontWeight: 700, color: '#38bdf8' }}>{selectedReceipt.plan}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>المبلغ: </span>
                <span style={{ fontWeight: 800, color: '#10b981' }}>${selectedReceipt.amount}</span>
              </div>
              <div>
                <span style={{ color: '#94a3b8' }}>رقم الحوالة: </span>
                <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>{selectedReceipt.referenceNumber}</span>
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.4rem', fontWeight: 600 }}>
                ملاحظات التدقيق (تظهر للمعهد):
              </label>
              <input
                type="text"
                placeholder="مثال: تم التأكد من دخول المبلغ في الحساب البنكي بنجاح"
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
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

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button
                onClick={() => handleReview('REJECTED')}
                style={{
                  padding: '0.65rem 1.25rem',
                  borderRadius: '10px',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: '#f87171',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                ❌ رفض الحوالة
              </button>

              <button
                onClick={() => handleReview('APPROVED')}
                className="sa-btn-primary"
              >
                ✅ اعتماد الحوالة وتفعيل الباقة فوراً
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
