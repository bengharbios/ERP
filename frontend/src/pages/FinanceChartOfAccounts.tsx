// @ts-nocheck
import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Plus, Search, Edit2, Trash2, ChevronDown,
    ChevronRight, BookMarked, Filter, SlidersHorizontal,
    RefreshCw, X, ArrowLeftRight, Landmark,
    TrendingUp, Wallet, PieChart, Info
} from 'lucide-react';
import accountService, { Account, CreateAccountData } from '../services/account.service';
import { useSettingsStore } from '../store/settingsStore';
import { Toast, ToastType } from '../components/Toast';
import './FinanceChartOfAccounts.css';

const ACCOUNT_TYPES = [
    { value: 'ASSET', label: 'الأصول', labelEn: 'Assets', color: '#10b981', icon: <Wallet size={16} /> },
    { value: 'LIABILITY', label: 'الخصوم', labelEn: 'Liabilities', color: '#ef4444', icon: <TrendingUp size={16} /> },
    { value: 'EQUITY', label: 'حقوق الملكية', labelEn: 'Equity', color: '#8b5cf6', icon: <PieChart size={16} /> },
    { value: 'REVENUE', label: 'الإيرادات', labelEn: 'Revenue', color: '#22c55e', icon: <ArrowLeftRight size={16} /> },
    { value: 'EXPENSE', label: 'المصروفات', labelEn: 'Expenses', color: '#f59e0b', icon: <TrendingUp size={16} /> }
] as const;

