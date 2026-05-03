import { useState, useEffect } from 'react';
import { feesService, StudentFeeCalculation, PaymentStatus, FeeType } from '../services/fees.service';
import { studentService, Student } from '../services/student.service';
import { academicService, Program } from '../services/academic.service';
import invoiceService from '../services/invoice.service';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';
import './StudentFees.css';

/**
 * ADVANCED STUDENT BILLING SYSTEM (Professional ERP 2026)
 * Strictly matches Classes.tsx "Next Gen" Design System.
 */

export default function StudentFees() {
    // --- Data States ---
    const [calculations, setCalculations] = useState<StudentFeeCalculation[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(true);

    // --- Filter & View States ---
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterProgram, setFilterProgram] = useState('');
    const [filterStatus, setFilterStatus] = useState<PaymentStatus | 'all'>('all');

    // --- Feature States ---
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
    const [showInstallmentModal, setShowInstallmentModal] = useState(false);
    const [showCreateInvoiceModal, setShowCreateInvoiceModal] = useState(false);
    const [selectedCalculation, setSelectedCalculation] = useState<StudentFeeCalculation | null>(null);
    const [paymentAmount, setPaymentAmount] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('CASH');
    const [paymentReference, setPaymentReference] = useState('');
    const [paymentReceipt, setPaymentReceipt] = useState('');
    const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedInstallmentId, setSelectedInstallmentId] = useState<string>('');
    const [lateFee, setLateFee] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [installmentMonths, setInstallmentMonths] = useState(4);
    const [systemSettings, setSystemSettings] = useState<any>(null);

    // --- Invoice Creation States ---
    const [invoiceStudentId, setInvoiceStudentId] = useState('');
    const [invoiceItems, setInvoiceItems] = useState<Array<{ description: string; quantity: number; unitPrice: number }>>([{ description: '', quantity: 1, unitPrice: 0 }]);

    // --- UI States ---
    const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
    const [confirmDialog, setConfirmDialog] = useState<{
        title: string;
        message: string;
        type: 'danger' | 'warning' | 'info';
        onConfirm: () => void;
    } | null>(null);

    // --- Initial Data Fetch ---
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [calcRes, studRes, progRes] = await Promise.all([
                feesService.getStudentFeeCalculations(),
                studentService.getStudents(),
                academicService.getPrograms()
            ]);

            if (calcRes.data) setCalculations(calcRes.data.calculations || []);
            if (studRes.data) setStudents(studRes.data.students || []);
            if (progRes.data) setPrograms(progRes.data.programs || []);

            // Fetch system settings for financial rules
            const { useSettingsStore } = await import('../store/settingsStore');
            const settings = useSettingsStore.getState().settings;
            if (settings) {
                setSystemSettings(settings);
            }
        } catch (error) {
            console.error('Fetch Error:', error);
            setToast({ type: 'error', message: '❌ فشل تحميل البيانات المالية' });
        } finally {
            setLoading(false);
        }
    };

    // --- Payment Handler ---
    const handlePayment = async () => {
        if (!selectedCalculation) return;

        // Validation: Prevent zero or negative payments
        const totalToPay = paymentAmount + lateFee - discount;
        if (totalToPay <= 0) {
            setToast({ type: 'error', message: '❌ يرجى إدخال مبلغ صحيح للسداد أكبر من صفر' });
            return;
        }

        try {
            setLoading(true);
            const res = await feesService.createPayment({
                calculationId: selectedCalculation.id,
                installmentId: selectedInstallmentId || undefined,
                amount: paymentAmount,
                method: paymentMethod,
                referenceNo: paymentReference,
                receiptNumber: paymentReceipt,
                paymentDate: paymentDate,
                lateFee: lateFee,
                discount: discount
            });

            if (res.success) {
                setToast({ type: 'success', message: `✅ تم تسجيل الدفعة بنجاح - إيصال رقم: ${res.data?.payment?.receiptNumber || 'N/A'}` });
                setShowPaymentModal(false);
                fetchData(); // Refresh data
                resetPaymentForm();
            }
        } catch (error: any) {
            console.error('Payment Error:', error);
            const msg = error.response?.data?.error?.message || 'فشل في تسجيل الدفعة';
            setToast({ type: 'error', message: `❌ ${msg}` });
        } finally {
            setLoading(false);
        }
    };

    const resetPaymentForm = () => {
        setPaymentAmount(0);
        setPaymentMethod('CASH');
        setPaymentReference('');
        setPaymentReceipt('');
        setPaymentDate(new Date().toISOString().split('T')[0]);
        setSelectedInstallmentId('');
        setLateFee(0);
        setDiscount(0);
    };

    // --- Search Logic ---
    const filteredCalculations = calculations.filter(c => {
        const student = students.find(s => s.id === c.studentId);
        const matchesSearch = !searchTerm ||
            (student && (student.firstNameAr + ' ' + student.lastNameAr).includes(searchTerm)) ||
            (student && (student.firstNameEn + ' ' + student.lastNameEn).toLowerCase().includes(searchTerm.toLowerCase())) ||
            c.calculationNumber.includes(searchTerm);

        const matchesProgram = !filterProgram || c.programId === filterProgram;
        const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

        return matchesSearch && matchesProgram && matchesStatus;
    });

    // --- Stats ---
    const totalInvoiced = calculations.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0);
    const totalCollected = calculations.reduce((sum, c) => sum + Number(c.paidAmount || 0), 0);
    const totalOutstanding = calculations.reduce((sum, c) => sum + Number(c.balance || 0), 0);
    const overdueCount = calculations.filter(c => c.status === PaymentStatus.OVERDUE).length;

    return (
        <div className="next-gen-page-container orange-theme fees-page-2026">
            {/* --- Premium Floating Header --- */}
            <header className="glass-header">
                <div className="container-wide header-content">
                    <div className="header-branding">
                        <div className="branding-icon orange">💳</div>
                        <div className="branding-text">
                            <h1>الرسوم المالية</h1>
                            <p className="hide-on-mobile">إدارة ومتابعة التحصيلات المالية للطلاب</p>
                        </div>
                    </div>

                    <div className="header-actions">
                        <div className="view-switcher hide-on-mobile">
                            <button onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? 'active' : ''}>▦</button>
                            <button onClick={() => setViewMode('table')} className={viewMode === 'table' ? 'active' : ''}>☰</button>
                        </div>
                        <div className="header-pills hide-on-mobile">
                            <span className="pill pill-orange">المتأخرين: {overdueCount}</span>
                            <span className="pill pill-orange" style={{ marginRight: '0.5rem' }}>العملة: {systemSettings?.currency || 'SAR'}</span>
                        </div>
                        <button onClick={() => setShowCreateInvoiceModal(true)} className="btn-modern btn-orange-gradient">
                            <span className="plus-icon">+</span>
                            <span className="hide-on-mobile">فاتورة ضريبية جديدة</span>
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
                        <input
                            type="text"
                            placeholder="بحث باسم الطالب أو رقم الفاتورة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="filters-group">
                        <select value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
                            <option value="">كل البرامج</option>
                            {programs.map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                        </select>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                            <option value="all">كل الحالات</option>
                            <option value="PAID">✅ مدفوع</option>
                            <option value="IN_PAYMENT">🏦 قيد التأكيد</option>
                            <option value="PARTIAL">⚠️ مدفوع جزئياً</option>
                            <option value="PENDING">🕒 معلق</option>
                            <option value="OVERDUE">❌ متأخر</option>
                        </select>
                    </div>
                </section>

                {/* --- Executive Insights Grid --- */}
                <section className="executive-stats-2026">
                    <div className="stat-card-2026 orange">
                        <div className="st-info">
                            <span className="st-label">إجمالي المستحقات</span>
                            <h3 className="st-value">{feesService.formatCurrency(totalInvoiced, systemSettings?.currency)}</h3>
                        </div>
                        <div className="st-icon">📊</div>
                    </div>
                    <div className="stat-card-2026 green">
                        <div className="st-info">
                            <span className="st-label">التحصيل الفعلي</span>
                            <h3 className="st-value">{feesService.formatCurrency(totalCollected, systemSettings?.currency)}</h3>
                        </div>
                        <div className="st-icon">💰</div>
                    </div>
                    <div className="stat-card-2026 orange">
                        <div className="st-info">
                            <span className="st-label">المتبقي</span>
                            <h3 className="st-value">{feesService.formatCurrency(totalOutstanding, systemSettings?.currency)}</h3>
                        </div>
                        <div className="st-icon">⏳</div>
                    </div>
                </section>

                {/* Data Display */}
                <div className={`content-transition-wrapper ${viewMode}`}>
                    {loading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
                            <div className="spinner"></div>
                        </div>
                    ) : filteredCalculations.length === 0 ? (
                        <div className="empty-state-modern">
                            <div className="empty-icon">📂</div>
                            <h2>لا توجد بيانات مالية</h2>
                            <p>لا توجد فواتير تطابق معايير البحث الحالية.</p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div key="grid-view" className="programs-grid-2026">
                            {filteredCalculations.map(calc => {
                                const student = students.find(s => s.id === calc.studentId);
                                const progress = calc.totalAmount > 0
                                    ? Math.round(((calc.paidAmount || 0) / calc.totalAmount) * 100)
                                    : 0;

                                return (
                                    <div key={calc.id} className="next-gen-card orange">
                                        <div className="card-top">
                                            <span className="card-code orange">{calc.calculationNumber}</span>
                                            <span className={`status-badge ${calc.status?.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                                                {calc.status === 'PAID' ? 'مكتمل' :
                                                    calc.status === 'PARTIAL' ? 'جزئي' :
                                                        calc.status === 'IN_PAYMENT' ? 'قيد التأكيد البنكي' :
                                                            calc.status === 'OVERDUE' ? 'متأخر' : 'معلق'}
                                            </span>
                                        </div>
                                        <div className="card-info">
                                            <div className="card-title-row">
                                                <div className="card-avatar">👤</div>
                                                <div>
                                                    <h3 className="card-title">
                                                        {student ? `${student.firstNameAr} ${student.lastNameAr}` : 'طالب غير معروف'}
                                                    </h3>
                                                    <p className="card-subtitle">
                                                        {programs.find(p => p.id === calc.programId)?.nameAr || 'عام'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="card-stats-grid">
                                            <div className="stat-item">
                                                <span className="stat-val" style={{ fontSize: '0.9rem' }}>{feesService.formatCurrency(calc.totalAmount, systemSettings?.currency)}</span>
                                                <span className="stat-lbl">الإجمالي</span>
                                            </div>
                                            <div className="stat-item highlight-orange">
                                                <span className="stat-val" style={{ fontSize: '0.9rem' }}>{feesService.formatCurrency(calc.balance || 0, systemSettings?.currency)}</span>
                                                <span className="stat-lbl">المتبقي</span>
                                            </div>
                                            <div className="stat-item">
                                                <span className="stat-val" style={{ fontSize: '0.9rem' }}>{progress}%</span>
                                                <span className="stat-lbl">سداد</span>
                                            </div>
                                        </div>

                                        <div className="card-footer">
                                            <div className="stats-bar" style={{ flex: 1, background: '#EDF2F7', borderRadius: '8px', height: '6px', overflow: 'hidden' }}>
                                                <div className="bar-fill" style={{
                                                    width: `${progress}%`,
                                                    height: '100%',
                                                    borderRadius: '8px',
                                                    background: progress === 100 ? '#38A169' : '#F59E0B',
                                                    transition: 'width 0.3s'
                                                }}></div>
                                            </div>
                                            <div className="card-actions-row" style={{ display: 'flex', gap: '6px', marginRight: '10px' }}>
                                                {calc.status !== 'PAID' && (
                                                    <button className="btn-mini" onClick={() => {
                                                        setSelectedCalculation(calc);
                                                        resetPaymentForm();
                                                        setShowPaymentModal(true);
                                                        setPaymentAmount(calc.balance || 0);
                                                    }} title="سداد">💳</button>
                                                )}
                                                <button className="btn-mini" onClick={() => { setSelectedCalculation(calc); setShowDetailsModal(true); }} title="التفاصيل">📄</button>
                                                <button className="btn-mini" onClick={() => { setSelectedCalculation(calc); setShowInstallmentModal(true); }} title="السجل المالي">📑</button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div key="table-view" className="next-gen-table-container">
                            <table className="modern-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: '#f8fafc', borderBottom: '2px solid #edf2f7' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: '#4a5568' }}>رقم الفاتورة</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: '#4a5568' }}>الطالب</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: '#4a5568' }}>البرنامج</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: '#4a5568' }}>الإجمالي</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: '#4a5568' }}>المدفوع</th>
                                        <th style={{ padding: '1rem', textAlign: 'right', color: '#4a5568' }}>المتبقي</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: '#4a5568' }}>الحالة</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', color: '#4a5568' }}>إجراءات</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredCalculations.map(calc => {
                                        const student = students.find(s => s.id === calc.studentId);
                                        return (
                                            <tr key={calc.id} style={{ borderBottom: '1px solid #edf2f7' }}>
                                                <td style={{ padding: '1rem', fontWeight: 'bold', color: '#2d3748' }}>{calc.calculationNumber}</td>
                                                <td style={{ padding: '1rem', fontWeight: 600 }}>{student ? `${student.firstNameAr} ${student.lastNameAr}` : 'غير معروف'}</td>
                                                <td style={{ padding: '1rem', color: '#718096' }}>{programs.find(p => p.id === calc.programId)?.nameAr || '-'}</td>
                                                <td style={{ padding: '1rem', fontWeight: 'bold' }}>{feesService.formatCurrency(calc.totalAmount, systemSettings?.currency)}</td>
                                                <td style={{ padding: '1rem', color: '#38a169', fontWeight: 'bold' }}>{feesService.formatCurrency(calc.paidAmount || 0, systemSettings?.currency)}</td>
                                                <td style={{ padding: '1rem', color: '#e53e3e', fontWeight: 'bold' }}>{feesService.formatCurrency(calc.balance || 0, systemSettings?.currency)}</td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <span className={`status-badge ${calc.status?.toLowerCase()}`}>
                                                        {calc.status === 'PAID' ? 'مكتمل' :
                                                            calc.status === 'PARTIAL' ? 'جزئي' :
                                                                calc.status === 'IN_PAYMENT' ? 'قيد التأكيد البنكي' :
                                                                    calc.status === 'OVERDUE' ? 'متأخر' : 'معلق'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                                                        {calc.status !== 'PAID' && (
                                                            <button className="btn-mini" onClick={() => {
                                                                setSelectedCalculation(calc);
                                                                resetPaymentForm();
                                                                setShowPaymentModal(true);
                                                                setPaymentAmount(calc.balance || 0);
                                                            }}>💳</button>
                                                        )}
                                                        <button className="btn-mini" onClick={() => { setSelectedCalculation(calc); setShowDetailsModal(true); }}>📄</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>

            {/* Payment Modal */}
            {showPaymentModal && selectedCalculation && (
                <div className="premium-modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="premium-modal-container fade-in" onClick={e => e.stopPropagation()}>
                        <div className="premium-modal-header">
                            <div className="header-content">
                                <h2>💳 تسجيل دفعة متقدمة</h2>
                                <p>
                                    {students.find(s => s.id === selectedCalculation.studentId)?.firstNameAr} -
                                    رقم الفاتورة: {selectedCalculation.calculationNumber}
                                </p>
                            </div>
                            <button className="premium-close-btn" onClick={() => setShowPaymentModal(false)}>×</button>
                        </div>
                        <div className="premium-modal-body">
                            <h3 className="premium-section-title">بيانات السداد</h3>
                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>تاريخ السداد</label>
                                    <input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} className="input-premium" />
                                </div>
                                <div className="form-group">
                                    <label>رقم الإيصال</label>
                                    <input type="text" value={paymentReceipt} onChange={e => setPaymentReceipt(e.target.value)} placeholder="مثلاً: REC-001" className="input-premium" />
                                </div>
                            </div>

                            <div className="form-group" style={{ marginTop: '1.25rem' }}>
                                <label>اختيار القسط (اختياري)</label>
                                <select
                                    value={selectedInstallmentId}
                                    onChange={e => {
                                        const instId = e.target.value;
                                        setSelectedInstallmentId(instId);
                                        if (instId) {
                                            const plan = selectedCalculation.installmentPlans?.[0];
                                            const inst = plan?.installments?.find(i => i.id === instId);
                                            if (inst) {
                                                setPaymentAmount(Number(inst.balance));
                                                // Check for late fees
                                                if (new Date(inst.dueDate) < new Date() && systemSettings?.lateFeeAmount) {
                                                    const diffDays = Math.ceil((new Date().getTime() - new Date(inst.dueDate).getTime()) / (1000 * 3600 * 24));
                                                    if (diffDays > (systemSettings.lateFeeGraceDays || 0)) {
                                                        setConfirmDialog({
                                                            title: 'تطبيق غرامة تأخير',
                                                            message: `هذا القسط متأخر بـ ${diffDays} يوم. هل ترغب في تطبيق غرامة تأخير بقيمة ${systemSettings.lateFeeAmount}؟`,
                                                            type: 'warning',
                                                            onConfirm: () => {
                                                                setLateFee(Number(systemSettings.lateFeeAmount));
                                                                setConfirmDialog(null);
                                                                setToast({ type: 'info', message: '💡 تم تطبيق غرامة التأخير' });
                                                            }
                                                        });
                                                    }
                                                }
                                            }
                                        }
                                    }}
                                    className="modern-select"
                                >
                                    <option value="">دفع مبلغ عام (بدون قسط)</option>
                                    {selectedCalculation.installmentPlans?.map(plan => (
                                        plan.installments?.map(inst => (
                                            <option key={inst.id} value={inst.id} disabled={inst.status === 'PAID'}>
                                                قسط {inst.installmentNumber} - {feesService.formatCurrency(inst.balance, systemSettings?.currency)} (استحقاق: {new Date(inst.dueDate).toLocaleDateString()})
                                            </option>
                                        ))
                                    ))}
                                </select>
                            </div>

                            <h3 className="premium-section-title" style={{ marginTop: '1.5rem' }}>تفاصيل المبلغ</h3>
                            {!selectedInstallmentId && paymentAmount > 0 && paymentAmount >= selectedCalculation.balance && systemSettings?.fullPaymentDiscountPercentage > 0 && discount === 0 && (
                                <div style={{
                                    background: 'rgba(56, 161, 105, 0.1)', padding: '1rem', borderRadius: '10px',
                                    marginBottom: '1rem', border: '1px solid #38A169', display: 'flex',
                                    justifyContent: 'space-between', alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '0.9rem', color: '#2F855A', fontWeight: 600 }}>
                                        💡 هذا الطالب مستحق لخصم سداد كامل بنسبة {systemSettings.fullPaymentDiscountPercentage}%
                                    </span>
                                    <button
                                        className="premium-footer-btn primary"
                                        style={{ padding: '0.4rem 1rem', fontSize: '0.85rem' }}
                                        onClick={() => {
                                            const discVal = Number(selectedCalculation.balance) * (systemSettings.fullPaymentDiscountPercentage / 100);
                                            setDiscount(discVal);
                                            setToast({ type: 'success', message: `✅ تم تطبيق خصم بقيمة ${feesService.formatCurrency(discVal, systemSettings?.currency)}` });
                                        }}
                                    >
                                        تطبيق الخصم
                                    </button>
                                </div>
                            )}

                            {selectedCalculation.student?.isTaxExempt && (
                                <div style={{
                                    background: 'rgba(56, 161, 105, 0.1)', padding: '0.75rem 1rem', borderRadius: '10px',
                                    marginBottom: '1rem', border: '1px solid #38A169', display: 'flex', gap: '8px', alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '1.2rem' }}>🛡️</span>
                                    <span style={{ fontSize: '0.85rem', color: '#2F855A', fontWeight: 700 }}>
                                        هذا الطالب معفى من ضريبة القيمة المضافة (Tax Exempt)
                                    </span>
                                </div>
                            )}

                            <div className="form-grid-2">
                                <div className="form-group">
                                    <label>المبلغ الأساسي ({systemSettings?.currency})</label>
                                    <input type="number" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} className="input-premium" />
                                </div>
                                <div className="form-group">
                                    <label>طريقة السداد</label>
                                    <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} className="modern-select">
                                        <option value="CASH">نقدي</option>
                                        <option value="BANK_TRANSFER">تحويل بنكي</option>
                                        <option value="POS">شبكة (POS)</option>
                                        <option value="ONLINE">دفع إلكتروني</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-grid-2" style={{ marginTop: '1rem' }}>
                                <div className="form-group">
                                    <label style={{ color: '#e53e3e' }}>غرامة تأخير (+) </label>
                                    <input type="number" value={lateFee} onChange={e => setLateFee(Number(e.target.value))} className="input-premium" />
                                </div>
                                <div className="form-group">
                                    <label style={{ color: '#38a169' }}>خصم مبلغ (-) </label>
                                    <input type="number" value={discount} onChange={e => setDiscount(Number(e.target.value))} className="input-premium" />
                                </div>
                            </div>

                            <div className="payment-summary-box">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', alignItems: 'center' }}>
                                    <span style={{ fontWeight: 600, color: '#4A5568' }}>إجمالي المبلغ للسداد:</span>
                                    <strong style={{ fontSize: '1.4rem', color: 'var(--orange-primary)' }}>
                                        {feesService.formatCurrency(paymentAmount + lateFee - discount, systemSettings?.currency)}
                                    </strong>
                                </div>
                                {paymentAmount + lateFee - discount >= selectedCalculation.balance && systemSettings?.fullPaymentDiscountPercentage > 0 && discount > 0 ? (
                                    <div className="promo-text" style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                                        ✅ تم تطبيق خصم السداد الكامل بنسبة {systemSettings.fullPaymentDiscountPercentage}%.
                                    </div>
                                ) : paymentAmount + lateFee - discount >= selectedCalculation.balance && systemSettings?.fullPaymentDiscountPercentage > 0 && (
                                    <div className="promo-text" style={{ fontSize: '0.85rem', color: '#E53E3E', fontWeight: 600 }}>
                                        ⚠️ انتبه: يمكنك تطبيق خصم سداد كامل لهذا الطالب.
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="premium-modal-footer">
                            <button className="premium-footer-btn secondary" onClick={() => setShowPaymentModal(false)}>إلغاء</button>
                            <button className="premium-footer-btn primary" onClick={handlePayment}>
                                {loading ? '⏳ جاري المعالجة...' : 'تأكيد السداد وإصدار إيصال'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedCalculation && (
                <div className="premium-modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="premium-modal-container fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                        <div className="premium-modal-header">
                            <div className="header-content">
                                <h2>📄 تفاصيل الفاتورة</h2>
                                <p>رقم: {selectedCalculation.calculationNumber}</p>
                            </div>
                            <button className="premium-close-btn" onClick={() => setShowDetailsModal(false)}>×</button>
                        </div>
                        <div className="premium-modal-body">
                            <div className="details-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #EDF2F7' }}>
                                    <span style={{ color: '#718096' }}>المجموع الفرعي:</span>
                                    <strong style={{ fontWeight: 600 }}>{feesService.formatCurrency(selectedCalculation.subtotal, systemSettings?.currency)}</strong>
                                </div>
                                <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #EDF2F7' }}>
                                    <span style={{ color: '#718096' }}>الضريبة:</span>
                                    <strong style={{ color: '#F59E0B' }}>{feesService.formatCurrency(selectedCalculation.taxAmount || 0, systemSettings?.currency)}</strong>
                                </div>
                                <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #EDF2F7' }}>
                                    <span style={{ color: '#718096' }}>إجمالي الفاتورة:</span>
                                    <strong style={{ fontWeight: 800 }}>{feesService.formatCurrency(selectedCalculation.totalAmount, systemSettings?.currency)}</strong>
                                </div>
                                <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.75rem', borderBottom: '1px solid #EDF2F7' }}>
                                    <span style={{ color: '#718096' }}>المدفوع:</span>
                                    <strong style={{ color: '#38A169' }}>{feesService.formatCurrency(selectedCalculation.paidAmount, systemSettings?.currency)}</strong>
                                </div>
                                <div className="detail-row" style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#718096' }}>المتبقي:</span>
                                    <strong style={{ color: 'var(--orange-primary)' }}>{feesService.formatCurrency(selectedCalculation.balance, systemSettings?.currency)}</strong>
                                </div>
                            </div>
                        </div>
                        <div className="premium-modal-footer">
                            <button className="premium-footer-btn secondary" onClick={() => setShowDetailsModal(false)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}
            {/* Installments Modal */}
            {showInstallmentModal && selectedCalculation && (
                <div className="premium-modal-overlay" onClick={() => setShowInstallmentModal(false)}>
                    <div className="premium-modal-container fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
                        <div className="premium-modal-header">
                            <div className="header-content">
                                <h2>📑 السجل المالي والأقساط</h2>
                                <p>المتبقي للتقسيط: {feesService.formatCurrency(selectedCalculation.balance, systemSettings?.currency)}</p>
                            </div>
                            <button className="premium-close-btn" onClick={() => setShowInstallmentModal(false)}>×</button>
                        </div>
                        <div className="premium-modal-body">
                            {selectedCalculation.installmentPlans && selectedCalculation.installmentPlans.length > 0 ? (
                                <>
                                    <h3 className="premium-section-title">الأقساط المجدولة (الفعلية)</h3>
                                    <div className="installment-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {selectedCalculation.installmentPlans[0].installments?.map((inst) => (
                                            <div key={inst.id} className={`inst-row ${inst.status.toLowerCase()}`} style={{
                                                display: 'flex', justifyContent: 'space-between', padding: '1rem',
                                                background: inst.status === 'PAID' ? '#F0FFF4' : inst.status === 'OVERDUE' ? '#FFF5F5' : '#F8FAFC',
                                                borderRadius: '12px', border: inst.status === 'PAID' ? '1px solid #C6F6D5' : '1px solid #EDF2F7'
                                            }}>
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontWeight: 700, color: '#1A202C' }}>قسط #{inst.installmentNumber}</span>
                                                    <span style={{ fontSize: '0.8rem', color: '#718096' }}>استحقاق: {new Date(inst.dueDate).toLocaleDateString('ar-SA')}</span>
                                                </div>
                                                <div style={{ textAlign: 'left' }}>
                                                    <div style={{ color: 'var(--orange-primary)', fontWeight: 800 }}>
                                                        {feesService.formatCurrency(inst.amount, systemSettings?.currency)}
                                                    </div>
                                                    <span className={`status-badge ${inst.status.toLowerCase()}`} style={{ fontSize: '0.7rem' }}>
                                                        {inst.status === 'PAID' ? 'تم السداد' :
                                                            inst.status === 'IN_PAYMENT' ? 'قيد التأكيد البنكي' :
                                                                inst.status === 'OVERDUE' ? 'متأخر' : 'منتظر'}
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h3 className="premium-section-title">محاكاة خطة الأقساط (لم يتم الجدولة بعد)</h3>
                                    <div className="installment-controls" style={{ marginBottom: '1.5rem' }}>
                                        <div className="tabs-pills" style={{ display: 'flex', gap: '0.5rem', background: '#F1F5F9', padding: '0.5rem', borderRadius: '12px' }}>
                                            {[3, 4, 6, 12].map(m => (
                                                <button
                                                    key={m}
                                                    style={{
                                                        flex: 1, padding: '0.6rem', borderRadius: '8px', border: 'none',
                                                        background: installmentMonths === m ? 'var(--orange-primary)' : 'transparent',
                                                        color: installmentMonths === m ? 'white' : '#64748B',
                                                        fontWeight: 700, cursor: 'pointer', transition: '0.2s'
                                                    }}
                                                    onClick={() => setInstallmentMonths(m)}
                                                >
                                                    {m} أشهر
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="installment-grid" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                        {feesService.generateInstallmentDates(new Date(), installmentMonths).map((date, idx) => (
                                            <div key={idx} className="inst-row" style={{
                                                display: 'flex', justifyContent: 'space-between', padding: '1rem',
                                                background: '#F8FAFC', borderRadius: '12px', border: '1px solid #EDF2F7'
                                            }}>
                                                <span style={{ fontWeight: 700, color: '#1A202C' }}>قسط #{idx + 1}</span>
                                                <span style={{ color: '#718096' }}>{date.toLocaleDateString('ar-SA')}</span>
                                                <span style={{ color: 'var(--orange-primary)', fontWeight: 800 }}>
                                                    {feesService.formatCurrency(Math.ceil(selectedCalculation.balance / installmentMonths), systemSettings?.currency)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="premium-modal-footer">
                            <button className="premium-footer-btn secondary" onClick={() => setShowInstallmentModal(false)}>إغلاق</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Create Tax Invoice Modal */}
            {showCreateInvoiceModal && (
                <div className="premium-modal-overlay" onClick={() => setShowCreateInvoiceModal(false)}>
                    <div className="premium-modal-container fade-in" onClick={e => e.stopPropagation()} style={{ maxWidth: '900px' }}>
                        <div className="premium-modal-header">
                            <div className="header-content">
                                <h2>📄 إنشاء فاتورة ضريبية جديدة</h2>
                                <p>إصدار فاتورة ضريبية متوافقة مع المعايير الدولية</p>
                            </div>
                            <button className="premium-close-btn" onClick={() => setShowCreateInvoiceModal(false)}>×</button>
                        </div>
                        <div className="premium-modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            <h3 className="premium-section-title">بيانات الطالب</h3>
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>اختيار الطالب *</label>
                                <select
                                    value={invoiceStudentId}
                                    onChange={e => setInvoiceStudentId(e.target.value)}
                                    className="modern-select"
                                    required
                                >
                                    <option value="">-- اختر الطالب --</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.firstNameAr} {s.lastNameAr} ({s.studentNumber})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <h3 className="premium-section-title">بنود الفاتورة</h3>
                            <div style={{ marginBottom: '1rem' }}>
                                {invoiceItems.map((item, idx) => (
                                    <div key={idx} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '2fr 1fr 1.5fr auto',
                                        gap: '0.75rem',
                                        marginBottom: '0.75rem',
                                        alignItems: 'end'
                                    }}>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>الوصف</label>
                                            <input
                                                type="text"
                                                value={item.description}
                                                onChange={e => {
                                                    const newItems = [...invoiceItems];
                                                    newItems[idx].description = e.target.value;
                                                    setInvoiceItems(newItems);
                                                }}
                                                placeholder="مثال: رسوم دراسية - الفصل الأول"
                                                className="input-premium"
                                                required
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>الكمية</label>
                                            <input
                                                type="number"
                                                value={item.quantity}
                                                onChange={e => {
                                                    const newItems = [...invoiceItems];
                                                    newItems[idx].quantity = parseInt(e.target.value) || 1;
                                                    setInvoiceItems(newItems);
                                                }}
                                                min="1"
                                                className="input-premium"
                                            />
                                        </div>
                                        <div className="form-group" style={{ marginBottom: 0 }}>
                                            <label style={{ fontSize: '0.85rem', marginBottom: '0.25rem' }}>سعر الوحدة ({systemSettings?.currency || 'SAR'})</label>
                                            <input
                                                type="number"
                                                value={item.unitPrice}
                                                onChange={e => {
                                                    const newItems = [...invoiceItems];
                                                    newItems[idx].unitPrice = parseFloat(e.target.value) || 0;
                                                    setInvoiceItems(newItems);
                                                }}
                                                min="0"
                                                step="0.01"
                                                className="input-premium"
                                                required
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (invoiceItems.length > 1) {
                                                    const newItems = invoiceItems.filter((_, i) => i !== idx);
                                                    setInvoiceItems(newItems);
                                                }
                                            }}
                                            disabled={invoiceItems.length === 1}
                                            style={{
                                                background: invoiceItems.length === 1 ? '#E2E8F0' : '#FEE2E2',
                                                color: invoiceItems.length === 1 ? '#94A3B8' : '#DC2626',
                                                border: 'none',
                                                padding: '0.6rem 1rem',
                                                borderRadius: '8px',
                                                cursor: invoiceItems.length === 1 ? 'not-allowed' : 'pointer',
                                                fontWeight: 700,
                                                transition: '0.2s'
                                            }}
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button
                                type="button"
                                onClick={() => setInvoiceItems([...invoiceItems, { description: '', quantity: 1, unitPrice: 0 }])}
                                style={{
                                    background: 'var(--orange-primary)',
                                    color: 'white',
                                    border: 'none',
                                    padding: '0.7rem 1.5rem',
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                    marginBottom: '1.5rem'
                                }}
                            >
                                + إضافة بند جديد
                            </button>

                            <div style={{
                                background: '#F8FAFC',
                                padding: '1.25rem',
                                borderRadius: '12px',
                                border: '2px solid #E2E8F0'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#64748B', fontWeight: 600 }}>المجموع الفرعي:</span>
                                    <strong style={{ fontSize: '1.1rem' }}>
                                        {feesService.formatCurrency(
                                            invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0),
                                            systemSettings?.currency
                                        )}
                                    </strong>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#64748B', fontWeight: 600 }}>ضريبة القيمة المضافة ({systemSettings?.vatRate || 15}%):</span>
                                    <strong style={{ fontSize: '1.1rem', color: '#F59E0B' }}>
                                        {feesService.formatCurrency(
                                            invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * ((systemSettings?.vatRate || 15) / 100),
                                            systemSettings?.currency
                                        )}
                                    </strong>
                                </div>
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    paddingTop: '0.75rem',
                                    borderTop: '2px solid #CBD5E1',
                                    marginTop: '0.5rem'
                                }}>
                                    <span style={{ color: '#1E293B', fontWeight: 800, fontSize: '1.1rem' }}>الإجمالي النهائي:</span>
                                    <strong style={{ fontSize: '1.4rem', color: 'var(--orange-primary)' }}>
                                        {feesService.formatCurrency(
                                            invoiceItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0) * (1 + ((systemSettings?.vatRate || 15) / 100)),
                                            systemSettings?.currency
                                        )}
                                    </strong>
                                </div>
                            </div>
                        </div>
                        <div className="premium-modal-footer">
                            <button className="premium-footer-btn secondary" onClick={() => setShowCreateInvoiceModal(false)}>إلغاء</button>
                            <button
                                className="premium-footer-btn primary"
                                onClick={async () => {
                                    if (!invoiceStudentId) {
                                        setToast({ type: 'error', message: '❌ يرجى اختيار الطالب' });
                                        return;
                                    }
                                    if (invoiceItems.some(item => !item.description || item.unitPrice <= 0)) {
                                        setToast({ type: 'error', message: '❌ يرجى إكمال بيانات جميع البنود' });
                                        return;
                                    }

                                    try {
                                        setLoading(true);
                                        await invoiceService.createInvoice({
                                            studentId: invoiceStudentId,
                                            items: invoiceItems
                                        });
                                        setToast({ type: 'success', message: '✅ تم إنشاء الفاتورة الضريبية بنجاح' });
                                        setShowCreateInvoiceModal(false);
                                        setInvoiceStudentId('');
                                        setInvoiceItems([{ description: '', quantity: 1, unitPrice: 0 }]);
                                        fetchData(); // Refresh data
                                    } catch (error: any) {
                                        console.error('Invoice Creation Error:', error);
                                        setToast({ type: 'error', message: `❌ ${error.response?.data?.error?.message || 'فشل في إنشاء الفاتورة'}` });
                                    } finally {
                                        setLoading(false);
                                    }
                                }}
                                disabled={loading}
                            >
                                {loading ? '⏳ جاري الإنشاء...' : '✅ إصدار الفاتورة'}
                            </button>
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
