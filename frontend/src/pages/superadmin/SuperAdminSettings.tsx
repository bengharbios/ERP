import React, { useEffect, useState } from 'react';
import { superAdminService, PlatformSettingsData } from '../../services/superAdminService';

export default function SuperAdminSettings() {
  const [settings, setSettings] = useState<PlatformSettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState<'PAYMENT' | 'PROFILE' | 'PLATFORM'>('PAYMENT');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await superAdminService.getSettings();
      setSettings(res);
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    try {
      setSaving(true);
      await superAdminService.updateSettings(settings);
      alert('✅ تم حفظ كافة التعديلات بنجاح! سيتم تطبيق طرق الدفع والإعدادات على المعاهد فوراً.');
    } catch (err) {
      alert('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return <div style={{ textAlign: 'center', padding: '5rem 0', color: '#94a3b8' }}>جاري تحميل الإعدادات...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="sa-page-header">
        <div className="sa-page-title-wrap">
          <h1>
            <span>طرق الدفع وإعدادات السوبر أدمن</span>
            <span style={{ fontSize: '1.2rem' }}>⚙️</span>
          </h1>
          <p className="sa-page-subtitle">
            التحكم في طرق الدفع المعروضة للمعاهد (تحويل بنكي / أونلاين)، بيانات الحسابات، وهوية المنصة
          </p>
        </div>

        <button onClick={handleSave} disabled={saving} className="sa-btn-primary">
          <span>💾</span>
          <span>{saving ? 'جاري الحفظ...' : 'حفظ الإعدادات وتطبيقها'}</span>
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setActiveSubTab('PAYMENT')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: activeSubTab === 'PAYMENT' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
            background: activeSubTab === 'PAYMENT' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
            color: activeSubTab === 'PAYMENT' ? '#38bdf8' : '#94a3b8',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          🏦 إعدادات طرق الدفع والتحويل البنكي
        </button>

        <button
          onClick={() => setActiveSubTab('PROFILE')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: activeSubTab === 'PROFILE' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
            background: activeSubTab === 'PROFILE' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
            color: activeSubTab === 'PROFILE' ? '#38bdf8' : '#94a3b8',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          👤 بيانات حساب السوبر أدمن والأمان
        </button>

        <button
          onClick={() => setActiveSubTab('PLATFORM')}
          style={{
            padding: '0.65rem 1.25rem',
            borderRadius: '10px',
            border: activeSubTab === 'PLATFORM' ? '1px solid #38bdf8' : '1px solid rgba(255,255,255,0.08)',
            background: activeSubTab === 'PLATFORM' ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.04)',
            color: activeSubTab === 'PLATFORM' ? '#38bdf8' : '#94a3b8',
            fontWeight: 700,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          🌐 هوية المنصة العامة (Branding)
        </button>
      </div>

      {/* Payment Tab */}
      {activeSubTab === 'PAYMENT' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Section 1: Offline Bank Transfer */}
          <div className="sa-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>🏦</span>
                  <span>التحويل البنكي المباشر مع رفع الإيصال (Offline Bank Transfer)</span>
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>
                  آمن 100% — المعهد يرى بيانات حسابك البنكي، يحول المبلغ ويرفع الإيصال لتقوم أنت بمراجعته واعتماده.
                </p>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.payment.enableBankTransfer}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, enableBankTransfer: e.target.checked },
                    })
                  }
                  style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
                />
                <span style={{ fontWeight: 700, color: settings.payment.enableBankTransfer ? '#34d399' : '#94a3b8', fontSize: '0.9rem' }}>
                  {settings.payment.enableBankTransfer ? 'مفعّل ويظهر للمعاهد' : 'معطّل'}
                </span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                  اسم البنك:
                </label>
                <input
                  type="text"
                  value={settings.payment.bankName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, bankName: e.target.value },
                    })
                  }
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
                  اسم المستفيد (صاحب الحساب):
                </label>
                <input
                  type="text"
                  value={settings.payment.accountHolderName}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, accountHolderName: e.target.value },
                    })
                  }
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
                  رقم الآيبان (IBAN):
                </label>
                <input
                  type="text"
                  value={settings.payment.iban}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, iban: e.target.value },
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#38bdf8',
                    fontFamily: 'monospace',
                    fontWeight: 700,
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                  رقم الحساب المحلي:
                </label>
                <input
                  type="text"
                  value={settings.payment.accountNumber}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, accountNumber: e.target.value },
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    fontFamily: 'monospace',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                تعليمات التحويل المعروضة للمعهد عند السداد:
              </label>
              <textarea
                rows={2}
                value={settings.payment.transferInstructions}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    payment: { ...settings.payment, transferInstructions: e.target.value },
                  })
                }
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  color: '#ffffff',
                  fontFamily: 'inherit',
                  resize: 'vertical',
                }}
              />
            </div>
          </div>

          {/* Section 2: Online Payment Gateway */}
          <div className="sa-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>💳</span>
                  <span>الدفع الإلكتروني الأونلاين الآمن جداً (Stripe / معايير عالمية PCI-DSS)</span>
                </h3>
                <p style={{ fontSize: '0.82rem', color: '#94a3b8', margin: '0.25rem 0 0' }}>
                  تفعيل الدفع بالبطاقات البنكية دون تخزين أي بيانات حساسة على السيرفر، مع دعم 3D Secure.
                </p>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={settings.payment.enableOnlinePayment}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, enableOnlinePayment: e.target.checked },
                    })
                  }
                  style={{ width: '18px', height: '18px', accentColor: '#06b6d4' }}
                />
                <span style={{ fontWeight: 700, color: settings.payment.enableOnlinePayment ? '#38bdf8' : '#94a3b8', fontSize: '0.9rem' }}>
                  {settings.payment.enableOnlinePayment ? 'مفعّل أونلاين' : 'معطّل (التحويل البنكي فقط)'}
                </span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                  بوابة الدفع العالمية المعتمدة:
                </label>
                <select
                  value={settings.payment.onlineProvider}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, onlineProvider: e.target.value as any },
                    })
                  }
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
                  <option value="STRIPE">Stripe (عالمي - فيزا، ماستركارد، Apple Pay)</option>
                  <option value="MOYASAR">Moyasar (السعودية والخليج - مدى، فيزا، Apple Pay)</option>
                  <option value="TAP">Tap Payments (الشرق الأوسط)</option>
                  <option value="MYFATOORAH">MyFatoorah</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                  وضع البوابة:
                </label>
                <select
                  value={settings.payment.isTestMode ? 'TEST' : 'LIVE'}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      payment: { ...settings.payment, isTestMode: e.target.value === 'TEST' },
                    })
                  }
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '8px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: settings.payment.isTestMode ? '#fbbf24' : '#34d399',
                    fontFamily: 'inherit',
                    fontWeight: 700,
                  }}
                >
                  <option value="TEST">وضع الاختبار (Test Sandbox - آمن وبدون أموال حقيقية)</option>
                  <option value="LIVE">وضع الإنتاج الحي (Live Mode)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Tab */}
      {activeSubTab === 'PROFILE' && (
        <div className="sa-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem' }}>
            👤 بيانات حساب السوبر أدمن وتأمين الدخول
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                اسم السوبر أدمن الكامل:
              </label>
              <input
                type="text"
                value={settings.profile.fullName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, fullName: e.target.value },
                  })
                }
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
                البريد الإلكتروني الرئيسي:
              </label>
              <input
                type="email"
                value={settings.profile.email}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, email: e.target.value },
                  })
                }
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
                رقم هاتف الطوارئ / الدعم:
              </label>
              <input
                type="text"
                value={settings.profile.phone || ''}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, phone: e.target.value },
                  })
                }
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

          {/* 2FA Card */}
          <div
            style={{
              background: 'rgba(14, 165, 233, 0.08)',
              border: '1px solid rgba(14, 165, 233, 0.25)',
              borderRadius: '12px',
              padding: '1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, color: '#ffffff', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span>🔒</span>
                <span>المصادقة الثنائية (Two-Factor Authentication - 2FA)</span>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#94a3b8', marginTop: '0.25rem' }}>
                تأمين حسابك عبر رمز تحقق فوري من تطبيق Google Authenticator لمنع أي وصول غير مصرح به.
              </div>
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings.profile.twoFactorEnabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    profile: { ...settings.profile, twoFactorEnabled: e.target.checked },
                  })
                }
                style={{ width: '18px', height: '18px', accentColor: '#06b6d4' }}
              />
              <span style={{ fontWeight: 700, color: settings.profile.twoFactorEnabled ? '#38bdf8' : '#94a3b8' }}>
                {settings.profile.twoFactorEnabled ? 'مفعّلة 🛡️' : 'معطّلة'}
              </span>
            </label>
          </div>
        </div>
      )}

      {/* Platform Branding Tab */}
      {activeSubTab === 'PLATFORM' && (
        <div className="sa-card">
          <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#ffffff', marginBottom: '1.25rem' }}>
            🌐 هوية المنصة العامة (Branding & Global Info)
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', color: '#cbd5e1', marginBottom: '0.35rem', fontWeight: 600 }}>
                اسم المنصة العام:
              </label>
              <input
                type="text"
                value={settings.platform.platformName}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platform: { ...settings.platform, platformName: e.target.value },
                  })
                }
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
                بريد الدعم الفني العام:
              </label>
              <input
                type="email"
                value={settings.platform.supportEmail}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platform: { ...settings.platform, supportEmail: e.target.value },
                  })
                }
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
                هاتف الدعم الفني:
              </label>
              <input
                type="text"
                value={settings.platform.supportPhone}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platform: { ...settings.platform, supportPhone: e.target.value },
                  })
                }
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
                العملة الافتراضية للفواتير:
              </label>
              <select
                value={settings.platform.defaultCurrency}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    platform: { ...settings.platform, defaultCurrency: e.target.value },
                  })
                }
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
                <option value="USD">الدولار الأمريكي ($ USD)</option>
                <option value="SAR">الريال السعودي (SAR)</option>
                <option value="AED">الدرهم الإماراتي (AED)</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
