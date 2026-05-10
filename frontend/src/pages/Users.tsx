import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import usersService, { User, Role } from '../services/users.service';
import { UserFormModal } from '../components/UserFormModal';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

export default function Users() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);

    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

    // UI States
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [formData, setFormData] = useState<any>({
        username: '', email: '', password: '', firstName: '', lastName: '', roleId: '', isActive: true, phone: '', telegramUserId: '', telegramUsername: ''
    });
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Password Reset States
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetUserId, setResetUserId] = useState<string | null>(null);
    const [resetUsername, setResetUsername] = useState<string>('');
    const [newPassword, setNewPassword] = useState('');

    const [toast, setToast] = useState<{ msg: string, type: ToastType } | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);

    useEffect(() => {
        fetchAllData();
    }, []);

    useEffect(() => {
        let filtered = [...users];
        if (searchTerm) {
            filtered = filtered.filter(u =>
                u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.lastName?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterRole) {
            filtered = filtered.filter(u => u.userRoles.some(ur => ur.role.id === filterRole));
        }
        if (filterStatus !== 'all') {
            const isAct = filterStatus === 'active';
            filtered = filtered.filter(u => u.isActive === isAct);
        }
        setFilteredUsers(filtered);
    }, [users, searchTerm, filterRole, filterStatus]);

    const fetchAllData = async () => {
        setLoading(true);
        try {
            const [usersRes, rolesRes] = await Promise.all([
                usersService.getUsers({}),
                usersService.getRoles()
            ]);
            if (usersRes.success && usersRes.data?.users) setUsers(usersRes.data.users);
            if (rolesRes.success && rolesRes.data?.roles) setRoles(rolesRes.data.roles);
        } catch (err) {
            console.error(err);
            setToast({ msg: '❌ فشل تحميل البيانات', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setIsEditing(false);
        setSelectedUser(null);
        setFormData({ username: '', email: '', password: '', firstName: '', lastName: '', roleId: '', isActive: true, phone: '', telegramUserId: '', telegramUsername: '' });
        setShowModal(true);
    };

    const handleEdit = (user: User) => {
        setIsEditing(true);
        setSelectedUser(user);
        const firstRole = user.userRoles.length > 0 ? user.userRoles[0] : null;
        setFormData({
            username: user.username,
            email: user.email,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            isActive: user.isActive,
            phone: user.phone || '',
            telegramUserId: user.telegramUserId || '',
            telegramUsername: user.telegramUsername || '',
            roleId: firstRole?.role.id || '',
            scopeType: firstRole?.scopeType || 'global',
            scopeId: firstRole?.scopeId || ''
        });
        setShowModal(true);
    };

    const handleDeleteClick = (id: string) => setConfirmId(id);

    const confirmDelete = async () => {
        if (!confirmId) return;
        try {
            await usersService.deleteUser(confirmId);
            setToast({ msg: '✅ تم حذف المستخدم', type: 'success' });
            fetchAllData();
        } catch (err: any) {
            setToast({ msg: '❌ لا يمكن حذف المستخدم', type: 'error' });
        } finally {
            setConfirmId(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing && selectedUser) {
                await usersService.updateUser(selectedUser.id, formData);
                setToast({ msg: '✅ تم تحديث المستخدم', type: 'success' });
            } else {
                await usersService.createUser(formData);
                setToast({ msg: '✅ تم إنشاء المستخدم', type: 'success' });
            }
            setShowModal(false);
            fetchAllData();
        } catch (err: any) {
            setToast({ msg: err.response?.data?.error?.message || '❌ حدث خطأ', type: 'error' });
        }
    };

    const toggleStatus = async (user: User) => {
        try {
            await usersService.updateUser(user.id, { isActive: !user.isActive });
            setToast({ msg: user.isActive ? 'تم تعطيل الحساب' : 'تم تفعيل الحساب', type: 'success' });
            fetchAllData();
        } catch (e) {
            setToast({ msg: 'فشل تغيير الحالة', type: 'error' });
        }
    };

    const handleResetPasswordClick = (user: User) => {
        setResetUserId(user.id);
        setResetUsername(user.username);
        setNewPassword('');
        setShowResetModal(true);
    };

    const handleResetPasswordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetUserId || !newPassword.trim()) return;
        try {
            await usersService.updateUser(resetUserId, { password: newPassword });
            setToast({ msg: `🔑 تم تعيين كلمة مرور جديدة بنجاح للمستخدم @${resetUsername}`, type: 'success' });
            setShowResetModal(false);
            setResetUserId(null);
            setResetUsername('');
            setNewPassword('');
        } catch (err: any) {
            setToast({ msg: err.response?.data?.error?.message || '❌ فشل تعيين كلمة المرور الجديدة', type: 'error' });
        }
    };

    if (loading && users.length === 0) {
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
                        <div className="branding-icon orange">👥</div>
                        <div className="branding-text">
                            <h1>إدارة المستخدمين</h1>
                            <p className="hide-on-mobile">التحكم في الوصول وإدارة حسابات طاقم العمل</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="view-switcher hide-on-mobile">
                            <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}>▦</button>
                            <button onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'active' : ''}>☰</button>
                        </div>
                        <div className="header-pills hide-on-mobile">
                            <span className="pill pill-green">النشطين: {users.filter(u => u.isActive).length}</span>
                        </div>
                        <button onClick={handleCreate} className="btn-modern btn-orange-gradient">
                            <span className="plus-icon">+</span>
                            <span className="hide-on-mobile">إضافة مستخدم</span>
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
                        <input type="text" placeholder="البحث بالاسم، البريد أو اسم المستخدم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="filters-group">
                        <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)}>
                            <option value="">كافة الأدوار</option>
                            {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                            <option value="all">الحالة: الكل</option>
                            <option value="active">نشط</option>
                            <option value="inactive">غير نشط</option>
                        </select>
                        <div className="divider-v"></div>
                        <button onClick={() => { setSearchTerm(''); setFilterRole(''); setFilterStatus('all'); }} className="btn-icon-label"><span>↻</span> إعادة ضبط</button>
                    </div>
                </section>

                {/* Mobile Search Bar Only */}
                <section className="show-on-mobile mobile-search-area">
                    <div className="search-box-wrapper">
                        <input type="text" placeholder="بحث عن مستخدم..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        <button onClick={() => setShowMobileFilters(true)} className="btn-filter-toggle">⚙️</button>
                    </div>
                </section>

                {/* Data Display */}
                <div className={`content-transition-wrapper ${viewMode}`}>
                    {filteredUsers.length === 0 ? (
                        <div className="empty-state-modern">
                            <div className="empty-icon">👤</div>
                            <h2>لا توجد نتائج مطابقة</h2>
                            <p>حاول تغيير معايير البحث أو إضافة مستخدمين جدد</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div key="grid-view" className="programs-grid-2026">
                            {filteredUsers.map(user => (
                                <div key={user.id} className="next-gen-card">
                                    <div className="card-top">
                                        <div className="avatar-preview-2026">
                                            {user.username.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div className="card-actions-mini">
                                            <button onClick={() => handleResetPasswordClick(user)} title="إعادة تعيين كلمة المرور" style={{ fontSize: '1.2rem' }}>🔑</button>
                                            <button onClick={() => handleEdit(user)}>✎</button>
                                            <button onClick={() => handleDeleteClick(user.id)} className="danger">×</button>
                                        </div>
                                    </div>
                                    <div className="card-info">
                                        <h3 className="card-title">{user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.username}</h3>
                                        <p className="card-subtitle">@{user.username}</p>
                                        <div className="card-tags">
                                            {user.userRoles.map(ur => (
                                                <span key={ur.role.id} className="tag-level">{ur.role.name}</span>
                                            ))}
                                            {user.userRoles.length === 0 && <span className="tag-body">بلا دور</span>}
                                        </div>
                                    </div>
                                    <div className="card-stats-grid">
                                        <div className="stat-item">
                                            <span className="stat-val">{user.userRoles.length}</span>
                                            <span className="stat-lbl">أدوار</span>
                                        </div>
                                        <div className="stat-item">
                                            <span className="stat-val">{user.isActive ? '✓' : '✗'}</span>
                                            <span className="stat-lbl">الحالة</span>
                                        </div>
                                        <div className="stat-item highlight">
                                            <span className="stat-val">{user.emailVerified ? '🛡️' : '⚠️'}</span>
                                            <span className="stat-lbl">التوثيق</span>
                                        </div>
                                    </div>
                                    <div className="card-footer">
                                        <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`}></span>
                                        <span className="status-text">{user.isActive ? 'نشط' : 'معطل'}</span>
                                        <button onClick={() => toggleStatus(user)} style={{
                                            marginRight: 'auto',
                                            background: user.isActive ? '#FFF5F5' : '#F0FFF4',
                                            color: user.isActive ? '#E53E3E' : '#38A169',
                                            border: 'none',
                                            padding: '0.25rem 0.75rem',
                                            borderRadius: '8px',
                                            fontSize: '0.75rem',
                                            fontWeight: '800',
                                            cursor: 'pointer'
                                        }}>{user.isActive ? 'تعطيل' : 'تفعيل'} ←</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div key="table-view" className="next-gen-table-container">
                            <table className="modern-data-table">
                                <thead>
                                    <tr>
                                        <th>المستخدم</th>
                                        <th className="hide-on-mobile">البريد الإلكتروني</th>
                                        <th>الأدوار</th>
                                        <th className="text-center">الحالة</th>
                                        <th className="text-center">إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredUsers.map(user => (
                                        <tr key={user.id}>
                                            <td className="w-300">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                    <div className="avatar-circle-sm">
                                                        {user.username.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="table-primary-text">{user.firstName || user.lastName ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : user.username}</div>
                                                        <div className="table-secondary-text">@{user.username}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="hide-on-mobile">{user.email}</td>
                                            <td>
                                                <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                                    {user.userRoles.map(ur => (
                                                        <span key={ur.role.id} className="code-pill">{ur.role.name}</span>
                                                    ))}
                                                    {user.userRoles.length === 0 && <span className="table-secondary-text">بلا دور</span>}
                                                </div>
                                            </td>
                                            <td className="text-center w-80">
                                                <span className={`status-dot ${user.isActive ? 'active' : 'inactive'}`}></span>
                                            </td>
                                            <td className="text-center w-150">
                                                <div className="table-row-actions">
                                                    <button onClick={() => handleResetPasswordClick(user)} className="edit-btn" style={{ background: '#FEFCBF', color: '#B7791F' }}>🔑 كلمة السر</button>
                                                    <button onClick={() => handleEdit(user)} className="edit-btn">تعديل</button>
                                                    <button onClick={() => handleDeleteClick(user.id)} className="delete-btn">حذف</button>
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
                <UserFormModal
                    show={showModal}
                    isEditing={isEditing}
                    formData={formData}
                    roles={roles}
                    onClose={() => setShowModal(false)}
                    onSubmit={handleSubmit}
                    onChange={(f, v) => setFormData({ ...formData, [f]: v })}
                />,
                document.body
            )}

            {showResetModal && createPortal(
                <div className="premium-modal-overlay" onClick={() => setShowResetModal(false)} dir="rtl">
                    <div className="premium-modal-content fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div style={{ padding: '2.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1A202C', margin: 0 }}>
                                        🔑 إعادة تعيين كلمة المرور
                                    </h2>
                                    <p style={{ color: '#718096', margin: '6px 0 0 0', fontSize: '0.875rem' }}>
                                        تعيين كلمة مرور جديدة للمستخدم: <b style={{ color: '#DD6B20' }}>@{resetUsername}</b>
                                    </p>
                                </div>
                                <button className="btn-close-2026" onClick={() => setShowResetModal(false)}>✕</button>
                            </div>

                            <form onSubmit={handleResetPasswordSubmit}>
                                <div style={{ marginBottom: '1.5rem' }}>
                                    <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: '800', color: '#4A5568', marginBottom: '0.8rem' }}>كلمة المرور الجديدة</label>
                                    <input
                                        type="password"
                                        style={{
                                            width: '100%',
                                            padding: '1rem 1.2rem',
                                            borderRadius: '14px',
                                            border: '1.5px solid #E2E8F0',
                                            fontSize: '1rem',
                                            color: '#2D3748',
                                            outline: 'none',
                                            transition: 'all 0.2s'
                                        }}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        required
                                        autoFocus
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid #EDF2F7', paddingTop: '1.5rem' }}>
                                    <button type="button" className="btn-secondary-large" onClick={() => setShowResetModal(false)}>إلغاء</button>
                                    <button type="submit" className="btn-primary-large orange" style={{
                                        background: 'linear-gradient(135deg, #DD6B20 0%, #ED8936 100%)',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '16px',
                                        fontWeight: '900',
                                        cursor: 'pointer'
                                    }}>
                                        تأكيد تعيين كلمة السر
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>,
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
                                <label>الدور الوظيفي</label>
                                <select value={filterRole} onChange={e => setFilterRole(e.target.value)}>
                                    <option value="">كافة الأدوار</option>
                                    {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                </select>
                            </div>
                            <div className="drawer-section">
                                <label>حالة الحساب</label>
                                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as any)}>
                                    <option value="all">الكل</option>
                                    <option value="active">نشط</option>
                                    <option value="inactive">غير نشط</option>
                                </select>
                            </div>
                        </div>
                        <div className="drawer-footer">
                            <button onClick={() => { setSearchTerm(''); setFilterRole(''); setFilterStatus('all'); setShowMobileFilters(false); }} className="btn-reset">إعادة تعيين</button>
                            <button onClick={() => setShowMobileFilters(false)} className="btn-apply orange">تطبيق</button>
                        </div>
                    </div>
                </div>
            )}

            {toast && createPortal(
                <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />,
                document.body
            )}

            {confirmId && createPortal(
                <ConfirmDialog
                    title="حذف المستخدم"
                    message="هل أنت متأكد؟ سيتم فقدان جميع بيانات المستخدم نهائياً."
                    onConfirm={confirmDelete}
                    onCancel={() => setConfirmId(null)}
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
                    --shadow-premium: 0 12px 30px rgba(0, 0, 0, 0.08);
                    --radius-lg: 16px;
                    --radius-md: 12px;
                }

                .next-gen-page-container { background: #F8FAFC; min-height: 100vh; padding-bottom: 3rem; direction: rtl; }
                .show-on-mobile { display: none; }
                
                /* HEADER */
                .glass-header { 
                    position: sticky; 
                    top: 64px; 
                    height: 85px; 
                    z-index: 1000;
                    background: var(--glass-bg); 
                    backdrop-filter: blur(12px); 
                    border: 1px solid rgba(226, 232, 240, 0.8);
                    border-radius: 20px; margin: 0 1.5rem;
                    box-shadow: 0 4px 20px rgba(0,0,0,0.03);
                    display: flex; align-items: center;
                }
                .branding-icon.orange { background: linear-gradient(135deg, #DD6B20 0%, #ED8936 100%); }
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
                .pill-green { background: #DCFCE7; color: #166534; }
                
                .btn-modern {
                    display: flex; align-items: center; gap: 0.75rem; padding: 0.75rem 1.5rem;
                    border-radius: 14px; font-weight: 800; border: none; cursor: pointer; transition: all 0.2s;
                }
                .btn-primary-gradient.orange, .btn-orange-gradient {
                    background: linear-gradient(135deg, #DD6B20 0%, #ED8936 100%); color: white;
                    box-shadow: 0 10px 15px -3px rgba(221, 107, 32, 0.3);
                }
                .btn-primary-gradient:hover, .btn-orange-gradient:hover { 
                    transform: translateY(-2px); 
                    filter: brightness(1.1); 
                    box-shadow: 0 12px 20px -3px rgba(221, 107, 32, 0.45);
                }
                
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
                .next-gen-card:hover { transform: translateY(-8px); box-shadow: var(--shadow-premium); border-color: var(--orange-light); }
                
                .avatar-preview-2026 {
                    width: 52px; height: 52px; border-radius: 14px;
                    background: linear-gradient(135deg, #DD6B20 0%, #ED8936 100%);
                    display: flex; align-items: center; justify-content: center;
                    color: white; font-weight: 900; font-size: 1.25rem;
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
                .stat-item.highlight .stat-val { color: var(--orange-primary); }
                
                .card-footer { margin-top: auto; display: flex; align-items: center; gap: 0.5rem; padding-top: 1rem; border-top: 1px solid #F1F5F9; }
                .status-dot { width: 8px; height: 8px; border-radius: 50%; }
                .status-dot.active { background: #38A169; box-shadow: 0 0 8px #38A169; }
                .status-dot.inactive { background: #CBD5E0; }
                .status-text { font-size: 0.75rem; font-weight: 600; color: var(--text-muted); }
                
                /* TABLE */
                .next-gen-table-container { background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-premium); overflow: hidden; margin-top: 2rem; }
                .modern-data-table { width: 100%; border-collapse: collapse; }
                .modern-data-table th { background: #F8FAFC; padding: 1.25rem 1.5rem; text-align: right; font-size: 0.8125rem; font-weight: 700; color: var(--text-muted); border-bottom: 1px solid #EDF2F7; }
                .modern-data-table td { padding: 1.25rem 1.5rem; border-bottom: 1px solid #F1F5F9; vertical-align: middle; }
                .table-primary-text { font-weight: 700; color: var(--text-main); }
                .table-secondary-text { font-size: 0.75rem; color: var(--text-muted); }
                .code-pill { background: #EDF2F7; padding: 0.25rem 0.625rem; border-radius: 6px; font-size: 0.75rem; font-weight: 800; color: var(--primary); }
                .avatar-circle-sm { width: 40px; height: 40px; border-radius: 10px; background: #F1F5F9; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--primary); }
                
                .table-row-actions { display: flex; gap: 0.5rem; }
                .edit-btn, .delete-btn { padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; border: none; cursor: pointer; transition: all 0.2s; }
                .edit-btn { background: var(--primary-light); color: var(--primary); }
                .delete-btn { background: #FFF5F5; color: #E53E3E; }
                .edit-btn:hover { background: var(--primary); color: white; }
                
                /* UTILS */
                .next-gen-loader { width: 50px; height: 50px; border: 4px solid var(--primary-light); border-top-color: var(--primary); border-radius: 50%; animation: spin 1s linear infinite; }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
                
                @media (max-width: 768px) {
                    .glass-header { 
                        margin: 0.5rem; 
                        height: 70px; 
                        top: 64px;
                        border-radius: 15px;
                        z-index: 1000;
                    }
                    .header-content { padding: 0 1rem; }
                    .branding-icon { width: 42px; height: 42px; font-size: 1.25rem; }
                    .header-actions { gap: 0.75rem; }
                    .main-content { padding: 1rem; }
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
