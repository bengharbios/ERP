import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import '../Rapidos2026/RapidosLayout.css';
import '../Rapidos2026/HorizonPages.css';
import './SuperAdminLayout.css';

interface SuperAdminLayoutProps {
  children: React.ReactNode;
}

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const navigate = useNavigate();

  return (
    <div className="hz-root sa-root">
      <div className="hz-app">
        {/* Super Admin Topbar */}
        <header className="sa-topbar">
          <div className="sa-topbar-brand">
            <div className="sa-logo-badge">👑</div>
            <div className="sa-brand-titles">
              <span className="sa-brand-main">EduCloud SaaS</span>
              <span className="sa-brand-badge">Super Admin Console</span>
            </div>
          </div>

          <nav className="sa-nav-links">
            <NavLink
              to="/super-admin/overview"
              className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="sa-nav-icon">📊</span>
              <span>نظرة عامة</span>
            </NavLink>
            <NavLink
              to="/super-admin/tenants"
              className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="sa-nav-icon">🏫</span>
              <span>إدارة المعاهد</span>
            </NavLink>
            <NavLink
              to="/super-admin/subscriptions"
              className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="sa-nav-icon">💳</span>
              <span>الاشتراكات والإيصالات</span>
            </NavLink>
            <NavLink
              to="/super-admin/plans"
              className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="sa-nav-icon">📦</span>
              <span>باقات الأسعار</span>
            </NavLink>
            <NavLink
              to="/super-admin/settings"
              className={({ isActive }) => `sa-nav-item ${isActive ? 'active' : ''}`}
            >
              <span className="sa-nav-icon">⚙️</span>
              <span>طرق الدفع والإعدادات</span>
            </NavLink>
          </nav>

          <div className="sa-topbar-actions">
            <button
              onClick={() => navigate('/dashboard')}
              className="sa-btn-switch-institute"
              title="العودة إلى لوحة المعهد"
            >
              <span className="sa-switch-icon">🔄</span>
              <span>دخول لوحة المعهد</span>
            </button>
            <div className="sa-admin-pill">
              <span className="sa-online-dot" />
              <span>Super Admin</span>
            </div>
          </div>
        </header>

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
