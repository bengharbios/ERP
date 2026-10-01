import React, { useEffect, useState } from 'react';
import {
  billingService,
  TenantSubscriptionInfo,
  SubscriptionPlanItem,
  TenantInvoiceItem,
} from '../services/billingService';
import { useAuthStore } from '../store/authStore';

export default function InstituteBilling() {
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [billingInfo, setBillingInfo] = useState<TenantSubscriptionInfo | null>(null);
  const [invoices, setInvoices] = useState<TenantInvoiceItem[]>([]);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY');
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlanItem | null>(null);
  const [activePaymentTab, setActivePaymentTab] = useState<'CARD' | 'BANK'>('CARD');

  // Bank receipt form state
  const [senderName, setSenderName] = useState('');
  const [senderBank, setSenderBank] = useState('');
  const [transferRef, setTransferRef] = useState('');
  const [receiptUrl, setReceiptUrl] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [submittingReceipt, setSubmittingReceipt] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [payingCard, setPayingCard] = useState(false);

  // Success / notification modal
  const [alertMsg, setAlertMsg] = useState<{ title: string; desc: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadBillingData();
  }, []);

  const loadBillingData = async () => {
    try {
      setLoading(true);
      const data = await billingService.getMySubscription();
      setBillingInfo(data);
      if (data.availablePlans && data.availablePlans.length > 0) {
        // default select Pro or current plan
        const def = data.availablePlans.find((p) => p.isPopular) || data.availablePlans[1] || data.availablePlans[0];
        setSelectedPlan(def);
      }
      try {
        const invs = await billingService.getInvoices();
        setInvoices(invs);
      } catch (e) {
        console.warn('Could not fetch invoices', e);
      }
    } catch (err: any) {
      console.error('Failed to load billing info:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBankReceiptSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!senderName) {
      setAlertMsg({ title: 'تنبيه', desc: 'يرجى إدخال اسم المحوّل', type: 'error' });
      return;
    }

    const amount = billingCycle === 'YEARLY' ? selectedPlan.priceYearly : selectedPlan.priceMonthly;

    try {
      setSubmittingReceipt(true);
      await billingService.submitBankReceipt({
        planId: selectedPlan.id,
        amount,
        currency: selectedPlan.currency || 'USD',
        senderName,
        senderBank: senderBank || 'تحويل بنكي',
        transferRef,
        receiptUrl: receiptUrl || 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?w=600&auto=format&fit=crop',
        notes: transferNotes,
      });

      setAlertMsg({
        title: '✅ تم استلام إشعار التحويل بنجاح!',
        desc: 'سيتم مراجعة الإيصال واعتماد الترقية فوراً من قبل الإدارة.',
        type: 'success',
      });
      setSenderName('');
      setTransferRef('');
      setReceiptUrl('');
      await loadBillingData();
    } catch (err: any) {
      setAlertMsg({ title: 'خطأ', desc: err.message || 'تعذر إرسال الإيصال', type: 'error' });
    } finally {
      setSubmittingReceipt(false);
    }
  };

  const handleCardPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (!cardNumber || !cardExpiry || !cardCvc) {
      setAlertMsg({ title: 'تنبيه', desc: 'يرجى ملء جميع بيانات البطاقة البنكية', type: 'error' });
      return;
    }

    try {
      setPayingCard(true);
      await billingService.payOnline({
        planId: selectedPlan.id,
        billingCycle,
        paymentMethod: 'STRIPE_CREDIT_CARD',
      });

      setAlertMsg({
        title: '🎉 تم تفعيل الاشتراك بنجاح!',
        desc: `تم سداد اشتراك باقة (${selectedPlan.nameAr}) وتمديد الخدمة فوراً.`,
        type: 'success',
      });
      await loadBillingData();
    } catch (err: any) {
      setAlertMsg({ title: 'فشل الدفع', desc: err.message || 'تعذر إتمام الدفع الإلكتروني', type: 'error' });
    } finally {
      setPayingCard(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`تم نسخ ${label} إلى الحافظة: ${text}`);
  };

  const printInvoice = (inv: TenantInvoiceItem) => {
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;
    printWindow.document.write(`
      <html dir="rtl" lang="ar">
        <head>
          <title>فاتورة اشتراك - ${inv.invoiceNumber}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
            .header { display: flex; justify-content: space-between; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; }
            .badge { background: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin-top: 30px; }
            th, td { border: 1px solid #cbd5e1; padding: 12px; text-align: right; }
            th { background: #f8fafc; }
            .total { font-size: 1.3rem; font-weight: bold; color: #1e3a8a; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <h2>منصة EduCloud SaaS ERP</h2>
              <p>فاتورة ضريبية رسمية لاشتراك معهد</p>
            </div>
            <div style="text-align: left;">
              <h3>${inv.invoiceNumber}</h3>
              <p>التاريخ: ${inv.date}</p>
              <span class="badge">مدفوعة بنجاح</span>
            </div>
          </div>
          <div style="margin-top: 20px;">
            <p><strong>المعهد المشترك:</strong> ${billingInfo?.tenant.name || 'معهد تدريب'}</p>
            <p><strong>طريقة السداد:</strong> ${inv.paymentMethod}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>الوصف والباقة</th>
                <th>الدورة</th>
                <th>المبلغ</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>اشتراك سحابي في نظام إدارة المعاهد - ${inv.planName}</td>
                <td>${inv.billingCycle}</td>
                <td>$${inv.amount} ${inv.currency}</td>
              </tr>
            </tbody>
          </table>
          <p class="total" style="text-align: left; margin-top: 20px;">الإجمالي المدفوع: $${inv.amount} ${inv.currency}</p>
          <div style="margin-top: 50px; text-align: center; color: #64748b; font-size: 0.9rem;">
            شكراً لثقتكم بنظامنا السحابي لإدارة المنشآت التعليمية والتدريبية.
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>💳</div>
          <p style={{ color: '#64748b', fontWeight: 600 }}>جاري تحميل بيانات الاشتراك والفوترة...</p>
        </div>
      </div>
    );
  }

  const tenant = billingInfo?.tenant;
  const currentPlan = billingInfo?.currentPlan;
  const plans = billingInfo?.availablePlans || [];
  const bank = billingInfo?.bankDetails;

  const isTrial = tenant?.subscriptionStatus === 'TRIAL';
  const isActive = tenant?.subscriptionStatus === 'ACTIVE';
  const isPending = tenant?.subscriptionStatus === 'PENDING_REVIEW';
  const isPaywalled = tenant?.isPaywalled || tenant?.subscriptionStatus === 'EXPIRED';

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '1.5rem', fontFamily: 'inherit' }}>
      {/* Alert Modal */}
      {alertMsg && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onClick={() => setAlertMsg(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: '2rem',
              maxWidth: '440px',
              width: '90%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {alertMsg.type === 'success' ? '✨' : '⚠️'}
            </div>
            <h3 style={{ margin: '0 0 0.5rem', color: '#0f172a', fontSize: '1.3rem' }}>{alertMsg.title}</h3>
            <p style={{ margin: '0 0 1.5rem', color: '#64748b', lineHeight: 1.6 }}>{alertMsg.desc}</p>
            <button
              onClick={() => setAlertMsg(null)}
              style={{
                background: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '0.75rem 2rem',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              حسناً، فهمت
            </button>
          </div>
        </div>
      )}

      {/* Top Banner / Status Alert */}
      {isPaywalled && (
        <div
          style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
            color: '#ffffff',
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 10px 15px -3px rgba(239, 68, 68, 0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ fontSize: '2rem' }}>🔒</span>
            <div>
              <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>
                انتهت فترة التجربة المجانية لهذا المعهد!
              </h4>
              <p style={{ margin: '0.25rem 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
                يرجى ترقية الباقة أو إتمام السداد للاستمرار في استخدام المنظومة الأكاديمية والمالية.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              const el = document.getElementById('payment-section');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              background: '#ffffff',
              color: '#b91c1c',
              border: 'none',
              padding: '0.6rem 1.4rem',
              borderRadius: '10px',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: 'inherit',
            }}
          >
            سداد الاشتراك الآن 💳
          </button>
        </div>
      )}

      {isPending && (
        <div
          style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            color: '#ffffff',
            padding: '1.25rem 1.5rem',
            borderRadius: '16px',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <span style={{ fontSize: '2rem' }}>⏳</span>
          <div>
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>
              إشعار التحويل البنكي قيد المراجعة والتدقيق
            </h4>
            <p style={{ margin: '0.25rem 0 0', opacity: 0.9, fontSize: '0.9rem' }}>
              تم استلام إيصال التحويل بنجاح، وسيقوم فريق العمل بتأكيد التفعيل خلال دقائق معدودة.
            </p>
          </div>
        </div>
      )}

      {/* Main Header Card */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          borderRadius: '20px',
          padding: '2rem',
          color: '#ffffff',
          marginBottom: '2rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
          boxShadow: '0 20px 25px -5px rgba(15, 23, 42, 0.25)',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '1.8rem' }}>🏢</span>
            <h1 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>{tenant?.name || user?.tenantName || 'المعهد'}</h1>
          </div>
          <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.95rem' }}>
            لوحة إدارة الاشتراكات السحابية، تجديد الباقات، وتحميل الفواتير الرسمية
          </p>
        </div>

        {/* Current Plan Badge Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            borderRadius: '16px',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>الباقة الحالية:</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>
              {currentPlan?.nameAr || 'الباقة المبتدئة'}
            </div>
          </div>

          <div style={{ height: '40px', width: '1px', background: 'rgba(255,255,255,0.15)' }} />

          <div>
            <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: '0.25rem' }}>الحالة:</div>
            <div>
              {isActive ? (
                <span style={{ background: '#10b981', color: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                  نشط ومفعّل ✓
                </span>
              ) : isTrial ? (
                <span style={{ background: '#3b82f6', color: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                  تجربة مجانية ({tenant?.daysRemaining || 14} يوم متبقي)
                </span>
              ) : isPending ? (
                <span style={{ background: '#f59e0b', color: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                  قيد المراجعة ⏳
                </span>
              ) : (
                <span style={{ background: '#ef4444', color: '#ffffff', padding: '0.25rem 0.75rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700 }}>
                  منتهي الصلاحية ✕
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Plan Selector & Pricing Cards */}
      <div style={{ marginBottom: '3rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.6rem', color: '#0f172a', fontWeight: 800, margin: '0 0 0.5rem' }}>
            اختر الباقة المناسبة لاحتياجات معهدك
          </h2>
          <p style={{ color: '#64748b', margin: '0 0 1.5rem' }}>
            أسعار شفافة وباقات مرنة تلائم كافة أحجام المراكز والمعاهد
          </p>

          {/* Monthly / Yearly Switcher */}
          <div
            style={{
              display: 'inline-flex',
              background: '#e2e8f0',
              padding: '0.35rem',
              borderRadius: '12px',
              gap: '0.25rem',
            }}
          >
            <button
              type="button"
              onClick={() => setBillingCycle('MONTHLY')}
              style={{
                background: billingCycle === 'MONTHLY' ? '#ffffff' : 'transparent',
                color: billingCycle === 'MONTHLY' ? '#0f172a' : '#64748b',
                border: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: billingCycle === 'MONTHLY' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              فوترة شهرية
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('YEARLY')}
              style={{
                background: billingCycle === 'YEARLY' ? '#ffffff' : 'transparent',
                color: billingCycle === 'YEARLY' ? '#0f172a' : '#64748b',
                border: 'none',
                padding: '0.5rem 1.25rem',
                borderRadius: '8px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxShadow: billingCycle === 'YEARLY' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <span>فوترة سنوية</span>
              <span style={{ background: '#10b981', color: '#ffffff', fontSize: '0.7rem', padding: '0.15rem 0.5rem', borderRadius: '10px' }}>
                خصم شهرين مجاناً 🎁
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {plans.map((p) => {
            const isSelected = selectedPlan?.id === p.id;
            const price = billingCycle === 'YEARLY' ? p.priceYearly : p.priceMonthly;
            const period = billingCycle === 'YEARLY' ? 'سنوياً' : 'شهرياً';

            return (
              <div
                key={p.id}
                onClick={() => setSelectedPlan(p)}
                style={{
                  background: isSelected ? '#ffffff' : '#ffffff',
                  border: isSelected ? '2px solid #2563eb' : '1px solid #e2e8f0',
                  borderRadius: '20px',
                  padding: '2rem',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? '0 20px 25px -5px rgba(37, 99, 235, 0.15)' : '0 4px 6px -1px rgba(0,0,0,0.04)',
                }}
              >
                {p.isPopular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-12px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      padding: '0.25rem 1rem',
                      borderRadius: '20px',
                      boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                    }}
                  >
                    ⭐ الأكثر طلباً للمعاهد
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>{p.nameAr}</h3>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: isSelected ? '7px solid #2563eb' : '2px solid #cbd5e1',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <p style={{ color: '#64748b', fontSize: '0.85rem', minHeight: '38px', margin: '0 0 1.25rem' }}>
                  {p.descriptionAr || p.description}
                </p>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '2.5rem', fontWeight: 900, color: '#0f172a' }}>${price}</span>
                  <span style={{ color: '#64748b', fontSize: '0.9rem', fontWeight: 600 }}>/ {period}</span>
                </div>

                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.75rem' }}>
                    الميزات المتضمنة:
                  </div>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {(Array.isArray(p.features) ? p.features : []).map((feat, idx) => (
                      <li
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#475569',
                          fontSize: '0.85rem',
                          marginBottom: '0.5rem',
                        }}
                      >
                        <span style={{ color: '#10b981', fontWeight: 900 }}>✓</span>
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Payment Processing Center */}
      <div
        id="payment-section"
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          padding: '2.5rem',
          marginBottom: '3rem',
          boxShadow: '0 10px 15px -3px rgba(0,0,0,0.05)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
              بوابة إتمام السداد والترقية
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
              الباقة المختارة:{' '}
              <strong style={{ color: '#2563eb' }}>{selectedPlan?.nameAr}</strong> - القيمة:{' '}
              <strong style={{ color: '#0f172a' }}>
                ${billingCycle === 'YEARLY' ? selectedPlan?.priceYearly : selectedPlan?.priceMonthly}{' '}
                {selectedPlan?.currency || 'USD'} ({billingCycle === 'YEARLY' ? 'سنوي' : 'شهري'})
              </strong>
            </p>
          </div>

          {/* Payment Method Switch Tabs */}
          <div style={{ display: 'flex', background: '#f1f5f9', padding: '0.25rem', borderRadius: '12px', gap: '0.25rem' }}>
            <button
              onClick={() => setActivePaymentTab('CARD')}
              style={{
                background: activePaymentTab === 'CARD' ? '#ffffff' : 'transparent',
                color: activePaymentTab === 'CARD' ? '#2563eb' : '#64748b',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: activePaymentTab === 'CARD' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <span>💳</span>
              <span>بطاقة بنكية (Stripe / Mada)</span>
            </button>

            <button
              onClick={() => setActivePaymentTab('BANK')}
              style={{
                background: activePaymentTab === 'BANK' ? '#ffffff' : 'transparent',
                color: activePaymentTab === 'BANK' ? '#2563eb' : '#64748b',
                border: 'none',
                padding: '0.6rem 1.2rem',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'inherit',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                boxShadow: activePaymentTab === 'BANK' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
              }}
            >
              <span>🏦</span>
              <span>تحويل بنكي رسمي</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Instant Card Checkout */}
        {activePaymentTab === 'CARD' && (
          <form onSubmit={handleCardPayment} style={{ maxWidth: '600px' }}>
            <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  اسم حامل البطاقة (كما هو مدون عليها)
                </label>
                <input
                  type="text"
                  placeholder="محمد أحمد المنصوري"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  رقم البطاقة (مدى / فيزا / ماستركارد)
                </label>
                <input
                  type="text"
                  placeholder="4000 1234 5678 9010"
                  maxLength={19}
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '1px solid #cbd5e1',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                    direction: 'ltr',
                    textAlign: 'right',
                  }}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    تاريخ الانتهاء (MM/YY)
                  </label>
                  <input
                    type="text"
                    placeholder="12/28"
                    maxLength={5}
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      direction: 'ltr',
                      textAlign: 'center',
                    }}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    رمز الأمان (CVC)
                  </label>
                  <input
                    type="password"
                    placeholder="•••"
                    maxLength={4}
                    value={cardCvc}
                    onChange={(e) => setCardCvc(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      direction: 'ltr',
                      textAlign: 'center',
                    }}
                    required
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <button
                type="submit"
                disabled={payingCard}
                style={{
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.85rem 2rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: payingCard ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 6px -1px rgba(37, 99, 235, 0.3)',
                }}
              >
                {payingCard ? 'جاري معالجة العملية بأمان...' : `تأكيد الدفع الفوري ($${billingCycle === 'YEARLY' ? selectedPlan?.priceYearly : selectedPlan?.priceMonthly})`}
              </button>
              <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
                🔒 دفع مشفر وآمن بمعيار 256-bit SSL
              </span>
            </div>
          </form>
        )}

        {/* Tab 2: Bank Transfer & Receipt Upload */}
        {activePaymentTab === 'BANK' && (
          <div>
            {/* Official Bank Account Information */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '2rem',
              }}
            >
              <h4 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                🏦 بيانات الحساب البنكي الرسمي للمنصة:
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>اسم البنك:</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{bank?.bankName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>اسم المستفيد:</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{bank?.accountHolderName}</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>رقم الآيبان (IBAN):</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#2563eb' }}>
                    <span>{bank?.iban}</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(bank?.iban || '', 'رقم الآيبان')}
                      style={{ background: '#e0e7ff', color: '#3730a3', border: 'none', padding: '0.2rem 0.5rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.75rem' }}
                    >
                      نسخ
                    </button>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b' }}>رمز السويفت (SWIFT):</div>
                  <div style={{ fontWeight: 700, color: '#0f172a' }}>{bank?.swift}</div>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b', background: '#eff6ff', padding: '0.75rem', borderRadius: '8px' }}>
                💡 <strong>تعليمات التحويل:</strong> {bank?.instructions}
              </p>
            </div>

            {/* Upload Receipt Form */}
            <form onSubmit={handleBankReceiptSubmit} style={{ maxWidth: '600px' }}>
              <h4 style={{ margin: '0 0 1rem', fontSize: '1.1rem', fontWeight: 800, color: '#0f172a' }}>
                📤 رفع إشعار عملية التحويل:
              </h4>

              <div style={{ display: 'grid', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    اسم صاحب الحساب المحوّل منه *
                  </label>
                  <input
                    type="text"
                    placeholder="معهد السلام للتدريب / د. أحمد"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      اسم البنك المحوّل منه
                    </label>
                    <input
                      type="text"
                      placeholder="مصرف الراجحي / البنك الأهلي"
                      value={senderBank}
                      onChange={(e) => setSenderBank(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      الرقم المرجعي للحوالة
                    </label>
                    <input
                      type="text"
                      placeholder="TXN-98471203"
                      value={transferRef}
                      onChange={(e) => setTransferRef(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: '10px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.95rem',
                        boxSizing: 'border-box',
                        fontFamily: 'inherit',
                        direction: 'ltr',
                        textAlign: 'right',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    رابط أو صورة إيصال التحويل (URL أو سكرين شوت)
                  </label>
                  <input
                    type="text"
                    placeholder="https://... أو إرفاق رابط الصورة"
                    value={receiptUrl}
                    onChange={(e) => setReceiptUrl(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                      direction: 'ltr',
                      textAlign: 'left',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                    ملاحظات إضافية
                  </label>
                  <textarea
                    rows={2}
                    placeholder="أي توضيحات بخصوص التحويل أو اسم المعهد..."
                    value={transferNotes}
                    onChange={(e) => setTransferNotes(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingReceipt}
                style={{
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.85rem 2rem',
                  borderRadius: '12px',
                  fontWeight: 800,
                  fontSize: '1rem',
                  cursor: submittingReceipt ? 'wait' : 'pointer',
                  fontFamily: 'inherit',
                  boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.3)',
                }}
              >
                {submittingReceipt ? 'جاري إرسال الإشعار...' : 'إرسال إشعار التحويل للاعتماد'}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Invoices History Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          padding: '2rem',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <div>
            <h3 style={{ margin: '0 0 0.25rem', fontSize: '1.3rem', fontWeight: 800, color: '#0f172a' }}>
              سجل الفواتير والعمليات السابقة
            </h3>
            <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
              كافة الفواتير الإلكترونية المعتمدة لاشتراكات هذا المعهد
            </p>
          </div>
        </div>

        {invoices.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#94a3b8' }}>
            <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📑</div>
            <p style={{ margin: 0, fontWeight: 600 }}>لا توجد فواتير سابقة حتى الآن لهذا المعهد.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.85rem' }}>رقم الفاتورة</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.85rem' }}>الباقة</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.85rem' }}>الدورة</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.85rem' }}>القيمة</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.85rem' }}>التاريخ</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.85rem' }}>طريقة الدفع</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.85rem' }}>الحالة</th>
                  <th style={{ padding: '0.85rem 1rem', color: '#475569', fontSize: '0.85rem' }}>الإجراء</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv, idx) => (
                  <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem', fontWeight: 700, color: '#2563eb' }}>{inv.invoiceNumber}</td>
                    <td style={{ padding: '1rem', color: '#0f172a', fontWeight: 600 }}>{inv.planName}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{inv.billingCycle}</td>
                    <td style={{ padding: '1rem', fontWeight: 800, color: '#0f172a' }}>
                      ${inv.amount} {inv.currency}
                    </td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{inv.date}</td>
                    <td style={{ padding: '1rem', color: '#64748b' }}>{inv.paymentMethod}</td>
                    <td style={{ padding: '1rem' }}>
                      <span
                        style={{
                          background: '#dcfce7',
                          color: '#15803d',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        معتمدة ✓
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        onClick={() => printInvoice(inv)}
                        style={{
                          background: '#f1f5f9',
                          border: 'none',
                          padding: '0.4rem 0.8rem',
                          borderRadius: '8px',
                          color: '#334155',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                        }}
                      >
                        <span>🖨️</span>
                        <span>طباعة</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
