import { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard, GraduationCap, BookOpen, Layers, Users, CalendarDays,
    Wallet, ReceiptText, FileText, BarChart3,
    Calculator, FileSpreadsheet,
    UserCircle, Building2, UserCheck, Clock, Briefcase,
    TrendingUp, Megaphone,
    Phone, Settings,
    ChevronDown, Bell, Search, Menu, X, Home,
    ChevronLeft, Hash, CreditCard, Landmark, FileJson, UserPlus,
    CalendarRange, ShieldAlert, BadgeCheck, FileStack,
    PenTool, MessageSquare, Headphones, Sun, Moon,
    ArrowRightLeft, BrainCircuit
} from 'lucide-react';
import { useSettingsStore } from '../../../store/settingsStore';
import { useAuthStore } from '../../../store/authStore';

/* ══════════════════════════════════════════
   NAVIGATION STRUCTURE — بنية التنقل الكاملة
══════════════════════════════════════════ */
export const NAV_SECTIONS = [
    {
        id: 'academic',
        label: 'الأكاديمية',
        shortLabel: 'الأكاديمية',
        icon: GraduationCap,
        color: 'var(--hz-cyan)', // Cyan
        glow: 'var(--hz-cyan-glow)',
        pages: [
            { label: 'الرئيسية (Dashboard)', icon: LayoutDashboard, path: '/dashboard' },
            { label: 'البرامج الأكاديمية', icon: BookOpen, path: '/programs' },
            { label: 'الوحدات والمواد', icon: Layers, path: '/units' },
            { label: 'الفصول الدراسية', icon: CalendarDays, path: '/classes' },
            { label: 'الطلاب المسجلين', icon: Users, path: '/students' },
            { label: 'جدول المحاضرات', icon: CalendarRange, path: '/schedule' },
            { label: 'سجلات الحضور', icon: Clock, path: '/attendance' },
            { label: 'الواجبات والمهام', icon: PenTool, path: '/assignments' },
            { label: 'المقيّم الأكاديمي الذكي', icon: BrainCircuit, path: '/academic-assessor-ai' },
        ],
    },
    {
        id: 'finance',
        label: 'المالية',
        shortLabel: 'المالية',
        icon: Wallet,
        color: 'var(--hz-gold)', // Gold/Orange
        glow: 'var(--hz-gold-glow)',
        pages: [
            { label: 'الرسوم الدراسية', icon: CreditCard, path: '/fees' },
            { label: 'سندات القبض', icon: ReceiptText, path: '/receipt-vouchers' },
            { label: 'سندات الصرف', icon: FileText, path: '/expenses' },
            { label: 'فواتير المبيعات', icon: FileStack, path: '/finance/invoices' },
            { label: 'دليل الحسابات', icon: Landmark, path: '/chart-of-accounts' },
            { label: 'القيود اليدوية', icon: FileJson, path: '/journal-entries' },
            { label: 'التقارير المالية', icon: BarChart3, path: '/financial-reports' },
        ],
    },
    {
        id: 'hr',
        label: 'الموارد البشرية',
        shortLabel: 'HR',
        icon: Briefcase,
        color: 'var(--hz-plasma)', // Plasma/Purple
        glow: 'var(--hz-plasma-glow)',
        pages: [
            { label: 'لوحة تحكم HR', icon: TrendingUp, path: '/hr-dashboard' },
            { label: 'ملفات الموظفين', icon: UserCircle, path: '/employees' },
            { label: 'الأقسام والهيكل', icon: Building2, path: '/departments' },
            { label: 'الحضور الذكي', icon: UserCheck, path: '/staff-attendance' },
            { label: 'إدارة المناوبات', icon: Clock, path: '/shifts' },
            { label: 'كشوف المرتبات', icon: FileSpreadsheet, path: '/payroll' },
            { label: 'طلبات الإجازة', icon: MessageSquare, path: '/leaves' },
            { label: 'التوظيف', icon: UserPlus, path: '/recruitment' },
            { label: 'الجزاءات والمكافآت', icon: ShieldAlert, path: '/employee-actions' },
        ],
    },
    {
        id: 'crm',
        label: 'إدارة المبيعات (CRM)',
        shortLabel: 'CRM',
        icon: UserPlus,
        color: 'var(--hz-neon)', // Neon/Green
        glow: 'var(--hz-neon-glow)',
        pages: [
            { label: 'لوحة تحكم CRM', icon: LayoutDashboard, path: '/crm/dashboard' },
            { label: 'العملاء (Customers)', icon: Users, path: '/crm-customers' },
            { label: 'العملاء المحتملون', icon: UserPlus, path: '/crm-leads' },
            { label: 'أنابيب المبيعات (Pipeline)', icon: ArrowRightLeft, path: '/crm-pipeline' },
            { label: 'إعدادات المراحل', icon: Settings, path: '/crm-stages' },
            { label: 'الأنشطة والمتابعة', icon: CalendarRange, path: '/crm-activities' },
            { label: 'فرق المبيعات', icon: Users, path: '/crm-teams' },
            { label: 'تتبع واتساب', icon: MessageSquare, path: '/whatsapp-tracker' },
            { label: 'الحملات التسويقية', icon: Megaphone, path: '/marketing' },
            { label: 'مركز الاتصالات', icon: Headphones, path: '/communication' },
        ],
    },
    {
        id: 'settings',
        label: 'الإعدادات',
        shortLabel: 'إعدادات',
        icon: Settings,
        color: 'var(--hz-coral)', // Coral/Pink
        glow: 'var(--hz-coral-glow)',
        pages: [
            { label: 'إعدادات المؤسسة', icon: Building2, path: '/settings' },
            { label: 'إدارة المستخدمين', icon: Users, path: '/users' },
            { label: 'الأدوار والصلاحيات', icon: BadgeCheck, path: '/roles' },
            { label: 'إعدادات النظام المالية', icon: Calculator, path: '/financial-settings' },
            { label: 'إعدادات الموارد البشرية', icon: UserCircle, path: '/hr-settings' },
            { label: 'أجهزة البصمة', icon: Hash, path: '/biometric-devices' },
            { label: 'التقارير الإحصائية', icon: FileText, path: '/reports' },
        ],
    },
];

