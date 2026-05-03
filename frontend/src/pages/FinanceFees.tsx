// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import {
    Search, Plus, X, SlidersHorizontal,
    CreditCard, FileText, LayoutGrid, Grid,
    List, RefreshCw, FileDown, BookOpen, User,
    DollarSign, Calendar, CheckCircle2, AlertTriangle, Clock,
    Trash2, Calculator, ShieldCheck
} from 'lucide-react';
import { feesService, StudentFeeCalculation, PaymentStatus } from '../services/fees.service';
import { studentService, Student } from '../services/student.service';
import { academicService, Program } from '../services/academic.service';
import invoiceService from '../services/invoice.service';
import { Toast, ToastType } from '../components/Toast';
import { ConfirmDialog } from '../components/ConfirmDialog';

import './FinanceFees.css';

/**
 * PREMIUM FINANCE SECTOR (Rapidos 2026)
 * Design Alignment: AcademicStudents.tsx
 */

export default function FinanceFees() {
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
    const [showMobileFilters, setShowMobileFilters] = useState(false);

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
                fetchData();
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
    const filteredCalculations = useMemo(() => {
        return calculations.filter(c => {
            const student = students.find(s => s.id === c.studentId);
            const matchesSearch = !searchTerm ||
                (student && (student.firstNameAr + ' ' + student.lastNameAr).includes(searchTerm)) ||
                (student && (student.firstNameEn + ' ' + student.lastNameEn).toLowerCase().includes(searchTerm.toLowerCase())) ||
                c.calculationNumber.includes(searchTerm);

            const matchesProgram = !filterProgram || c.programId === filterProgram;
            const matchesStatus = filterStatus === 'all' || c.status === filterStatus;

            return matchesSearch && matchesProgram && matchesStatus;
        });
    }, [calculations, students, searchTerm, filterProgram, filterStatus]);

    // --- Stats ---
    const financialStats = useMemo(() => ({
        totalInvoiced: calculations.reduce((sum, c) => sum + Number(c.totalAmount || 0), 0),
        totalCollected: calculations.reduce((sum, c) => sum + Number(c.paidAmount || 0), 0),
        totalOutstanding: calculations.reduce((sum, c) => sum + Number(c.balance || 0), 0),
        overdueCount: calculations.filter(c => c.status === PaymentStatus.OVERDUE).length
    }), [calculations]);

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'PAID': return 'مكتمل';
            case 'PARTIAL': return 'جزئي';
            case 'IN_PAYMENT': return 'قيد التأكيد';
            case 'OVERDUE': return 'متأخر';
            default: return 'معلق';
        }
    };

    const getStatusCls = (status: string) => {
        return `status-${status?.toLowerCase() || 'pending'}`;
    };

    // --- Sidebar Content ---
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
                            placeholder="بحث باسم الطالب أو رقم الفاتورة..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ag-divider" />

                <div className="ag-filter-group">
                    <span className="ag-filter-label">البرنامج الدراسي</span>
                    <select className="ag-select" value={filterProgram} onChange={(e) => setFilterProgram(e.target.value)}>
                        <option value="">كل البرامج</option>
                        {programs.map(p => <option key={p.id} value={p.id}>{p.nameAr}</option>)}
                    </select>
                </div>

                <div className="ag-filter-group">
                    <span className="ag-filter-label">حالة السداد</span>
                    <select className="ag-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as any)}>
                        <option value="all">كل الحالات</option>
                        <option value="PAID">✅ مدفوع</option>
                        <option value="PARTIAL">⚠️ مدفوع جزئياً</option>
                        <option value="OVERDUE">❌ متأخر</option>
                        <option value="PENDING">🕒 معلق</option>
                        <option value="IN_PAYMENT">🏦 قيد التأكيد</option>
                    </select>
                </div>

                <div className="ag-divider" />

                <div className="ag-filter-group">
                    <span className="ag-filter-label">طريقة العرض</span>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className={`ag-btn-icon ${viewMode === 'grid' ? 'active' : ''}`} onClick={() => setViewMode('grid')}>
                            <Grid size={16} />
                        </button>
                        <button className={`ag-btn-icon ${viewMode === 'table' ? 'active' : ''}`} onClick={() => setViewMode('table')}>
                            <List size={16} />
                        </button>
                    </div>
                </div>

                <button className="ag-btn ag-btn-ghost" style={{ width: '100%', marginTop: 'auto' }} onClick={fetchData}>
                    <RefreshCw size={14} /> تحديث البيانات
                </button>
            </div>
        </>
    );

    return (
        <div className="ag-root">
            {/* ── HEADER ── */}
            <header className="ag-header">
                <div className="ag-header-left">
                    <h1 className="ag-title">
                        <span className="hide-mobile"><CreditCard size={20} /></span>
                        إدارة الرسوم الدراسية
                    </h1>
                    <div className="ag-mini-stats hide-mobile">
                        <div className="ag-stat-pill">
                            <span className="ag-stat-val">{financialStats.overdueCount}</span>
                            متأخرين
                        </div>
                        <div className="ag-stat-pill">
                            <span className="ag-stat-val">{systemSettings?.currency || 'SAR'}</span>
                            العملة
                        </div>
                    </div>
                </div>

                <div className="ag-header-right">
                    <button className="ag-btn-icon hide-mobile" title="تصدير" onClick={() => console.log('Export')}>
                        <FileDown size={16} />
                    </button>
                    <button className="ag-btn-icon mobile-only" title="تصفية" onClick={() => setShowMobileFilters(true)}>
                        <SlidersHorizontal size={16} />
                    </button>
                    <button className="ag-btn ag-btn-primary" onClick={() => setShowCreateInvoiceModal(true)}>
                        <Plus size={16} />
                        <span className="hide-mobile">فاتورة جديدة</span>
                    </button>
                </div>
            </header>

            {/* ── BODY ── */}
            <div className="ag-body">
                {/* Mobile Sidebar Overlay */}
                <div className={`ag-sidebar-overlay ${showMobileFilters ? 'show' : ''}`} onClick={() => setShowMobileFilters(false)} />

                {/* Sidebar */}
                <div className={`ag-sidebar ${showMobileFilters ? 'show' : 'hide-on-mobile'}`}>
                    <SidebarContent />
                </div>

                {/* Main Content */}
                <main className="ag-main">
                    {loading ? (
                        <div style={{ display: 'flex', flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                            <div className="spinner"></div>
                        </div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '20px 20px 0' }}>
                                <div className="ag-stat-pill" style={{ padding: '12px 16px', background: 'var(--hz-surface)', border: '1px solid var(--hz-border-soft)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)', fontWeight: 800 }}>إجمالي الفواتير</span>
                                        <span style={{ fontSize: '1.1rem', color: 'var(--hz-text-bright)', fontWeight: 900 }}>
                                            {feesService.formatCurrency(financialStats.totalInvoiced, systemSettings?.currency)}
                                        </span>
                                    </div>
                                </div>
                                <div className="ag-stat-pill" style={{ padding: '12px 16px', background: 'var(--hz-surface)', border: '1px solid var(--hz-border-soft)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)', fontWeight: 800 }}>المحصل الفعلي</span>
                                        <span style={{ fontSize: '1.1rem', color: '#68D391', fontWeight: 900 }}>
                                            {feesService.formatCurrency(financialStats.totalCollected, systemSettings?.currency)}
                                        </span>
                                    </div>
                                </div>
                                <div className="ag-stat-pill" style={{ padding: '12px 16px', background: 'var(--hz-surface)', border: '1px solid var(--hz-border-soft)' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--hz-text-muted)', fontWeight: 800 }}>المستحقات المتبقية</span>
                                        <span style={{ fontSize: '1.1rem', color: 'var(--hz-orange)', fontWeight: 900 }}>
                                            {feesService.formatCurrency(financialStats.totalOutstanding, systemSettings?.currency)}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {filteredCalculations.length === 0 ? (
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: 'var(--hz-text-muted)' }}>
                                    <BookOpen size={48} strokeWidth={1} style={{ marginBottom: '16px' }} />
                                    <p>لا توجد سجلات مالية تطابق معايير البحث</p>
                                </div>
                            ) : viewMode === 'grid' ? (
                                <div className="ag-grid">
                                    {filteredCalculations.map(calc => {
                                        const student = students.find(s => s.id === calc.studentId);
                                        const progress = calc.totalAmount > 0
                                            ? Math.round(((calc.paidAmount || 0) / calc.totalAmount) * 100)
                                            : 0;

                                        return (
                                            <div key={calc.id} className="ag-card" onClick={() => { setSelectedCalculation(calc); setShowDetailsModal(true); }}>
                                                <div className="ag-card-status-wrap">
                                                    <span className={`ag-card-badge ${getStatusCls(calc.status)}`}>
                                                        {getStatusLabel(calc.status)}
                                                    </span>
                                                </div>

                                                <div className="ag-card-head">
                                                    <div className="ag-avatar">👤</div>
                                                    <div>
                                                        <h3 className="ag-card-title">
                                                            {student ? `${student.firstNameAr} ${student.lastNameAr}` : 'طالب غير معروف'}
                                                        </h3>
                                                        <p className="ag-card-sub">
                                                            {programs.find(p => p.id === calc.programId)?.nameAr || 'عام'} • {calc.calculationNumber}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="ag-card-kpis">
                                                    <div className="ag-kpi">
                                                        <span className="ag-kpi-val">{feesService.formatCurrency(calc.totalAmount, systemSettings?.currency)}</span>
                                                        <span className="ag-kpi-lbl">الإجمالي</span>
                                                    </div>
                                                    <div className="ag-kpi">
                                                        <span className="ag-kpi-val" style={{ color: '#68D391' }}>{feesService.formatCurrency(calc.paidAmount || 0, systemSettings?.currency)}</span>
                                                        <span className="ag-kpi-lbl">المدفوع</span>
                                                    </div>
                                                    <div className="ag-kpi">
                                                        <span className="ag-kpi-val" style={{ color: 'var(--hz-orange)' }}>{feesService.formatCurrency(calc.balance || 0, systemSettings?.currency)}</span>
                                                        <span className="ag-kpi-lbl">المتبقي</span>
                                                    </div>
                                                </div>

                                                <div className="ag-progress-box">
                                                    <div className="ag-progress-info">
                                                        <span>نسبة السداد</span>
                                                        <span>{progress}%</span>
                                                    </div>
                                                    <div className="ag-progress-bar">
                                                        <div className="ag-progress-fill" style={{
                                                            width: `${progress}%`,
                                                            background: progress === 100 ? '#38A169' : 'var(--hz-orange)'
                                                        }} />
                                                    </div>
                                                </div>

                                                <div className="ag-card-foot">
                                                    {calc.status !== 'PAID' && (
                                                        <button className="ag-btn ag-btn-primary" style={{ height: '32px', flex: 1 }} onClick={(e) => {
                                                            e.stopPropagation();
                                                            setSelectedCalculation(calc);
                                                            resetPaymentForm();
                                                            setShowPaymentModal(true);
                                                            setPaymentAmount(calc.balance || 0);
                                                        }}>
                                                            <CreditCard size={14} /> سداد
                                                        </button>
                                                    )}
                                                    <button className="ag-btn ag-btn-ghost" style={{ height: '32px', flex: 1 }} onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCalculation(calc);
                                                        setShowInstallmentModal(true);
                                                    }}>
                                                        <List size={14} /> الأقساط
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="ag-table-wrap">
                                    <table className="ag-table">
                                        <thead>
                                            <tr>
                                                <th>الفاتورة</th>
                                                <th>الطالب</th>
                                                <th>البرنامج</th>
                                                <th>المجموع</th>
                                                <th>المدفوع</th>
                                                <th>المتبقي</th>
                                                <th>الحالة</th>
                                                <th>أدوات</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredCalculations.map(calc => {
                                                const student = students.find(s => s.id === calc.studentId);
                                                return (
                                                    <tr key={calc.id}>
                                                        <td style={{ fontWeight: 900 }}>{calc.calculationNumber}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontWeight: 700 }}>{student ? `${student.firstNameAr} ${student.lastNameAr}` : '-'}</span>
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--hz-text-muted)' }}>{student?.studentNumber}</span>
                                                            </div>
                                                        </td>
                                                        <td style={{ fontSize: '0.8rem' }}>{programs.find(p => p.id === calc.programId)?.nameAr || '-'}</td>
                                                        <td style={{ fontWeight: 700 }}>{feesService.formatCurrency(calc.totalAmount, systemSettings?.currency)}</td>
                                                        <td style={{ fontWeight: 700, color: '#68D391' }}>{feesService.formatCurrency(calc.paidAmount || 0, systemSettings?.currency)}</td>
                                                        <td style={{ fontWeight: 700, color: 'var(--hz-orange)' }}>{feesService.formatCurrency(calc.balance || 0, systemSettings?.currency)}</td>
                                                        <td>
                                                            <span className={`ag-card-badge ${getStatusCls(calc.status)}`}>
                                                                {getStatusLabel(calc.status)}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <div style={{ display: 'flex', gap: '4px' }}>
                                                                <button className="ag-btn-icon" onClick={() => { setSelectedCalculation(calc); setShowDetailsModal(true); }}><FileText size={14} /></button>
                                                                {calc.status !== 'PAID' && (
                                                                    <button className="ag-btn-icon" onClick={() => {
                                                                        setSelectedCalculation(calc);
                                                                        resetPaymentForm();
                                                                        setShowPaymentModal(true);
                                                                    }}><CreditCard size={14} /></button>
                                                                )}
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </>
                    )}
                </main>
            </div>

            {/* ── MODALS ── */}

            {showPaymentModal && selectedCalculation && createPortal(
                <div className="ag-modal-overlay" onClick={() => setShowPaymentModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head">
                            <div className="ag-modal-title">
                                <div className="ag-avatar" style={{ background: 'linear-gradient(135deg, var(--hz-orange), #EA580C)', width: '48px', height: '48px' }}>
                                    <CreditCard size={24} color="#FFF" />
                                </div>
                                <div>
                                    <h3>تسجيل دفعة مالية</h3>
                                    <p>تحصيل مالي للطالب: {selectedCalculation.student?.firstNameAr} (سجل: {selectedCalculation.calculationNumber})</p>
                                </div>
                            </div>
                            <button className="ag-btn-icon" onClick={() => setShowPaymentModal(false)}><X size={20} /></button>
                        </div>
                        <div className="ag-modal-body">
                            {/* Intelligent Notices */}
                            {selectedCalculation.student?.isTaxExempt && (
                                <div className="ag-notice-banner success" style={{ marginBottom: '16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <ShieldCheck size={18} />
                                        <span>إعفاء ضريبي: هذا الطالب معفى من ضريبة القيمة المضافة</span>
                                    </div>
                                </div>
                            )}

                            {!selectedInstallmentId && paymentAmount > 0 && paymentAmount >= selectedCalculation.balance && systemSettings?.fullPaymentDiscountPercentage > 0 && discount === 0 && (
                                <div className="ag-notice-banner success">
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ background: 'rgba(104, 211, 145, 0.2)', padding: '6px', borderRadius: '8px' }}>
                                            <Calculator size={16} />
                                        </div>
                                        <span>مستحق لخصم سداد كامل ({systemSettings.fullPaymentDiscountPercentage}%)</span>
                                    </div>
                                    <button className="ag-notice-btn" onClick={() => {
                                        const discVal = Number(selectedCalculation.balance) * (systemSettings.fullPaymentDiscountPercentage / 100);
                                        setDiscount(discVal);
                                        setToast({ type: 'success', message: `✅ تم تطبيق خصم بقيمة ${feesService.formatCurrency(discVal, systemSettings?.currency)}` });
                                    }}>تطبيق</button>
                                </div>
                            )}

                            <div className="ag-section-title">
                                <Calendar size={16} /> الموعد والتوثيق
                            </div>
                            <div className="ag-form-row cols-2">
                                <div className="ag-form-group">
                                    <label className="ag-label">تاريخ السداد</label>
                                    <input type="date" className="ag-input" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
                                </div>
                                <div className="ag-form-group">
                                    <label className="ag-label">رقم الإيصال المراد تسجيله</label>
                                    <input type="text" className="ag-input" value={paymentReceipt} placeholder="اتركه فارغاً للتوليد التلقائي" onChange={e => setPaymentReceipt(e.target.value)} />
                                </div>
                            </div>

                            <div className="ag-section-title" style={{ marginTop: '20px' }}>
                                <Clock size={16} /> تخصيص المبلغ (الأقساط)
                            </div>
                            <div className="ag-form-group" style={{ marginBottom: '20px' }}>
                                <label className="ag-label">ربط الدفعة بقسط محدد</label>
                                <select
                                    className="ag-input"
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
                                >
                                    <option value="">-- دفع مبلغ عام (توزيع تلقائي) --</option>
                                    {selectedCalculation.installmentPlans?.map(plan => (
                                        plan.installments?.map(inst => (
                                            <option key={inst.id} value={inst.id} disabled={inst.status === 'PAID'}>
                                                قسط {inst.installmentNumber} - استحقاق {new Date(inst.dueDate).toLocaleDateString('ar-SA')} ({feesService.formatCurrency(inst.balance, systemSettings?.currency)})
                                            </option>
                                        ))
                                    ))}
                                </select>
                            </div>

                            <div className="ag-section-title">
                                <DollarSign size={16} /> تفاصيل المبلغ وطريقة السداد
                            </div>
                            <div className="ag-form-row cols-2">
                                <div className="ag-form-group">
                                    <label className="ag-label">المبلغ الأساسي *</label>
                                    <input type="number" className="ag-input" value={paymentAmount} onChange={e => setPaymentAmount(Number(e.target.value))} />
                                </div>
                                <div className="ag-form-group">
                                    <label className="ag-label">طريقة السداد</label>
                                    <select className="ag-input" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
                                        <option value="CASH">نقدي (Cash)</option>
                                        <option value="BANK_TRANSFER">تحويل بنكي (Bank)</option>
                                        <option value="POS">شبكة (POS / Mada)</option>
                                        <option value="ONLINE">دفع أونلاين (Online)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="ag-form-row cols-2" style={{ marginTop: '10px' }}>
                                <div className="ag-form-group">
                                    <label className="ag-label" style={{ color: 'var(--hz-coral)' }}>غرامة تأخير (+)</label>
                                    <input type="number" className="ag-input" style={{ borderColor: 'rgba(245, 101, 101, 0.3)' }} value={lateFee} onChange={e => setLateFee(Number(e.target.value))} />
                                </div>
                                <div className="ag-form-group">
                                    <label className="ag-label" style={{ color: '#68D391' }}>خصم استثنائي (-)</label>
                                    <input type="number" className="ag-input" style={{ borderColor: 'rgba(104, 211, 145, 0.3)' }} value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                                </div>
                            </div>

                            <div className="ag-payment-box" style={{ marginTop: '24px' }}>
                                <div className="ag-fin-row">
                                    <span className="ag-label" style={{ textTransform: 'none' }}>المبلغ الأساسي (قبل التعديل):</span>
                                    <span>{feesService.formatCurrency(paymentAmount, systemSettings?.currency)}</span>
                                </div>
                                <div className="ag-fin-row" style={{ fontSize: '1.4rem', fontWeight: 900, borderBottom: 'none', paddingTop: '12px' }}>
                                    <span style={{ color: 'var(--hz-text-bright)' }}>إجمالي المبلغ للسداد:</span>
                                    <span style={{ color: 'var(--hz-orange)' }}>
                                        {feesService.formatCurrency(paymentAmount + lateFee - discount, systemSettings?.currency)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="ag-modal-foot">
                            <button className="ag-btn ag-btn-ghost" onClick={() => setShowPaymentModal(false)}>إلغاء العملية</button>
                            <button className="ag-btn ag-btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--hz-orange)', color: '#FFF' }} onClick={handlePayment} disabled={loading}>
                                {loading ? '⏳ جاري المعالجة...' : '✅ تأكيد السداد وإصدار الإيصال'}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Details Modal */}
            {showDetailsModal && selectedCalculation && createPortal(
                <div className="ag-modal-overlay" onClick={() => setShowDetailsModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '480px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head">
                            <div className="ag-modal-title">
                                <div className="ag-avatar" style={{ background: 'var(--hz-surface-3)', width: '40px', height: '40px' }}>
                                    <FileText size={20} color="var(--hz-orange)" />
                                </div>
                                <div>
                                    <h3>تفاصيل الفاتورة</h3>
                                    <p>{selectedCalculation.calculationNumber}</p>
                                </div>
                            </div>
                            <button className="ag-btn-icon" onClick={() => setShowDetailsModal(false)}><X size={18} /></button>
                        </div>
                        <div className="ag-modal-body">
                            <div className="ag-section-title">
                                <User size={16} /> بيانات العميل
                            </div>
                            <div className="details-list" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hz-border-soft)' }}>
                                    <span className="ag-label" style={{ textTransform: 'none' }}>الاسم:</span>
                                    <strong style={{ color: 'var(--hz-text-bright)' }}>{selectedCalculation.student?.firstNameAr} {selectedCalculation.student?.lastNameAr}</strong>
                                </div>
                                <div className="detail-item" style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--hz-border-soft)' }}>
                                    <span className="ag-label" style={{ textTransform: 'none' }}>الرقم الجامعي:</span>
                                    <strong style={{ color: 'var(--hz-orange)' }}>{selectedCalculation.student?.studentNumber}</strong>
                                </div>
                            </div>

                            <div className="ag-section-title" style={{ marginTop: '24px' }}>
                                <CreditCard size={16} /> الحالة المالية
                            </div>
                            <div className="ag-fin-grid">
                                <div className="ag-fin-card">
                                    <span className="ag-fin-lbl">الإجمالي</span>
                                    <span className="ag-fin-val">{feesService.formatCurrency(selectedCalculation.totalAmount, systemSettings?.currency)}</span>
                                </div>
                                <div className="ag-fin-card">
                                    <span className="ag-fin-lbl">المسدد</span>
                                    <span className="ag-fin-val" style={{ color: 'var(--hz-cyan)' }}>{feesService.formatCurrency(selectedCalculation.paidAmount, systemSettings?.currency)}</span>
                                </div>
                                <div className="ag-fin-card">
                                    <span className="ag-fin-lbl">المطالبة</span>
                                    <span className="ag-fin-val" style={{ color: 'var(--hz-coral)' }}>{feesService.formatCurrency(selectedCalculation.balance, systemSettings?.currency)}</span>
                                </div>
                            </div>
                        </div>
                        <div className="ag-modal-foot">
                            <button className="ag-btn ag-btn-ghost" onClick={() => setShowDetailsModal(false)}>إغلاق</button>
                            <button className="ag-btn ag-btn-primary" style={{ background: 'var(--hz-orange)', color: '#FFF' }}>
                                <FileDown size={16} /> تحميل PDF
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Installments Modal */}
            {showInstallmentModal && selectedCalculation && createPortal(
                <div className="ag-modal-overlay" onClick={() => setShowInstallmentModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '550px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head">
                            <div className="ag-modal-title">
                                <div className="ag-avatar" style={{ background: 'var(--hz-surface-3)', width: '40px', height: '40px' }}>
                                    <Calendar size={20} color="var(--hz-orange)" />
                                </div>
                                <div>
                                    <h3>الأقساط والسجل المالي</h3>
                                    <p>المتبقي: {feesService.formatCurrency(selectedCalculation.balance, systemSettings?.currency)}</p>
                                </div>
                            </div>
                            <button className="ag-btn-icon" onClick={() => setShowInstallmentModal(false)}><X size={18} /></button>
                        </div>
                        <div className="ag-modal-body">
                            <div className="ag-section-title">
                                <Clock size={16} /> جدول الدفعات المستحقة
                            </div>
                            {selectedCalculation.installmentPlans?.[0]?.installments ? (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {selectedCalculation.installmentPlans[0].installments.map(inst => (
                                        <div key={inst.id} style={{
                                            display: 'flex', justifyContent: 'space-between', padding: '14px',
                                            background: 'var(--hz-surface)', borderRadius: '12px',
                                            border: '1px solid var(--hz-border-soft)',
                                            boxShadow: 'var(--hz-shadow-sm)'
                                        }}>
                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                <span style={{ fontWeight: 800, color: 'var(--hz-text-bright)' }}>قسط #{inst.installmentNumber}</span>
                                                <span className="ag-label" style={{ fontSize: '0.65rem', marginTop: '2px' }}>استحقاق: {new Date(inst.dueDate).toLocaleDateString('ar-SA')}</span>
                                            </div>
                                            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                                                <div style={{ fontWeight: 900, color: 'var(--hz-orange)', fontSize: '1rem' }}>{feesService.formatCurrency(inst.amount, systemSettings?.currency)}</div>
                                                <span className={`ag-card-badge ${getStatusCls(inst.status)}`} style={{ fontSize: '0.6rem' }}>{getStatusLabel(inst.status)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                                    <FileText size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                                    <p style={{ color: 'var(--hz-text-muted)', fontSize: '0.85rem' }}>لا توجد خطة أقساط مفعلة لهذه الفاتورة</p>
                                </div>
                            )}
                        </div>
                        <div className="ag-modal-foot">
                            <button className="ag-btn ag-btn-ghost" onClick={() => setShowInstallmentModal(false)}>إغلاق</button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {/* Create Invoice Modal */}
            {showCreateInvoiceModal && createPortal(
                <div className="ag-modal-overlay" onClick={() => setShowCreateInvoiceModal(false)}>
                    <div className="ag-modal" style={{ maxWidth: '850px' }} onClick={e => e.stopPropagation()}>
                        <div className="ag-modal-head">
                            <div className="ag-modal-title">
                                <div className="ag-avatar" style={{ background: 'linear-gradient(135deg, var(--hz-orange), #EA580C)', width: '48px', height: '48px' }}>
                                    <Plus size={24} color="#FFF" />
                                </div>
                                <div>
                                    <h3>إنشاء فاتورة جديدة</h3>
                                    <p>إصدار فاتورة ضريبية رسمية في النظام المالي</p>
                                </div>
                            </div>
                            <button className="ag-btn-icon" onClick={() => setShowCreateInvoiceModal(false)}><X size={20} /></button>
                        </div>
                        <div className="ag-modal-body">
                            <div className="ag-section-title">
                                <User size={16} /> بيانات العميل (الطالب المستفيد)
                            </div>
                            <div className="ag-form-group">
                                <label className="ag-label">اختيار الطالب من القائمة الأكاديمية *</label>
                                <select className="ag-input" value={invoiceStudentId} onChange={e => setInvoiceStudentId(e.target.value)}>
                                    <option value="">-- اختر الطالب --</option>
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.firstNameAr} {s.lastNameAr} ({s.studentNumber})</option>
                                    ))}
                                </select>
                            </div>

                            <div className="ag-section-title" style={{ marginTop: '24px' }}>
                                <FileText size={16} /> بنود الفاتورة والخدمات المقدمة
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                                {invoiceItems.map((item, idx) => (
                                    <div key={idx} style={{ display: 'grid', gridTemplateColumns: 'minmax(200px, 3fr) 1fr 1.5fr auto', gap: '12px', alignItems: 'end', background: 'var(--hz-surface)', padding: '16px', borderRadius: '12px', border: '1px solid var(--hz-border-soft)' }}>
                                        <div className="ag-form-group">
                                            <label className="ag-label" style={{ fontSize: '0.65rem' }}>الوصف / نوع الخدمة</label>
                                            <input type="text" className="ag-input" placeholder="مثلاً: رسوم تسجيل، دورة تدريبية..." value={item.description} onChange={e => {
                                                const newItems = [...invoiceItems];
                                                newItems[idx].description = e.target.value;
                                                setInvoiceItems(newItems);
                                            }} />
                                        </div>
                                        <div className="ag-form-group">
                                            <label className="ag-label" style={{ fontSize: '0.65rem' }}>الكمية</label>
                                            <input type="number" className="ag-input" value={item.quantity} onChange={e => {
                                                const newItems = [...invoiceItems];
                                                newItems[idx].quantity = Number(e.target.value);
                                                setInvoiceItems(newItems);
                                            }} />
                                        </div>
                                        <div className="ag-form-group">
                                            <label className="ag-label" style={{ fontSize: '0.65rem' }}>سعر الوحدة</label>
                                            <input type="number" className="ag-input" value={item.unitPrice} onChange={e => {
                                                const newItems = [...invoiceItems];
                                                newItems[idx].unitPrice = Number(e.target.value);
                                                setInvoiceItems(newItems);
                                            }} />
                                        </div>
                                        <button className="ag-btn-icon" style={{ height: '42px', width: '42px', color: 'var(--hz-coral)', borderColor: 'rgba(245, 101, 101, 0.2)' }} onClick={() => setInvoiceItems(invoiceItems.filter((_, i) => i !== idx))}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <button className="ag-btn ag-btn-ghost" style={{ fontSize: '0.85rem', width: '100%', borderStyle: 'dashed', height: '45px', justifyContent: 'center' }} onClick={() => setInvoiceItems([...invoiceItems, { description: '', quantity: 1, unitPrice: 0 }])}>
                                <Plus size={16} /> إضافة بند مالي جديد للفاتورة
                            </button>

                            <div className="ag-payment-box">
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--hz-border-soft)', paddingBottom: '10px', marginBottom: '10px' }}>
                                    <span className="ag-label" style={{ textTransform: 'none' }}>المجموع الفرعي (قبل الضريبة):</span>
                                    <span style={{ fontWeight: 700 }}>{feesService.formatCurrency(invoiceItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0), systemSettings?.currency)}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 900 }}>
                                    <span style={{ color: 'var(--hz-text-bright)' }}>الإجمالي الكلي (شامل الضريبة):</span>
                                    <span style={{ color: 'var(--hz-orange)' }}>
                                        {feesService.formatCurrency(
                                            invoiceItems.reduce((acc, i) => acc + (i.quantity * i.unitPrice), 0) * (1 + (systemSettings?.vatRate || 15) / 100),
                                            systemSettings?.currency
                                        )}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="ag-modal-foot">
                            <button className="ag-btn ag-btn-ghost" onClick={() => setShowCreateInvoiceModal(false)}>إلغاء</button>
                            <button className="ag-btn ag-btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--hz-orange)', color: '#FFF' }} onClick={async () => {
                                if (!invoiceStudentId) return setToast({ type: 'error', message: 'يرجى اختيار الطالب' });
                                try {
                                    setLoading(true);
                                    await invoiceService.createInvoice({ studentId: invoiceStudentId, items: invoiceItems });
                                    setToast({ type: 'success', message: 'تم إنشاء الفاتورة بنجاح' });
                                    setShowCreateInvoiceModal(false);
                                    fetchData();
                                } catch (e) {
                                    setToast({ type: 'error', message: 'فشل في إنشاء الفاتورة' });
                                } finally {
                                    setLoading(false);
                                }
                            }}>✅ إصدار وقيد الفاتورة المذكورة</button>
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
