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
import { useAuthStore } from '../../../store/authStore';

interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
    permission?: string;
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
            { icon: BookOpen, label: 'البرامج', path: '/programs', permission: 'view_academic_programs' },
            { icon: Layers, label: 'الوحدات', path: '/units', permission: 'view_academic_units' },
            { icon: GraduationCap, label: 'الفصول', path: '/classes', permission: 'view_academic_classes' },
            { icon: Users, label: 'الطلاب', path: '/students', permission: 'view_students' },
            { icon: ClipboardList, label: 'الجداول', path: '/schedule', permission: 'view_academic_classes' },
            { icon: Calendar, label: 'الحضور', path: '/attendance', permission: 'view_attendance_lectures' },
            { icon: FileText, label: 'الواجبات', path: '/assignments', permission: 'view_assignments' },
        ],
    },
    {
        label: 'المالية',
        icon: Wallet,
        items: [
            { icon: DollarSign, label: 'الرسوم الدراسية', path: '/fees', permission: 'view_finance_fees' },
            { icon: Receipt, label: 'سندات القبض', path: '/receipt-vouchers', permission: 'view_finance_receipts' },
            { icon: BookMarked, label: 'دليل الحسابات', path: '/chart-of-accounts', permission: 'view_chart_of_accounts' },
            { icon: FileText, label: 'قيود اليومية', path: '/journal-entries', permission: 'view_journal_entries' },
            { icon: FileStack, label: 'فواتير المبيعات', path: '/finance/invoices', permission: 'view_finance_invoices' },
            { icon: TrendingDown, label: 'سندات الصرف', path: '/expenses', permission: 'view_finance_expenses' },
            { icon: BarChart3, label: 'التقارير المالية', path: '/financial-reports', permission: 'view_financial_reports' },
            { icon: Settings, label: 'الإعدادات المالية', path: '/financial-settings', permission: 'view_financial_settings' },
        ],
    },
    {
        label: 'الموارد البشرية',
        icon: UserCog,
        items: [
            { icon: BarChart3, label: 'لوحة الموارد البشرية', path: '/hr-dashboard', permission: 'view_hr_employees' },
            { icon: Users, label: 'الموظفون', path: '/employees', permission: 'view_hr_employees' },
            { icon: Building2, label: 'الأقسام', path: '/departments', permission: 'view_hr_departments' },
            { icon: DollarSign, label: 'الرواتب', path: '/payroll', permission: 'view_hr_payroll' },
            { icon: Calendar, label: 'حضور الموظفين', path: '/staff-attendance', permission: 'view_hr_staff_attendance' },
            { icon: FileText, label: 'طلبات الإجازة', path: '/leaves', permission: 'view_hr_leaves' },
            { icon: Clock, label: 'المناوبات', path: '/shifts', permission: 'view_hr_shifts' },
            { icon: Users, label: 'التوظيف', path: '/recruitment', permission: 'view_hr_recruitment' },
            { icon: Scale, label: 'إجراءات الموظفين', path: '/employee-actions', permission: 'view_hr_employee_actions' },
        ],
    },
    {
        label: 'إدارة المبيعات (CRM)',
        icon: Target,
        items: [
            { icon: BarChart3, label: 'لوحة تحكم CRM', path: '/crm/dashboard', permission: 'view_crm_dashboard' },
            { icon: UserPlus, label: 'العملاء المحتملون', path: '/crm-leads', permission: 'view_crm_leads' },
            { icon: ArrowRightLeft, label: 'أنابيب المبيعات', path: '/crm-pipeline', permission: 'view_crm_pipeline' },
            { icon: Calendar, label: 'الأنشطة المجدولة', path: '/crm-activities', permission: 'view_crm_activities' },
            { icon: Sliders, label: 'مراحل البيع', path: '/crm-stages', permission: 'view_crm_stages' },
            { icon: Users, label: 'فرق المبيعات', path: '/crm-teams', permission: 'view_crm_teams' },
        ],
    },
    {
        label: 'التسويق',
        icon: Megaphone,
        items: [
            { icon: Megaphone, label: 'الحملات الإعلانية', path: '/marketing', permission: 'view_sys_marketing' },
        ],
    },
    {
        label: 'الإعدادات',
        icon: Settings,
        items: [
            { icon: Users, label: 'المستخدمون', path: '/users', permission: 'view_sys_users' },
            { icon: UserCog, label: 'الأدوار', path: '/roles', permission: 'view_sys_roles' },
            { icon: MessageCircle, label: 'التواصل', path: '/communication', permission: 'view_sys_settings' },
            { icon: Settings, label: 'إعدادات النظام', path: '/settings', permission: 'view_sys_settings' },
            { icon: UserCog, label: 'إعدادات الموارد البشرية', path: '/hr-settings', permission: 'view_hr_settings' },
        ],
    },
];

export function RapidosSidebar() {
    const settings = useSettingsStore((s) => s.settings);
    const instituteName = settings?.instituteName || 'معهد سلام';
    const user = useAuthStore((s) => s.user);
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['رئيسي', 'الأكاديمية', 'إدارة المبيعات (CRM)']));

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

    const hasPermission = (permissionCode: string) => {
        if (!user) return false;
        // Super Admin and Admin bypass all checks and see everything
        const isBypass = user.roles?.some(r => r === 'Super Admin' || r === 'Admin') || user.role === 'Admin';
        if (isBypass) return true;
        return user.permissions?.includes(permissionCode) || false;
    };

    const displayName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'الإدارة';
    const displayRole = user?.roles?.[0] || user?.role || 'موظف';

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

                    // Filter items in the group by permissions
                    const filteredItems = group.items.filter(
                        (item) => !item.permission || hasPermission(item.permission)
                    );

                    // If no items are visible in this group, hide the entire group!
                    if (filteredItems.length === 0) return null;

                    // For single-item groups (like dashboard), render directly
                    if (filteredItems.length === 1 && group.label === 'رئيسي') {
                        const item = filteredItems[0];
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
                                    {filteredItems.map((item) => (
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
                        {displayName.charAt(0).toUpperCase()}
                        <span className="rd-avatar-status" />
                    </div>
                    <div className="rd-sidebar-user-info">
                        <div className="rd-sidebar-user-name">{displayName}</div>
                        <div className="rd-sidebar-user-role">{displayRole}</div>
                    </div>
                </div>
            </div>
        </aside>
    );
}
