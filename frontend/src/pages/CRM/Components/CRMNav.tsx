import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, Users, Target, Calendar, TrendingUp } from 'lucide-react';

const CRMNav: React.FC = () => {
    const location = useLocation();

    const navItems = [
        { path: '/crm/dashboard', icon: <Home size={18} />, label: 'لوحة التحكم' },
        { path: '/crm/leads', icon: <Users size={18} />, label: 'العملاء المحتملون' },
        { path: '/crm/pipeline', icon: <Target size={18} />, label: 'خط الأنابيب' },
        { path: '/crm/activities', icon: <Calendar size={18} />, label: 'الأنشطة' },
        { path: '/crm/teams', icon: <TrendingUp size={18} />, label: 'فرق المبيعات' }
    ];

    return (
        <div style={{
            background: 'white',
            borderBottom: '2px solid #f3f4f6',
            marginBottom: '1.5rem',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
        }}>
            <div style={{
                maxWidth: '1400px',
                margin: '0 auto',
                padding: '0 1.5rem'
            }}>
                <div style={{
                    display: 'flex',
                    gap: '0.5rem',
                    overflowX: 'auto'
                }}>
                    {navItems.map(item => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.875rem 1.25rem',
                                textDecoration: 'none',
                                color: location.pathname === item.path ? '#f97316' : '#6b7280',
                                fontWeight: location.pathname === item.path ? '600' : '500',
                                fontSize: '0.9rem',
                                borderBottom: location.pathname === item.path ? '3px solid #f97316' : '3px solid transparent',
                                transition: 'all 0.2s',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            <span style={{
                                color: location.pathname === item.path ? '#f97316' : '#9ca3af'
                            }}>
                                {item.icon}
                            </span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CRMNav;
