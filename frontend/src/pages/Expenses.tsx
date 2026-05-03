import { useState, useEffect } from 'react';
import { expenseService, Expense, ExpenseCategory, ExpenseStats } from '../services/expense.service';
import { useSettingsStore } from '../store/settingsStore';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import {
    Plus,
    Search,
    Edit2,
    Trash2,
    Eye,
    FolderOpen,
    Calendar,
    Printer,
    FileText,
    Receipt,
    RefreshCw
} from 'lucide-react';
import './Expenses.css';

export default function Expenses() {
    // --- Data States ---
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [categories, setCategories] = useState<ExpenseCategory[]>([]);
    const [stats, setStats] = useState<ExpenseStats | null>(null);
    const [loading, setLoading] = useState(true);

    // --- Filter & UI States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
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
    const [isEditing, setIsEditing] = useState(false);
    const [selectedItem, setSelectedItem] = useState<any>(null);

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

    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

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

    // --- Expense Handlers ---
    const handleSaveExpense = async () => {
        if (!expenseForm.categoryId || !expenseForm.amount || !expenseForm.description) {
            setToast({ type: 'warning', message: '⚠️ يرجى ملء الحقول المطلوبة' });
            return;
        }

        try {
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

    // --- Category Handlers ---
    const handleSaveCategory = async () => {
        if (!categoryForm.name || !categoryForm.nameAr) {
            setToast({ type: 'warning', message: '⚠️ يرجى ملء اسم التصنيف بالعربية والإنجليزية' });
            return;
        }

        try {
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
                // We keep the modal open to see the list update, or close if you prefer.
                // Keeping it open as it has a list view.
            }
        } catch (error: any) {
            setToast({ type: 'error', message: `❌ خطأ: ${error.message}` });
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

    // --- Filtering ---
    const filteredExpenses = expenses.filter(exp => {
        const matchesSearch =
            exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.expenseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.paidTo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            exp.referenceNo?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === '' || exp.categoryId === filterCategory;
        return matchesSearch && matchesCategory;
    });

    return (
        <div className="next-gen-page-container">
            {/* --- Premium Floating Header --- */}
            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">
                            <Receipt size={28} strokeWidth={2.5} />
                        </div>
                        <div className="branding-text">
                            <h1>إدارة المصاريف</h1>
                            <p>تتبع جميع نفقات ومصاريف المعهد بدقة</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-modern btn-secondary-glass" onClick={() => { resetCategoryForm(); setShowCategoryModal(true); }}>
                            <FolderOpen size={18} strokeWidth={2.5} />
                            <span>إدارة التصنيفات</span>
                        </button>
                        <button className="btn-modern btn-orange-gradient" onClick={() => { resetExpenseForm(); setShowExpenseModal(true); }}>
                            <Plus size={18} strokeWidth={2.8} />
                            <span>تسجيل مصروف جديد</span>
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
                            placeholder="البحث برقم المصروف، الوصف، أو الجهة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="divider-v"></div>
                    <div className="filters-group">
                        <div style={{ position: 'relative', width: '220px' }}>
                            <select
                                className="modern-select"
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                            >
                                <option value="">كل التصنيفات</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                                ))}
                            </select>
                        </div>
                        <button className="btn-modern btn-orange-gradient" onClick={() => { setSearchTerm(''); setFilterCategory(''); }} style={{ padding: '0 1.5rem', height: '52px' }}>
                            <RefreshCw size={16} />
                            إعادة ضبط
                        </button>
                    </div>
                </section>

                {/* Dashboard Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card-mini" style={{ borderRight: '3px solid var(--orange-primary)' }}>
                        <div className="stat-label">إجمالي المصاريف</div>
                        <div className="stat-value">{formatCurrency(stats?.totalAllTime || 0)}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #3182CE' }}>
                        <div className="stat-label">مصاريف الشهر الحالي</div>
                        <div className="stat-value">{formatCurrency(stats?.totalThisMonth || 0)}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #38A169' }}>
                        <div className="stat-label">عدد التصنيفات</div>
                        <div className="stat-value">{categories.length}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #6B46C1' }}>
                        <div className="stat-label">متوسط المصروف</div>
                        <div className="stat-value">{expenses.length > 0 ? formatCurrency((stats?.totalAllTime || 0) / expenses.length) : '0.00 ' + settings?.currency}</div>
                    </div>
                </div>

                {/* Expenses Table Container */}
                <div className="next-gen-table-container">
                    <table className="modern-data-table">
                        <thead>
                            <tr>
                                <th>رقم المصروف</th>
                                <th>التاريخ</th>
                                <th>التصنيف</th>
                                <th>صرفنا إلى</th>
                                <th>الوصف</th>
                                <th className="text-center">المبلغ</th>
                                <th className="text-center">الإجمالي (+ض)</th>
                                <th className="text-center">الإجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={8} className="text-center" style={{ padding: '3rem' }}>جاري التحميل...</td></tr>
                            ) : filteredExpenses.length > 0 ? (
                                filteredExpenses.map(exp => (
                                    <tr key={exp.id}>
                                        <td>
                                            <div className="id-badge orange">#{exp.expenseNumber}</div>
                                        </td>
                                        <td>
                                            <div className="date-cell">
                                                <Calendar size={14} />
                                                {new Date(exp.expenseDate).toLocaleDateString('ar-EG')}
                                            </div>
                                        </td>
                                        <td>
                                            <span className="category-pill-2026">{exp.category?.nameAr}</span>
                                        </td>
                                        <td>
                                            <span style={{ fontWeight: '700', color: '#1E293B' }}>{exp.paidTo || '---'}</span>
                                        </td>
                                        <td style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {exp.description}
                                        </td>
                                        <td className="text-center font-bold">
                                            {formatCurrency(exp.amount)}
                                        </td>
                                        <td className="text-center">
                                            <div className="amount-total-pill orange">
                                                {formatCurrency(exp.totalAmount || exp.amount)}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="table-actions-2026 justify-center">
                                                <button className="action-btn-2026 view" title="معاينة" onClick={() => {
                                                    setViewingExpense(exp);
                                                    setShowVoucherModal(true);
                                                }}>
                                                    <Eye size={16} />
                                                </button>
                                                <button className="action-btn-2026 edit" title="تعديل" onClick={() => {
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
                                                <button className="action-btn-2026 delete" title="حذف" onClick={() => handleDeleteExpense(exp.id)}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8}>
                                        <div className="empty-state-2026">
                                            <Search size={48} color="#94A3B8" />
                                            <p>لا توجد مصاريف مطابقة للبحث</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </main>

            {/* Premium Expense Modal */}
            {showExpenseModal && (
                <div className="premium-modal-overlay active">
                    <div className="premium-modal-container" style={{ maxWidth: '800px' }}>
                        <div className="premium-modal-header">
                            <div className="premium-modal-header-title">
                                <div className="premium-modal-header-icon orange">
                                    <Receipt size={22} />
                                </div>
                                <div>
                                    <h3>{isEditing ? 'تعديل مصروف' : 'تسجيل مصروف جديد'}</h3>
                                    <p>أدخل بيانات المصروف المالي والضريبة بدقة</p>
                                </div>
                            </div>
                            <button className="premium-modal-close" onClick={() => setShowExpenseModal(false)}>×</button>
                        </div>

                        <div className="premium-modal-body">
                            <div className="form-row-2026">
                                <div className="form-group-2026">
                                    <label>التصنيف *</label>
                                    <select
                                        className="modern-select"
                                        value={expenseForm.categoryId}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, categoryId: e.target.value })}
                                    >
                                        <option value="">اختر التصنيف</option>
                                        {categories.map(cat => (
                                            <option key={cat.id} value={cat.id}>{cat.nameAr}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group-2026">
                                    <label>صرفنا إلى (المورد/المستلم)</label>
                                    <input
                                        className="input-premium"
                                        placeholder="اسم الشخص أو الشركة"
                                        value={expenseForm.paidTo}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, paidTo: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row-2026 tri-grid">
                                <div className="form-group-2026 text-center">
                                    <label>المبلغ الأساسي *</label>
                                    <input
                                        type="number"
                                        className="input-premium text-center"
                                        style={{ fontSize: '1.2rem', fontWeight: '800' }}
                                        value={expenseForm.amount}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                                    />
                                </div>
                                <div className="form-group-2026 text-center">
                                    <label>نسبة الضريبة (%)</label>
                                    <input
                                        type="number"
                                        className="input-premium text-center"
                                        value={expenseForm.taxRate}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, taxRate: e.target.value })}
                                    />
                                </div>
                                <div className="form-group-2026">
                                    <label>التاريخ *</label>
                                    <input
                                        type="date"
                                        className="input-premium"
                                        value={expenseForm.expenseDate}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, expenseDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group-2026">
                                <label>الوصف *</label>
                                <textarea
                                    className="input-premium"
                                    style={{ height: '80px', paddingTop: '0.75rem' }}
                                    placeholder="شرح مختصر للمصروف..."
                                    value={expenseForm.description}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                                />
                            </div>

                            <div className="form-row-2026">
                                <div className="form-group-2026">
                                    <label>طريقة الدفع</label>
                                    <select
                                        className="modern-select"
                                        value={expenseForm.paymentMethod}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value as any })}
                                    >
                                        <option value="CASH">نقدي</option>
                                        <option value="BANK_TRANSFER">تحويل بنكي</option>
                                        <option value="CHEQUE">شيك</option>
                                        <option value="ONLINE">أونلاين</option>
                                        <option value="POS">نقاط بيع</option>
                                    </select>
                                </div>
                                <div className="form-group-2026">
                                    <label>المرجع / رقم الإيصال</label>
                                    <input
                                        className="input-premium"
                                        placeholder="رقم العملية أو الإيصال"
                                        value={expenseForm.referenceNo}
                                        onChange={(e) => setExpenseForm({ ...expenseForm, referenceNo: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group-2026">
                                <label>ملاحظات إضافية</label>
                                <textarea
                                    className="input-premium"
                                    style={{ height: '60px', paddingTop: '0.75rem' }}
                                    rows={2}
                                    value={expenseForm.notes}
                                    onChange={(e) => setExpenseForm({ ...expenseForm, notes: e.target.value })}
                                />
                            </div>

                            <div className="total-preview-orange-2026">
                                <div className="preview-label">إجمالي المصروف مع الضريبة:</div>
                                <div className="preview-value">
                                    {formatCurrency(Number(expenseForm.amount) + (Number(expenseForm.amount) * Number(expenseForm.taxRate)) / 100)}
                                </div>
                            </div>
                        </div>

                        <div className="premium-modal-footer">
                            <button className="premium-footer-btn secondary" onClick={() => setShowExpenseModal(false)}>إلغاء</button>
                            <button className="premium-footer-btn primary" onClick={handleSaveExpense}>
                                <FileText size={18} />
                                حفظ البيانات
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Voucher Preview Modal */}
            {showVoucherModal && viewingExpense && (
                <div className="premium-modal-overlay active">
                    <div className="premium-modal-container voucher-modal-2026" style={{ maxWidth: '850px' }}>
                        <div className="premium-modal-header no-print">
                            <div className="premium-modal-header-title">
                                <div className="premium-modal-header-icon orange">
                                    <Printer size={22} />
                                </div>
                                <div>
                                    <h3>سند صرف مالي</h3>
                                    <p>معاينة وطباعة سند الصرف الخاص بالمصروف</p>
                                </div>
                            </div>
                            <button className="premium-modal-close" onClick={() => setShowVoucherModal(false)}>×</button>
                        </div>

                        <div className="premium-modal-body">
                            <div className="voucher-paper-2026" id="voucher-to-print">
                                <div className="voucher-header-2026">
                                    <div className="institute-branding">
                                        <h2>{settings?.instituteNameAr}</h2>
                                        <p>{settings?.instituteAddress}</p>
                                        <p>{settings?.institutePhone}</p>
                                    </div>
                                    <div className="voucher-title-badge">
                                        <h1>سند صرف</h1>
                                        <div className="v-number">#{viewingExpense.expenseNumber}</div>
                                    </div>
                                </div>

                                <div className="voucher-content-2026">
                                    <div className="v-field-row">
                                        <div className="v-label">صرفنا إلى:</div>
                                        <div className="v-value-dotted font-bold">{viewingExpense.paidTo || '---'}</div>
                                        <div className="v-label" style={{ minWidth: '80px' }}>التاريخ:</div>
                                        <div className="v-value-dotted">{new Date(viewingExpense.expenseDate).toLocaleDateString('ar-EG')}</div>
                                    </div>

                                    <div className="v-field-row highlighter">
                                        <div className="v-label highlight-text">بمبلغ وقدره:</div>
                                        <div className="v-value-dotted amount-big">{formatCurrency(viewingExpense.totalAmount || viewingExpense.amount)}</div>
                                    </div>

                                    <div className="v-field-row">
                                        <div className="v-label">وذلك عن:</div>
                                        <div className="v-value-dotted">{viewingExpense.description}</div>
                                    </div>

                                    <div className="v-field-row">
                                        <div className="v-label">طريقة الدفع:</div>
                                        <div className="v-value-dotted">{viewingExpense.paymentMethod}</div>
                                        <div className="v-label" style={{ minWidth: '80px' }}>المرجع:</div>
                                        <div className="v-value-dotted">{viewingExpense.referenceNo || '---'}</div>
                                    </div>

                                    {viewingExpense.notes && (
                                        <div className="v-field-row">
                                            <div className="v-label">ملاحظات:</div>
                                            <div className="v-value-dotted">{viewingExpense.notes}</div>
                                        </div>
                                    )}

                                    <div className="v-tax-summary-2026">
                                        <div className="tax-item">المبلغ الأساسي: {formatCurrency(viewingExpense.amount)}</div>
                                        <div className="tax-item">قيمة الضريبة ({viewingExpense.taxRate}%): {formatCurrency(viewingExpense.taxAmount || 0)}</div>
                                    </div>
                                </div>

                                <div className="voucher-footer-2026">
                                    <div className="signature-block">
                                        <span>توقيع المستلم</span>
                                        <div className="under-line"></div>
                                    </div>
                                    <div className="signature-block">
                                        <span>الختم الرسمي</span>
                                        <div className="stamp-placeholder"></div>
                                    </div>
                                    <div className="signature-block">
                                        <span>المحاسب</span>
                                        <div className="under-line"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="premium-modal-footer no-print">
                            <button className="premium-footer-btn secondary" onClick={() => setShowVoucherModal(false)}>إغلاق</button>
                            <button className="premium-footer-btn primary" onClick={() => window.print()}>
                                <Printer size={18} />
                                طباعة السند
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Premium Category Modal */}
            {showCategoryModal && (
                <div className="premium-modal-overlay active">
                    <div className="premium-modal-container" style={{ maxWidth: '600px' }}>
                        <div className="premium-modal-header">
                            <div className="premium-modal-header-title">
                                <div className="premium-modal-header-icon orange">
                                    <FolderOpen size={22} />
                                </div>
                                <div>
                                    <h3>إدارة تصنيفات المصاريف</h3>
                                    <p>إضافة وتعديل تصنيفات المصاريف (رواتب، إيجار، إلخ)</p>
                                </div>
                            </div>
                            <button className="premium-modal-close" onClick={() => setShowCategoryModal(false)}>×</button>
                        </div>

                        <div className="premium-modal-body">
                            <div className="category-form-card-2026">
                                <div className="form-row-2026">
                                    <div className="form-group-2026">
                                        <label>الاسم بالإنجليزية</label>
                                        <input
                                            className="input-premium"
                                            placeholder="e.g. Salaries"
                                            value={categoryForm.name}
                                            onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group-2026">
                                        <label>الاسم بالعربية</label>
                                        <input
                                            className="input-premium"
                                            placeholder="مثلاً: الرواتب"
                                            value={categoryForm.nameAr}
                                            onChange={e => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="category-action-buttons">
                                    <button className="btn-modern btn-orange-gradient w-100" onClick={handleSaveCategory}>
                                        <Plus size={18} />
                                        {isEditing ? 'تحديث التصنيف' : 'إضافة تصنيف جديد'}
                                    </button>
                                    {isEditing && (
                                        <button className="btn-modern btn-secondary-glass w-100 mt-2" onClick={() => resetCategoryForm()}>
                                            إلغاء التعديل
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="modern-list-container mt-4">
                                <div className="list-header-2026">التصنيفات الحالية</div>
                                <div className="modern-scrollable-list" style={{ maxHeight: '250px' }}>
                                    {categories.length > 0 ? categories.map(cat => (
                                        <div key={cat.id} className="modern-list-item-2026">
                                            <div className="item-info">
                                                <span className="title">{cat.nameAr}</span>
                                                <span className="subtitle">{cat.name}</span>
                                            </div>
                                            <div className="item-actions">
                                                <button className="icon-action-btn edit" onClick={() => {
                                                    setSelectedItem(cat);
                                                    setCategoryForm({ name: cat.name, nameAr: cat.nameAr, description: cat.description || '' });
                                                    setIsEditing(true);
                                                }}>
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="icon-action-btn delete" onClick={() => {
                                                    setConfirmDialog({
                                                        title: 'حذف تصنيف',
                                                        message: 'هل أنت متأكد من حذف هذا التصنيف؟ لن يتم الحذف إذا كانت هناك مصاريف مرتبطة به.',
                                                        type: 'danger',
                                                        onConfirm: async () => {
                                                            try {
                                                                const res = await expenseService.deleteCategory(cat.id);
                                                                if (res.success) {
                                                                    setToast({ type: 'success', message: '✅ تم حذف التصنيف' });
                                                                    fetchAllData();
                                                                }
                                                            } catch (error: any) {
                                                                setToast({ type: 'error', message: `❌ خطأ: ${error.message}` });
                                                            }
                                                            setConfirmDialog(null);
                                                        }
                                                    });
                                                }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="empty-mini-state">
                                            <Search size={32} />
                                            <p>لا توجد تصنيفات مضافة</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="premium-modal-footer">
                            <button className="premium-footer-btn secondary" onClick={() => setShowCategoryModal(false)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}

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
        </div>
    );
}
