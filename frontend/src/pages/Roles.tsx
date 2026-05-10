import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import usersService, { Role, Permission } from '../services/users.service';
import { RoleFormModal } from '../components/RoleFormModal';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function Roles() {
    // --- STATE ---
    const [roles, setRoles] = useState<Role[]>([]);
    const [filteredRoles, setFilteredRoles] = useState<Role[]>([]);
    const [groupedPermissions, setGroupedPermissions] = useState<Record<string, Permission[]>>({});

    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<'all' | 'system' | 'custom'>('all');

    // UI State
    const [showModal, setShowModal] = useState(false);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        permissionIds: [] as string[],
        isSystemRole: false
    });

    // Feedback
    const [toast, setToast] = useState<{ msg: string, type: ToastType } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        id: string;
        title: string;
        message: string;
    } | null>(null);

    // --- EFFECT: DATA FETCHING ---
    useEffect(() => {
        fetchData();
    }, []);

    useEffect(() => {
        let filtered = [...roles];
        if (searchTerm) {
            filtered = filtered.filter(r =>
                r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (r.description && r.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }
        if (filterType === 'system') {
            filtered = filtered.filter(r => r.isSystemRole);
        } else if (filterType === 'custom') {
            filtered = filtered.filter(r => !r.isSystemRole);
        }
        setFilteredRoles(filtered);
    }, [roles, searchTerm, filterType]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                usersService.getRoles(),
                usersService.getPermissions()
            ]);

            if (rolesRes.success && rolesRes.data?.roles) {
                setRoles(rolesRes.data.roles);
            }

            if (permsRes.success && permsRes.data?.permissions) {
                groupPermissions(permsRes.data.permissions);
            }
        } catch (err: any) {
            console.error('Fetch Error:', err);
            setToast({ msg: '❌ فشل تحميل الأدوار', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const groupPermissions = (perms: Permission[]) => {
        const grouped: Record<string, Permission[]> = {};
        perms.forEach(p => {
            if (!grouped[p.resource]) grouped[p.resource] = [];
            grouped[p.resource].push(p);
        });
        setGroupedPermissions(grouped);
    };

    // --- HANDLERS ---
    const handleCreate = () => {
        setIsEditing(false);
        setSelectedRole(null);
        setFormData({ name: '', description: '', permissionIds: [], isSystemRole: false });
        setShowModal(true);
    };

    const handleEdit = (role: Role) => {
        setIsEditing(true);
        setSelectedRole(role);
        setFormData({
            name: role.name,
            description: role.description || '',
            permissionIds: role.rolePermissions.map(rp => rp.permission.id),
            isSystemRole: role.isSystemRole
        });
        setShowModal(true);
    };

    const handleDeleteClick = (role: Role) => {
        if (role.isSystemRole) {
            setToast({ msg: '⛔ لا يمكن حذف أدوار النظام الأساسية', type: 'error' });
            return;
        }
        if ((role._count?.userRoles || 0) > 0) {
            setToast({ msg: `⛔ هذا الدور مسند إلى ${role._count?.userRoles} مستخدم.`, type: 'error' });
            return;
        }
        setConfirmDialog({
            id: role.id,
            title: 'حذف الدور',
            message: `هل أنت متأكد من حذف دور "${role.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
        });
    };

    const confirmDelete = async () => {
        if (!confirmDialog) return;
        try {
            await usersService.deleteRole(confirmDialog.id);
            setToast({ msg: '✅ تم حذف الدور بنجاح', type: 'success' });
            fetchData();
        } catch (err: any) {
            setToast({ msg: '❌ فشل حذف الدور', type: 'error' });
        } finally {
            setConfirmDialog(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && selectedRole) {
                await usersService.updateRole(selectedRole.id, formData);
                setToast({ msg: '✅ تم تحديث الدور', type: 'success' });
            } else {
                await usersService.createRole(formData);
                setToast({ msg: '✅ تم إنشاء الدور', type: 'success' });
            }
            setShowModal(false);
            fetchData();
        } catch (err: any) {
            setToast({ msg: '❌ حدث خطأ أثناء الحفظ', type: 'error' });
        }
    };

    const togglePermission = (permId: string) => {
        setFormData(prev => {
            const exists = prev.permissionIds.includes(permId);
            return {
                ...prev,
                permissionIds: exists
                    ? prev.permissionIds.filter(id => id !== permId)
                    : [...prev.permissionIds, permId]
            };
        });
    };

    if (loading && roles.length === 0) {
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
                        <div className="branding-icon" style={{ background: 'linear-gradient(135deg, #ECC94B 0%, #D69E2E 100%)' }}>🔑</div>
                        <div className="branding-text">
                            <h1>إدارة الأدوار</h1>
                            <p className="hide-on-mobile">تعريف الصلاحيات وهيكل الوصول للنظام</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="view-switcher hide-on-mobile">
                            <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}>▦</button>
                            <button onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'active' : ''}>☰</button>
                        </div>
                        <div className="header-pills hide-on-mobile">
                            <span className="pill pill-yellow">النظام: {roles.filter(r => r.isSystemRole).length}</span>
                        </div>
                        <button onClick={handleCreate} className="btn-modern btn-primary-gradient orange">
                            <span className="plus-icon">+</span>
                            <span className="hide-on-mobile">إضافة دور</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* --- Main Content --- */}
            <main className="container-wide main-content">
                {/* Desktop Search & Filters Toolbar */}
                <section className="filters-toolbar hide-on-mobile">
                    <div className="search-box-wrapper">
                        <span className="search-icon">🔍</span>
                        <input type="text" placeholder="البحث باسم الدور أو الوصف..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="filters-group">
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)}>
                            <option value="all">النوع: الكل</option>
                            <option value="system">أدوار النظام</option>
                            <option value="custom">أدوار مخصصة</option>
                        </select>
                        <div className="divider-v"></div>
                        <button onClick={() => { setSearchTerm(''); setFilterType('all'); }} className="btn-icon-label"><span>↻</span> إعادة ضبط</button>
                    </div>
                </section>

                {/* Mobile Search Bar Only */}
                <section className="show-on-mobile mobile-search-area">
                    <div className="search-box-wrapper">
                        <input type="text" placeholder="بحث عن دور..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <button onClick={() => setShowMobileFilters(true)} className="btn-filter-toggle">⚙️</button>
                    </div>
                </section>

                {/* Data Display */}
                <div className={`content-transition-wrapper ${viewMode}`}>
                    {filteredRoles.length === 0 ? (
                        <div className="empty-state-modern">
                            <div className="empty-icon">🔑</div>
                            <h2>لا توجد أدوار مطابقة</h2>
                            <p>حاول تغيير معايير البحث أو إضافة أدوار جديدة</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div key="grid-view" className="programs-grid-2026">
                            {filteredRoles.map(role => (
                                <div key={role.id} className={`next-gen-card ${role.isSystemRole ? 'system-active' : ''}`}>
                                    <div className="card-top">
                                        <div className="role-icon-box-2026">
                                            {getRoleIcon(role.name)}
                                        </div>
                                        <div className="card-actions-mini">
                                            <button onClick={() => handleEdit(role)}>✎</button>
                                            {!role.isSystemRole && (
                                                <button onClick={() => handleDeleteClick(role)} className="danger">×</button>
                                            )}
                                        </div>
                                    </div>
                                    <div className="card-info">
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <h3 className="card-title">{role.name}</h3>
                                            {role.isSystemRole && <span className="badge-pill-yellow">نظام</span>}
                                        </div>
                                        <p className="card-subtitle">{role.description || 'لا يوجد وصف متاح'}</p>
                                    </div>
                                    <div className="card-stats-grid">
                                        <div className="stat-item">
                                            <span className="stat-val">{role.rolePermissions.length}</span>
                                            <span className="stat-lbl">صلاحية</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-val">{role._count?.userRoles || 0}</span>
                                            <span className="stat-lbl">مستخدم</span>
                                        </div>
                                        <div className="stat-item highlight">
                                            <span className="stat-val">{role.isSystemRole ? '🛡️' : '✏️'}</span>
                                            <span className="stat-lbl">النوع</span>
                                        </div>
                                    </div>
                                    <div className="card-footer">
                                        <span className={`status-dot ${role.isSystemRole ? 'active' : 'inactive'}`}></span>
                                        <span className="status-text">{role.isSystemRole ? 'دور نظام محمي' : 'دور مخصص'}</span>
                                        <button onClick={() => handleEdit(role)} style={{
                                            marginRight: 'auto',
                                            background: 'var(--orange-light)',
                                            color: 'var(--orange-primary)',
                                            border: 'none',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            fontWeight: '800',
                                            cursor: 'pointer'
                                        }}>الصلاحيات ←</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div key="table-view" className="next-gen-table-container">
                            <table className="modern-data-table">
                                <thead>
                                    <tr>
                                        <th>اسم الدور</th>
                                        <th className="hide-on-mobile">الوصف</th>
                                        <th className="text-center">الصلاحيات</th>
                                        <th className="text-center">المستخدمين</th>
                                        <th className="text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRoles.map(role => (
                                        <tr key={role.id}>
                                            <td className="w-250">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div className="avatar-circle-sm">
                                                        {getRoleIcon(role.name)}
                                                    </div>
                                                    <div>
                                                        <div className="table-primary-text">{role.name}</div>
                                                        {role.isSystemRole && <span className="badge-pill-yellow" style={{ fontSize: '0.65rem' }}>دور نظام</span>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hide-on-mobile">
                                                <div className="table-secondary-text" style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {role.description || '-'}
                                                </div>
                                            </td>
                                            <td className="text-center w-120">
                                                <span className="code-pill blue">{role.rolePermissions.length}</span>
                                            </td>
                                            <td className="text-center w-120">
                                                <span className="count-pill">{role._count?.userRoles || 0}</span>
                                            </td>
                                            <td className="text-center w-150">
                                                <div className="table-row-actions">
                                                    <button onClick={() => handleEdit(role)} className="edit-btn">تعديل</button>
                                                    {!role.isSystemRole && (
                                                        <button onClick={() => handleDeleteClick(role)} className="delete-btn">حذف</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* --- Modals Rendered via React Portals strictly to document.body to bypass transformed relative container flows --- */}
            {showModal && createPortal(
                <RoleFormModal
                    show={showModal}
                    isEditing={isEditing}
                    formData={formData}
                    groupedPermissions={groupedPermissions}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleSubmit}
                    onChange={(f, v) => setFormData({ ...formData, [f]: v })}
                    onTogglePermission={togglePermission}
                />,
                document.body
            )}

            {showMobileFilters && (
                <div className="drawer-overlay" onClick={() => setShowMobileFilters(false)}>
                    <div className="drawer-content" onClick={e => e.stopPropagation()}>
                        <div className="drawer-header">
                            <h2>⚙️ الفلاتر</h2>
                            <button onClick={() => setShowMobileFilters(false)}>×</button>
                        </div>
                        <div className="drawer-body">
                            <div className="drawer-section">
                                <label>نوع الدور</label>
                                <select value={filterType} onChange={e => setFilterType(e.target.value as any)}>
                                    <option value="all">كافة الأدوار</option>
                                    <option value="system">أدوار النظام</option>
                                    <option value="custom">أدوار مخصصة</option>
                                </select>
                            </div>
                        </div>
                        <div className="drawer-footer">
                            <button onClick={() => { setSearchTerm(''); setFilterType('all'); setShowMobileFilters(false); }} className="btn-reset">إعادة تعيين</button>
                            <button onClick={() => setShowMobileFilters(false)} className="btn-apply orange">تطبيق</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && createPortal(
                <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />,
                document.body
            )}

            {confirmDialog && createPortal(
                <ConfirmDialog
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    onConfirm={confirmDelete}
                    onCancel={() => setConfirmDialog(null)}
                />,
                document.body
            )}

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
                    --shadow- premium: 0 12px 30px rgba(0, 0, 0, 0.08);
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
                .view-switcher { background: #F1F5F9; padding: 0.25rem; border-radius: 12px; display: flex; gap: 0.25rem; }
                .view-switcher button { background: transparent; border: none; width: 36px; height: 36px; border-radius: 10px; cursor: pointer; color: #64748B; font-size: 1.1rem; transition: all 0.2s; }
                .view-switcher button.active { background: white; color: var(--primary); box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
                
                .pill { padding: 0.35rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 800; }
                .pill-yellow { background: #FEFCBF; color: #B7791F; }
                
                .btn-modern {
                    display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.5rem;
                    border-radius: 14px; font-weight: 800; border: none; cursor: pointer; transition: all 0.2s;
                }
                .btn-primary-gradient.orange {
                    background: linear-gradient(135deg, #DD6B20 0%, #ED8936 100%); color: white;
                    box-shadow: 0 10px 15px -3px rgba(221, 107, 32, 0.3);
                }
                .btn-primary-gradient:hover { transform: translateY(-2px); filter: brightness(1.1); }
                
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
                
                /* CARDS */
                .programs-grid-2026 { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
                .next-gen-card {
                    background: white; border-radius: var(--radius-lg); padding: 1.5rem;
                    border: 1px solid #EDF2F7; transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.1);
                    position: relative; overflow: hidden; display: flex; flex-direction: column;
                    box-shadow: var(--shadow-sm);
                }
                .next-gen-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-premium); border-color: #ECC94B; }
                
                .role-icon-box-2026 {
                    width: 52px; height: 52px; border-radius: 14px;
                    background: linear-gradient(135deg, #ECC94B 0%, #D69E2E 100%);
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-weight: 900; font-size: 1.5rem;
                }
                
                .card-top { display: flex; justify-content: space-between; margin-bottom: 1.25rem; }
                .card-actions-mini button { background: transparent; border: none; font-size: 1.1rem; cursor: pointer; margin-right: 0.5rem; color: var(--text-muted); transition: color 0.2s; }
                .card-actions-mini button:hover { color: var(--primary); }
                .card-actions-mini button.danger:hover { color: #E53E3E; }
                
                .card-title { font-size: 1.125rem; font-weight: 800; color: var(--text-main); margin: 0 0 0.25rem 0; }
                .card-subtitle { font-size: 0.8125rem; color: var(--text-muted); margin: 0 0 1rem 0; }
                .card-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
                .tag-level { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 600; background: #EBF8FF; color: #2B6CB0; }
                .tag-body { font-size: 0.7rem; padding: 0.2rem 0.6rem; border-radius: 6px; font-weight: 600; background: #F7FAFC; color: #4A5568; border: 1px solid #E2E8F0; }
                
                .card-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; padding: 1rem; background: #F8FAFC; border-radius: var(--radius-md); margin-bottom: 1.25rem; }
                .stat-item { display: flex; flex-direction: column; align-items: center; }
                .stat-val { font-size: 1.125rem; font-weight: 800; color: var(--text-main); }
                .stat-lbl { font-size: 0.625rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
                .stat-item.highlight .stat-val { color: #B7791F; }
                
                .card-footer { margin-top: auto; display: flex; align-items: center; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid #F1F5F9; }
                .status-dot { width: 8px; height: 8px; border-radius: 50%; }
                .status-dot.active { background: #38A169; box-shadow: 0 0 8px #38A169; }
                .status-dot.inactive { background: #CBD5E0; }
                .status-text { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
                
                .badge-pill-yellow { background: #FEFCBF; color: #B7791F; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 700; }
                
                /* TABLE */
                .next-gen-table-container { background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-premium); overflow: hidden; margin-top: 2rem; }
                .modern-data-table { width: 100%; border-collapse: collapse; }
                .modern-data-table th { background: #F8FAFC; padding: 1.25rem 1.5rem; text-align: right; font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); border-bottom: 1px solid #EDF2F7; }
                .modern-data-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
                .table-primary-text { font-weight: 700; color: var(--text-main); }
                .table-secondary-text { font-size: 0.75rem; color: var(--text-muted); }
                .code-pill { background: #EDF2F7; padding: 0.25rem 0.625rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; color: var(--primary); }
                .code-pill.blue { background: #EBF8FF; color: #3182CE; }
                .avatar-circle-sm { width: 40px; height: 40px; border-radius: 10px; background: #F1F5F9; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--primary); }
                
                .table-row-actions { display: flex; gap: 0.5rem; }
                .edit-btn, .delete-btn { padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; }
                .edit-btn { background: var(--primary-light); color: var(--primary); }
                .delete-btn { background: #FFF5F5; color: #E53E3E; }
                .edit-btn:hover { background: var(--primary); color: white; }
                
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
                    .roles-grid-2026 { grid-template-columns: 1fr; }
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

function getRoleIcon(name: string) {
    const n = name.toLowerCase();
    if (n.includes('admin')) return '👮‍♂️';
    if (n.includes('instructor')) return '👨‍🏫';
    if (n.includes('student')) return '👨‍🎓';
    if (n.includes('manager')) return '👔';
    return '👤';
}
