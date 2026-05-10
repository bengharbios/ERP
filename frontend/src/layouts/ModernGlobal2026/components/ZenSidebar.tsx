import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
    BarChart3,
    GraduationCap,
    Users,
    Wallet,
    Settings,
    Target,
    MessageSquare,
    BookOpen,
    Layers,
    ClipboardList,
    Calendar,
    Building2,
    Megaphone,
    ChevronDown,
    ArrowRightLeft,
    UserPlus,
    Clock,
    Scale,
    DollarSign,
    Receipt,
    FileText,
    UserCog,
} from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';

interface NavGroup {
    label: string;
    icon: React.ElementType;
    items: { icon: React.ElementType; label: string; path: string; permission?: string }[];
}

const navGroups: NavGroup[] = [
    {
        label: 'رئيسي',
        icon: BarChart3,
        items: [{ icon: BarChart3, label: 'لوحة القيادة', path: '/dashboard' }],
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
        ],
    },
    {
        label: 'المالية',
        icon: Wallet,
        items: [
            { icon: DollarSign, label: 'الرسوم الدراسية', path: '/fees', permission: 'view_finance_fees' },
            { icon: Receipt, label: 'سندات القبض', path: '/receipt-vouchers', permission: 'view_finance_receipts' },
            { icon: FileText, label: 'قيود اليومية', path: '/journal-entries', permission: 'view_journal_entries' },
            { icon: Wallet, label: 'المصروفات', path: '/expenses', permission: 'view_finance_expenses' },
            { icon: Settings, label: 'الإعدادات المالية', path: '/financial-settings', permission: 'view_financial_settings' },
        ],
    },
    {
        label: 'الموارد البشرية',
        icon: UserCog,
        items: [
            { icon: Users, label: 'الموظفون', path: '/employees', permission: 'view_hr_employees' },
            { icon: Building2, label: 'الأقسام', path: '/departments', permission: 'view_hr_departments' },
            { icon: Calendar, label: 'حضور الموظفين', path: '/staff-attendance', permission: 'view_hr_staff_attendance' },
            { icon: FileText, label: 'طلبات الإجازة', path: '/leaves', permission: 'view_hr_leaves' },
            { icon: Clock, label: 'المناوبات', path: '/shifts', permission: 'view_hr_shifts' },
            { icon: Users, label: 'التوظيف', path: '/recruitment', permission: 'view_hr_recruitment' },
            { icon: Scale, label: 'إجراءات الموظفين', path: '/employee-actions', permission: 'view_hr_employee_actions' },
        ],
    },
    {
        label: 'التسويق و CRM',
        icon: Target,
        items: [
            { icon: BarChart3, label: 'لوحة تحكم CRM', path: '/crm/dashboard', permission: 'view_crm_dashboard' },
            { icon: UserPlus, label: 'العملاء المحتملون', path: '/crm-leads', permission: 'view_crm_leads' },
            { icon: ArrowRightLeft, label: 'أنابيب المبيعات', path: '/crm-pipeline', permission: 'view_crm_pipeline' },
            { icon: Megaphone, label: 'التسويق', path: '/marketing', permission: 'view_sys_marketing' },
        ],
    },
    {
        label: 'الإعدادات',
        icon: Settings,
        items: [
            { icon: Users, label: 'المستخدمون', path: '/users', permission: 'view_sys_users' },
            { icon: UserCog, label: 'إعدادات الموارد البشرية', path: '/hr-settings', permission: 'view_hr_settings' },
            { icon: MessageSquare, label: 'التواصل', path: '/communication', permission: 'view_sys_settings' },
            { icon: Settings, label: 'إعدادات النظام', path: '/settings', permission: 'view_sys_settings' },
        ],
    },
];

export function ZenSidebar() {
    const user = useAuthStore((s) => s.user);
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['رئيسي', 'الأكاديمية']));

    const toggleGroup = (label: string) => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(label)) next.delete(label);
            else next.add(label);
            return next;
        });
    };

    const hasPermission = (permissionCode: string) => {
        if (!user) return false;
        // Super Admin and Admin bypass all checks and see everything
        const isBypass = user.username === 'admin' || user.roles?.some(r => r === 'Super Admin' || r === 'Admin') || user.role === 'Admin';
        if (isBypass) return true;
        return user.permissions?.includes(permissionCode) || false;
    };

    return (
        <aside className="mg26-sidebar">
            <div className="mg26-logo-area" style={{ marginBottom: 'var(--mg26-space-4xl)' }}>
                <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    backgroundColor: 'var(--mg26-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '20px'
                }}>
                    G
                </div>
            </div>

            <nav className="mg26-nav" style={{ overflowY: 'auto', flex: 1 }}>
                {navGroups.map((group) => {
                    const isOpen = openGroups.has(group.label);
                    const GroupIcon = group.icon;

                    const filteredItems = group.items.filter(
                        (item) => !item.permission || hasPermission(item.permission)
                    );

                    if (filteredItems.length === 0) return null;

                    if (filteredItems.length === 1 && group.label === 'رئيسي') {
                        const item = filteredItems[0];
                        return (
                            <NavLink
                                key={item.path}
                                to={item.path}
                                className={({ isActive }) => `mg26-nav-item ${isActive ? 'active' : ''}`}
                            >
                                <div className="mg26-nav-icon"><item.icon size={24} strokeWidth={1.5} /></div>
                                <span className="mg26-nav-label">{item.label}</span>
                            </NavLink>
                        );
                    }

                    return (
                        <div key={group.label}>
                            <button
                                onClick={() => toggleGroup(group.label)}
                                className="mg26-nav-item"
                                style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            >
                                <div className="mg26-nav-icon"><GroupIcon size={24} strokeWidth={1.5} /></div>
                                <span className="mg26-nav-label" style={{ flex: 1 }}>{group.label}</span>
                                <ChevronDown size={14} style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s', opacity: 0.6 }} />
                            </button>
                            {isOpen && (
                                <div style={{ paddingRight: '16px' }}>
                                    {filteredItems.map((item) => (
                                        <NavLink
                                            key={item.path}
                                            to={item.path}
                                            className={({ isActive }) => `mg26-nav-item ${isActive ? 'active' : ''}`}
                                            style={{ fontSize: '0.85rem' }}
                                        >
                                            <div className="mg26-nav-icon" style={{ width: '28px', height: '28px' }}>
                                                <item.icon size={16} strokeWidth={1.5} />
                                            </div>
                                            <span className="mg26-nav-label">{item.label}</span>
                                        </NavLink>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto', width: '100%', padding: '0 var(--mg26-space-md)' }} />
        </aside>
    );
}
