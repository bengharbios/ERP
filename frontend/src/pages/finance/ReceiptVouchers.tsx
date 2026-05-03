import React, { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    ShieldCheck,
    Clock,
    Eye,
    Printer,
    CheckCircle
} from 'lucide-react';

import { feesService, StudentFeeCalculation } from '../../services/fees.service';
import { studentService, Student } from '../../services/student.service';
import { Account } from '../../services/account.service';
import accountService from '../../services/account.service';
import { useSettingsStore } from '../../store/settingsStore';
import { Toast, ToastType } from '../../components/Toast';
import './ReceiptVouchers.css';

const ReceiptVouchers: React.FC = () => {
    // State
    const [calculations, setCalculations] = useState<StudentFeeCalculation[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);

    // Filters & Feature States
    const [searchTerm, setSearchTerm] = useState('');
    const [showVoucherModal, setShowVoucherModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [paymentAmount, setPaymentAmount] = useState<number>(0);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [selectedAccountId, setSelectedAccountId] = useState('');
    const [referenceNo, setReferenceNo] = useState('');
    const [selectedInstallmentId, setSelectedInstallmentId] = useState('');
    const [installmentPlans, setInstallmentPlans] = useState<any[]>([]);
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [viewPayment, setViewPayment] = useState<any | null>(null);

    const { settings } = useSettingsStore();

    useEffect(() => {
        fetchData();
        loadAccounts();
    }, []);

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentInstallments(selectedStudent.id);
        } else {
            setInstallmentPlans([]);
            setSelectedInstallmentId('');
        }
    }, [selectedStudent]);

    const fetchStudentInstallments = async (studentId: string) => {
        try {
            // Filter from local calculations for simplicity, or we could fetch specifically
            const studentCalcs = calculations.filter(c => c.studentId === studentId);
            const allPlans = studentCalcs.flatMap(c => (c as any).installmentPlans || []);
            setInstallmentPlans(allPlans);
        } catch (error) {
            console.error("Error loading installments:", error);
        }
    };

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

    const handleCreateVoucher = async () => {
        if (!selectedStudent || paymentAmount <= 0 || !selectedAccountId) {
            setToast({ type: 'error', message: '❌ يرجى اختيار الطالب والمبلغ وحساب الإيداع' });
            return;
        }

        try {
            setIsSubmitting(true);

            // Find the correct calculation (either from selected installment or first pending)
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
                setPayments([res.data.payment, ...payments]);
                setToast({ type: 'success', message: '✅ تم إصدار سند القبض بنجاح' });
                setShowVoucherModal(false);
                resetForm();
                fetchData();
            }
        } catch (error: any) {
            console.error('Create Voucher Error:', error);
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
            fetchData(); // Refresh list
        } catch (error: any) {
            console.error('Reconcile Error:', error);
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

    return (
        <div className="next-gen-page-container">
            {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

            {/* --- Premium Floating Header --- */}
            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">
                            <ShieldCheck size={28} strokeWidth={2.5} />
                        </div>
                        <div className="branding-text">
                            <h1>سندات القبض</h1>
                            <p>إدارة التحصيلات والتدفقات النقدية</p>
                        </div>
                    </div>
                    <div className="header-actions">
                        <button className="btn-modern btn-orange-gradient" onClick={() => setShowVoucherModal(true)}>
                            <Plus size={18} strokeWidth={2.8} />
                            <span>إصدار سند جديد</span>
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
                            placeholder="بحث برقم السند، اسم الطالب..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="divider-v"></div>
                    <div className="filters-group">
                        <select defaultValue="all">
                            <option value="all">كافة الحالات</option>
                            <option value="reconciled">مكتملة (مرحّلة)</option>
                            <option value="pending">معلقة</option>
                        </select>
                        <select defaultValue="all">
                            <option value="all">كافة الطرق</option>
                            <option value="CASH">نقدي</option>
                            <option value="BANK_TRANSFER">تحويل بنكي</option>
                            <option value="CARD">بطاقة</option>
                        </select>
                    </div>
                </section>

                {/* Stats Cards */}
                <div className="stats-grid">
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #2C7A7B' }}>
                        <div className="stat-label">إجمالي السندات</div>
                        <div className="stat-value">{payments.length}</div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #38A169' }}>
                        <div className="stat-label">المبلغ الإجمالي</div>
                        <div className="stat-value">
                            {payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()} {settings?.currency || 'د.إ'}
                        </div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #3182CE' }}>
                        <div className="stat-label">مكتملة (مرحّلة)</div>
                        <div className="stat-value">
                            {payments.filter(p => p.reconciliationStatus === 'RECONCILED').length}
                        </div>
                    </div>
                    <div className="stat-card-mini" style={{ borderRight: '3px solid #DD6B20' }}>
                        <div className="stat-label">معلقة (تحويلات)</div>
                        <div className="stat-value">
                            {payments.filter(p => p.reconciliationStatus === 'PENDING').length}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="next-gen-table-container">
                    <table className="modern-data-table">
                        <thead>
                            <tr>
                                <th>رقم السند</th>
                                <th>التاريخ والوقت</th>
                                <th>الطالب</th>
                                <th>المبلغ</th>
                                <th>الطريقة</th>
                                <th>الحالة</th>
                                <th>إجراءات</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan={7} className="text-center">جاري التحميل...</td></tr>
                            ) : payments.length === 0 ? (
                                <tr><td colSpan={7} className="text-center">لا توجد سجلات</td></tr>
                            ) : (
                                payments
                                    .filter(p => {
                                        if (!searchTerm) return true;
                                        const term = searchTerm.toLowerCase();
                                        const student = p.student || p.feeCalculation?.student;

                                        return (
                                            p.receiptNumber?.toLowerCase().includes(term) ||
                                            student?.firstNameAr?.toLowerCase().includes(term) ||
                                            student?.lastNameAr?.toLowerCase().includes(term) ||
                                            student?.firstNameEn?.toLowerCase().includes(term) ||
                                            student?.lastNameEn?.toLowerCase().includes(term) ||
                                            `${student?.firstNameAr || ''} ${student?.lastNameAr || ''}`.toLowerCase().includes(term) ||
                                            `${student?.firstNameEn || ''} ${student?.lastNameEn || ''}`.toLowerCase().includes(term)
                                        );
                                    })
                                    .map((payment) => (
                                        <tr key={payment.id}>
                                            <td><strong>{payment.receiptNumber}</strong></td>
                                            <td>
                                                <div className="date-time-stack">
                                                    <span className="date-text">{new Date(payment.paymentDate).toLocaleDateString('ar-AE')}</span>
                                                    <div className="time-row">
                                                        <Clock size={12} />
                                                        <span>{new Date(payment.createdAt || payment.paymentDate).toLocaleTimeString('ar-AE', { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                {(() => {
                                                    const s = payment.student || payment.feeCalculation?.student;
                                                    return s ? `${s.firstNameAr || ''} ${s.lastNameAr || ''}` : '---';
                                                })()}
                                            </td>
                                            <td><strong>{payment.amount.toLocaleString()} {settings?.currency || 'د.إ'}</strong></td>
                                            <td>{payment.method}</td>
                                            <td>
                                                <span className={`status-pill ${payment.reconciliationStatus?.toLowerCase()}`}>
                                                    {payment.reconciliationStatus === 'RECONCILED' ? 'مكتمل (مرحّل)' : 'معلق (قيد الانتظار)'}
                                                </span>
                                            </td>
                                            <td>
                                                <div className="flex items-center gap-2">
                                                    {(payment.method === 'BANK_TRANSFER' || payment.method === 'Bank Transfer') && payment.reconciliationStatus === 'PENDING' && (
                                                        <button
                                                            className="btn-icon-mini confirm"
                                                            title="تأكيد التحويل"
                                                            onClick={() => handleReconcile(payment.id)}
                                                        >
                                                            <CheckCircle size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn-icon-mini"
                                                        title="عرض التفاصيل"
                                                        onClick={() => setViewPayment(payment)}
                                                    >
                                                        <Eye size={18} />
                                                    </button>
                                                    <button
                                                        className="btn-icon-mini"
                                                        title="طباعة السند"
                                                        onClick={() => window.print()}
                                                    >
                                                        <Printer size={18} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                            )}
                        </tbody>
                    </table>
                </div >
            </main >

            {/* Voucher Modal */}
            {
                showVoucherModal && (
                    <div className="premium-modal-overlay" onClick={() => setShowVoucherModal(false)}>
                        <div className="premium-modal-container" style={{ maxWidth: '600px' }} onClick={e => e.stopPropagation()}>
                            <div className="premium-modal-header">
                                <div className="header-content">
                                    <h2>إصدار سند قبض جديد</h2>
                                    <p>تسجيل عملية تحصيل نقدية من طالب</p>
                                </div>
                                <button className="premium-close-btn" onClick={() => setShowVoucherModal(false)}>&times;</button>
                            </div>

                            <div className="premium-modal-body">
                                <div className="form-group-2026">
                                    <label>اختيار الطالب *</label>
                                    <select
                                        className="modern-select"
                                        style={{ color: '#000000', backgroundColor: '#ffffff', opacity: 1, padding: '0 1rem' }}
                                        value={selectedStudent?.id || ''}
                                        onChange={(e) => {
                                            const student = students.find(s => s.id === e.target.value);
                                            setSelectedStudent(student || null);
                                        }}
                                    >
                                        <option value="">اختر الطالب...</option>
                                        {students.map(s => <option key={s.id} value={s.id}>{s.firstNameAr} {s.lastNameAr}</option>)}
                                    </select>
                                </div>

                                {selectedStudent && installmentPlans.length > 0 && (
                                    <div className="form-group-2026" style={{ marginTop: '1rem' }}>
                                        <label>اختيار القسط (اختياري)</label>
                                        <select
                                            className="modern-select highlight"
                                            style={{ color: '#000000', backgroundColor: '#fff7ed', opacity: 1, padding: '0 1rem' }}
                                            value={selectedInstallmentId}
                                            onChange={(e) => {
                                                const instId = e.target.value;
                                                setSelectedInstallmentId(instId);
                                                if (instId) {
                                                    const inst = installmentPlans.flatMap(p => p.installments).find(i => i.id === instId);
                                                    if (inst) setPaymentAmount(Number(inst.balance));
                                                }
                                            }}
                                        >
                                            <option value="">سداد عام (بدون تحديد قسط)</option>
                                            {installmentPlans.map(plan => (
                                                plan.installments
                                                    .filter((i: any) => i.status !== 'PAID')
                                                    .map((inst: any) => (
                                                        <option key={inst.id} value={inst.id}>
                                                            {plan.nameAr} - قسط {inst.installmentNumber} ({inst.balance} ر.س)
                                                        </option>
                                                    ))
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="form-grid-2" style={{ marginTop: '1rem' }}>
                                    <div className="form-group-2026">
                                        <label>المبلغ *</label>
                                        <input
                                            type="number"
                                            className="input-premium"
                                            style={{ color: '#000000', backgroundColor: '#ffffff', opacity: 1, padding: '0 1rem' }}
                                            value={paymentAmount}
                                            onChange={(e) => setPaymentAmount(Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="form-group-2026">
                                        <label>طريقة الدفع</label>
                                        <select
                                            className="modern-select"
                                            style={{ color: '#000000', backgroundColor: '#ffffff', opacity: 1, padding: '0 1rem' }}
                                            value={paymentMethod}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                        >
                                            <option value="CASH">نقدي (Cash)</option>
                                            <option value="BANK_TRANSFER">تحويل بنكي (Bank)</option>
                                            <option value="CARD">بطاقة (Card)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="form-group-2026">
                                    <label>حساب الإيداع (دليل الحسابات) *</label>
                                    <select
                                        className="modern-select highlight"
                                        style={{ color: '#000000', backgroundColor: '#ffffff', opacity: 1, padding: '0 1rem' }}
                                        value={selectedAccountId}
                                        onChange={(e) => setSelectedAccountId(e.target.value)}
                                    >
                                        <option value="">اختر الحساب المصرفي / الخزينة...</option>
                                        {accounts
                                            .filter(acc => acc.type === 'ASSET')
                                            .map(acc => (
                                                <option key={acc.id} value={acc.id}>{acc.code} - {acc.nameAr}</option>
                                            ))
                                        }
                                    </select>
                                </div>

                                <div className="form-group-2026">
                                    <label>المرجع / ملاحظات</label>
                                    <input
                                        type="text"
                                        className="input-premium"
                                        style={{ color: '#000000', backgroundColor: '#ffffff', opacity: 1, padding: '0 1rem' }}
                                        value={referenceNo}
                                        onChange={(e) => setReferenceNo(e.target.value)}
                                        placeholder="رقم العملية، رقم الشيك..."
                                    />
                                </div>
                            </div>

                            <div className="premium-modal-footer">
                                <button className="premium-footer-btn secondary" onClick={() => setShowVoucherModal(false)}>إلغاء</button>
                                <button
                                    className="premium-footer-btn primary"
                                    onClick={handleCreateVoucher}
                                    disabled={isSubmitting || !selectedStudent || paymentAmount <= 0 || !selectedAccountId}
                                >
                                    {isSubmitting ? 'جاري الإصدار...' : 'تأكيد وإصدار السند'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* View Payment Modal */}
            {
                viewPayment && (
                    <div className="premium-modal-overlay" onClick={() => setViewPayment(null)}>
                        <div className="premium-modal-container" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                            <div className="premium-modal-header">
                                <div className="header-content">
                                    <h2>تفاصيل السند</h2>
                                    <p>{viewPayment.receiptNumber}</p>
                                </div>
                                <button className="premium-close-btn" onClick={() => setViewPayment(null)}>&times;</button>
                            </div>
                            <div className="premium-modal-body">
                                <div className="details-grid-2026">
                                    <div className="detail-row">
                                        <span className="label">الطالب</span>
                                        <span className="value">
                                            {(() => {
                                                const s = viewPayment.student || viewPayment.feeCalculation?.student;
                                                return s ? `${s.firstNameAr || ''} ${s.lastNameAr || ''}` : '---';
                                            })()}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">المبلغ</span>
                                        <span className="value highlight">{Number(viewPayment.amount).toLocaleString()} {settings?.currency || 'د.إ'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">طريقة الدفع</span>
                                        <span className="value">{viewPayment.method}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">التاريخ</span>
                                        <span className="value">{new Date(viewPayment.paymentDate).toLocaleDateString('ar-AE')}</span>
                                    </div>
                                    <div className="detail-row">
                                        <span className="label">الحالة</span>
                                        <span className={`status-pill ${viewPayment.reconciliationStatus?.toLowerCase()}`}>
                                            {viewPayment.reconciliationStatus === 'RECONCILED' ? 'مكتمل' : 'معلق'}
                                        </span>
                                    </div>
                                    {viewPayment.referenceNo && (
                                        <div className="detail-row">
                                            <span className="label">المرجع</span>
                                            <span className="value">{viewPayment.referenceNo}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="premium-modal-footer">
                                <button className="premium-footer-btn secondary" onClick={() => setViewPayment(null)}>إغلاق</button>
                                <button className="premium-footer-btn primary" onClick={() => window.print()}>
                                    <Printer size={16} style={{ marginLeft: '8px' }} /> طباعة
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Hidden Printable Receipt */}
            {
                viewPayment && (
                    <div id="printable-area" style={{ display: 'none' }}>
                        <div className="receipt-document">
                            <div className="receipt-header">
                                <div className="institute-info">
                                    <h2>{settings?.instituteNameAr || 'المعهد العلمي'}</h2>
                                    <p>{settings?.instituteNameEn || 'Scientific Institute'}</p>
                                </div>
                                <div className="receipt-title">
                                    <h1>سند قبض</h1>
                                    <h2>RECEIPT VOUCHER</h2>
                                </div>
                                <div className="receipt-meta">
                                    <div className="meta-row">
                                        <strong>رقم السند:</strong> <span>{viewPayment.receiptNumber}</span>
                                    </div>
                                    <div className="meta-row">
                                        <strong>التاريخ:</strong> <span>{new Date(viewPayment.paymentDate).toLocaleDateString('ar-AE')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="receipt-body">
                                <div className="receipt-row">
                                    <label>استلمنا من السيد/ة:</label>
                                    <span className="line-value">
                                        {(() => {
                                            const s = viewPayment.student || viewPayment.feeCalculation?.student;
                                            return s ? `${s.firstNameAr || ''} ${s.lastNameAr || ''}` : '---';
                                        })()}
                                    </span>
                                </div>
                                <div className="receipt-row">
                                    <label>مبلغ وقدره:</label>
                                    <span className="line-value highlight">
                                        {Number(viewPayment.amount).toLocaleString()} {settings?.currency || 'د.إ'}
                                    </span>
                                </div>
                                <div className="receipt-row">
                                    <label>وذلك عن:</label>
                                    <span className="line-value">
                                        {viewPayment.installment
                                            ? `قسط رقم ${viewPayment.installment.installmentNumber}`
                                            : 'رسوم دراسية / خدمات تعليمية'}
                                        {viewPayment.referenceNo ? ` - مرجع: ${viewPayment.referenceNo}` : ''}
                                    </span>
                                </div>
                                <div className="receipt-row">
                                    <label>طريقة الدفع:</label>
                                    <span className="line-value">
                                        {viewPayment.method === 'CASH' ? 'نقدي (Cash)' :
                                            viewPayment.method === 'BANK_TRANSFER' ? 'تحويل بنكي (Bank Transfer)' :
                                                viewPayment.method === 'CARD' ? 'بطاقة (Card)' : viewPayment.method}
                                    </span>
                                </div>
                            </div>

                            <div className="receipt-footer">
                                <div className="signature-box">
                                    <p>المحاسب / Accountant</p>
                                    <div className="sign-line"></div>
                                </div>
                                <div className="signature-box">
                                    <p>الختم / Stamp</p>
                                    <div className="stamp-place"></div>
                                </div>
                            </div>

                            <div className="receipt-copy-right">
                                <small>تم إصدار هذا السند إلكترونياً من النظام</small>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ReceiptVouchers;
