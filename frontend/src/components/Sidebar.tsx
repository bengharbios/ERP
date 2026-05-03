import { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import {
    LayoutDashboard,
    GraduationCap,
    BookOpen,
    Library,
    School,
    Users,
    Calendar,
    Trophy,
    CheckCircle,
    FileText,
    BarChart3,
    Wallet,
    CreditCard,
    TrendingDown,
    Target,
    Rocket,
    MessageCircle,
    Building2,
    UserPlus,
    Clock,
    DollarSign,
    Settings,
    Key,
    Shield,
    LogOut,
    ChevronDown,
    ChevronRight,
    User,
    Megaphone,
    Bell,
    Repeat,
    Scale,
    Fingerprint,
    // Briefcase removed
    // MarketingIcon removed
} from 'lucide-react';

interface SidebarProps {
    isCollapsed: boolean;
    onToggle: () => void;
    isMobileOpen: boolean;
    onMobileClose: () => void;
}

const Icon = ({ icon: IconComponent, size = 20 }: { icon: any; size?: number }) => {
    return <IconComponent size={size} strokeWidth={2.2} />;
};

export default function Sidebar({ isCollapsed, onToggle, isMobileOpen, onMobileClose }: SidebarProps) {
    const navigate = useNavigate();
    const logout = useAuthStore((state) => state.logout);
    const user = useAuthStore((state) => state.user);
    const [expandedSections, setExpandedSections] = useState<string[]>(['academic']);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkScreenSize = () => {
            setIsMobile(window.innerWidth < 1024);
        };
        checkScreenSize();
        window.addEventListener('resize', checkScreenSize);
        return () => window.removeEventListener('resize', checkScreenSize);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const toggleSection = (section: string) => {
        setExpandedSections(prev =>
            prev.includes(section) ? prev.filter(s => s !== section) : [...prev, section]
        );
    };

    const menuSections = [
        {
            id: 'main',
            label: 'الرئيسية',
            items: [{ path: '/dashboard', icon: LayoutDashboard, label: 'لوحة التحكم' }]
        },
        {
            id: 'academic',
            label: 'الأكاديمية',
            icon: GraduationCap,
            items: [
                { path: '/programs', icon: BookOpen, label: 'البرامج' },
                { path: '/units', icon: Library, label: 'الوحدات' },
                { path: '/classes', icon: School, label: 'الفصول' },
                { path: '/students', icon: Users, label: 'الطلاب' },
                { path: '/schedule', icon: Calendar, label: 'الجدول' },
                { path: '/achievement', icon: Trophy, label: 'الإنجاز' },
                { path: '/attendance', icon: CheckCircle, label: 'الحضور' },
                { path: '/assignments', icon: FileText, label: 'الواجبات' },
                { path: '/reports', icon: BarChart3, label: 'التقارير' }
            ]
        },
        {
            id: 'finance',
            label: 'المالية',
            icon: Wallet,
            items: [
                { path: '/fees', icon: CreditCard, label: 'الرسوم الدراسية' },
                { path: '/finance/invoices', icon: FileText, label: 'الفواتير الضريبية' },
                { path: '/chart-of-accounts', icon: FileText, label: 'دليل الحسابات' },
                { path: '/journal-entries', icon: FileText, label: 'قيود اليومية' },
                { path: '/receipt-vouchers', icon: FileText, label: 'سندات القبض' },
                { path: '/expenses', icon: TrendingDown, label: 'المصاريف' },
                { path: '/financial-reports', icon: BarChart3, label: 'التقارير المالية' },
                { path: '/financial-settings', icon: Settings, label: 'الإعدادات المالية' },
                { path: '/accounting-guide', icon: BookOpen, label: 'الدليل المالي' }
            ]
        },
        {
            id: 'crm',
            label: 'العملاء (CRM)',
            icon: Target,
            items: [
                { path: '/crm/dashboard', icon: LayoutDashboard, label: 'نظرة عامة' },
                { path: '/crm/leads', icon: Users, label: 'العملاء' },
                { path: '/crm/pipeline', icon: BarChart3, label: 'المبيعات' },
                { path: '/crm/activities', icon: Calendar, label: 'الأنشطة' },
                { path: '/crm/teams', icon: Trophy, label: 'الفرق' }
            ]
        },
        {
            id: 'marketing',
            label: 'التسويق',
            icon: Rocket,
            items: [
                { path: '/marketing', icon: Megaphone, label: 'الحملات' },
                { path: '/whatsapp-tracker', icon: MessageCircle, label: 'واتساب' }
            ]
        },
        {
            id: 'hr',
            label: 'الموارد البشرية',
            icon: Building2,
            items: [
                { path: '/hr-dashboard', icon: LayoutDashboard, label: 'نظرة عامة' },
                { path: '/employees', icon: User, label: 'الموظفين' },
                { path: '/leaves', icon: Calendar, label: 'الإجازات' },
                { path: '/recruitment', icon: UserPlus, label: 'التوظيف' },
                { path: '/employee-actions', icon: Scale, label: 'الإجراءات' },
                { path: '/shifts', icon: Repeat, label: 'المناوبات' },
                { path: '/communication', icon: Bell, label: 'التواصل' },
                { path: '/biometric-devices', icon: Fingerprint, label: 'أجهزة البصمة' },
                { path: '/staff-attendance', icon: Clock, label: 'الحضور' },
                { path: '/attendance-reports', icon: BarChart3, label: 'تقارير الحضور' },
                { path: '/hr-settings', icon: Settings, label: 'إعدادات الدوام' },
                { path: '/payroll', icon: DollarSign, label: 'الرواتب' }
            ]
        },
        {
            id: 'system',
            label: 'النظام',
            icon: Settings,
            items: [
                { path: '/users', icon: Users, label: 'المستخدمين' },
                { path: '/roles', icon: Key, label: 'الأدوار' },
                { path: '/permissions', icon: Shield, label: 'الصلاحيات' },
                { path: '/settings', icon: Settings, label: 'الإعدادات' }
            ]
        }
    ];

    return (
        <>
            {isMobile && isMobileOpen && (
                <div onClick={onMobileClose} className="sidebar-overlay" />
            )}

            <div className={`sidebar-container ${isCollapsed ? 'collapsed' : ''} ${isMobile && isMobileOpen ? 'mobile-open' : ''}`}>
                <div className="sidebar-header">
                    <div className="brand-box" onClick={!isMobile ? onToggle : undefined} style={{ cursor: !isMobile ? 'pointer' : 'default' }}>
                        <div className="brand-icon">
                            <Icon icon={School} size={24} />
                        </div>
                        {!isCollapsed && (
                            <div className="brand-text">
                                <h1>نظام المعهد</h1>
                                <span>Institute ERP</span>
                            </div>
                        )}
                    </div>
                </div>

                <nav className="sidebar-nav custom-scrollbar">
                    {menuSections.map((section) => (
                        <div key={section.id} className="nav-section">
                            {section.id === 'main' ? (
                                section.items.map((item) => (
                                    <NavLink
                                        key={item.path}
                                        to={item.path}
                                        onClick={() => isMobile && onMobileClose()}
                                        className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                    >
                                        <div className="item-icon-wrap"><Icon icon={item.icon} /></div>
                                        {!isCollapsed && <span className="item-label">{item.label}</span>}
                                    </NavLink>
                                ))
                            ) : (
                                <>
                                    <button onClick={() => toggleSection(section.id)} className="section-header">
                                        <div className="section-title">
                                            {section.icon && <Icon icon={section.icon} />}
                                            {!isCollapsed && <span>{section.label}</span>}
                                        </div>
                                        {!isCollapsed && (
                                            <Icon icon={expandedSections.includes(section.id) ? ChevronDown : ChevronRight} size={14} />
                                        )}
                                    </button>
                                    {expandedSections.includes(section.id) && (
                                        <div className="section-items">
                                            {section.items.map((item) => (
                                                <NavLink
                                                    key={item.path}
                                                    to={item.path}
                                                    onClick={() => isMobile && onMobileClose()}
                                                    className={({ isActive }) => `sub-item ${isActive ? 'active' : ''}`}
                                                >
                                                    <div className="item-icon-wrap thin"><Icon icon={item.icon} size={16} /></div>
                                                    {!isCollapsed && <span className="item-label">{item.label}</span>}
                                                </NavLink>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    {!isCollapsed && (
                        <div className="user-mini-card">
                            <div className="u-avatar">
                                <Icon icon={User} size={18} />
                            </div>
                            <div className="u-info">
                                <span className="u-name">{user?.firstName || 'Admin'}</span>
                                <span className="u-role">{user?.role || 'مسؤول'}</span>
                            </div>
                        </div>
                    )}
                    <button onClick={handleLogout} className="logout-action" title="Log Out">
                        <Icon icon={LogOut} size={18} />
                        {!isCollapsed && <span>خروج</span>}
                    </button>
                </div>
            </div>

            <style>{`
                .sidebar-container {
                    position: fixed;
                    right: 0;
                    top: 0;
                    bottom: 0;
                    width: 260px;
                    background: #FFFFFF;
                    display: flex;
                    flex-direction: column;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    z-index: 2000;
                    border-left: 1px solid #F1F5F9;
                    box-shadow: 4px 0 20px rgba(0,0,0,0.02);
                    font-family: 'Cairo', sans-serif;
                }

                .sidebar-container.collapsed {
                    width: 80px;
                }

                @media (max-width: 1024px) {
                    .sidebar-container {
                        transform: translateX(100%);
                        width: 280px;
                    }
                    .sidebar-container.mobile-open {
                        transform: translateX(0);
                    }
                }

                .sidebar-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.3);
                    backdrop-filter: blur(4px);
                    z-index: 1999;
                }

                .sidebar-header {
                    padding: 24px;
                }

                .brand-box {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .brand-icon {
                    width: 44px;
                    height: 44px;
                    background: #F97316;
                    border-radius: 12px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    box-shadow: 0 8px 16px -4px rgba(249, 115, 22, 0.4);
                }

                .brand-text h1 {
                    font-size: 16px;
                    font-weight: 800;
                    color: #0F172A;
                    margin: 0;
                }

                .brand-text span {
                    font-size: 11px;
                    color: #94A3B8;
                    font-weight: 600;
                    letter-spacing: 0.5px;
                }

                .sidebar-nav {
                    flex: 1;
                    padding: 8px 12px;
                    overflow-y: auto;
                }

                .nav-section {
                    margin-bottom: 20px;
                }

                /* Section Category Labels (The "General", "Academic" headers) */
                .section-header {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 10px 12px 5px 12px;
                    border: none;
                    background: transparent;
                    color: #94a3b8;
                    font-size: 11px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    cursor: pointer;
                    border-radius: 8px;
                    transition: all 0.2s;
                    margin-bottom: 4px;
                }

                .section-header:hover {
                    color: #F97316;
                }

                .section-title {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }

                /* Main Navigation Items */
                .nav-item {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 10px 16px;
                    margin-bottom: 2px;
                    color: #475569;
                    text-decoration: none;
                    font-size: 14px;
                    font-weight: 600;
                    border-radius: 10px;
                    transition: all 0.2s;
                    white-space: nowrap;
                    overflow: hidden;
                }

                .nav-item:hover {
                    background: #F8FAFC;
                    color: #F97316;
                }

                .nav-item.active {
                    background: #F97316;
                    color: white;
                    box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
                }

                /* Sub-menu Items Indentation & Style */
                .section-items {
                    display: flex;
                    flex-direction: column;
                    gap: 1px;
                    margin-top: 2px;
                }

                .sub-item {
                    display: flex;
                    align-items: center;
                    gap: 14px;
                    padding: 9px 24px 9px 16px;
                    color: #64748b;
                    text-decoration: none;
                    font-size: 13.5px;
                    font-weight: 600;
                    border-radius: 8px;
                    transition: all 0.2s;
                    white-space: nowrap;
                    overflow: hidden;
                }

                .sub-item:hover {
                    background: #f1f5f9;
                    color: #0f172a;
                }

                .sub-item.active {
                    color: #F97316;
                    background: #FFF7ED;
                }

                .item-icon-wrap {
                    width: 20px;
                    display: flex;
                    justify-content: center;
                    opacity: 0.8;
                }

                .item-label {
                    overflow: hidden;
                    text-overflow: ellipsis;
                }

                .sidebar-footer {
                    padding: 24px 16px;
                    border-top: 1px solid #F1F5F9;
                }

                .user-mini-card {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 12px;
                    background: #F8FAFC;
                    border-radius: 12px;
                    margin-bottom: 12px;
                }

                .u-avatar {
                    width: 36px;
                    height: 36px;
                    background: #E2E8F0;
                    border-radius: 10px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: #64748B;
                }

                .u-name {
                    display: block;
                    font-size: 13px;
                    font-weight: 700;
                    color: #0F172A;
                }

                .u-role {
                    font-size: 11px;
                    color: #94A3B8;
                }

                .logout-action {
                    width: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    padding: 12px;
                    border: 1px solid #FEE2E2;
                    background: #FFF5F5;
                    color: #EF4444;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .logout-action:hover {
                    background: #EF4444;
                    color: white;
                    border-color: #EF4444;
                }
            `}</style>
        </>
    );
}
