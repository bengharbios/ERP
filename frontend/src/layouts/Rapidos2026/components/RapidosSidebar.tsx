import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    GraduationCap,
    Users,
    Wallet,
    Settings,
    Megaphone,
    MessageCircle,
    BookOpen,
    Layers,
    ClipboardList,
    Zap,
    ChevronDown,
    DollarSign,
    Receipt,
    BookMarked,
    FileText,
    UserCog,
    Calendar,
    BarChart3,
    Building2,
    Target,
    TrendingDown,
    FileStack,
    Clock,
    Scale,
    ArrowRightLeft,
    UserPlus,
    Sliders,
} from 'lucide-react';
import { useSettingsStore } from '../../../store/settingsStore';

interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
    badge?: number;
}

interface NavGroup {
    label: string;
    icon: React.ElementType;
    items: NavItem[];
}

const navGroups: NavGroup[] = [
    {
        label: 'رئيسي',
        icon: LayoutDashboard,
        items: [
            { icon: LayoutDashboard, label: 'لوحة القيادة', path: '/dashboard' },
        ],
    },
    {
        label: 'الأكاديمية',
        icon: GraduationCap,
        items: [
            { icon: BookOpen, label: 'البرامج', path: '/programs' },
            { icon: Layers, label: 'الوحدات', path: '/units' },
            { icon: GraduationCap, label: 'الفصول', path: '/classes' },
            { icon: Users, label: 'الطلاب', path: '/students' },
            { icon: ClipboardList, label: 'الجداول', path: '/schedule' },
            { icon: Calendar, label: 'الحضور', path: '/attendance' },
            { icon: FileText, label: 'الواجبات', path: '/assignments' },
        ],
    },
    {
        label: 'المالية',
        icon: Wallet,
        items: [
            { icon: DollarSign, label: 'الرسوم الدراسية', path: '/fees' },
            { icon: Receipt, label: 'سندات القبض', path: '/receipt-vouchers' },
            { icon: BookMarked, label: 'دليل الحسابات', path: '/chart-of-accounts' },
            { icon: FileText, label: 'قيود اليومية', path: '/journal-entries' },
            { icon: FileStack, label: 'فواتير المبيعات', path: '/finance/invoices' },
            { icon: TrendingDown, label: 'سندات الصرف', path: '/expenses' },
            { icon: BarChart3, label: 'التقارير المالية', path: '/financial-reports' },
            { icon: Settings, label: 'الإعدادات المالية', path: '/financial-settings' },
        ],
    },
    {
        label: 'الموارد البشرية',
        icon: UserCog,
        items: [
            { icon: BarChart3, label: 'لوحة الموارد البشرية', path: '/hr-dashboard' },
            { icon: Users, label: 'الموظفون', path: '/employees' },
            { icon: Building2, label: 'الأقسام', path: '/departments' },
            { icon: DollarSign, label: 'الرواتب', path: '/payroll' },
            { icon: Calendar, label: 'حضور الموظفين', path: '/staff-attendance' },
            { icon: FileText, label: 'طلبات الإجازة', path: '/leaves' },
            { icon: Clock, label: 'المناوبات', path: '/shifts' },
            { icon: Users, label: 'التوظيف', path: '/recruitment' },
            { icon: Scale, label: 'إجراءات الموظفين', path: '/employee-actions' },
        ],
    },
    {
        label: 'إدارة المبيعات (CRM)',
        icon: Target,
        items: [
            { icon: BarChart3, label: 'لوحة تحكم CRM', path: '/crm/dashboard' },
            { icon: UserPlus, label: 'العملاء المحتملون', path: '/crm-leads' },
            { icon: ArrowRightLeft, label: 'أنابيب المبيعات', path: '/crm-pipeline' },
            { icon: Calendar, label: 'الأنشطة المجدولة', path: '/crm-activities' },
            { icon: Sliders, label: 'مراحل البيع', path: '/crm-stages' },
            { icon: Users, label: 'فرق المبيعات', path: '/crm-teams' },
        ],
    },
    {
        label: 'التسويق',
        icon: Megaphone,
        items: [
            { icon: Megaphone, label: 'الحملات الإعلانية', path: '/marketing' },
        ],
    },
    {
        label: 'الإعدادات',
        icon: Settings,
        items: [
            { icon: Users, label: 'المستخدمون', path: '/users' },
            { icon: UserCog, label: 'الأدوار', path: '/roles' },
            { icon: MessageCircle, label: 'التواصل', path: '/communication' },
            { icon: Settings, label: 'إعدادات النظام', path: '/settings' },
            { icon: UserCog, label: 'إعدادات الموارد البشرية', path: '/hr-settings' },
        ],
    },
];

