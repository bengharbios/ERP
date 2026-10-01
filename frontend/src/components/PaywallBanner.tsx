import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

export default function PaywallBanner() {
  const { isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [subStatus, setSubStatus] = useState<{
    isPaywalled: boolean;
    isTrial: boolean;
    daysRemaining: number;
    planName: string;
  } | null>(null);

  useEffect(() => {
    // Only check if logged in and not on super-admin routes or billing route
    if (!isAuthenticated || location.pathname.startsWith('/super-admin') || location.pathname === '/welcome' || location.pathname === '/pricing') {
      return;
    }

    // If primary institute (Alsalam), never paywall
    if (user?.tenantId === 'tenant_primary_001') {
      return;
    }

    api.get('/tenants/my-subscription')
      .then((res) => {
        const data = res.data?.data;
        if (data?.tenant) {
          setSubStatus({
            isPaywalled: data.tenant.isPaywalled || data.tenant.isExpired,
            isTrial: data.tenant.subscriptionStatus === 'TRIAL',
            daysRemaining: data.tenant.daysRemaining,
            planName: data.currentPlan?.nameAr || 'الباقة المجانية',
          });
        }
      })
      .catch((err) => {
        // Silently catch
        console.warn('Could not check subscription status:', err);
      });
  }, [isAuthenticated, location.pathname, user?.tenantId]);

  if (!subStatus) return null;

  // Don't show if already on billing page
  if (location.pathname === '/institute/billing' || location.pathname === '/billing') {
    return null;
  }

  // 1. Paywalled / Expired Banner
  if (subStatus.isPaywalled) {
    return (
      <div
        style={{
          background: 'linear-gradient(90deg, #b91c1c, #ef4444)',
          color: '#ffffff',
          padding: '0.65rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.9rem',
          fontWeight: 700,
          position: 'sticky',
          top: 0,
          zIndex: 9998,
          boxShadow: '0 4px 6px -1px rgba(185, 28, 28, 0.3)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
          <span>
            تنبيه: انتهت فترة التجربة المجانية لهذا المعهد. يرجى سداد الاشتراك لتجنب إيقاف الوصول للنظام.
          </span>
        </div>
        <button
          onClick={() => navigate('/institute/billing')}
          style={{
            background: '#ffffff',
            color: '#b91c1c',
            border: 'none',
            padding: '0.35rem 1rem',
            borderRadius: '8px',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.85rem',
          }}
        >
          ترقية وتفعيل الحساب 💳
        </button>
      </div>
    );
  }

  // 2. Trial Notice (If <= 7 days left)
  if (subStatus.isTrial && subStatus.daysRemaining <= 7) {
    return (
      <div
        style={{
          background: 'linear-gradient(90deg, #d97706, #f59e0b)',
          color: '#ffffff',
          padding: '0.5rem 1.25rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.85rem',
          fontWeight: 700,
          position: 'sticky',
          top: 0,
          zIndex: 9998,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <span>⏳</span>
          <span>
            أنت تستخدم النسخة التجريبية المجانية. متبقي <strong>{subStatus.daysRemaining} أيام</strong> فقط.
          </span>
        </div>
        <button
          onClick={() => navigate('/institute/billing')}
          style={{
            background: '#ffffff',
            color: '#d97706',
            border: 'none',
            padding: '0.3rem 0.85rem',
            borderRadius: '6px',
            fontWeight: 800,
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: '0.8rem',
          }}
        >
          اختر باقتك الآن
        </button>
      </div>
    );
  }

  return null;
}
