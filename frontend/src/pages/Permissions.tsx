import { useState, useEffect } from 'react';
import usersService, { Permission } from '../services/users.service';
import { Toast, ToastType } from '../components/Toast';

export default function Permissions() {
    // --- STATE ---
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [filteredPermissions, setFilteredPermissions] = useState<Permission[]>([]);
    const [resources, setResources] = useState<string[]>([]);

    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterResource, setFilterResource] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Toast
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    // --- EFFECTS ---
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = [...permissions];
        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
                p.resource.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterResource) {
            filtered = filtered.filter(p => p.resource === filterResource);
        }
        setFilteredPermissions(filtered);
    }, [permissions, searchTerm, filterResource]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const permsRes = await usersService.getPermissions();

            if (permsRes.success && permsRes.data?.permissions) {
                setPermissions(permsRes.data.permissions);
                const uniqueResources = [...new Set(permsRes.data.permissions.map((p: any) => p.resource))] as string[];
                setResources(uniqueResources);
            }
        } catch (error) {
            console.error('Error fetching permissions:', error);
            setToast({ type: 'error', message: '❌ فشل في تحميل الصلاحيات' });
        } finally {
            setLoading(false);
        }
    };

    const groupedPermissions: Record<string, Permission[]> = {};
    filteredPermissions.forEach(p => {
        if (!groupedPermissions[p.resource]) {
            groupedPermissions[p.resource] = [];
        }
        groupedPermissions[p.resource].push(p);
    });

    if (loading && permissions.length === 0) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#F8FAFC' }}>
                <div className="next-gen-loader"></div>
            </div>
        );
    }

    return (
        <div className="next-gen-page-container">
            {/* --- Premium Floating Header --- */}
            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon" style={{ background: 'linear-gradient(135deg, #4299E1 0%, #3182CE 100%)' }}>🛡️</div>
                        <div className="branding-text">
                            <h1>مستودع الصلاحيات</h1>
                            <p className="hide-on-mobile">قائمة العمليات المتاحة وهيكل التحكم في النظام</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="header-pills hide-on-mobile">
                            <span className="pill pill-blue">الموارد: {resources.length}</span>
                            <span className="pill pill-green">الصلاحيات: {permissions.length}</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="container-wide main-content">
                {/* Desktop Search & Filters Toolbar */}
                <section className="filters-toolbar hide-on-mobile">
                    <div className="search-box-wrapper">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="البحث بوصف الصلاحية أو المورد..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="filters-group">
                        <select value={filterResource} onChange={(e) => setFilterResource(e.target.value)}>
                            <option value="">كافة الموارد</option>
                            {resources.map(r => <option key={r} value={r}>{formatResourceName(r)}</option>)}
                        </select>
                        <div className="divider-v"></div>
                        <button onClick={() => { setSearchTerm(''); setFilterResource(''); }} className="btn-icon-label"><span>↻</span> إعادة ضبط</button>
                    </div>
                </section>

                {/* Mobile Search Bar Only */}
                <section className="show-on-mobile mobile-search-area">
                    <div className="search-box-wrapper">
                        <input type="text" placeholder="بحث عن صلاحية..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <button onClick={() => setShowMobileFilters(true)} className="btn-filter-toggle">⚙️</button>
                    </div>
                </section>

                {/* Permissions Grid */}
                <div className="content-transition-wrapper">
                    {Object.keys(groupedPermissions).length === 0 ? (
                        <div className="empty-state-modern">
                            <div className="empty-icon">🛡️</div>
                            <h2>لا توجد نتائج مطابقة</h2>
                            <p>حاول تغيير معايير البحث أو تحديث قاعدة البيانات</p>
                        </div>
                    ) : (
                        <div className="resources-grid-2026">
                            {Object.entries(groupedPermissions).map(([resource, perms]) => (
                                <div key={resource} className="resource-card-2026">
                                    <div className="resource-header">
                                        <div className="resource-icon-glass">{getResourceIcon(resource)}</div>
                                        <div className="resource-title-area">
                                            <h3>{formatResourceName(resource)}</h3>
                                            <span className="resource-id-tag">{resource}</span>
                                        </div>
                                    </div>

                                    <div className="permissions-matrix-2026">
                                        {perms.map(p => (
                                            <div key={p.id} className="permission-item-2026">
                                                <div className={`perm-indicator ${getActionColor(p.action)}`}></div>
                                                <div className="perm-info-2026">
                                                    <span className="perm-action-tag">{p.action}</span>
                                                    <span className="perm-desc-text">{p.description || 'صلاحية نظام افتراضية'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {showMobileFilters && (
                <div className="drawer-overlay" onClick={() => setShowMobileFilters(false)}>
                    <div className="drawer-content" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header">
                            <h2>⚙️ الفلاتر</h2>
                            <button onClick={() => setShowMobileFilters(false)}>×</button>
                        </div>
                        <div className="drawer-body">
                            <div className="drawer-section">
                                <label>المورد (القسم)</label>
                                <select value={filterResource} onChange={e => setFilterResource(e.target.value)}>
                                    <option value="">كافة الموارد</option>
                                    {resources.map(r => <option key={r} value={r}>{formatResourceName(r)}</option>)}
                                </select>
                            </div>
                        </div>
                        <div className="drawer-footer">
                            <button onClick={() => { setSearchTerm(''); setFilterResource(''); setShowMobileFilters(false); }} className="btn-reset">إعادة تعيين</button>
                            <button onClick={() => setShowMobileFilters(false)} className="btn-apply orange">تطبيق</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            <style dangerouslySetInnerHTML={{
                __html: `
                :root {
                    --orange-primary: #DD6B20;
                    --orange-light: #FEEBC8;
                    --orange-dark: #7B341E;
                    --primary: var(--orange-primary);
                    --primary-light: var(--orange-light);
                    --primary-dark: var(--orange-dark);
                    --accent: #3182CE;
                    --bg-page: #F8FAFC;
                    --surface: #FFFFFF;
                    --text-main: #1A202C;
                    --text-muted: #718096;
                    --glass-bg: rgba(255, 255, 255, 0.85);
                    --shadow-sm: 0 2px 4px rgba(0,0,0,0.05);
                    --shadow-premium: 0 12px 30px rgba(0, 0, 0, 0.08);
                    --radius-lg: 16px;
                    --radius-md: 12px;
                }

                .next-gen-page-container { background: #F8FAFC; min-height: 100vh; padding-bottom: 3rem; direction: rtl; }
                .show-on-mobile { display: none; }
                
                /* HEADER */
                .glass-header {
                    position: sticky; top: 64px; z-index: 1000;
                    background: rgba(255, 255, 255, 0.85); backdrop-filter: blur(12px);
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 20px; margin: 0 1.5rem; height: 85px;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    display: flex; align-items: center;
                }
                .header-content { display: flex; justify-content: space-between; align-items: center; width: 100%; padding: 0 2rem; }
                .header-branding { display: flex; align-items: center; gap: 1.25rem; }
                .branding-icon { width: 52px; height: 52px; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; color: white; }
                .branding-text h1 { font-size: 1.5rem; font-weight: 900; margin: 0; color: #1A202C; }
                .branding-text p { font-size: 0.875rem; color: #718096; margin: 0; }
                
                .header-actions { display: flex; align-items: center; gap: 1.5rem; }
                .pill { padding: 0.35rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 800; }
                .pill-blue { background: #EBF8FF; color: #3182CE; }
                .pill-green { background: #DCFCE7; color: #166534; }
                
                /* TOOLBAR */
                .container-wide { max-width: 1400px; margin: 0 auto; width: 100%; }
                .main-content { padding: 2rem 1.5rem; }
                .filters-toolbar {
                    display: flex; justify-content: space-between; align-items: center;
                    margin-bottom: 2rem; background: white; padding: 1rem; border-radius: 16px;
                    border: 1px solid #EDF2F7; box-shadow: var(--shadow-premium);
                }
                .search-box-wrapper { position: relative; flex: 1; max-width: 400px; }
                .search-icon { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); color: #A0AEC0; }
                .search-box-wrapper input { width: 100%; height: 48px; padding: 0 3rem 0 1rem; border: 2px solid #F1F5F9; border-radius: 12px; transition: all 0.2s; }
                .search-box-wrapper input:focus { border-color: var(--primary); outline: none; background: #FFF; }
                
                .filters-group { display: flex; align-items: center; gap: 1rem; }
                .filters-group select { height: 48px; padding: 0 1rem; border: 2px solid #F1F5F9; border-radius: 12px; background: white; color: #4A5568; font-weight: 600; cursor: pointer; }
                .divider-v { width: 1px; height: 32px; background: #E2E8F0; }
                .btn-icon-label { background: transparent; border: none; color: var(--primary); font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
                
                /* RESOURCES GRID */
                .resources-grid-2026 { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 1.5rem; }
                .resource-card-2026 { background: white; border-radius: 24px; border: 1px solid #EDF2F7; padding: 1.75rem; transition: all 0.3s ease; box-shadow: var(--shadow-premium); }
                .resource-card-2026:hover { transform: translateY(-5px); box-shadow: 0 20px 40px rgba(0,0,0,0.06); border-color: #BEE3F8; }
                
                .resource-header { display: flex; gap: 1.25rem; align-items: center; border-bottom: 1px solid #F7FAFC; padding-bottom: 1.25rem; margin-bottom: 1.25rem; }
                .resource-icon-glass { width: 52px; height: 52px; border-radius: 16px; background: #F8FAFC; display: flex; align-items: center; justify-content: center; font-size: 1.75rem; }
                .resource-title-area h3 { margin: 0; font-size: 1.15rem; font-weight: 900; color: #2D3748; }
                .resource-id-tag { font-size: 0.75rem; color: #A0AEC0; font-family: monospace; letter-spacing: 0.5px; }
                
                .permissions-matrix-2026 { display: grid; grid-template-columns: 1fr; gap: 0.875rem; }
                .permission-item-2026 { display: flex; gap: 14px; align-items: flex-start; background: #F8FAFC; padding: 12px; border-radius: 14px; border: 1.2px solid transparent; transition: all 0.2s; }
                .permission-item-2026:hover { background: #FFF; border-color: #E2E8F0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
                
                .perm-indicator { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
                .perm-indicator.read { background: #48BB78; box-shadow: 0 0 0 3px #C6F6D5; }
                .perm-indicator.create { background: #4299E1; box-shadow: 0 0 0 3px #BEE3F8; }
                .perm-indicator.update { background: #D69E2E; box-shadow: 0 0 0 3px #FEFCBF; }
                .perm-indicator.delete { background: #E53E3E; box-shadow: 0 0 0 3px #FED7D7; }
                .perm-indicator.manage { background: #805AD5; box-shadow: 0 0 0 3px #E9D8FD; }
                
                .perm-info-2026 { display: flex; flex-direction: column; gap: 2px; }
                .perm-action-tag { font-size: 0.85rem; font-weight: 900; color: #1A202C; text-transform: uppercase; }
                .perm-desc-text { font-size: 0.75rem; color: #718096; line-height: 1.3; }

                /* UTILS */
                .next-gen-loader { width: 50px; height: 50px; border: 4px solid var(--primary-light); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                
                    .glass-header { 
                        margin: 0.5rem; 
                        height: 70px; 
                        top: 64px;
                        border-radius: 15px;
                        z-index: 1000;
                    }
                    .header-content { padding: 0 1rem; }
                    .branding-icon { width: 42px; height: 42px; font-size: 1.25rem; }
                    .main-content { padding: 1rem; }
                    .resources-grid-2026 { grid-template-columns: 1fr; }
                    .hide-on-mobile { display: none !important; }
                    .show-on-mobile { display: block !important; }

                    .btn-filter-toggle {
                        width: 48px;
                        height: 48px;
                        background: white;
                        border: 1px solid #E2E8F0;
                        border-radius: 12px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        font-size: 1.25rem;
                        cursor: pointer;
                        transition: all 0.2s;
                        box-shadow: var(--shadow-sm);
                        margin-right: 8px;
                    }
                }

                .drawer-overlay {
                    position: fixed; inset: 0; background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(8px); z-index: 3000; display: flex; justify-content: flex-start;
                    animation: fadeIn 0.3s ease;
                }
                .drawer-content {
                    width: 85%; max-width: 320px; background: white; height: 100%;
                    padding: 2.5rem 1.5rem; display: flex; flex-direction: column;
                    box-shadow: -10px 0 40px rgba(0,0,0,0.15);
                    animation: slideInRTL 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    border-left: 1px solid rgba(226, 232, 240, 0.8);
                }
                @keyframes slideInRTL { from { transform: translateX(100%); } to { transform: translateX(0); } }
                .drawer-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; padding-bottom: 1.25rem; border-bottom: 1px solid #F1F5F9; }
                .drawer-header h2 { font-size: 1.25rem; font-weight: 800; margin: 0; color: #1A202C; display: flex; align-items: center; gap: 0.75rem; }
                .drawer-header button { background: #F8FAFC; border: none; width: 36px; height: 36px; border-radius: 50%; font-size: 1.25rem; color: #718096; cursor: pointer; }
                .drawer-body { flex: 1; overflow-y: auto; }
                .drawer-section { margin-bottom: 2rem; }
                .drawer-section label { display: block; font-size: 0.75rem; font-weight: 800; color: #DD6B20; text-transform: uppercase; margin-bottom: 1rem; }
                .drawer-section select { width: 100%; height: 52px; padding: 0 1rem; border: 2px solid #EDF2F7; border-radius: 14px; background: #F8FAFC; font-weight: 600; }
                .drawer-footer { margin-top: auto; display: flex; flex-direction: column; gap: 0.75rem; padding-top: 1.5rem; }
                .btn-reset { height: 50px; background: #F1F5F9; border: none; border-radius: 14px; color: #718096; font-weight: 700; cursor: pointer; }
                .btn-apply { height: 52px; color: white; border: none; border-radius: 14px; font-weight: 700; cursor: pointer; }
                .btn-apply.orange { background: linear-gradient(135deg, #DD6B20 0%, #ED8936 100%); }
            ` }} />
        </div>
    );
}

// Helpers
function getResourceIcon(resource: string): string {
    const icons: Record<string, string> = {
        users: '👤',
        roles: '🔑',
        permissions: '🛡️',
        students: '🎓',
        academic: '📚',
        attendance: '📅',
        assignments: '📝',
        settings: '⚙️',
        programs: '🏫',
        units: '📖',
        classes: '🏫'
    };
    return icons[resource] || '📦';
}

function formatResourceName(resource: string): string {
    const names: Record<string, string> = {
        users: 'المستخدمين',
        roles: 'الأدوار',
        permissions: 'الصلاحيات',
        students: 'الطلاب',
        academic: 'الشؤون الأكاديمية',
        attendance: 'الحضور والغياب',
        assignments: 'الواجبات',
        settings: 'الإعدادات',
        programs: 'البرامج الدراسية',
        units: 'الوحدات التعليمية',
        classes: 'الفصول الدراسية'
    };
    return names[resource] || resource;
}

function getActionColor(action: string): string {
    if (action.includes('read')) return 'read';
    if (action.includes('create')) return 'create';
    if (action.includes('update')) return 'update';
    if (action.includes('delete')) return 'delete';
    if (action.includes('manage')) return 'manage';
    return 'read';
}
