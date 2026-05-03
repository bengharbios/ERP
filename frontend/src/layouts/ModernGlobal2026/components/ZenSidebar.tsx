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
    DollarSign,
    Receipt,
    FileText,
    UserCog,
    Calendar,
    Building2,
    Megaphone,
    ChevronDown,
    ArrowRightLeft,
    UserPlus,
    Clock,
    Scale,
} from 'lucide-react';

interface NavGroup {
    label: string;
    icon: React.ElementType;
    items: { icon: React.ElementType; label: string; path: string }[];
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
            { icon: BookOpen, label: 'البرامج', path: '/programs' },
            { icon: Layers, label: 'الوحدات', path: '/units' },
            { icon: GraduationCap, label: 'الفصول', path: '/classes' },
            { icon: Users, label: 'الطلاب', path: '/students' },
            { icon: ClipboardList, label: 'الجداول', path: '/schedule' },
            { icon: Calendar, label: 'الحضور', path: '/attendance' },
        ],
    },
    {
        label: 'المالية',
        icon: Wallet,
        items: [
            { icon: DollarSign, label: 'الرسوم الدراسية', path: '/fees' },
            { icon: Receipt, label: 'سندات القبض', path: '/receipt-vouchers' },
            { icon: FileText, label: 'قيود اليومية', path: '/journal-entries' },
            { icon: Wallet, label: 'المصروفات', path: '/expenses' },
            { icon: Settings, label: 'الإعدادات المالية', path: '/financial-settings' },
        ],
    },
    {
        label: 'الموارد البشرية',
        icon: UserCog,
        items: [
            { icon: Users, label: 'الموظفون', path: '/employees' },
            { icon: Building2, label: 'الأقسام', path: '/departments' },
            { icon: Calendar, label: 'حضور الموظفين', path: '/staff-attendance' },
            { icon: FileText, label: 'طلبات الإجازة', path: '/leaves' },
            { icon: Clock, label: 'المناوبات', path: '/shifts' },
            { icon: Users, label: 'التوظيف', path: '/recruitment' },
            { icon: Scale, label: 'إجراءات الموظفين', path: '/employee-actions' },
        ],
    },
    {
        label: 'التسويق و CRM',
        icon: Target,
        items: [
            { icon: BarChart3, label: 'لوحة تحكم CRM', path: '/crm/dashboard' },
            { icon: UserPlus, label: 'العملاء المحتملون', path: '/crm-leads' },
            { icon: ArrowRightLeft, label: 'أنابيب المبيعات', path: '/crm-pipeline' },
            { icon: Megaphone, label: 'التسويق', path: '/marketing' },
        ],
    },
    {
        label: 'الإعدادات',
        icon: Settings,
        items: [
            { icon: Users, label: 'المستخدمون', path: '/users' },
            { icon: UserCog, label: 'إعدادات الموارد البشرية', path: '/hr-settings' },
            { icon: MessageSquare, label: 'التواصل', path: '/communication' },
            { icon: Settings, label: 'إعدادات النظام', path: '/settings' },
        ],
    },
];

export function ZenSidebar() {
    const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(['رئيسي', 'الأكاديمية']));

    const toggleGroup = (label: string) => {
        setOpenGroups((prev) => {
            const next = new Set(prev);
            if (next.has(label)) next.delete(label);
            else next.add(label);
            return next;
        });
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

                    if (group.items.length === 1) {
                        const item = group.items[0];
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
                                    {group.items.map((item) => (
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
