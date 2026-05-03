// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, Plus, X, SlidersHorizontal,
    CreditCard, FileText, Eye, Printer,
    CheckCircle, Clock, RefreshCw, Trash2,
    DollarSign, ShieldCheck, User, Landmark,
    FileDown, Grid, List
} from 'lucide-react';
import { feesService, StudentFeeCalculation } from '../services/fees.service';
import { studentService, Student } from '../services/student.service';
import accountService, { Account } from '../services/account.service';
import { useSettingsStore } from '../store/settingsStore';
import { Toast, ToastType } from '../components/Toast';
import './FinanceReceipts.css';

export default function FinanceReceipts() {
    // --- Data States ---
    const [payments, setPayments] = useState<any[]>([]);
    const [calculations, setCalculations] = useState<StudentFeeCalculation[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- UI States ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [methodFilter, setMethodFilter] = useState('all');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);

    // --- Modal States ---
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [viewPayment, setViewPayment] = useState<any | null>(null);

    // --- Form States (New Voucher) ---
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    const [selectedInstallmentId, setSelectedInstallmentId] = useState('');
    const [installmentPlans, setInstallmentPlans] = useState<any[]>([]);

    const { settings } = useSettingsStore();

    // --- Fetch Data ---
    useEffect(() => {
        fetchData();
        loadAccounts();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [calcRes, studRes, payRes] = await Promise.all([
                feesService.getStudentFeeCalculations(),
                studentService.getStudents(),
                feesService.getPayments()
            ]);
            if (calcRes.data) setCalculations(calcRes.data.calculations);
            if (studRes.data) setStudents(studRes.data.students);
            if (payRes.data) setPayments(payRes.data.payments);
        } catch (error) {
            console.error('Data Fetch Error:', error);
            setToast({ type: 'error', message: '❌ فشل تحميل البيانات' });
        } finally {
            setLoading(false);
        }
    };

    const loadAccounts = async () => {
        try {
            const results = await accountService.getAccounts({ isActive: true });
            setAccounts(results);
        } catch (error) {
            console.error("Error fetching accounts:", error);
        }
    };

    // --- Form Logic ---
    useEffect(() => {
        if (selectedStudent) {
            const studentCalcs = calculations.filter(c => c.studentId === selectedStudent.id);
            const allPlans = studentCalcs.flatMap(c => (c as any).installmentPlans || []);
            setInstallmentPlans(allPlans);
        } else {
            setInstallmentPlans([]);
            setSelectedInstallmentId('');
        }
    }, [selectedStudent, calculations]);

    const handleCreateVoucher = async () => {
        if (!selectedStudent || paymentAmount <= 0 || !selectedAccountId) {
            setToast({ type: 'error', message: '❌ يرجى اختيار الطالب والمبلغ وحساب الإيداع' });
            return;
        }

        try {
            setIsSubmitting(true);
            let calcId = '';
            if (selectedInstallmentId) {
                const plan = installmentPlans.find(p => p.installments.some((i: any) => i.id === selectedInstallmentId));
                calcId = plan?.calculationId;
            } else {
                const calc = calculations.find(c => c.studentId === selectedStudent.id && (c as any).status !== 'PAID');
                calcId = calc?.id || '';
            }

            if (!calcId) {
                setToast({ type: 'error', message: '❌ لا يوجد مطالبات مالية معلقة لهذا الطالب' });
                return;
            }

            const res = await feesService.createPayment({
                calculationId: calcId,
                installmentId: selectedInstallmentId || undefined,
                amount: Number(paymentAmount),
                method: paymentMethod as any,
                referenceNo: referenceNo,
                paymentDate: new Date().toISOString()
            });

            if (res.data) {
                setToast({ type: 'success', message: '✅ تم إصدار سند القبض بنجاح' });
                setShowVoucherModal(false);
                resetForm();
                fetchData();
            }
        } catch (error: any) {
            setToast({ type: 'error', message: `❌ فشل إصدار السند: ${error.message || 'خطأ غير معروف'}` });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReconcile = async (paymentId: string) => {
        if (!window.confirm('هل أنت متأكد من تأكيد هذا التحويل البنكي؟')) return;
        try {
            await feesService.reconcilePayment(paymentId);
            setToast({ type: 'success', message: '✅ تم تأكيد التحويل بنجاح' });
            fetchData();
        } catch (error: any) {
            setToast({ type: 'error', message: '❌ فشل تأكيد التحويل' });
        }
    };

    const resetForm = () => {
        setSelectedStudent(null);
        setPaymentAmount(0);
        setSelectedAccountId('');
        setReferenceNo('');
        setPaymentMethod('CASH');
        setSelectedInstallmentId('');
        setInstallmentPlans([]);
    };

    // --- Filtering ---
    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const student = p.student || p.feeCalculation?.student;
            const matchesSearch = !searchTerm ||
                p.receiptNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student?.firstNameAr?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                student?.lastNameAr?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'all' ||
                (statusFilter === 'reconciled' && p.reconciliationStatus === 'RECONCILED') ||
                (statusFilter === 'pending' && p.reconciliationStatus === 'PENDING');

            const matchesMethod = methodFilter === 'all' || p.method === methodFilter;

            return matchesSearch && matchesStatus && matchesMethod;
        });
    }, [payments, searchTerm, statusFilter, methodFilter]);

    // --- Stats ---
    const stats = useMemo(() => {
        return {
            totalCount: payments.length,
            totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
            pendingCount: payments.filter(p => p.reconciliationStatus === 'PENDING').length
        };
    }, [payments]);

    const SidebarContent = () => (
        <>
            <div className="ag-sidebar-head">
                <span className="ag-sidebar-head-title">الفلاتر</span>
                <button className="ag-sidebar-head-close" onClick={() => setShowMobileFilters(false)}>
                    <X size={18} />
                </button>
            </div>
            <div className="ag-sidebar-pane">
                <div className="ag-filter-group">
                    <span className="ag-filter-label">البحث</span>
                    <div className="ag-search">
                        <Search size={14} />
                        <input
                            type="text"
                            placeholder="رقم السند أو اسم الطالب..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">الحالة</span>
                    <select className="ag-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="all">كافة الحالات</option>
                        <option value="reconciled">مكتملة (مرحّلة)</option>
                        <option value="pending">معلقة</option>
                    </select>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">طريقة الدفع</span>
                    <select className="ag-select" value={methodFilter} onChange={(e) => setMethodFilter(e.target.value)}>
                        <option value="all">كافة الطرق</option>
                        <option value="CASH">نقدي</option>
                        <option value="BANK_TRANSFER">تحويل بنكي</option>
                        <option value="CARD">بطاقة</option>
                    </select>
                </div>

                <div className="ag-divider" />

                <button className="ag-btn ag-btn-ghost" style={{ width: '100%', marginTop: 'auto' }} onClick={fetchData}>
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
                        <span className="hide-mobile"><ShieldCheck size={20} /></span> سندات القبض
                    </h1>
                    <div className="ag-mini-stats hide-mobile">
                        <div className="ag-stat-pill">
                            <span>السندات:</span>
                            <span className="ag-stat-val">{stats.totalCount}</span>
                        </div>
                        <div className="ag-stat-pill">
                            <span>المبلغ:</span>
                            <span className="ag-stat-val">{stats.totalAmount.toLocaleString()} {settings?.currency || 'د.إ'}</span>
                        </div>
                        {stats.pendingCount > 0 && (
                            <div className="ag-stat-pill hide-mobile" style={{ borderColor: 'var(--hz-orange)' }}>
                                <span style={{ color: 'var(--hz-orange)' }}>معلق:</span>
                                <span className="ag-stat-val">{stats.pendingCount}</span>
                            </div>
                        )}
                    </div>
                </div>
                <div className="ag-header-right">
                    <button className="ag-btn-icon hide-mobile" title="تصدير" onClick={() => console.log('Export')}>
                        <FileDown size={16} />
                    </button>
                    <button className="ag-btn-icon mobile-only" title="تصفية" onClick={() => setShowMobileFilters(true)}>
                        <SlidersHorizontal size={16} />
                    </button>
                    <button className="ag-btn ag-btn-primary" onClick={() => setShowVoucherModal(true)}>
                        <Plus size={16} />
                        <span className="hide-mobile">إصدار سند</span>
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
                                    <th>رقم السند</th>
                                    <th>الطالب</th>
                                    <th>المبلغ</th>
                                    <th>الطريقة</th>
                                    <th>الحالة</th>
                                    <th>التاريخ</th>
                                    <th style={{ textAlign: 'center' }}>إجراءات</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>جاري التحميل...</td></tr>
                                ) : filteredPayments.length === 0 ? (
                                    <tr><td colSpan={7} style={{ textAlign: 'center', padding: '40px' }}>لا توجد سجلات مطابقة</td></tr>
                                ) : (
                                    filteredPayments.map(payment => {
                                        const s = payment.student || payment.feeCalculation?.student;
                                        return (
                                            <tr key={payment.id}>
                                                <td><strong>{payment.receiptNumber}</strong></td>
                                                <td>{s ? `${s.firstNameAr} ${s.lastNameAr}` : '---'}</td>
                                                <td><strong>{payment.amount.toLocaleString()} {settings?.currency || 'د.إ'}</strong></td>
                                                <td>{payment.method}</td>
                                                <td>
                                                    <span className={`ag-card-badge status-${payment.reconciliationStatus?.toLowerCase()}`}>
                                                        {payment.reconciliationStatus === 'RECONCILED' ? 'مكتمل' : 'معلق'}
                                                    </span>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', flexDirection: 'column', fontSize: '0.75rem' }}>
                                                        <span>{new Date(payment.paymentDate).toLocaleDateString('ar-AE')}</span>
                                                        <span style={{ color: 'var(--hz-text-muted)' }}>
                                                            <Clock size={10} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                                                            {new Date(payment.createdAt || payment.paymentDate).toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                                                        {payment.reconciliationStatus === 'PENDING' && (
                                                            <button className="ag-btn-icon confirm" title="تأكيد التحويل" onClick={() => handleReconcile(payment.id)}>
                                                                <CheckCircle size={16} />
                                                            </button>
                                                        )}
                                                        <button className="ag-btn-icon" title="عرض التفاصيل" onClick={() => setViewPayment(payment)}>
                                                            <Eye size={16} />
                                                        </button>
                                                        <button className="ag-btn-icon" title="طباعة" onClick={() => setViewPayment(payment)}>
                                                            <Printer size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ── MODALS ── */}
            {/* New Voucher Modal */}
            {showVoucherModal && createPortal(
                <div className="ag-modal-overlay" onClick={() => setShowVoucherModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head">
                            <div className="ag-modal-title">
                                <div className="ag-avatar" style={{ background: 'linear-gradient(135deg, var(--hz-orange), #EA580C)', width: '48px', height: '48px' }}>
                                    <Plus size={24} color="#FFF" />
                                </div>
                                <div>
                                    <h3>إصدار سند قبض جديد</h3>
                                    <p>تسجيل تحصيل مالي جديد في النظام المالي</p>
                                </div>
                            </div>
                            <button className="ag-btn-icon" onClick={() => setShowVoucherModal(false)}><X size={20} /></button>
                        </div>
                        <div className="ag-modal-body">
                            <div className="ag-section-title">
                                <User size={16} /> بيانات العميل والإسناد المالي
                            </div>
                            <div className="ag-form-group">
                                <label className="ag-label">اختيار الطالب المستهدف *</label>
                                <select className="ag-input" value={selectedStudent?.id || ''} onChange={(e) => setSelectedStudent(students.find(s => s.id === e.target.value) || null)}>
                                    <option value="">-- اختر الطالب --</option>
                                    {students.map(s => <option key={s.id} value={s.id}>{s.firstNameAr} {s.lastNameAr}</option>)}
                                </select>
                            </div>

                            {selectedStudent && installmentPlans.length > 0 && (
                                <div className="ag-form-group" style={{ marginTop: '16px' }}>
                                    <label className="ag-label">اختيار القسط المرتبط (اختياري)</label>
                                    <select className="ag-input" value={selectedInstallmentId} onChange={(e) => {
                                        const instId = e.target.value;
                                        setSelectedInstallmentId(instId);
                                        if (instId) {
                                            const inst = installmentPlans.flatMap(p => p.installments).find(i => i.id === instId);
                                            if (inst) setPaymentAmount(Number(inst.balance));
                                        }
                                    }}>
                                        <option value="">سداد عام (بدون تحديد قسط)</option>
                                        {installmentPlans.map(plan => plan.installments.filter(i => i.status !== 'PAID').map(inst => (
                                            <option key={inst.id} value={inst.id}>
                                                {plan.nameAr} - قسط {inst.installmentNumber} ({inst.balance} {settings?.currency || 'ر.س'})
                                            </option>
                                        )))}
                                    </select>
                                </div>
                            )}

                            <div className="ag-section-title" style={{ marginTop: '24px' }}>
                                <DollarSign size={16} /> تفاصيل العملية المالية
                            </div>
                            <div className="ag-form-row cols-2">
                                <div className="ag-form-group">
                                    <label className="ag-label">المبلغ المطلوب تحصيله *</label>
                                    <input type="number" className="ag-input" value={paymentAmount} onChange={(e) => setPaymentAmount(Number(e.target.value))} />
                                </div>
                                <div className="ag-form-group">
                                    <label className="ag-label">طريقة التحصيل</label>
                                    <select className="ag-input" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                                        <option value="CASH">نقدي (Cash)</option>
                                        <option value="BANK_TRANSFER">تحويل بنكي (Bank)</option>
                                        <option value="CARD">بطاقة (Card / POS)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="ag-form-group" style={{ marginTop: '16px' }}>
                                <label className="ag-label">حساب الإيداع الوجهة *</label>
                                <select className="ag-input" value={selectedAccountId} onChange={(e) => setSelectedAccountId(e.target.value)}>
                                    <option value="">-- اختر الحساب المصرفي / الخزينة --</option>
                                    {accounts.filter(acc => acc.type === 'ASSET').map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="ag-form-group" style={{ marginTop: '16px' }}>
                                <label className="ag-label">المرجع / الملاحظات الإضافية</label>
                                <input type="text" className="ag-input" placeholder="رقم العملية، رقم الشيك، ملاحظات..." value={referenceNo} onChange={(e) => setReferenceNo(e.target.value)} />
                            </div>
                        </div>
                        <div className="ag-modal-foot">
                            <button className="ag-btn ag-btn-ghost" onClick={() => setShowVoucherModal(false)}>إلغاء</button>
                            <button className="ag-btn ag-btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--hz-orange)', color: '#FFF' }} onClick={handleCreateVoucher} disabled={isSubmitting || !selectedStudent || paymentAmount <= 0 || !selectedAccountId}>
                                {isSubmitting ? 'جاري الإصدار...' : 'تأكيد وقيد سند القبض'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* View Details Modal */}
            {viewPayment && createPortal(
                <div className="ag-modal-overlay" onClick={() => setViewPayment(null)}>
                    <div className="ag-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head">
                            <div className="ag-modal-title">
                                <div className="ag-avatar" style={{ background: 'var(--hz-surface-3)', width: '40px', height: '40px' }}>
                                    <FileText size={20} color="var(--hz-orange)" />
                                </div>
                                <div>
                                    <h3>تفاصيل السند المالي</h3>
                                    <p>{viewPayment.receiptNumber}</p>
                                </div>
                            </div>
                            <button className="ag-btn-icon" onClick={() => setViewPayment(null)}><X size={18} /></button>
                        </div>
                        <div className="ag-modal-body">
                            <div className="ag-section-title">
                                <CreditCard size={16} /> بيانات العملية والتحصيل
                            </div>
                            <div className="details-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hz-border-soft)' }}>
                                    <span className="ag-label" style={{ textTransform: 'none' }}>اسم الطالب المستفيد:</span>
                                    <strong style={{ color: 'var(--hz-text-bright)' }}>{viewPayment.student?.firstNameAr} {viewPayment.student?.lastNameAr}</strong>
                                </div>
                                <div className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hz-border-soft)' }}>
                                    <span className="ag-label" style={{ textTransform: 'none' }}>رقم الفاتورة المرتبطة:</span>
                                    <strong style={{ color: 'var(--hz-orange)' }}>{viewPayment.feeCalculation?.calculationNumber || '---'}</strong>
                                </div>
                                <div className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hz-border-soft)' }}>
                                    <span className="ag-label" style={{ textTransform: 'none' }}>طريقة السداد:</span>
                                    <strong style={{ color: 'var(--hz-text-primary)' }}>{viewPayment.method}</strong>
                                </div>
                                <div className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hz-border-soft)' }}>
                                    <span className="ag-label" style={{ textTransform: 'none' }}>تاريخ العملية:</span>
                                    <strong style={{ color: 'var(--hz-text-primary)' }}>{new Date(viewPayment.paymentDate).toLocaleDateString('ar-SA')}</strong>
                                </div>
                                <div className="ag-payment-box" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
                                    <span style={{ fontWeight: 800 }}>المبلغ المحصل:</span>
                                    <strong style={{ fontSize: '1.4rem', color: 'var(--hz-text-bright)', fontWeight: 900 }}>{viewPayment.amount.toLocaleString()} {settings?.currency || 'ر.س'}</strong>
                                </div>
                            </div>

                            {viewPayment.referenceNo && (
                                <div style={{ marginTop: '20px', padding: '12px', background: 'var(--hz-surface)', borderRadius: '8px', border: '1px solid var(--hz-border-soft)' }}>
                                    <div className="ag-label" style={{ marginBottom: '4px' }}>المرجع / الملاحظات:</div>
                                    <div style={{ color: 'var(--hz-text-muted)', fontSize: '0.85rem' }}>{viewPayment.referenceNo}</div>
                                </div>
                            )}
                        </div>
                        <div className="ag-modal-foot">
                            <button className="ag-btn ag-btn-ghost" onClick={() => setViewPayment(null)}>إإغلاق</button>
                            <button className="ag-btn ag-btn-primary" style={{ background: 'var(--hz-orange)', color: '#FFF' }}>
                                <Printer size={16} /> طباعة السند الرسمي
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