export function RapidosSidebar() {
    const settings = useSettingsStore((s) => s.settings);
    const instituteName = settings?.instituteName || 'معهد سلام';
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['رئيسي', 'الأكاديمية']));

    const toggleGroup = (label: string) => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(label)) {
                next.delete(label);
            } else {
                next.add(label);
            }
            return next;
        });
    };

    return (
        <aside className="rd-sidebar">
            {/* Logo */}
            <div className="rd-sidebar-logo">
                <div className="rd-sidebar-logo-icon">
                    <Zap size={20} color="white" strokeWidth={2.5} />
                </div>
                <div className="rd-sidebar-logo-text">
                    <h2>{instituteName}</h2>
                    <span>Rapidos ERP 2026</span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="rd-nav" style={{ overflowY: 'auto', flex: 1 }}>
                {navGroups.map((group) => {
                    const isOpen = openGroups.has(group.label);
                    const GroupIcon = group.icon;

                    // For single-item groups (like dashboard), render directly
                    if (group.items.length === 1) {
                        const item = group.items[0];
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `rd-nav-item ${isActive ? 'active' : ''}`}
                                title={item.label}
                            >
                                <div className="rd-nav-icon">
                                    <item.icon size={20} strokeWidth={1.8} />
                                </div>
                                <span className="rd-nav-label">{item.label}</span>
                            </NavLink>
                        );
                    }

                    return (
                        <div key={group.label} className="rd-nav-group">
                            <button
                                className="rd-nav-item rd-nav-group-header"
                                onClick={() => toggleGroup(group.label)}
                                style={{
                                    width: '100%',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    textAlign: 'right',
                                }}
                            >
                                <div className="rd-nav-icon">
                                    <GroupIcon size={20} strokeWidth={1.8} />
                                </div>
                                <span className="rd-nav-label" style={{ flex: 1 }}>{group.label}</span>
                                <ChevronDown
                                    size={14}
                                    strokeWidth={2}
                                    style={{
                                        transition: 'transform 0.2s',
                                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                                        marginLeft: '4px',
                                        opacity: 0.6,
                                    }}
                                />
                            </button>

                            {isOpen && (
                                <div className="rd-nav-children" style={{ paddingRight: '12px' }}>
                                    {group.items.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) => `rd-nav-item rd-nav-child ${isActive ? 'active' : ''}`}
                                            title={item.label}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            <div className="rd-nav-icon" style={{ width: '28px', height: '28px' }}>
                                                <item.icon size={16} strokeWidth={1.8} />
                                            </div>
                                            <span className="rd-nav-label">{item.label}</span>
                                            {item.badge && <span className="rd-nav-badge">{item.badge}</span>}
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* User Footer */}
            <div className="rd-sidebar-footer">
                <div className="rd-sidebar-user">
                    <div className="rd-avatar">
                        {instituteName.charAt(0)}
                        <span className="rd-avatar-status" />
                    </div>
                    <div className="rd-sidebar-user-info">
                        <div className="rd-sidebar-user-name">الإدارة</div>
                        <div className="rd-sidebar-user-role">مسؤول النظام</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