// Mobile bottom bar: one item per section
const MOBILE_SECTIONS = NAV_SECTIONS.map(s => ({
    label: s.shortLabel || s.label,
    icon: s.icon,
    path: s.pages[0].path,
    color: s.color,
}));

/* ══════════════════════════════════════════
   DROPDOWN MENU COMPONENT
══════════════════════════════════════════ */
function SectionDropdown({ section, onClose }: { section: typeof NAV_SECTIONS[0]; onClose: () => void }) {
    const { pathname } = useLocation();

    return (
        <div className="hz-dropdown-panel" style={{ '--hz-drop-color': section.color, '--hz-drop-glow': section.glow } as any}>
            <div className="hz-dropdown-header">
                <section.icon size={16} />
                <span>{section.label}</span>
            </div>
            <div className="hz-dropdown-grid">
                {section.pages.map(page => {
                    const active = pathname === page.path || pathname.startsWith(page.path + '/');
                    return (
                        <NavLink
                            key={page.path}
                            to={page.path}
                            className={`hz-dropdown-item ${active ? 'active' : ''}`}
                            onClick={onClose}
                            title={page.label}
                        >
                            <div className="hz-dropdown-item-icon">
                                <page.icon size={18} strokeWidth={1.8} />
                            </div>
                            <span className="hz-dropdown-item-label">{page.label}</span>
                        </NavLink>
                    );
                })}
            </div>
        </div>
    );
}

