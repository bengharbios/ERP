import React, { useState, useEffect } from 'react';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    ChevronDown,
    ChevronRight,
    FileText
} from 'lucide-react';
import accountService, { Account, CreateAccountData } from '../services/account.service';
import './ChartOfAccounts.css';

const ACCOUNT_TYPES = [
    { value: 'ASSET', label: 'الأصول', labelEn: 'Assets', icon: '📊', color: '#10b981' },
    { value: 'LIABILITY', label: 'الخصوم', labelEn: 'Liabilities', icon: '📉', color: '#ef4444' },
    { value: 'EQUITY', label: 'حقوق الملكية', labelEn: 'Equity', icon: '💰', color: '#8b5cf6' },
    { value: 'REVENUE', label: 'الإيرادات', labelEn: 'Revenue', icon: '💵', color: '#22c55e' },
    { value: 'EXPENSE', label: 'المصروفات', labelEn: 'Expenses', icon: '💸', color: '#f59e0b' }
] as const;

interface AccountTreeNodeProps {
    account: Account;
    level: number;
    onEdit: (account: Account) => void;
    onDelete: (account: Account) => void;
    expandedNodes: Set<string>;
    toggleNode: (id: string) => void;
}

const AccountTreeNode: React.FC<AccountTreeNodeProps> = ({
    account,
    level,
    onEdit,
    onDelete,
    expandedNodes,
    toggleNode
}) => {
    const hasChildren = account.children && account.children.length > 0;
    const isExpanded = expandedNodes.has(account.id);
    const accountType = ACCOUNT_TYPES.find(t => t.value === account.type);

    return (
        <div className="coa-node-wrapper">
            <div
                className={`coa-row level-${level} ${!account.isActive ? 'inactive' : ''}`}
            >
                <div className="col account-main-col" style={{ paddingRight: `${level * 24}px` }}>
                    <div className="account-expand">
                        {hasChildren ? (
                            <button
                                className="expand-btn-2026"
                                onClick={() => toggleNode(account.id)}
                            >
                                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                        ) : (
                            <span className="no-expand-2026"></span>
                        )}
                    </div>

                    <div className="account-ident">
                        <span className="account-code-badge">{account.code}</span>
                        <div className="name-stack">
                            <span className="name-ar">{account.nameAr}</span>
                            <span className="name-en">{account.name}</span>
                        </div>
                    </div>
                </div>

                <div className="col text-center">
                    <span
                        className="type-pill-2026"
                        style={{
                            backgroundColor: `${accountType?.color}15`,
                            color: accountType?.color,
                            border: `1px solid ${accountType?.color}30`
                        }}
                    >
                        {accountType?.label}
                    </span>
                </div>

                <div className="col text-center">
                    <div className="balance-display">
                        <span className={`amount ${account.balance > 0 ? 'positive' : account.balance < 0 ? 'negative' : ''}`}>
                            {Number(account.balance).toLocaleString('en-AE', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="currency">د.إ</span>
                    </div>
                </div>

                <div className="col text-left">
                    <div className="actions-stack">
                        <button
                            className="btn-icon-2026 edit"
                            onClick={() => onEdit(account)}
                            title="تعديل"
                        >
                            <Edit2 size={16} />
                        </button>
                        <button
                            className="btn-icon-2026 delete"
                            onClick={() => onDelete(account)}
                            title="حذف"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {hasChildren && isExpanded && (
                <div className="coa-children">
                    {account.children!.map(child => (
                        <AccountTreeNode
                            key={child.id}
                            account={child}
                            level={level + 1}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            expandedNodes={expandedNodes}
                            toggleNode={toggleNode}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

const ChartOfAccounts: React.FC = () => {
    // State
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [treeData, setTreeData] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // Modal state
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentAccount, setCurrentAccount] = useState<Account | null>(null);

    // Form state
    const [formData, setFormData] = useState<CreateAccountData>({
        code: '',
        name: '',
        nameAr: '',
        type: 'ASSET',
        parentId: null,
        balance: 0,
        isActive: true,
        description: ''
    });

    // Stats
    const [stats, setStats] = useState({
        totalAccounts: 0,
        activeAccounts: 0,
        totalAssets: 0,
        totalLiabilities: 0
    });

    // Load accounts
    useEffect(() => {
        loadAccounts();
    }, []);

    const loadAccounts = async () => {
        try {
            setLoading(true);
            const [allAccounts, tree] = await Promise.all([
                accountService.getAccounts(),
                accountService.getAccountTree()
            ]);

            setAccounts(allAccounts || []);
            setTreeData(tree || []);
            calculateStats(allAccounts || []);

            // Expand root nodes by default
            const rootIds = (tree || []).map(a => a.id);
            setExpandedNodes(new Set(rootIds));
        } catch (error) {
            console.error('Error loading accounts:', error);
            alert('فشل تحميل الحسابات');
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (accountsList: Account[]) => {
        if (!Array.isArray(accountsList)) return;
        const active = accountsList.filter(a => a.isActive);
        const assets = accountsList
            .filter(a => a.type === 'ASSET')
            .reduce((sum, a) => sum + Number(a.balance), 0);
        const liabilities = accountsList
            .filter(a => a.type === 'LIABILITY')
            .reduce((sum, a) => sum + Number(a.balance), 0);

        setStats({
            totalAccounts: accountsList.length,
            activeAccounts: active.length,
            totalAssets: assets,
            totalLiabilities: liabilities
        });
    };

    // Tree operations
    const toggleNode = (id: string) => {
        setExpandedNodes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const expandAll = () => {
        const allIds = new Set<string>();
        const collectIds = (accs: Account[]) => {
            accs.forEach(acc => {
                allIds.add(acc.id);
                if (acc.children) {
                    collectIds(acc.children);
                }
            });
        };
        collectIds(treeData || []);
        setExpandedNodes(allIds);
    };

    const collapseAll = () => {
        setExpandedNodes(new Set());
    };

    // CRUD operations
    const handleCreate = () => {
        setModalMode('create');
        setCurrentAccount(null);
        setFormData({
            code: '',
            name: '',
            nameAr: '',
            type: 'ASSET',
            parentId: null,
            balance: 0,
            isActive: true,
            description: ''
        });
        setShowModal(true);
    };

    const handleEdit = (account: Account) => {
        setModalMode('edit');
        setCurrentAccount(account);
        setFormData({
            code: account.code,
            name: account.name,
            nameAr: account.nameAr,
            type: account.type,
            parentId: account.parentId || null,
            balance: Number(account.balance),
            isActive: account.isActive,
            description: account.description || ''
        });
        setShowModal(true);
    };

    const handleDelete = async (account: Account) => {
        if (!confirm(`هل أنت متأكد من حذف الحساب "${account.nameAr}"؟`)) {
            return;
        }

        try {
            await accountService.deleteAccount(account.id);
            alert('تم حذف الحساب بنجاح');
            loadAccounts();
        } catch (error: any) {
            console.error('Error deleting account:', error);
            alert(error.response?.data?.error || 'فشل حذف الحساب');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (modalMode === 'create') {
                await accountService.createAccount(formData);
                alert('تم إنشاء الحساب بنجاح');
            } else if (currentAccount) {
                await accountService.updateAccount(currentAccount.id, formData);
                alert('تم تحديث الحساب بنجاح');
            }

            setShowModal(false);
            loadAccounts();
        } catch (error: any) {
            console.error('Error saving account:', error);
            alert(error.response?.data?.error || 'فشل حفظ الحساب');
        }
    };

    // Filter accounts
    const getFilteredTree = () => {
        if (!searchTerm && !selectedType) {
            return treeData || [];
        }

        const filterNode = (account: Account): Account | null => {
            const matchesSearch = !searchTerm ||
                account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                account.nameAr.includes(searchTerm);

            const matchesType = !selectedType || account.type === selectedType;

            const filteredChildren = account.children
                ?.map(child => filterNode(child))
                .filter(Boolean) as Account[] | undefined;

            if (matchesSearch && matchesType) {
                return { ...account, children: filteredChildren };
            }

            if (filteredChildren && filteredChildren.length > 0) {
                return { ...account, children: filteredChildren };
            }

            return null;
        };

        return (treeData || []).map(filterNode).filter(Boolean) as Account[];
    };

    const filteredTree = getFilteredTree();

    if (loading) {
        return (
            <div className="chart-of-accounts-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>جاري تحميل دليل الحسابات...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="next-gen-page-container">
            {/* --- Premium Floating Header --- */}
            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">
                            <FileText size={28} strokeWidth={2.5} />
                        </div>
                        <div className="branding-text">
                            <h1>دليل الحسابات</h1>
                            <p>إدارة الحسابات المالية والأرصدة</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-modern btn-orange-gradient" onClick={handleCreate}>
                            <Plus size={18} strokeWidth={2.8} />
                            <span>إضافة حساب جديد</span>
                        </button>
                    </div>
                </div>
            </header>

            <main className="container-wide main-content">
                {/* Desktop Search & Filters Toolbar */}
                <section className="filters-toolbar hide-on-mobile">
                    <div className="search-box-wrapper">
                        <span className="search-icon">
                            <Search size={18} strokeWidth={2.2} />
                        </span>
                        <input
                            type="text"
                            placeholder="بحث بالرمز أو الاسم..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="divider-v"></div>
                    <div className="filters-group">
                        <div style={{ position: 'relative', width: '200px' }}>
                            <select
                                className="modern-select"
                                value={selectedType}
                                onChange={(e) => setSelectedType(e.target.value)}
                                style={{ paddingRight: '1rem' }}
                            >
                                <option value="">كافة الأنواع</option>
                                {ACCOUNT_TYPES.map(type => (
                                    <option key={type.value} value={type.value}>
                                        {type.icon} {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="divider-v" style={{ height: '30px' }}></div>

                        <div className="button-group-2026" style={{ display: 'flex', gap: '0.5rem' }}>
                            <button className="btn-modern" onClick={expandAll} style={{ padding: '0 1rem', background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', height: '52px' }}>
                                <ChevronDown size={16} /> توسيع الكل
                            </button>
                            <button className="btn-modern" onClick={collapseAll} style={{ padding: '0 1rem', background: '#F8FAFC', color: '#64748B', border: '1.5px solid #E2E8F0', height: '52px' }}>
                                <ChevronRight size={16} /> طي الكل
                            </button>
                        </div>

                        <button className="btn-modern btn-orange-gradient" onClick={() => { setSearchTerm(''); setSelectedType(''); }} style={{ padding: '0 1.5rem', height: '52px' }}>
                            إعادة ضبط
                        </button>
                    </div>
                </section>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #2C7A7B' }}>
                        <div className="stat-label">إجمالي الحسابات</div>
                        <div className="stat-value">{stats.totalAccounts}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #38A169' }}>
                        <div className="stat-label">إجمالي الأصول</div>
                        <div className="stat-value">{stats.totalAssets.toLocaleString()} د.إ</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #EF4444' }}>
                        <div className="stat-label">إجمالي الخصوم</div>
                        <div className="stat-value">{stats.totalLiabilities.toLocaleString()} د.إ</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #3182CE' }}>
                        <div className="stat-label">صافي حقوق الملكية</div>
                        <div className="stat-value">{(stats.totalAssets - stats.totalLiabilities).toLocaleString()} د.إ</div>
                    </div>
                </div>

                {/* Accounts Tree */}
                <div className="coa-tree-container">
                    <div className="coa-tree-header">
                        <div className="col">الحساب والرمز</div>
                        <div className="col text-center">النوع</div>
                        <div className="col text-center">الرصيد الحالي</div>
                        <div className="col text-left">العمليات</div>
                    </div>

                    <div className="coa-tree-body">
                        {filteredTree.length === 0 ? (
                            <div className="empty-state-2026">
                                <Search size={48} color="#94A3B8" />
                                <p>لا توجد حسابات مطابقة للبحث</p>
                            </div>
                        ) : (
                            filteredTree.map(account => (
                                <AccountTreeNode
                                    key={account.id}
                                    account={account}
                                    level={0}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    expandedNodes={expandedNodes}
                                    toggleNode={toggleNode}
                                />
                            ))
                        )}
                    </div>
                </div>
            </main>

            {/* Premium Modal */}
            {showModal && (
                <div className="premium-modal-overlay active">
                    <div className="premium-modal-container" style={{ maxWidth: '700px' }}>
                        <div className="premium-modal-header">
                            <div className="premium-modal-header-title">
                                <div className="premium-modal-header-icon orange">
                                    <FileText size={22} />
                                </div>
                                <div>
                                    <h3>{modalMode === 'create' ? 'إضافة حساب جديد' : 'تعديل الحساب'}</h3>
                                    <p>أدخل بيانات الحساب المالي بدقة</p>
                                </div>
                            </div>
                            <button className="premium-modal-close" onClick={() => setShowModal(false)}>×</button>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="premium-modal-body">
                                <div className="form-row-2026">
                                    <div className="form-group-2026">
                                        <label>رمز الحساب *</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            value={formData.code}
                                            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                                            placeholder="1110"
                                            required
                                            disabled={modalMode === 'edit'}
                                        />
                                    </div>

                                    <div className="form-group-2026">
                                        <label>نوع الحساب *</label>
                                        <select
                                            className="modern-select"
                                            value={formData.type}
                                            onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                            required
                                        >
                                            {ACCOUNT_TYPES.map(type => (
                                                <option key={type.value} value={type.value}>
                                                    {type.icon} {type.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="form-row-2026">
                                    <div className="form-group-2026">
                                        <label>الاسم بالعربية *</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            value={formData.nameAr}
                                            onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                                            placeholder="حساب البنك"
                                            required
                                        />
                                    </div>

                                    <div className="form-group-2026">
                                        <label>الاسم بالإنجليزية *</label>
                                        <input
                                            type="text"
                                            className="input-premium"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="Bank Account"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-row-2026">
                                    <div className="form-group-2026">
                                        <label>الحساب الرئيسي</label>
                                        <select
                                            className="modern-select"
                                            value={formData.parentId || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                parentId: e.target.value || null
                                            })}
                                        >
                                            <option value="">لا يوجد (حساب رئيسي)</option>
                                            {accounts
                                                .filter(a => a.type === formData.type && a.id !== currentAccount?.id)
                                                .map(account => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.code} - {account.nameAr}
                                                    </option>
                                                ))}
                                        </select>
                                    </div>

                                    <div className="form-group-2026">
                                        <label>الرصيد الافتتاحي</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="input-premium"
                                            value={formData.balance}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                balance: parseFloat(e.target.value) || 0
                                            })}
                                        />
                                    </div>
                                </div>

                                <div className="form-group-2026" style={{ marginTop: '1rem' }}>
                                    <label>الوصف</label>
                                    <textarea
                                        className="input-premium"
                                        style={{ height: '80px', paddingTop: '0.75rem' }}
                                        value={formData.description || ''}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="وصف الحساب (اختياري)"
                                        rows={3}
                                    />
                                </div>

                                <div className="form-group-2026 checkbox-group" style={{ marginTop: '0.5rem' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={formData.isActive}
                                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                            style={{ width: '18px', height: '18px' }}
                                        />
                                        <span style={{ fontSize: '0.9rem', fontWeight: '700' }}>حساب نشط</span>
                                    </label>
                                </div>
                            </div>

                            <div className="premium-modal-footer">
                                <button type="button" className="premium-footer-btn secondary" onClick={() => setShowModal(false)}>
                                    إلغاء
                                </button>
                                <button type="submit" className="premium-footer-btn primary">
                                    {modalMode === 'create' ? 'إنشاء الحساب' : 'حفظ التعديلات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChartOfAccounts;
