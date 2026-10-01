import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  Building2,
  CreditCard,
  Layers,
  Settings,
  Sun,
  Moon,
  Bell,
  ChevronDown,
  ChevronLeft,
  ArrowRightLeft,
  Menu,
  X,
  LogOut,
  School,
  ExternalLink,
} from 'lucide-react';
import { useSettingsStore } from '../../store/settingsStore';
import { useAuthStore } from '../../store/authStore';
import '../Rapidos2026/RapidosLayout.css';
import '../Rapidos2026/HorizonPages.css';
import './SuperAdminLayout.css';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

const SUPER_ADMIN_LINKS = [
  {
    path: '/super-admin/overview',
    label: 'نظرة عامة',
    icon: LayoutDashboard,
    color: 'var(--hz-cyan)', // Cyan
  },
  {
    path: '/super-admin/tenants',
    label: 'إدارة المعاهد',
    icon: Building2,
    color: 'var(--hz-neon)', // Neon
  },
  {
    path: '/super-admin/subscriptions',
    label: 'الاشتراكات والإيصالات',
    icon: CreditCard,
    color: 'var(--hz-gold)', // Gold
  },
  {
    path: '/super-admin/plans',
    label: 'باقات الأسعار',
    icon: Layers,
    color: 'var(--hz-plasma)', // Purple
  },
  {
    path: '/super-admin/settings',
    label: 'طرق الدفع والإعدادات',
    icon: Settings,
    color: 'var(--hz-coral)', // Coral
  },
];

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useSettingsStore();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close menus on navigation
  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [pathname]);

  // Ensure data-theme attribute is strictly synchronized on documentElement and container
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
    }
  }, [theme]);

  const activeItem = SUPER_ADMIN_LINKS.find(
    (item) => pathname === item.path || pathname.startsWith(item.path + '/')
  );

  return (
    <div className="hz-root sa-root" data-theme={theme}>
      <div className="hz-app">
        {/* Topbar matching Rapidos Horizon style */}
        <header className="hz-topbar">
          <button
            className="hz-hamburger"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="القائمة"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* SaaS Super Admin Brand Logo */}
          <div className="hz-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/super-admin/overview')}>
            <div
              className="hz-logo-mark"
              style={{
                background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
                boxShadow: '0 0 20px rgba(139, 92, 246, 0.45)',
              }}
            >
              <Shield size={19} color="#fff" strokeWidth={2.2} />
            </div>
            <div className="hz-logo-text">
              <span className="hz-logo-name">EduCloud SaaS</span>
              <span className="hz-logo-badge" style={{ color: '#A78BFA' }}>
                SUPER ADMIN
              </span>
            </div>
          </div>

          <div className="hz-topbar-divider" />

          {/* Navigation Links with Rapidos styles */}
          <nav className="hz-topnav">
            {SUPER_ADMIN_LINKS.map((item) => {
              const isActive =
                pathname === item.path || pathname.startsWith(item.path + '/');
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`hz-navlink ${isActive ? 'active' : ''}`}
                  style={{
                    '--hz-drop-color': item.color,
                    textDecoration: 'none',
                  } as any}
                >
                  <span className="hz-nav-icon">
                    <item.icon size={16} strokeWidth={2} />
                  </span>
                  <span className="hz-nav-label">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>

          {/* Topbar Right Controls */}
          <div className="hz-topbar-right">
            {/* Direct Switch to Institute Dashboard */}
            <button
              onClick={() => navigate('/dashboard')}
              title="دخول لوحة تحكم المعهد"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 14px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.35)',
                color: '#38BDF8',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.22)';
                e.currentTarget.style.borderColor = '#38BDF8';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(56, 189, 248, 0.12)';
                e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.35)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <School size={15} />
              <span>لوحة المعهد</span>
              <ArrowRightLeft size={13} style={{ opacity: 0.8 }} />
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              className="hz-icon-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}
            >
              {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
            </button>

            {/* Notifications Button */}
            <button className="hz-icon-btn" title="الإشعارات السحابية">
              <Bell size={18} strokeWidth={2} />
              <span className="hz-notif-dot" />
            </button>

            {/* User Profile Chip and Dropdown */}
            <div className="hz-user-chip-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
              <div
                className="hz-user-chip"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <div
                  className="hz-user-avatar"
                  style={{
                    background: 'linear-gradient(135deg, #8B5CF6 0%, #3B82F6 100%)',
                  }}
                >
                  👑
                </div>
                <span className="hz-user-name">
                  {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Super Admin'}
                </span>
                <ChevronDown
                  size={14}
                  style={{
                    opacity: 0.6,
                    transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)',
                    transition: 'transform 0.2s',
                  }}
                />
              </div>

              {dropdownOpen && (
                <div
                  className="hz-user-dropdown-panel"
                  style={{
                    position: 'absolute',
                    top: '120%',
                    left: 0,
                    width: '240px',
                    background: '#111827',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '12px',
                    padding: '8px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                    zIndex: 9999,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  <div
                    style={{
                      padding: '8px 12px',
                      borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                      marginBottom: '4px',
                    }}
                  >
                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FFFFFF', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'Super Admin'}</span>
                      <span style={{ fontSize: '0.7rem', background: 'rgba(139, 92, 246, 0.2)', color: '#A78BFA', padding: '1px 6px', borderRadius: '4px' }}>مدير المنصة</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '3px' }}>
                      {user?.email || 'admin@educloud.io'}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/dashboard');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      color: '#38BDF8',
                      background: 'rgba(56, 189, 248, 0.08)',
                      border: '1px solid rgba(56, 189, 248, 0.2)',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      borderRadius: '8px',
                      cursor: 'pointer',
                      width: '100%',
                      textAlign: 'right',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.18)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)')}
                  >
                    <School size={15} />
                    <span>الذهاب إلى لوحة المعهد</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      color: '#EF4444',
                      background: 'none',
                      border: 'none',
                      width: '100%',
                      textAlign: 'right',
                      fontSize: '0.85rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                  >
                    <LogOut size={15} />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Subnav Breadcrumb */}
        <div className="hz-subnav">
          <div className="hz-breadcrumb">
            <span className="hz-breadcrumb-item">
              <Shield size={13} style={{ display: 'inline', marginLeft: '4px', color: '#A78BFA' }} />
              <span>الإدارة السحابية المركزية</span>
            </span>
            {activeItem && (
              <>
                <ChevronLeft size={12} className="hz-breadcrumb-sep" />
                <span
                  className="hz-breadcrumb-item active"
                  style={{ color: activeItem.color }}
                >
                  {activeItem.label}
                </span>
              </>
            )}
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileOpen && (
          <div className="hz-mobile-drawer">
            <div className="hz-mobile-drawer-inner">
              <div className="hz-drawer-section">
                <div className="hz-drawer-section-title" style={{ color: '#A78BFA' }}>
                  <Shield size={14} />
                  <span>أقسام إدارة المنصة</span>
                </div>
                {SUPER_ADMIN_LINKS.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) => `hz-drawer-item ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    <item.icon size={16} strokeWidth={1.8} />
                    <span>{item.label}</span>
                  </NavLink>
                ))}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    navigate('/dashboard');
                  }}
                  className="hz-drawer-item"
                  style={{ color: '#38BDF8', marginTop: '10px' }}
                >
                  <School size={16} />
                  <span>دخول لوحة المعهد</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="hz-main sa-main">
          {children}
        </main>

        {/* Footer */}
        <footer className="hz-footer sa-footer">
          <div className="hz-footer-brand">
            <div className="hz-footer-logo">🛡️</div>
            <span className="hz-footer-text">
              نظام إدارة المنصة السحابية — Super Admin Console (Ver 2.6 Enterprise)
            </span>
          </div>
          <div className="hz-footer-status">
            <span className="hz-footer-status-dot" />
            <span>حماية البيانات نشطة | مشفر وفق معايير PCI-DSS</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default SuperAdminLayout;
