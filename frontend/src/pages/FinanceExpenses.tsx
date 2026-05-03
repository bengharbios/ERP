// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, Plus, X, SlidersHorizontal,
    TrendingDown, FolderOpen, Eye, Printer,
    Calendar, RefreshCw, Trash2, Edit2,
    DollarSign, User, Landmark, Receipt,
    FileText, CheckCircle2, Clock
} from 'lucide-react';
import { expenseService, Expense, ExpenseCategory, ExpenseStats } from '../services/expense.service';
import { useSettingsStore } from '../store/settingsStore';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import './FinanceExpenses.css';

export default function FinanceExpenses() {
    // --- Data States ---
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [stats, setStats] = useState<ExpenseStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- UI States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    } | null>(null);

    // --- Modal States ---
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);
    const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

    // --- Form States (Expense) ---
    const [expenseForm, setExpenseForm] = useState({
        categoryId: '',
        amount: '',
        taxRate: '0',
        description: '',
        paidTo: '',
        expenseDate: new Date().toISOString().split('T')[0],
        paymentMethod: 'CASH',
        referenceNo: '',
        notes: ''
    });

    // --- Form States (Category) ---
    const [categoryForm, setCategoryForm] = useState({
        name: '',
        nameAr: '',
        description: ''
    });

    const { settings } = useSettingsStore();

    useEffect(() => {
        fetchAllData();
    }, []);

    const fetchAllData = async () => {
        try {
            setLoading(true);
            const [expRes, catRes, statRes] = await Promise.all([
                expenseService.getExpenses(),
                expenseService.getCategories(),
                expenseService.getStats()
            ]);

            if (expRes.success) setExpenses(expRes.data?.expenses || []);
            if (catRes.success) setCategories(catRes.data?.categories || []);
            if (statRes.success) setStats(statRes.data?.stats || null);
        } catch (error) {
            console.error('Fetch error:', error);
            setToast({ type: 'error', message: '❌ فشل تحميل بيانات المصاريف' });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveExpense = async () => {
        if (!expenseForm.categoryId || !expenseForm.amount || !expenseForm.description) {
            setToast({ type: 'warning', message: '⚠️ يرجى ملء الحقول المطلوبة' });
            return;
        }

        try {
            setIsSubmitting(true);
            const payload: Partial<Expense> = {
                ...expenseForm,
                amount: Number(expenseForm.amount),
                taxRate: Number(expenseForm.taxRate),
                paymentMethod: expenseForm.paymentMethod as any,
            };

            let res;
            if (isEditing && selectedItem) {
                res = await expenseService.updateExpense(selectedItem.id, payload);
            } else {
                res = await expenseService.createExpense(payload);
            }

            if (res.success) {
                setToast({ type: 'success', message: isEditing ? '✅ تم تحديث المصروف بنجاح' : '✅ تم تسجيل المصروف بنجاح' });
                setShowExpenseModal(false);
                fetchAllData();
                resetExpenseForm();
            }
        } catch (error: any) {
            setToast({ type: 'error', message: `❌ خطأ: ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteExpense = (id: string) => {
        setConfirmDialog({
            title: 'حذف مصروف',
            message: 'هل أنت متأكد من رغبتك في حذف هذا المصروف؟ لا يمكن التراجع عن هذه العملية.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    const res = await expenseService.deleteExpense(id);
                    if (res.success) {
                        setToast({ type: 'success', message: '✅ تم حذف المصروف بنجاح' });
                        fetchAllData();
                    }
                } catch (error: any) {
                    setToast({ type: 'error', message: `❌ خطأ: ${error.message}` });
                }
                setConfirmDialog(null);
            }
        });
    };

    const handleSaveCategory = async () => {
        if (!categoryForm.name || !categoryForm.nameAr) {
            setToast({ type: 'warning', message: '⚠️ يرجى ملء اسم التصنيف بالعربية والإنجليزية' });
            return;
        }

        try {
            setIsSubmitting(true);
            let res;
            if (isEditing && selectedItem) {
                res = await expenseService.updateCategory(selectedItem.id, categoryForm);
            } else {
                res = await expenseService.createCategory(categoryForm);
            }

            if (res.success) {
                setToast({ type: 'success', message: '✅ تم حفظ التصنيف بنجاح' });
                fetchAllData();
                resetCategoryForm();
            }
        } catch (error: any) {
            setToast({ type: 'error', message: `❌ خطأ: ${error.message}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetExpenseForm = () => {
        setExpenseForm({
            categoryId: '',
            amount: '',
            taxRate: settings?.taxRate?.toString() || '0',
            description: '',
            paidTo: '',
            expenseDate: new Date().toISOString().split('T')[0],
            paymentMethod: 'CASH',
            referenceNo: '',
            notes: ''
        });
        setIsEditing(false);
        setSelectedItem(null);
    };

    const resetCategoryForm = () => {
        setCategoryForm({ name: '', nameAr: '', description: '' });
        setIsEditing(false);
        setSelectedItem(null);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount) + ' ' + (settings?.currency || 'SAR');
    };

    const filteredExpenses = useMemo(() => {
        return expenses.filter(exp => {
            const matchesSearch = !searchTerm ||
                exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.expenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.paidTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                exp.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = filterCategory === '' || exp.categoryId === filterCategory;
            return matchesSearch && matchesCategory;
        });
    }, [expenses, searchTerm, filterCategory]);

    const SidebarContent = () => (
        <>
            <div className="ag-sidebar-head">
                <span className="ag-sidebar-head-title">الفلاتر والأدوات</span>
                <button className="ag-sidebar-head-close" onClick={() => setShowMobileFilters(false)}>
                    <X size={18} />
                </button>
            </div>
            <div className="ag-sidebar-pane">
                <div className="ag-filter-group">
                    <span className="ag-filter-label">البحث السريع</span>
                    <div className="ag-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="الوصف، الرقم، المستلم..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">التصنيف</span>
                    <select className="ag-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                        <option value="">كل التصنيفات</option>
                        {categories.map(cat => (
                            <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                        ))}
                    </select>
                </div>

                <div className="ag-divider" />

                <button className="ag-btn ag-btn-ghost" style={{ width: '100%', marginTop: 'auto' }} onClick={fetchAllData}>
                    <RefreshCw size={14} /> تحديث البيانات
                </button>
            </div>
        </>
    );

    return (
        <div className="ag-root">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}
            {confirmDialog && (
                <ConfirmDialog
                    title={confirmDialog.title}
                    message={confirmDialog.message}
                    type={confirmDialog.type}
                    onConfirm={confirmDialog.onConfirm}
                    onCancel={() => setConfirmDialog(null)}
                />
            )}

            {/* ── HEADER ── */}
            <div className="ag-header">
                <div className="ag-header-left">
                    <h1 className="ag-title">
                        <span className="hide-mobile"><FileText size={20} /></span> سندات الصرف
                    </h1>
                    <div className="ag-mini-stats hide-mobile">
                        <div className="ag-stat-pill">
                            <span>الإجمالي All-Time:</span>
                            <span className="ag-stat-val">{formatCurrency(stats?.totalAllTime || 0)}</span>
                        </div>
                        <div className="ag-stat-pill" style={{ borderColor: 'var(--hz-orange)' }}>
                            <span style={{ color: 'var(--hz-orange)' }}>هذا الشهر:</span>
                            <span className="ag-stat-val">{formatCurrency(stats?.totalThisMonth || 0)}</span>
                        </div>
                    </div>
                </div>
                <div className="ag-header-right">
                    <button className="ag-btn ag-btn-ghost hide-mobile" onClick={() => { resetCategoryForm(); setShowCategoryModal(true); }}>
                        <FolderOpen size={16} />
                        <span>التصنيفات</span>
                    </button>
                    <button className="ag-btn-icon mobile-only" title="تصفية" onClick={() => setShowMobileFilters(true)}>
                        <SlidersHorizontal size={16} />
                    </button>
                    <button className="ag-btn ag-btn-primary" onClick={() => { resetExpenseForm(); setShowExpenseModal(true); }}>
                        <Plus size={16} />
                        <span className="hide-mobile">تسجيل مصروف</span>
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

                {/* Main Content */}
                <div className="ag-main">
                    <div className="ag-table-wrap">
                        <table className="ag-table">
                            <thead>
                                <tr>
                                    <th>رقم المصروف</th>
                                    <th>التاريخ</th>
                                    <th>التصنيف</th>
                                    <th>الجهة / المستلم</th>
                                    <th>المبلغ (+ض)</th>
                                    <th>طريقة الدفع</th>
                                    <th className="text-center">الإجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} className="text-center" style={{ padding: '40px' }}>جاري التحميل...</td></tr>
                                ) : filteredExpenses.length > 0 ? (
                                    filteredExpenses.map(exp => (
                                        <tr key={exp.id}>
                                            <td>
                                                <div className="ag-id-pill">#{exp.expenseNumber}</div>
                                            </td>
                                            <td>
                                                <div className="ag-date-cell">
                                                    <Calendar size={14} />
                                                    {new Date(exp.expenseDate).toLocaleDateString('ar-SA')}
                                                </div>
                                            </td>
                                            <td>
                                                <span className="ag-category-tag">{exp.category?.nameAr}</span>
                                            </td>
                                            <td>
                                                <strong style={{ color: 'var(--hz-text-bright)' }}>{exp.paidTo || '---'}</strong>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--hz-text-muted)', marginTop: '2px' }}>{exp.description}</div>
                                            </td>
                                            <td>
                                                <div className="ag-amount-badge">
                                                    {formatCurrency(exp.totalAmount || exp.amount)}
                                                </div>
                                            </td>
                                            <td>
                                                <div className="ag-method-pill">{exp.paymentMethod}</div>
                                            </td>
                                            <td>
                                                <div className="ag-table-actions">
                                                    <button className="ag-action-btn view" title="معاينة السند" onClick={() => { setViewingExpense(exp); setShowVoucherModal(true); }}>
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="ag-action-btn edit" title="تعديل" onClick={() => {
                                                        setSelectedItem(exp);
                                                        setExpenseForm({
                                                            categoryId: exp.categoryId,
                                                            amount: String(exp.amount),
                                                            taxRate: String(exp.taxRate || 0),
                                                            description: exp.description,
                                                            paidTo: exp.paidTo || '',
                                                            expenseDate: new Date(exp.expenseDate).toISOString().split('T')[0],
                                                            paymentMethod: exp.paymentMethod,
                                                            referenceNo: exp.referenceNo || '',
                                                            notes: exp.notes || ''
                                                        });
                                                        setIsEditing(true);
                                                        setShowExpenseModal(true);
                                                    }}>
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button className="ag-action-btn delete" title="حذف" onClick={() => handleDeleteExpense(exp.id)}>
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7}>
                                            <div className="ag-empty">
                                                <Receipt size={40} opacity={0.3} />
                                                <p>لا توجد سندات صرف مطابقة</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── MODALS ── */}

            {/* Category Management Modal */}
            {showCategoryModal && createPortal(
                <div className="ag-modal-overlay" onClick={() => setShowCategoryModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head">
                            <div className="ag-modal-title">
                                <div className="ag-avatar" style={{ background: 'var(--hz-surface-3)', width: '48px', height: '48px' }}>
                                    <FolderOpen size={24} color="var(--hz-orange)" />
                                </div>
                                <div>
                                    <h3>إدارة تصنيفات المصاريف</h3>
                                    <p>تعريف وتعديل مجموعات الصرف (رواتب، إيجارات، إلخ)</p>
                                </div>
                            </div>
                            <button className="ag-btn-icon" onClick={() => setShowCategoryModal(false)}><X size={20} /></button>
                        </div>
                        <div className="ag-modal-body">
                            <div className="ag-section-title">إضافة / تعديل تصنيف</div>
                            <div className="ag-form-row cols-2">
                                <div className="ag-form-group">
                                    <label className="ag-label">الاسم بالعربية *</label>
                                    <input className="ag-input" placeholder="مثلاً: الرواتب" value={categoryForm.nameAr} onChange={e => setCategoryForm({ ...categoryForm, nameAr: e.target.value })} />
                                </div>
                                <div className="ag-form-group">
                                    <label className="ag-label">الاسم بالإنجليزية</label>
                                    <input className="ag-input" placeholder="e.g. Salaries" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} />
                                </div>
                            </div>
                            <button className="ag-btn ag-btn-primary" style={{ width: '100%', marginTop: '16px', background: 'var(--hz-orange)', color: '#FFF' }} onClick={handleSaveCategory} disabled={isSubmitting}>
                                {isEditing ? 'تحديث التصنيف' : 'حفظ التصنيف الجديد'}
                            </button>

                            <div className="ag-divider" style={{ margin: '24px 0' }} />

                            <div className="ag-section-title">التصنيفات المتاحة</div>
                            <div className="ag-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {categories.map(cat => (
                                    <div key={cat.id} className="ag-list-item">
                                        <div className="ag-list-item-info">
                                            <span className="ag-list-item-title">{cat.nameAr}</span>
                                            <span className="ag-list-item-sub">{cat.name}</span>
                                        </div>
                                        <div className="ag-list-item-actions">
                                            <button className="ag-btn-icon small" onClick={() => {
                                                setSelectedItem(cat);
                                                setCategoryForm({ name: cat.name, nameAr: cat.nameAr, description: cat.description || '' });
                                                setIsEditing(true);
                                            }}><Edit2 size={12} /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="ag-modal-foot">
                            <button className="ag-btn ag-btn-ghost" onClick={() => setShowCategoryModal(false)}>إغلاق النافذة</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Expense Record Modal */}
            {showExpenseModal && createPortal(
                <div className="ag-modal-overlay" onClick={() => setShowExpenseModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '800px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head">
                            <div className="ag-modal-title">
                                <div className="ag-avatar" style={{ background: 'linear-gradient(135deg, var(--hz-orange), #EA580C)', width: '48px', height: '48px' }}>
                                    <TrendingDown size={24} color="#FFF" />
                                </div>
                                <div>
                                    <h3>{isEditing ? 'تعديل بيانات المصروف' : 'تسجيل مصروف مالي جديد'}</h3>
                                    <p>إدخال التفاصيل المالية، الضريبية، وجهة الصرف</p>
                                </div>
                            </div>
                            <button className="ag-btn-icon" onClick={() => setShowExpenseModal(false)}><X size={20} /></button>
                        </div>
                        <div className="ag-modal-body">
                            <div className="ag-section-title">
                                <FileText size={16} /> البيانات الأساسية والجهة
                            </div>
                            <div className="ag-form-row cols-2">
                                <div className="ag-form-group">
                                    <label className="ag-label">التصنيف *</label>
                                    <select className="ag-input" value={expenseForm.categoryId} onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}>
                                        <option value="">-- اختر التصنيف --</option>
                                        {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.nameAr}</option>)}
                                    </select>
                                </div>
                                <div className="ag-form-group">
                                    <label className="ag-label">صرفنا إلى (المورد / المستلم)</label>
                                    <input className="ag-input" placeholder="اسم الشركة أو الشخص المستلم" value={expenseForm.paidTo} onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })} />
                                </div>
                            </div>

                            <div className="ag-form-group" style={{ marginTop: '16px' }}>
                                <label className="ag-label">الوصف / الغرض من الصرف *</label>
                                <textarea className="ag-input" style={{ minHeight: '80px' }} placeholder="شرح موجز لعملية الصرف..." value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
                            </div>

                            <div className="ag-section-title" style={{ marginTop: '24px' }}>
                                <DollarSign size={16} /> التفاصيل المالية والضريبة
                            </div>
                            <div className="ag-form-row" style={{ gridTemplateColumns: '1fr 1fr 1fr' }}>
                                <div className="ag-form-group">
                                    <label className="ag-label">المبلغ الأساسي *</label>
                                    <input type="number" className="ag-input" style={{ fontWeight: 800, fontSize: '1.1rem' }} value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
                                </div>
                                <div className="ag-form-group">
                                    <label className="ag-label">نسبة الضريبة (%)</label>
                                    <input type="number" className="ag-input" value={expenseForm.taxRate} onChange={(e) => setExpenseForm({ ...expenseForm, taxRate: e.target.value })} />
                                </div>
                                <div className="ag-form-group">
                                    <label className="ag-label">تاريخ الصرف *</label>
                                    <input type="date" className="ag-input" value={expenseForm.expenseDate} onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="ag-form-row cols-2" style={{ marginTop: '16px' }}>
                                <div className="ag-form-group">
                                    <label className="ag-label">طريقة الدفع</label>
                                    <select className="ag-input" value={expenseForm.paymentMethod} onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}>
                                        <option value="CASH">نقدي</option>
                                        <option value="BANK_TRANSFER">تحويل بنكي</option>
                                        <option value="CHEQUE">شيك</option>
                                        <option value="POS">نقاط بيع</option>
                                    </select>
                                </div>
                                <div className="ag-form-group">
                                    <label className="ag-label">رقم المرجع (Optional)</label>
                                    <input className="ag-input" placeholder="رقم التحويل أو الشيك" value={expenseForm.referenceNo} onChange={(e) => setExpenseForm({ ...expenseForm, referenceNo: e.target.value })} />
                                </div>
                            </div>

                            <div className="ag-payment-box" style={{ marginTop: '24px' }}>
                                <div className="ag-fin-row">
                                    <span className="ag-label">المبلغ الأساسي (قبل الضريبة):</span>
                                    <span>{formatCurrency(Number(expenseForm.amount))}</span>
                                </div>
                                <div className="ag-fin-row" style={{ fontSize: '1.3rem', fontWeight: 900, border: 'none', paddingTop: '10px' }}>
                                    <span style={{ color: 'var(--hz-text-bright)' }}>إجمالي المبلغ مع الضريبة:</span>
                                    <span style={{ color: 'var(--hz-orange)' }}>
                                        {formatCurrency(Number(expenseForm.amount) + (Number(expenseForm.amount) * Number(expenseForm.taxRate)) / 100)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="ag-modal-foot">
                            <button className="ag-btn ag-btn-ghost" onClick={() => setShowExpenseModal(false)}>إلغاء</button>
                            <button className="ag-btn ag-btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--hz-orange)', color: '#FFF' }} onClick={handleSaveExpense} disabled={isSubmitting}>
                                {isSubmitting ? 'جاري المعالجة...' : '✅ تأكيد وحفظ السند'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Voucher Preview Modal */}
            {showVoucherModal && viewingExpense && createPortal(
                <div className="ag-modal-overlay" onClick={() => setShowVoucherModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head no-print">
                            <div className="ag-modal-title">
                                <div className="ag-avatar" style={{ background: 'var(--hz-surface-3)', width: '40px', height: '40px' }}>
                                    <Printer size={20} color="var(--hz-orange)" />
                                </div>
                                <div>
                                    <h3>معاينة سند الصرف</h3>
                                    <p>مراجعة السند المالي قبل الطباعة</p>
                                </div>
                            </div>
                            <button className="ag-btn-icon" onClick={() => setShowVoucherModal(false)}><X size={18} /></button>
                        </div>
                        <div className="ag-modal-body">
                            <div className="ag-voucher-paper" id="voucher-to-print">
                                <div className="ag-voucher-header">
                                    <div className="ag-voucher-branding">
                                        <h2>{settings?.instituteNameAr || 'نظام المعهد الذكي'}</h2>
                                        <p>{settings?.instituteAddress}</p>
                                        <p>{settings?.institutePhone}</p>
                                    </div>
                                    <div className="ag-voucher-title-badge">
                                        <h1>سند صـرف</h1>
                                        <div className="ag-v-number">#{viewingExpense.expenseNumber}</div>
                                    </div>
                                </div>

                                <div className="ag-voucher-content">
                                    <div className="ag-v-row">
                                        <span className="ag-v-label">صرفنا إلى السيد/السادة:</span>
                                        <div className="ag-v-dots"><strong>{viewingExpense.paidTo || '---'}</strong></div>
                                        <span className="ag-v-label" style={{ minWidth: '80px' }}>التاريخ:</span>
                                        <div className="ag-v-dots">{new Date(viewingExpense.expenseDate).toLocaleDateString('ar-SA')}</div>
                                    </div>

                                    <div className="ag-v-row highlighter">
                                        <span className="ag-v-label">مبلغ وقدره:</span>
                                        <div className="ag-v-dots amount">{formatCurrency(viewingExpense.totalAmount || viewingExpense.amount)}</div>
                                    </div>

                                    <div className="ag-v-row">
                                        <span className="ag-v-label">وذلك عـن:</span>
                                        <div className="ag-v-dots">{viewingExpense.description}</div>
                                    </div>

                                    <div className="ag-v-row">
                                        <span className="ag-v-label">طريقة الدفع:</span>
                                        <div className="ag-v-dots">{viewingExpense.paymentMethod}</div>
                                        <span className="ag-v-label" style={{ minWidth: '80px' }}>المرجع:</span>
                                        <div className="ag-v-dots">{viewingExpense.referenceNo || '---'}</div>
                                    </div>

                                    <div className="ag-tax-summary">
                                        <div>المبلغ قبل الضريبة: {formatCurrency(viewingExpense.amount)}</div>
                                        <div>الضريبة ({viewingExpense.taxRate}%): {formatCurrency(viewingExpense.taxAmount || 0)}</div>
                                    </div>
                                </div>

                                <div className="ag-voucher-footer">
                                    <div className="ag-sig-block">
                                        <span>توقيع المستلم</span>
                                        <div className="ag-sig-line"></div>
                                    </div>
                                    <div className="ag-sig-block">
                                        <span>المحاسب</span>
                                        <div className="ag-sig-line"></div>
                                    </div>
                                    <div className="ag-sig-block">
                                        <span>الختم الرسمي</span>
                                        <div className="ag-stamp"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="ag-modal-foot no-print">
                            <button className="ag-btn ag-btn-ghost" onClick={() => setShowVoucherModal(false)}>إغلاق</button>
                            <button className="ag-btn ag-btn-primary" style={{ background: 'var(--hz-orange)', color: '#FFF' }} onClick={() => window.print()}>
                                <Printer size={16} /> طباعة السند الآن
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
