import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const API_BASE = '/api/v1';

interface InstituteUser {
  id: string;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: string;
  tenantId?: string;
  tenant?: { id: string; name: string; slug: string };
}

export default function InstituteDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<InstituteUser | null>(null);
  const [stats, setStats] = useState({ students: 0, users: 0, classes: 0, employees: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('institute_user');
    const token = localStorage.getItem('institute_token');
    if (!stored || !token) {
      navigate('/institute/login');
      return;
    }
    const u: InstituteUser = JSON.parse(stored);
    setUser(u);
    loadStats(token);
  }, []);

  const loadStats = async (token: string) => {
    try {
      // Fetch real stats from API using institute token
      const headers = { 'Authorization': `Bearer ${token}` };
      const [studRes, usrRes] = await Promise.allSettled([
        fetch(`${API_BASE}/students?limit=1`, { headers }),
        fetch(`${API_BASE}/users?limit=1`, { headers }),
      ]);
      // Parse counts from headers or fallback to 0
      if (studRes.status === 'fulfilled' && studRes.value.ok) {
        const d = await studRes.value.json();
        setStats(prev => ({ ...prev, students: d.data?.total || d.data?.students?.length || 0 }));
      }
      if (usrRes.status === 'fulfilled' && usrRes.value.ok) {
        const d = await usrRes.value.json();
        setStats(prev => ({ ...prev, users: d.data?.total || d.data?.users?.length || 0 }));
      }
    } catch (e) {
      console.error('Stats load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('institute_token');
    localStorage.removeItem('institute_refresh');
    localStorage.removeItem('institute_user');
    navigate('/institute/login');
  };

  const cards = [
    { icon: '🎓', label: 'الطلاب', value: stats.students, color: '#6366f1', link: '/students' },
    { icon: '👥', label: 'المستخدمون', value: stats.users, color: '#10b981', link: '/users' },
    { icon: '🏫', label: 'الفصول', value: stats.classes, color: '#f59e0b', link: '/classes' },
    { icon: '💼', label: 'الموظفون', value: stats.employees, color: '#ec4899', link: '/employees' },
  ];

  const modules = [
    { icon: '🎓', label: 'الطلاب', path: '/students' },
    { icon: '📚', label: 'البرامج', path: '/programs' },
    { icon: '🏫', label: 'الفصول', path: '/classes' },
    { icon: '📅', label: 'الجدول', path: '/schedule' },
    { icon: '✅', label: 'الحضور', path: '/attendance' },
    { icon: '💰', label: 'المالية', path: '/finance/fees' },
    { icon: '💼', label: 'الموارد البشرية', path: '/hr/employees' },
    { icon: '📊', label: 'التقارير', path: '/reports' },
    { icon: '📣', label: 'التسويق / CRM', path: '/crm' },
    { icon: '⚙️', label: 'الإعدادات', path: '/settings' },
  ];

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0a0f1e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontFamily: 'Cairo, sans-serif' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⏳</div>
        <p>جارٍ تحميل لوحة التحكم...</p>
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1829 100%)',
      fontFamily: "'Cairo', 'Segoe UI', sans-serif",
      direction: 'rtl', color: '#e2e8f0',
    }}>
      {/* Top Nav */}
      <nav style={{
        background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        padding: '0 2rem', height: '64px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ fontSize: '1.5rem' }}>🏫</div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: '#fff' }}>
              {user?.tenant?.name || 'لوحة تحكم المعهد'}
            </div>
            <div style={{ fontSize: '0.7rem', color: '#64748b' }}>
              {user?.role === 'INSTITUTE_ADMIN' ? 'مدير المعهد' : user?.role} · {user?.username}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a href="/dashboard" style={{
            padding: '0.4rem 0.85rem', borderRadius: '8px',
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#a5b4fc', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 600,
          }}>
            النظام الكامل ↗
          </a>
          <button onClick={handleLogout} style={{
            padding: '0.4rem 0.85rem', borderRadius: '8px',
            background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', fontSize: '0.8rem', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            تسجيل الخروج
          </button>
        </div>
      </nav>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Welcome */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', margin: '0 0 0.25rem' }}>
            مرحباً، {user?.firstName || user?.username} 👋
          </h1>
          <p style={{ color: '#64748b', margin: 0, fontSize: '0.9rem' }}>
            {user?.tenant?.name} · آخر دخول: {new Date().toLocaleDateString('ar-SA')}
          </p>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
          {cards.map((c, i) => (
            <div key={i} style={{
              background: 'rgba(255,255,255,0.04)', border: `1px solid ${c.color}33`,
              borderRadius: '16px', padding: '1.5rem',
              cursor: 'pointer', transition: 'transform 0.2s',
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-4px)')}
              onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
              onClick={() => navigate(c.link)}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>{c.icon}</div>
              <div style={{ fontSize: '2rem', fontWeight: 800, color: c.color }}>{c.value}</div>
              <div style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.25rem' }}>{c.label}</div>
            </div>
          ))}
        </div>

        {/* Module Quick Access */}
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '20px', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: '0 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            ⚡ الوحدات المتاحة
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '0.75rem' }}>
            {modules.map((m, i) => (
              <button
                key={i}
                onClick={() => navigate(m.path)}
                style={{
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px', padding: '1rem 0.75rem',
                  color: '#cbd5e1', fontFamily: 'inherit', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem',
                  fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(99,102,241,0.15)';
                  e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)';
                  e.currentTarget.style.color = '#a5b4fc';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <span style={{ fontSize: '1.5rem' }}>{m.icon}</span>
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap');
      `}</style>
    </div>
  );
}