/* ══════════════════════════════════════════
   MAIN TOPBAR
══════════════════════════════════════════ */
export function HorizonTopbar() {
    const { pathname } = useLocation();
    const { settings, theme, toggleTheme } = useSettingsStore();
    const user = useAuthStore((state) => state.user);
    const logout = useAuthStore((state) => state.logout);
    const instituteName = settings?.instituteName || 'معهد سلام';
    const [openSection, setOpenSection] = useState<string | null>(null);
    const [searchVal, setSearchVal] = useState('');
    const [mobileOpen, setMobileOpen] = useState(false);
    const [tickerClosed, setTickerClosed] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const navRef = useRef<HTMLDivElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (navRef.current && !navRef.current.contains(e.target as Node)) {
                setOpenSection(null);
            }
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    useEffect(() => { setOpenSection(null); setMobileOpen(false); setDropdownOpen(false); }, [pathname]);

    const crumbSection = NAV_SECTIONS.find(s => s.pages.some(p => pathname.startsWith(p.path)));
    const crumbPage = crumbSection?.pages.find(p => pathname.startsWith(p.path));

    return (
        <>
            <header className="hz-topbar">
                <button className="hz-hamburger" onClick={() => setMobileOpen(v => !v)} aria-label="القائمة">
                    {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                </button>

                <div className="hz-logo">
                    <div className="hz-logo-mark">⚡</div>
                    <div className="hz-logo-text">
                        <span className="hz-logo-name">{instituteName}</span>
                        <span className="hz-logo-badge">Horizon 2030</span>
                    </div>
                </div>

                <div className="hz-topbar-divider" />

                <nav className="hz-topnav" ref={navRef}>
                    {NAV_SECTIONS.map(section => {
                        const sectionActive = section.pages.some(p =>
                            pathname === p.path || (p.path !== '/' && pathname.startsWith(p.path + '/'))
                        );
                        const isOpen = openSection === section.id;
                        return (
                            <div key={section.id} className="hz-navgroup" style={{ '--hz-drop-color': section.color } as any}>
                                <button
                                    className={`hz-navlink ${sectionActive ? 'active' : ''} ${isOpen ? 'open' : ''}`}
                                    onClick={() => setOpenSection(isOpen ? null : section.id)}
                                >
                                    <span className="hz-nav-icon"><section.icon size={15} strokeWidth={2} /></span>
                                    <span className="hz-nav-label">{section.label}</span>
                                    <ChevronDown size={13} className={`hz-nav-chevron ${isOpen ? 'rotated' : ''}`} />
                                </button>
                                {isOpen && <SectionDropdown section={section} onClose={() => setOpenSection(null)} />}
                            </div>
                        );
                    })}
                </nav>

                <div className="hz-topbar-right">
                    <div className="hz-search">
                        <Search size={14} color="var(--hz-text-muted)" />
                        <input
                            type="text"
                            placeholder="بحث..."
                            value={searchVal}
                            onChange={e => setSearchVal(e.target.value)}
                        />
                    </div>
                    <button className="hz-icon-btn" onClick={toggleTheme} title={theme === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي'}>
                        {theme === 'dark' ? <Sun size={18} strokeWidth={2} /> : <Moon size={18} strokeWidth={2} />}
                    </button>
                    <button className="hz-icon-btn">
                        <Bell size={18} strokeWidth={2} />
                        <span className="hz-notif-dot" />
                    </button>
                    <div className="hz-user-chip-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
                        <div className="hz-user-chip" onClick={() => setDropdownOpen(!dropdownOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div className="hz-user-avatar">
                                {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim().charAt(0).toUpperCase() || user.username.charAt(0).toUpperCase() : 'م'}
                            </div>
                            <span className="hz-user-name">
                                {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'الإدارة'}
                            </span>
                            <ChevronDown size={14} style={{ opacity: 0.6, transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s' }} />
                        </div>

                        {dropdownOpen && (
                            <div className="hz-user-dropdown-panel" style={{
                                position: 'absolute',
                                top: '120%',
                                left: '0',
                                width: '220px',
                                background: '#111827',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '8px',
                                boxShadow: '0 12px 30px rgba(0,0,0,0.6)',
                                zIndex: 9999,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '4px'
                            }}>
                                <div style={{
                                    padding: '8px 12px',
                                    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                                    marginBottom: '4px'
                                }}>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FFFFFF' }}>
                                        {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username : 'الإدارة'}
                                    </div>
                                    <div style={{ fontSize: '0.75rem', color: '#9CA3AF', marginTop: '2px' }}>
                                        {user?.email || 'admin@سلام.com'}
                                    </div>
                                </div>
                                <NavLink to="/settings" onClick={() => setDropdownOpen(false)} style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '10px',
                                    padding: '10px 12px',
                                    color: '#F3F4F6',
                                    textDecoration: 'none',
                                    fontSize: '0.85rem',
                                    borderRadius: '8px',
                                    transition: 'background 0.2s'
                                }} 
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                >
                                    <Settings size={14} />
                                    <span>إعدادات النظام</span>
                                </NavLink>
                                <button onClick={() => { setDropdownOpen(false); logout(); }} style={{
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
                                    transition: 'background 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                >
                                    <X size={14} />
                                    <span>تسجيل الخروج</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="hz-subnav">
                <div className="hz-breadcrumb">
                    <span className="hz-breadcrumb-item">
                        <Home size={12} style={{ display: 'inline', marginLeft: '4px' }} />
                        {crumbSection?.label || 'الرئيسية'}
                    </span>
                    {crumbPage && crumbPage.path !== '/dashboard' && <>
                        <ChevronLeft size={12} className="hz-breadcrumb-sep" />
                        <span className="hz-breadcrumb-item active" style={{ color: crumbSection?.color }}>
                            {crumbPage.label}
                        </span>
                    </>}
                </div>

                {settings?.announcementTicker && !tickerClosed && (
                    <div className="hz-announcement-ticker-container visible-mobile">
                        <Megaphone size={14} className="hz-ticker-icon" />
                        <div className="hz-ticker-scroll-area">
                            <div className="hz-ticker-content">
                                {settings.announcementTicker}
                            </div>
                        </div>
                        <button className="hz-ticker-close" onClick={() => setTickerClosed(true)}>
                            <X size={14} />
                        </button>
                    </div>
                )}
            </div>

            {mobileOpen && (
                <div className="hz-mobile-drawer">
                    <div className="hz-mobile-drawer-inner">
                        {NAV_SECTIONS.map(section => (
                            <div key={section.id} className="hz-drawer-section">
                                <div className="hz-drawer-section-title" style={{ color: section.color }}>
                                    <section.icon size={14} />
                                    {section.label}
                                </div>
                                {section.pages.map(page => (
                                    <NavLink
                                        key={page.path}
                                        to={page.path}
                                        className={({ isActive }) => `hz-drawer-item ${isActive ? 'active' : ''}`}
                                        onClick={() => setMobileOpen(false)}
                                    >
                                        <page.icon size={16} strokeWidth={1.8} />
                                        <span>{page.label}</span>
                                    </NavLink>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
}

export function HorizonMobileBar() {
    const { pathname } = useLocation();
    const [openSection, setOpenSection] = useState<string | null>(null);

    useEffect(() => { setOpenSection(null); }, [pathname]);

    return (
        <>
            {openSection && (
                <div className="hz-mobile-panel-overlay" onClick={() => setOpenSection(null)}>
                    <div className="hz-mobile-panel" onClick={e => e.stopPropagation()}>
                        <div className="hz-mobile-panel-header">
                            <span className="hz-mobile-panel-title">
                                {NAV_SECTIONS.find(s => s.id === openSection)?.label}
                            </span>
                            <button className="hz-hamburger" style={{ display: 'flex' }} onClick={() => setOpenSection(null)}>
                                <X size={20} />
                            </button>
                        </div>
                        <div className="hz-mobile-panel-grid">
                            {NAV_SECTIONS.find(s => s.id === openSection)?.pages.map(page => {
                                const active = pathname === page.path || (page.path !== '/' && pathname.startsWith(page.path + '/'));
                                return (
                                    <NavLink
                                        key={page.path}
                                        to={page.path}
                                        className={`hz-mobile-panel-item ${active ? 'active' : ''}`}
                                        onClick={() => setOpenSection(null)}
                                    >
                                        <div className="hz-mobile-panel-icon">
                                            <page.icon size={22} strokeWidth={1.5} />
                                        </div>
                                        <span>{page.label}</span>
                                    </NavLink>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <nav className="hz-mobile-bar" role="navigation">
                {MOBILE_SECTIONS.map(section => {
                    const fullSection = NAV_SECTIONS.find(s => s.id === section.label || s.shortLabel === section.label || s.label === section.label);
                    const isActive = fullSection?.pages.some(p => pathname === p.path || (p.path !== '/' && pathname.startsWith(p.path + '/')));
                    const isOpen = openSection === fullSection?.id;

                    return (
                        <div
                            key={section.label}
                            className={`hz-mobile-navitem ${isActive || isOpen ? 'active' : ''}`}
                            style={(isActive || isOpen ? { '--hz-active-color': section.color } : {}) as any}
                            onClick={() => setOpenSection(isOpen ? null : fullSection?.id || null)}
                        >
                            <div className="hz-mobile-nav-icon">
                                <section.icon size={22} strokeWidth={1.7} />
                            </div>
                            <span className="hz-mobile-nav-label">{section.label}</span>
                        </div>
                    );
                })}
            </nav>
        </>
    );
}