export default function FinanceChartOfAccounts() {
    // --- Data States ---
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [treeData, setTreeData] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    // --- UI/Filter States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState<string>('ALL');
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // --- Modal States ---
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [currentAccount, setCurrentAccount] = useState<Account | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // --- Form state ---
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

    const { settings } = useSettingsStore();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [allAccounts, tree] = await Promise.all([
                accountService.getAccounts(),
                accountService.getAccountTree()
            ]);
            setAccounts(allAccounts || []);
            setTreeData(tree || []);

            // Expand root nodes by default
            const rootIds = (tree || []).map(a => a.id);
            setExpandedNodes(new Set(rootIds));
        } catch (error) {
            console.error('Error loading accounts:', error);
            setToast({ type: 'error', message: '❌ فشل تحميل دليل الحسابات' });
        } finally {
            setLoading(false);
        }
    };

    // --- Tree Handlers ---
    const toggleNode = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const expandAll = () => {
        const allIds = new Set<string>();
        const collect = (list: Account[]) => {
            list.forEach(a => {
                allIds.add(a.id);
                if (a.children) collect(a.children);
            });
        };
        collect(treeData);
        setExpandedNodes(allIds);
    };

    const collapseAll = () => setExpandedNodes(new Set());

    // --- CRUD Handlers ---
    const handleOpenCreate = () => {
        setModalMode('create');
        setCurrentAccount(null);
        setFormData({
            code: '', name: '', nameAr: '', type: 'ASSET',
            parentId: null, balance: 0, isActive: true, description: ''
        });
        setShowModal(true);
    };

    const handleOpenEdit = (account: Account) => {
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
        if (!window.confirm(`هل أنت متأكد من حذف الحساب "${account.nameAr}"؟`)) return;
        try {
            await accountService.deleteAccount(account.id);
            setToast({ type: 'success', message: '✅ تم حذف الحساب بنجاح' });
            loadData();
        } catch (err) {
            setToast({ type: 'error', message: '❌ فشل حذف الحساب. قد يكون مرتبطاً بعمليات مالية' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            setIsSaving(true);
            if (modalMode === 'create') {
                await accountService.createAccount(formData);
                setToast({ type: 'success', message: '✅ تم إنشاء الحساب بنجاح' });
            } else {
                await accountService.updateAccount(currentAccount.id, formData);
                setToast({ type: 'success', message: '✅ تم تحديث الحساب بنجاح' });
            }
            setShowModal(false);
            loadData();
        } catch (err) {
            setToast({ type: 'error', message: '❌ فشل حفظ البيانات' });
        } finally {
            setIsSaving(false);
        }
    };

    // --- Filtering Logic ---
    const filteredTree = useMemo(() => {
        if (!searchTerm && (selectedType === 'ALL')) return treeData;

        const filterNode = (node: Account): Account | null => {
            const matchesSearch = !searchTerm ||
                node.nameAr.toLowerCase().includes(searchTerm.toLowerCase()) ||
                node.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                node.code.includes(searchTerm);

            const matchesType = selectedType === 'ALL' || node.type === selectedType;

            const children = (node.children || [])
                .map(filterNode)
                .filter(Boolean) as Account[];

            if (matchesSearch && matchesType) return { ...node, children };
            if (children.length > 0) return { ...node, children };
            return null;
        };

        return treeData.map(filterNode).filter(Boolean) as Account[];
    }, [treeData, searchTerm, selectedType]);

    const stats = useMemo(() => {
        const assets = accounts.filter(a => a.type === 'ASSET').reduce((s, a) => s + Number(a.balance), 0);
        const liab = accounts.filter(a => a.type === 'LIABILITY').reduce((s, a) => s + Number(a.balance), 0);
        return {
            total: accounts.length,
            assets,
            liab,
            equity: assets - liab
        };
    }, [accounts]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' ' + (settings?.currency || 'AED');
    };

    // --- Recursive Tree Component ---
    const RenderNode = ({ node, level = 0 }: { node: Account, level: number }) => {
        const isExpanded = expandedNodes.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const typeInfo = ACCOUNT_TYPES.find(t => t.value === node.type);

        return (
            <div className={`ag-node-group ${isExpanded ? 'is-expanded' : ''}`} key={node.id}>
                <div className={`ag-node-row level-${level}`} onClick={(e) => hasChildren && toggleNode(node.id, e)}>
                    <div className="ag-node-cell account-info" style={{ paddingRight: `${level * 24 + 16}px` }}>
                        <div className="ag-expand-trigger">
                            {hasChildren ? (
                                isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />
                            ) : <div style={{ width: 14 }} />}
                        </div>
                        <span className="ag-code-pill">{node.code}</span>
                        <div className="ag-name-stack">
                            <span className="ar">{node.nameAr}</span>
                            <span className="en">{node.name}</span>
                        </div>
                    </div>

                    <div className="ag-node-cell type-cell hide-mobile">
                        <span className="ag-type-chip" style={{
                            background: `${typeInfo?.color}15`,
                            color: typeInfo?.color,
                            borderColor: `${typeInfo?.color}30`
                        }}>
                            {typeInfo?.icon}
                            {typeInfo?.label}
                        </span>
                    </div>

                    <div className="ag-node-cell balance-cell text-center">
                        <div className={`ag-balance ${Number(node.balance) >= 0 ? 'pos' : 'neg'}`}>
                            {formatCurrency(Number(node.balance))}
                        </div>
                    </div>

                    <div className="ag-node-cell actions-cell">
                        <div className="ag-action-group">
                            <button className="ag-mini-btn edit" title="تعديل" onClick={(e) => { e.stopPropagation(); handleOpenEdit(node); }}>
                                <Edit2 size={13} />
                            </button>
                            <button className="ag-mini-btn delete" title="حذف" onClick={(e) => { e.stopPropagation(); handleDelete(node); }}>
                                <Trash2 size={13} />
                            </button>
                        </div>
                    </div>
                </div>

                {hasChildren && isExpanded && (
                    <div className="ag-node-children">
                        {node.children.map(child => <RenderNode node={child} level={level + 1} key={child.id} />)}
                    </div>
                )}
            </div>
        );
    };

    const SidebarContent = () => (
        <>
            <div className="ag-sidebar-head">
                <span className="ag-sidebar-head-title">أدوات الدليل</span>
                <button className="ag-sidebar-head-close" onClick={() => setShowMobileFilters(false)}>
                    <X size={18} />
                </button>
            </div>
            <div className="ag-sidebar-pane">
                <div className="ag-filter-group">
                    <span className="ag-filter-label">البحث في الحسابات</span>
                    <div className="ag-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="الرمز، الاسم..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">نوع الحساب</span>
                    <select className="ag-select" value={selectedType} onChange={(e) => setSelectedType(e.target.value)}>
                        <option value="ALL">كافة الحسابات</option>
                        {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                </div>

                <div className="ag-divider" />

                <div className="ag-tree-controls">
                    <button className="ag-btn ag-btn-ghost w-full" onClick={expandAll}>
                        <ChevronDown size={14} /> توسيع الكل
                    </button>
                    <button className="ag-btn ag-btn-ghost w-full" onClick={collapseAll}>
                        <ChevronRight size={14} /> طي الكل
                    </button>
                </div>

                <button className="ag-btn ag-btn-ghost" style={{ width: '100%', marginTop: 'auto' }} onClick={loadData}>
                    <RefreshCw size={14} /> تحديث البيانات
                </button>
            </div>
        </>
    );

    return (
        <div className="ag-root">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* ── HEADER ── */}
            <div className="ag-header">
                <div className="ag-header-left">
                    <h1 className="ag-title">
                        <Landmark size={20} /> دليل الحسابات
                    </h1>
                    <div className="ag-mini-stats hide-mobile">
                        <div className="ag-stat-pill">
                            <span className="label">الأصول:</span>
                            <span className="val">{formatCurrency(stats.assets)}</span>
                        </div>
                        <div className="ag-stat-pill">
                            <span className="label">الخصوم:</span>
                            <span className="val neg">{formatCurrency(stats.liab)}</span>
                        </div>
                    </div>
                </div>
                <div className="ag-header-right">
                    <button className="ag-btn-icon mobile-only" onClick={() => setShowMobileFilters(true)}>
                        <SlidersHorizontal size={16} />
                    </button>
                    <button className="ag-btn ag-btn-primary" onClick={handleOpenCreate}>
                        <Plus size={16} /> <span className="hide-mobile">إضافة حساب</span>
                    </button>
                </div>
            </div>

            {/* ── BODY ── */}
            <div className="ag-body">
                {/* Mobile Sidebar Overlay */}
                <div className={`ag-sidebar-overlay ${showMobileFilters ? 'show' : ''}`} onClick={() => setShowMobileFilters(false)} />

                {/* Sidebar */}
                <div className={`ag-sidebar ${showMobileFilters ? 'show' : ''}`}>
                    <SidebarContent />
                </div>

                <div className="ag-main">
                    <div className="ag-tree-wrap">
                        <div className="ag-tree-thead hide-mobile">
                            <div className="col account">تفاصيل الحساب</div>
                            <div className="col type">التصنيف</div>
                            <div className="col balance">الرصيد الحالي</div>
                            <div className="col actions">إجراءات</div>
                        </div>
                        <div className="ag-tree-tbody">
                            {loading ? (
                                <div className="ag-loading-box">جاري تحميل البيانات...</div>
                            ) : filteredTree.length > 0 ? (
                                filteredTree.map(node => <RenderNode node={node} level={0} key={node.id} />)
                            ) : (
                                <div className="ag-empty-box">
                                    <BookMarked size={40} />
                                    <p>لا يوجد حسابات تطابق البحث</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── MODAL ── */}
            {showModal && createPortal(
                <div className="ag-modal-overlay" onClick={() => !isSaving && setShowModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head">
                            <div className="ag-modal-title">
                                <div className="ag-avatar" style={{ background: 'var(--hz-surface-3)' }}>
                                    <Edit2 size={20} color="var(--hz-orange)" />
                                </div>
                                <div>
                                    <h3>{modalMode === 'create' ? 'إضافة حساب جديد' : 'تعديل بيانات الحساب'}</h3>
                                    <p>يرجى إدخال رموز الحسابات والأسماء بدقة لضمان صحة الدورة المحاسبية</p>
                                </div>
                            </div>
                            <button className="ag-btn-icon" onClick={() => setShowModal(false)} disabled={isSaving}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="ag-modal-body">
                                <div className="ag-form-row cols-2">
                                    <div className="ag-form-group">
                                        <label>رمز الحساب (Code)*</label>
                                        <input
                                            className="ag-input"
                                            placeholder="مثال: 1101"
                                            value={formData.code}
                                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="ag-form-group">
                                        <label>نوع الحساب*</label>
                                        <select
                                            className="ag-select"
                                            value={formData.type}
                                            onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        >
                                            {ACCOUNT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div className="ag-form-row cols-2">
                                    <div className="ag-form-group">
                                        <label>الاسم بالعربية*</label>
                                        <input
                                            className="ag-input"
                                            value={formData.nameAr}
                                            onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="ag-form-group">
                                        <label>الاسم بالإنجليزية*</label>
                                        <input
                                            className="ag-input"
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="ag-form-row cols-2">
                                    <div className="ag-form-group">
                                        <label>الحساب الرئيسي (Parent)</label>
                                        <select
                                            className="ag-select"
                                            value={formData.parentId || ''}
                                            onChange={e => setFormData({ ...formData, parentId: e.target.value || null })}
                                        >
                                            <option value="">-- حساب جذري --</option>
                                            {accounts
                                                .filter(a => a.type === formData.type && a.id !== currentAccount?.id)
                                                .map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>)
                                            }
                                        </select>
                                    </div>
                                    <div className="ag-form-group">
                                        <label>الرصيد الافتتاحي</label>
                                        <div className="ag-input-wrap">
                                            <input
                                                type="number"
                                                className="ag-input"
                                                value={formData.balance}
                                                onChange={e => setFormData({ ...formData, balance: Number(e.target.value) })}
                                            />
                                            <span className="ag-input-suffix">{settings?.currency || 'AED'}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="ag-form-group">
                                    <label>وصف الحساب</label>
                                    <textarea
                                        className="ag-input"
                                        rows={3}
                                        value={formData.description || ''}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    />
                                </div>

                                <div className="ag-form-check">
                                    <input
                                        type="checkbox"
                                        id="acc-active"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <label htmlFor="acc-active">الحساب نشط ويقبل العمليات المالية</label>
                                </div>
                            </div>
                            <div className="ag-modal-footer">
                                <button type="button" className="ag-btn ag-btn-ghost" onClick={() => setShowModal(false)} disabled={isSaving}>إلغاء</button>
                                <button type="submit" className="ag-btn ag-btn-primary" disabled={isSaving}>
                                    {isSaving ? 'جاري الحفظ...' : modalMode === 'create' ? 'إنشاء الحساب' : 'حفظ التعديلات'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
